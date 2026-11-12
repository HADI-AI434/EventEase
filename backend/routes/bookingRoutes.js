const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');

const Booking = require('../models/Booking');
const Event = require('../models/Event');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();


// CREATE A BOOKING
router.post(
    '/',
    authMiddleware,
    roleMiddleware('customer'),
    async (req, res) => {
        try {
            const { eventId, quantity } = req.body;

            // VALIDATE EVENT ID
            if (!mongoose.Types.ObjectId.isValid(eventId)) {
                return res.status(400).json({
                    message: 'Invalid event ID.'
                });
            }

            // VALIDATE TICKET QUANTITY
            const ticketQuantity = Number(quantity);

            if (
                !Number.isInteger(ticketQuantity) ||
                ticketQuantity < 1
            ) {
                return res.status(400).json({
                    message: 'Ticket quantity must be at least 1.'
                });
            }

            // VALIDATE IDEMPOTENCY KEY
            const idempotencyKey =
                req.headers['idempotency-key']?.trim();

            if (
                !idempotencyKey ||
                idempotencyKey.length > 200
            ) {
                return res.status(400).json({
                    message: 'A valid idempotency key is required.'
                });
            }

            // CHECK WHETHER THE EVENT EXISTS
            const requestedEvent = await Event.findById(eventId);

            if (!requestedEvent) {
                return res.status(404).json({
                    message: 'Event not found.'
                });
            }

            // EXTERNAL EVENTS MUST USE THEIR ORIGINAL PROVIDER
            if (requestedEvent.eventSource === 'External') {
                return res.status(400).json({
                    message:
                        'This is an external event. Please book through its original provider.',
                    bookingUrl: requestedEvent.bookingUrl || null
                });
            }

            // PREVENT BOOKING WHEN PRICE IS UNKNOWN
            if (requestedEvent.priceKnown === false) {
                return res.status(400).json({
                    message:
                        'Ticket price has not been confirmed yet. Booking is unavailable.'
                });
            }

            // CHECK WHETHER THIS REQUEST WAS ALREADY PROCESSED
            const existingBooking = await Booking.findOne({
                customer: req.user.userId,
                idempotencyKey
            });

            if (existingBooking) {
                return res.status(200).json({
                    message:
                        'This booking request was already processed.',
                    booking: existingBooking
                });
            }

            // ATOMICALLY RESERVE SEATS
            const event = await Event.findOneAndUpdate(
                {
                    _id: eventId,
                    eventSource: 'EventEase',
                    status: 'published',
                    availableSeats: {
                        $gte: ticketQuantity
                    },
                    date: {
                        $gt: new Date()
                    }
                },
                {
                    $inc: {
                        availableSeats: -ticketQuantity
                    }
                },
                {
                    returnDocument: 'after'
                }
            );

            if (!event) {
                const existingEvent =
                    await Event.findById(eventId);

                if (!existingEvent) {
                    return res.status(404).json({
                        message: 'Event not found.'
                    });
                }

                if (existingEvent.eventSource === 'External') {
                    return res.status(400).json({
                        message:
                            'This is an external event. Please book through its original provider.',
                        bookingUrl:
                            existingEvent.bookingUrl || null
                    });
                }

                if (existingEvent.priceKnown === false) {
                    return res.status(400).json({
                        message:
                            'Ticket price has not been confirmed yet. Booking is unavailable.'
                    });
                }

                if (existingEvent.status !== 'published') {
                    return res.status(400).json({
                        message:
                            'This event is not available for booking.'
                    });
                }

                if (new Date(existingEvent.date) <= new Date()) {
                    return res.status(400).json({
                        message:
                            'This event has already started or passed.'
                    });
                }

                return res.status(400).json({
                    message: 'Not enough tickets available.'
                });
            }

            // CALCULATE TOTAL AMOUNT
            const totalAmount =
                event.price * ticketQuantity;

            try {
                // CREATE BOOKING
                const booking = await Booking.create({
                    event: event._id,
                    customer: req.user.userId,
                    quantity: ticketQuantity,
                    totalAmount,
                    idempotencyKey,
                    bookingReference:
                        'EVT-' +
                        crypto.randomBytes(5)
                            .toString('hex')
                            .toUpperCase()
                });

                return res.status(201).json({
                    message: 'Booking confirmed successfully!',
                    booking
                });

            } catch (bookingError) {
                // RESTORE SEATS IF BOOKING CREATION FAILS
                await Event.updateOne(
                    { _id: event._id },
                    {
                        $inc: {
                            availableSeats: ticketQuantity
                        }
                    }
                );

                // HANDLE DUPLICATE IDEMPOTENCY REQUESTS
                if (bookingError.code === 11000) {
                    const duplicateBooking =
                        await Booking.findOne({
                            customer: req.user.userId,
                            idempotencyKey
                        });

                    if (duplicateBooking) {
                        return res.status(200).json({
                            message:
                                'This booking request was already processed.',
                            booking: duplicateBooking
                        });
                    }
                }

                throw bookingError;
            }

        } catch (error) {
            console.error('Booking creation error:', error);

            return res.status(500).json({
                message: 'Booking failed.'
            });
        }
    }
);


// GET CUSTOMER'S BOOKINGS
router.get(
    '/my-bookings',
    authMiddleware,
    roleMiddleware('customer'),
    async (req, res) => {
        try {
            const bookings = await Booking.find({
                customer: req.user.userId
            })
                .populate('event')
                .sort({ createdAt: -1 });

            return res.status(200).json({
                bookings
            });

        } catch (error) {
            console.error('Fetch bookings error:', error);

            return res.status(500).json({
                message: 'Failed to fetch bookings.'
            });
        }
    }
);


