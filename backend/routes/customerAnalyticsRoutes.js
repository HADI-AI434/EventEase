const express = require('express');
const mongoose = require('mongoose');

const Booking = require('../models/Booking');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

router.get(
    '/',
    authMiddleware,
    roleMiddleware('customer'),
    async (req, res) => {
        try {
            const customerId = new mongoose.Types.ObjectId(req.user.userId);

            const [
                bookingSummary,
                monthlyActivity,
                categoryBreakdown
            ] = await Promise.all([
                Booking.aggregate([
                    { $match: { customer: customerId } },
                    {
                        $group: {
                            _id: null,
                            totalBookings: { $sum: 1 },
                            cancelledBookings: {
                                $sum: {
                                    $cond: [
                                        { $eq: ['$status', 'Cancelled'] },
                                        1,
                                        0
                                    ]
                                }
                            },
                            successfulBookings: {
                                $sum: {
                                    $cond: [
                                        { $in: ['$status', ['Confirmed', 'Used']] },
                                        1,
                                        0
                                    ]
                                }
                            },
                            ticketsPurchased: {
                                $sum: {
                                    $cond: [
                                        { $in: ['$status', ['Confirmed', 'Used']] },
                                        '$quantity',
                                        0
                                    ]
                                }
                            },
                            totalSpent: {
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
                ]),

                Booking.aggregate([
                    {
                        $match: {
                            customer: customerId,
                            status: { $in: ['Confirmed', 'Used'] }
                        }
                    },
                    {
                        $group: {
                            _id: {
                                $dateToString: {
                                    format: '%Y-%m',
                                    date: '$createdAt'
                                }
                            },
                            bookings: { $sum: 1 },
                            tickets: { $sum: '$quantity' },
                            spending: { $sum: '$totalAmount' }
                        }
                    },
                    { $sort: { _id: -1 } },
                    { $limit: 12 },
                    { $sort: { _id: 1 } }
                ]),

                Booking.aggregate([
                    {
                        $match: {
                            customer: customerId,
                            status: { $in: ['Confirmed', 'Used'] }
                        }
                    },
                    {
                        $lookup: {
                            from: 'events',
                            localField: 'event',
                            foreignField: '_id',
                            as: 'event'
                        }
                    },
                    { $unwind: '$event' },
                    {
                        $group: {
                            _id: {
                                $ifNull: ['$event.category', 'Other']
                            },
                            bookings: { $sum: 1 },
                            tickets: { $sum: '$quantity' },
                            spending: { $sum: '$totalAmount' }
                        }
                    },
                    { $sort: { tickets: -1 } }
                ])
            ]);

            const summary = bookingSummary[0] || {
                totalBookings: 0,
                cancelledBookings: 0,
                successfulBookings: 0,
                ticketsPurchased: 0,
                totalSpent: 0
            };

            const preferredCategory = categoryBreakdown.length
                ? categoryBreakdown[0]._id
                : null;

            res.json({
                success: true,
                summary,
                monthlyActivity: monthlyActivity.map(item => ({
                    month: item._id,
                    bookings: item.bookings,
                    tickets: item.tickets,
                    spending: item.spending
                })),
                categoryBreakdown: categoryBreakdown.map(item => ({
                    category: item._id,
                    bookings: item.bookings,
                    tickets: item.tickets,
                    spending: item.spending
                })),
                preferredCategory
            });
        } catch (error) {
            console.error('Customer analytics error:', error);
            res.status(500).json({
                message: 'Unable to load customer analytics.'
            });
        }
    }
);

module.exports = router;