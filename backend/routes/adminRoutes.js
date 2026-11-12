
const express = require('express');

const User = require('../models/User');
const Event = require('../models/Event');
const Booking = require('../models/Booking');

const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

// ADMIN DASHBOARD API
router.get(
    '/dashboard',
    authMiddleware,
    roleMiddleware('admin'),
    async (req, res) => {
        try {
            // Fetch all users without exposing passwords
            const users = await User.find()
                .select('-password')
                .sort({ createdAt: -1 });

            // Fetch all events
            const events = await Event.find()
                .populate('organizer', 'name email')
                .sort({ createdAt: -1 });

            // Fetch all bookings
            const bookings = await Booking.find()
                .populate('customer', 'name email')
                .populate('event', 'title')
                .sort({ createdAt: -1 });

            // USER STATISTICS
            const totalUsers = users.length;

            const totalCustomers = users.filter(
                user => user.role === 'customer'
            ).length;

            const totalOrganizers = users.filter(
                user => user.role === 'organizer'
            ).length;

            const totalAdmins = users.filter(
                user => user.role === 'admin'
            ).length;

            // EVENT STATISTICS
            const totalEvents = events.length;

            // BOOKING STATISTICS
            const totalBookings = bookings.length;

            const successfulBookings = bookings.filter(
                booking =>
                    ['Confirmed', 'Used'].includes(booking.status)
            );

            const cancelledBookings = bookings.filter(
                booking => booking.status === 'Cancelled'
            );

            const totalTicketsSold = successfulBookings.reduce(
                (total, booking) => total + (booking.quantity || 0),
                0
            );

            const totalRevenue = successfulBookings.reduce(
                (total, booking) => total + (booking.totalAmount || 0),
                0
            );

            // SEND ADMIN DASHBOARD DATA
            res.json({
                message: 'Admin dashboard data retrieved successfully.',

                statistics: {
                    totalUsers,
                    totalCustomers,
                    totalOrganizers,
                    totalAdmins,
                    totalEvents,
                    totalBookings,
                    successfulBookings: successfulBookings.length,
                    cancelledBookings: cancelledBookings.length,
                    totalTicketsSold,
                    totalRevenue
                },

                users,
                events,
                bookings
            });

        } catch (error) {
            console.error('Admin dashboard error:', error);

            res.status(500).json({
                message: 'Failed to load admin dashboard.'
            });
        }
    }
);

module.exports = router;