// CANCEL A CUSTOMER BOOKING
router.patch(
    '/:bookingId/cancel',
    authMiddleware,
    roleMiddleware('customer'),
    async (req, res) => {
        try {
            const { bookingId } = req.params;

            // VALIDATE BOOKING ID
            if (!mongoose.Types.ObjectId.isValid(bookingId)) {
                return res.status(400).json({
                    message: 'Invalid booking ID.'
                });
            }

            // FIND BOOKING BELONGING TO THIS CUSTOMER
            const booking = await Booking.findOne({
                _id: bookingId,
                customer: req.user.userId
            });

            if (!booking) {
                return res.status(404).json({
                    message: 'Booking not found.'
                });
            }

            if (booking.status === 'Cancelled') {
                return res.status(400).json({
                    message: 'This booking is already cancelled.'
                });
            }

            if (booking.status !== 'Confirmed') {
                return res.status(400).json({
                    message:
                        'Only confirmed bookings can be cancelled.'
                });
            }

            // ATOMICALLY CANCEL BOOKING
            const cancelledBooking =
                await Booking.findOneAndUpdate(
                    {
                        _id: bookingId,
                        customer: req.user.userId,
                        status: 'Confirmed'
                    },
                    {
                        $set: {
                            status: 'Cancelled'
                        }
                    },
                    {
                        returnDocument: 'after'
                    }
                );

            if (!cancelledBooking) {
                return res.status(400).json({
                    message: 'Booking could not be cancelled.'
                });
            }

            try {
                // RESTORE AVAILABLE SEATS
                const seatRestoration = await Event.updateOne(
                    { _id: booking.event },
                    {
                        $inc: {
                            availableSeats: booking.quantity
                        }
                    }
                );

                if (seatRestoration.matchedCount !== 1) {
                    throw new Error('Event was not found during seat restoration.');
                }

            } catch (restorationError) {
                console.error(
                    'Seat restoration error:',
                    restorationError.message
                );

                // COMPENSATE BY RESTORING THE BOOKING STATUS
                const restoredBooking = await Booking.updateOne(
                    {
                        _id: bookingId,
                        customer: req.user.userId,
                        status: 'Cancelled'
                    },
                    {
                        $set: {
                            status: 'Confirmed'
                        }
                    }
                );

                if (restoredBooking.modifiedCount !== 1) {
                    console.error(
                        'CRITICAL: Booking cancellation recovery failed.',
                        bookingId
                    );
                }

                return res.status(500).json({
                    message:
                        'Cancellation could not be completed. Please check your booking status before trying again.'
                });
            }

            return res.status(200).json({
                message: 'Booking cancelled successfully!',
                booking: cancelledBooking
            });

        } catch (error) {
            console.error('Booking cancellation error:', error);

            return res.status(500).json({
                message: 'Failed to cancel booking.'
            });
        }
    }
);


// VERIFY AND MARK A TICKET AS USED
router.get(
    '/verify/:bookingReference',
    authMiddleware,
    roleMiddleware('organizer'),
    async (req, res) => {
        try {
            const bookingReference =
                req.params.bookingReference.trim().toUpperCase();

            // FIND BOOKING AND EVENT
            const booking = await Booking.findOne({
                bookingReference
            }).populate('event');

            if (!booking) {
                return res.status(404).json({
                    valid: false,
                    message:
                        'Invalid ticket. Booking not found.'
                });
            }

            if (!booking.event) {
                return res.status(404).json({
                    valid: false,
                    message: 'Event information not found.'
                });
            }

            // CHECK ORGANIZER OWNERSHIP
            if (
                !booking.event.organizer ||
                booking.event.organizer.toString() !==
                req.user.userId
            ) {
                return res.status(403).json({
                    valid: false,
                    message:
                        'You are not authorized to verify this ticket.'
                });
            }

            // REJECT CANCELLED TICKETS
            if (booking.status === 'Cancelled') {
                return res.status(400).json({
                    valid: false,
                    message:
                        'This ticket has been cancelled.'
                });
            }

            // REJECT PREVIOUSLY USED TICKETS
            if (booking.status === 'Used') {
                return res.status(400).json({
                    valid: false,
                    message:
                        'Ticket Already Used! Entry has already been recorded.'
                });
            }

            // ATOMICALLY MARK TICKET AS USED
            const usedBooking =
                await Booking.findOneAndUpdate(
                    {
                        _id: booking._id,
                        status: 'Confirmed'
                    },
                    {
                        $set: {
                            status: 'Used',
                            usedAt: new Date(),
                            verifiedBy: req.user.userId
                        }
                    },
                    {
                        returnDocument: 'after'
                    }
                );

            // HANDLE SIMULTANEOUS SCANS
            if (!usedBooking) {
                const latestBooking =
                    await Booking.findById(booking._id);

                return res.status(400).json({
                    valid: false,
                    message:
                        latestBooking?.status === 'Used'
                            ? 'Ticket Already Used! Entry has already been recorded.'
                            : 'This ticket is no longer valid.'
                });
            }

            return res.status(200).json({
                valid: true,
                message:
                    'Ticket verified successfully! Entry approved.',
                ticket: {
                    bookingReference:
                        usedBooking.bookingReference,
                    event: booking.event.title,
                    date: booking.event.date,
                    location: booking.event.location,
                    quantity: usedBooking.quantity,
                    status: usedBooking.status,
                    usedAt: usedBooking.usedAt
                }
            });

        } catch (error) {
            console.error('Ticket verification error:', error);

            return res.status(500).json({
                valid: false,
                message: 'Ticket verification failed.'
            });
        }
    }
);


module.exports = router;