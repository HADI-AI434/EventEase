const express = require('express');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();


// GET ORGANIZER ANALYTICS
router.get(
    '/organizer',
    authMiddleware,
    roleMiddleware('organizer'),
    async (req, res) => {
        try {
            // Find events belonging to this organizer
            const events = await Event.find({
                organizer: req.user.userId
            }).select('_id title availableSeats');

            const eventIds = events.map(event => event._id);

            // Calculate event and seat statistics
            const totalEvents = events.length;

            const totalAvailableSeats = events.reduce(
                (total, event) => total + event.availableSeats,
                0
            );

            // Calculate overall booking statistics
            const bookingStats = await Booking.aggregate([
                {
                    $match: {
                        event: { $in: eventIds }
                    }
                },
                {
                    $group: {
                        _id: null,

                        totalBookings: { $sum: 1 },

                        successfulBookings: {
                            $sum: {
                                $cond: [
                                    { $in: ['$status', ['Confirmed', 'Used']] },
                                    1,
                                    0
                                ]
                            }
                        },

                        cancelledBookings: {
                            $sum: {
                                $cond: [
                                    { $eq: ['$status', 'Cancelled'] },
                                    1,
                                    0
                                ]
                            }
                        },

                        ticketsSold: {
                            $sum: {
                                $cond: [
                                    { $in: ['$status', ['Confirmed', 'Used']] },
                                    '$quantity',
                                    0
                                ]
                            }
                        },

                        totalRevenue: {
                            $sum: {
                                $cond: [
                                    { $in: ['$status', ['Confirmed', 'Used']] },
                                    '$totalAmount',
                                    0
                                ]
                            }
                        }
                    }
                }
            ]);


            const stats = bookingStats[0] || {
                totalBookings: 0,
                successfulBookings: 0,
                cancelledBookings: 0,
                ticketsSold: 0,
                totalRevenue: 0
            };

            // BOOKING SUCCESS AND CANCELLATION RATES

            const bookingSuccessRate = stats.totalBookings > 0
                ? Number(
                    ((stats.successfulBookings / stats.totalBookings) * 100).toFixed(1)
                )
                : 0;

            const cancellationRate = stats.totalBookings > 0
                ? Number(
                    ((stats.cancelledBookings / stats.totalBookings) * 100).toFixed(1)
                )
                : 0;


            // Calculate sales separately for each event
            const eventSales = await Booking.aggregate([
                {
                    $match: {
                        event: { $in: eventIds }
                    }
                },
                {
                    $group: {
                        _id: '$event',

                        ticketsSold: {
                            $sum: {
                                $cond: [
                                    { $in: ['$status', ['Confirmed', 'Used']] },
                                    '$quantity',
                                    0
                                ]
                            }
                        },

                        revenue: {
                            $sum: {
                                $cond: [
                                    { $in: ['$status', ['Confirmed', 'Used']] },
                                    '$totalAmount',
                                    0
                                ]
                            }
                        }
                    }
                }
            ]);

            // Build a lookup map once so each event's sales are found in O(1)
            const salesMap = new Map(
                eventSales.map(item => [
                    item._id.toString(),
                    item
                ])
            );

            const salesByEvent = events.map(event => {
                const sales = salesMap.get(event._id.toString());

                return {
                    eventTitle: event.title,
                    ticketsSold: sales?.ticketsSold || 0,
                    revenue: sales?.revenue || 0
                };
            });

            // CALCULATE MONTHLY REVENUE AND TICKET SALES
            const monthlyStats = await Booking.aggregate([
                {
                    $match: {
                        event: { $in: eventIds },
                        status: { $in: ['Confirmed', 'Used'] }
                    }
                },
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' }
                        },

                        monthlyTicketsSold: {
                            $sum: '$quantity'
                        },

                        monthlyRevenue: {
                            $sum: '$totalAmount'
                        }
                    }
                },
                {
                    $sort: {
                        '_id.year': 1,
                        '_id.month': 1
                    }
                }
            ]);

            const monthlyTrends = monthlyStats.map(item => ({
                month: new Date(
                    item._id.year,
                    item._id.month - 1
                ).toLocaleString('en-US', {
                    month: 'short',
                    year: 'numeric'
                }),

                ticketsSold: item.monthlyTicketsSold,
                revenue: item.monthlyRevenue
            }));

            // SEND ANALYTICS RESPONSE
            res.status(200).json({
                message: 'Organizer analytics fetched successfully!',

                analytics: {
                    totalEvents,
                    totalBookings: stats.totalBookings,
                    cancelledBookings: stats.cancelledBookings,
                    ticketsSold: stats.ticketsSold,
                    totalRevenue: stats.totalRevenue,
                    totalAvailableSeats,
                    salesByEvent,
                    monthlyTrends,
                    successfulBookings: stats.successfulBookings,
                    bookingSuccessRate,
                    cancellationRate,
                }
            });

        } catch (error) {
            console.error('Analytics error:', error);

            res.status(500).json({
                message: 'Failed to fetch organizer analytics.'
            });
        }
    }
);

module.exports = router;