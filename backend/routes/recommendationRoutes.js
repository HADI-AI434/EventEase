const express = require('express');

const Booking = require('../models/Booking');
const Event = require('../models/Event');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

// GET PERSONALIZED EVENT RECOMMENDATIONS
router.get(
    '/',
    authMiddleware,
    roleMiddleware('customer'),
    async (req, res) => {
        try {
            const customerId = req.user.userId;
            const now = new Date();

            // 1. GET CUSTOMER BOOKING HISTORY
            const bookingHistory = await Booking.find({
                customer: customerId,
                status: { $in: ['Confirmed', 'Used'] }
            })
                .select('event')
                .populate('event', 'category')
                .lean();

            // 2. CALCULATE CATEGORY PREFERENCES
            const categoryCounts = {};

            bookingHistory.forEach(booking => {
                const category = booking.event?.category;

                if (category) {
                    categoryCounts[category] =
                        (categoryCounts[category] || 0) + 1;
                }
            });

            // 3. EXCLUDE PREVIOUSLY BOOKED EVENTS
            const bookedEventIds = bookingHistory
                .filter(booking => booking.event)
                .map(booking => booking.event._id);

            // 4. FIND ELIGIBLE UPCOMING EVENTS
            const events = await Event.find({
                date: { $gt: now },
                status: 'published',
                _id: { $nin: bookedEventIds },
                $or: [
                    { eventSource: 'External' },
                    {
                        eventSource: 'EventEase',
                        priceKnown: { $ne: false }
                    }
                ]
            })
                .sort({ date: 1 })
                .limit(100)
                .lean();

            // 5. CALCULATE POPULARITY ONLY FOR ELIGIBLE EVENTS
            let popularityResults = [];

            if (events.length > 0) {
                const eventIds = events.map(event => event._id);

                popularityResults = await Booking.aggregate([
                    {
                        $match: {
                            event: { $in: eventIds },
                            status: { $in: ['Confirmed', 'Used'] }
                        }
                    },
                    {
                        $group: {
                            _id: '$event',
                            bookingCount: { $sum: 1 }
                        }
                    }
                ]);
            }

            const popularityCounts = new Map();

            popularityResults.forEach(item => {
                popularityCounts.set(
                    item._id.toString(),
                    item.bookingCount
                );
            });

            // 6. SCORE RECOMMENDATIONS
            const recommendations = events.map(event => {
                const categoryCount =
                    categoryCounts[event.category] || 0;

                const popularity =
                    popularityCounts.get(event._id.toString()) || 0;

                const score =
                    categoryCount * 10 + popularity * 2;

                let reason = 'An upcoming event you may enjoy.';

                if (categoryCount > 0) {
                    reason =
                        `Based on your interest in ${event.category}.`;
                } else if (popularity > 0) {
                    reason =
                        'Popular among EventEase customers.';
                } else if (
                    Object.keys(categoryCounts).length === 0
                ) {
                    reason =
                        'Discover an upcoming event in Pakistan.';
                }

                return {
                    ...event,
                    recommendationScore: score,
                    recommendationReason: reason
                };
            });

            // 7. RANK RECOMMENDATIONS
            recommendations.sort((a, b) => {
                if (
                    b.recommendationScore !==
                    a.recommendationScore
                ) {
                    return (
                        b.recommendationScore -
                        a.recommendationScore
                    );
                }

                return new Date(a.date) - new Date(b.date);
            });

            return res.status(200).json({
                message: 'Recommendations fetched successfully.',
                basedOnBookingHistory: bookingHistory.length > 0,
                preferredCategories: Object.keys(categoryCounts),
                recommendations: recommendations.slice(0, 8)
            });

        } catch (error) {
            console.error('Recommendation error:', error);

            return res.status(500).json({
                message:
                    'Failed to generate event recommendations.'
            });
        }
    }
);

module.exports = router;