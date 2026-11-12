const express = require('express');

const User = require('../models/User');
const Event = require('../models/Event');
const Booking = require('../models/Booking');

const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

router.get(
    '/',
    authMiddleware,
    roleMiddleware('admin'),
    async (req, res) => {
        try {
            const [
                userCounts,
                eventCounts,
                bookingSummary,
                monthlyBookings,
                monthlyUsers,
                categoryBreakdown,
                bookingStatuses
            ] = await Promise.all([
                User.aggregate([
                    {
                        $group: {
                            _id: '$role',
                            count: { $sum: 1 }
                        }
                    }
                ]),

                Event.aggregate([
                    {
                        $group: {
                            _id: null,
                            totalEvents: { $sum: 1 },
                            publishedEvents: {
                                $sum: {
                                    $cond: [
                                        { $eq: ['$status', 'published'] },
                                        1,
                                        0
                                    ]
                                }
                            },
                            externalEvents: {
                                $sum: {
                                    $cond: [
                                        { $eq: ['$eventSource', 'External'] },
                                        1,
                                        0
                                    ]
                                }
                            }
                        }
                    }
                ]),

                Booking.aggregate([
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
                ]),

                Booking.aggregate([
                    {
                        $match: {
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
                            ticketsSold: { $sum: '$quantity' },
                            revenue: { $sum: '$totalAmount' }
                        }
                    },
                    { $sort: { _id: -1 } },
                    { $limit: 12 },
                    { $sort: { _id: 1 } }
                ]),

                User.aggregate([
                    {
                        $group: {
                            _id: {
                                $dateToString: {
                                    format: '%Y-%m',
                                    date: '$createdAt'
                                }
                            },
                            registrations: { $sum: 1 }
                        }
                    },
                    { $sort: { _id: -1 } },
                    { $limit: 12 },
                    { $sort: { _id: 1 } }
                ]),

                Event.aggregate([
                    {
                        $match: {
                            status: { $ne: 'cancelled' }
                        }
                    },
                    {
                        $group: {
                            _id: { $ifNull: ['$category', 'Other'] },
                            eventCount: { $sum: 1 }
                        }
                    },
                    { $sort: { eventCount: -1 } }
                ]),

                Booking.aggregate([
                    {
                        $group: {
                            _id: '$status',
                            count: { $sum: 1 }
                        }
                    }
                ])
            ]);

            const roleCounts = new Map(
                userCounts.map(item => [
                    item._id,
                    item.count
                ])
            );

            const getRoleCount = role =>
                roleCounts.get(role) || 0;

            const events = eventCounts[0] || {
                totalEvents: 0,
                publishedEvents: 0,
                externalEvents: 0
            };

            const bookings = bookingSummary[0] || {
                totalBookings: 0,
                successfulBookings: 0,
                cancelledBookings: 0,
                ticketsSold: 0,
                revenue: 0
            };

            res.json({
                success: true,

                summary: {
                    totalUsers: userCounts.reduce(
                        (total, item) => total + item.count,
                        0
                    ),
                    totalCustomers: getRoleCount('customer'),
                    totalOrganizers: getRoleCount('organizer'),
                    totalAdmins: getRoleCount('admin'),

                    ...events,

                    totalBookings: bookings.totalBookings,
                    successfulBookings: bookings.successfulBookings,
                    cancelledBookings: bookings.cancelledBookings,
                    ticketsSold: bookings.ticketsSold,
                    totalRevenue: bookings.revenue
                },

                monthlyBookings: monthlyBookings.map(item => ({
                    month: item._id,
                    bookings: item.bookings,
                    ticketsSold: item.ticketsSold,
                    revenue: item.revenue
                })),

                monthlyUsers: monthlyUsers.map(item => ({
                    month: item._id,
                    registrations: item.registrations
                })),

                categoryBreakdown: categoryBreakdown.map(item => ({
                    category: item._id,
                    eventCount: item.eventCount
                })),

                bookingStatuses: bookingStatuses.map(item => ({
                    status: item._id,
                    count: item.count
                }))
            });
        } catch (error) {
            console.error('Admin analytics error:', error);
            res.status(500).json({
                message: 'Unable to load admin analytics.'
            });
        }
    }
);

module.exports = router;