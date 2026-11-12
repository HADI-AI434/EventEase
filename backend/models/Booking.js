const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
    {
        event: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Event',
            required: true
        },

        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        quantity: {
            type: Number,
            required: true,
            min: 1
        },

        totalAmount: {
            type: Number,
            required: true,
            min: 0
        },

        bookingReference: {
            type: String,
            required: true,
            unique: true
        },

        idempotencyKey: {
            type: String,
            default: null
        },

        status: {
            type: String,
            enum: ['Confirmed', 'Cancelled', 'Used'],
            default: 'Confirmed'
        },

        usedAt: {
            type: Date,
            default: null
        },

        verifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        }
    },
    {
        timestamps: true
    }
);

bookingSchema.index(
    { customer: 1, idempotencyKey: 1 },
    {
        unique: true,
        partialFilterExpression: {
            idempotencyKey: { $type: 'string' }
        }
    }
);

// CUSTOMER BOOKING HISTORY
bookingSchema.index({
    customer: 1,
    createdAt: -1
});

// CUSTOMER ANALYTICS
bookingSchema.index({
    customer: 1,
    status: 1
});

// EVENT BOOKING ANALYTICS
bookingSchema.index({
    event: 1,
    status: 1
});

// BOOKING POPULARITY QUERIES
bookingSchema.index({
    status: 1,
    event: 1
});

module.exports = mongoose.model('Booking', bookingSchema);