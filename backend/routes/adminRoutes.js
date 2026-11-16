
const express = require('express');

const User = require('../models/User');
const Event = require('../models/Event');
const Booking = require('../models/Booking');

const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

// Support both multi-role and legacy accounts.
function getUserRoles(user) {
    if (Array.isArray(user.roles)) {
        return user.roles;
    }

    if (user.role === 'organizer') {
        return ['customer', 'organizer'];
    }

    return user.role ? [user.role] : [];
}

// ADMIN DASHBOARD API
router.get(
    '/dashboard',
    authMiddleware,
    roleMiddleware('admin'),
    async (req, res) => {
        try {
            // Fetch users without exposing passwords.
            const users = await User.find()
                .select('-password')
                .sort({ createdAt: -1 });

            // Fetch all events.
            const events = await Event.find()
                .populate('organizer', 'name email')
                .sort({ createdAt: -1 });

            // Fetch all bookings.
            const bookings = await Booking.find()
                .populate('customer', 'name email')
                .populate('event', 'title')
                .sort({ createdAt: -1 });

            // MULTI-ROLE USER STATISTICS
            const totalUsers = users.length;

            const totalCustomers = users.filter(user =>
                getUserRoles(user).includes('customer')
            ).length;

            const totalOrganizers = users.filter(user =>
                getUserRoles(user).includes('organizer')
            ).length;

            const totalAdmins = users.filter(user =>
                getUserRoles(user).includes('admin')
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
                (total, booking) =>
                    total + (booking.quantity || 0),
                0
            );

            const totalRevenue = successfulBookings.reduce(
                (total, booking) =>
                    total + (booking.totalAmount || 0),
                0
            );

            // SEND ADMIN DASHBOARD DATA
            res.json({
                success: true,
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
                success: false,
                message: 'Failed to load admin dashboard.'
            });
        }
    }
);

module.exports = router;
