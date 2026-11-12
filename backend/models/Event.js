const mongoose = require('mongoose');

const coordinatesSchema = new mongoose.Schema(
    {
        latitude: {
            type: Number,
            min: -90,
            max: 90
        },
        longitude: {
            type: Number,
            min: -180,
            max: 180
        }
    },
    { _id: false }
);

const eventSchema = new mongoose.Schema(
    {
        // BASIC EVENT INFORMATION
        title: {
            type: String,
            required: true,
            trim: true,
            minlength: 3,
            maxlength: 120
        },

        description: {
            type: String,
            required: true,
            trim: true,
            minlength: 10,
            maxlength: 3000
        },

        type: {
            type: String,
            enum: ['Online', 'In-person'],
            required: true
        },

        category: {
            type: String,
            enum: [
                'Music',
                'Technology',
                'Business',
                'Education',
                'Arts',
                'Food',
                'Sports',
                'Community',
                'Other'
            ],
            default: 'Other'
        },

        // DATE AND LOCATION
        date: {
            type: Date,
            required: true
        },

        location: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200
        },

        city: {
            type: String,
            trim: true,
            maxlength: 80
        },

        venue: {
            type: String,
            trim: true,
            maxlength: 150
        },

        // EVENT IMAGE
        imageUrl: {
            type: String,
            trim: true,
            default: '',
            validate: {
                validator: function (value) {
                    return !value ||
                        /^https?:\/\/.+/i.test(value);
                },
                message: 'Image URL must start with http:// or https://.'
            }
        },

        // MAP COORDINATES
        coordinates: {
            type: coordinatesSchema,
            default: undefined
        },

        // EXTERNAL BOOKING LINK
        bookingUrl: {
            type: String,
            trim: true,
            default: '',
            validate: {
                validator: function (value) {
                    return !value ||
                        /^https?:\/\/.+/i.test(value);
                },
                message: 'Booking URL must start with http:// or https://.'
            }
        },

        // EVENT SOURCE
        eventSource: {
            type: String,
            enum: ['EventEase', 'External'],
            default: 'EventEase'
        },

        providerName: {
            type: String,
            trim: true,
            default: 'EventEase'
        },

        sourceUrl: {
            type: String,
            trim: true,
            default: '',
            validate: {
                validator: function (value) {
                    return !value ||
                        /^https?:\/\/.+/i.test(value);
                },
                message: 'Source URL must start with http:// or https://.'
            }
        },

        // PRICE INFORMATION
        price: {
            type: Number,
            required: true,
            min: 0
        },

        priceKnown: {
            type: Boolean,
            default: true
        },

        priceLabel: {
            type: String,
            trim: true,
            default: ''
        },

        // EXTERNAL EVENT DUPLICATE PREVENTION
        externalId: {
            type: String,
            trim: true,
            default: undefined
        },



        // LAST VERIFICATION DATE
        lastVerifiedAt: {
            type: Date,
            default: null
        },

        // EVENT STATUS
        status: {
            type: String,
            enum: ['published', 'cancelled', 'completed'],
            default: 'published'
        },

        // AVAILABLE SEATS
        availableSeats: {
            type: Number,
            required: true,
            min: 0,
            validate: {
                validator: Number.isInteger,
                message: 'Available seats must be a whole number.'
            }
        },

        // EVENT ORGANIZER
        organizer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: function () {
                return this.eventSource === 'EventEase';
            }
        }
    },
    { timestamps: true }
);

// PREVENT DUPLICATE EXTERNAL EVENTS
eventSchema.index(
    { externalId: 1 },
    { unique: true, sparse: true }
);

// EVENT DISCOVERY INDEX
eventSchema.index({
    status: 1,
    date: 1
});

// ORGANIZER EVENT MANAGEMENT INDEX
eventSchema.index({
    organizer: 1,
    eventSource: 1,
    createdAt: -1
});

// COORDINATES VALIDATION
eventSchema.pre('validate', function () {
    if (this.coordinates) {
        const hasLatitude =
            this.coordinates.latitude !== undefined &&
            this.coordinates.latitude !== null;

        const hasLongitude =
            this.coordinates.longitude !== undefined &&
            this.coordinates.longitude !== null;

        if (hasLatitude !== hasLongitude) {
            this.invalidate(
                'coordinates',
                'Both latitude and longitude are required.'
            );
        }
    }
});

// CREATE MODEL
const Event = mongoose.model('Event', eventSchema);

module.exports = Event;