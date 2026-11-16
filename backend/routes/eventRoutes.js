const express = require('express');
const mongoose = require('mongoose');
const Event = require('../models/Event');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

const allowedFields = [
    'title',
    'description',
    'type',
    'category',
    'date',
    'location',
    'city',
    'province',
    'country',
    'venue',
    'imageUrl',
    'images',
    'coordinates',
    'googlePlaceId',
    'bookingUrl',
    'price',
    'availableSeats'
];

const validCategories = [
    'Music',
    'Technology',
    'Business',
    'Education',
    'Arts',
    'Food',
    'Sports',
    'Community',
    'Other'
];


// VALIDATE EVENT DATA
function validateEventData(body, isCreate = false) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return 'Invalid event data.';
    }

    const unknownFields = Object.keys(body).filter(
        field => !allowedFields.includes(field)
    );

    if (unknownFields.length > 0) {
        return `Unsupported fields: ${unknownFields.join(', ')}`;
    }

    // REQUIRED FIELDS FOR EVENT CREATION
    if (isCreate) {
        const requiredFields = [
            'title',
            'description',
            'type',
            'date',
            'location',
            'price',
            'availableSeats'
        ];

        for (const field of requiredFields) {
            if (
                body[field] === undefined ||
                body[field] === null ||
                body[field] === ''
            ) {
                return `${field} is required.`;
            }
        }

        if (
            body.type === 'In-person' &&
            (
                typeof body.city !== 'string' ||
                !body.city.trim() ||
                typeof body.venue !== 'string' ||
                !body.venue.trim()
            )
        ) {
            return 'City and venue are required for in-person events.';
        }
    }

    // TITLE
    if (body.title !== undefined) {
        if (
            typeof body.title !== 'string' ||
            body.title.trim().length < 3 ||
            body.title.trim().length > 120
        ) {
            return 'Title must contain between 3 and 120 characters.';
        }
    }

    // DESCRIPTION
    if (body.description !== undefined) {
        if (
            typeof body.description !== 'string' ||
            body.description.trim().length < 10 ||
            body.description.trim().length > 3000
        ) {
            return 'Description must contain between 10 and 3000 characters.';
        }
    }

    // EVENT TYPE
    if (
        body.type !== undefined &&
        !['Online', 'In-person'].includes(body.type)
    ) {
        return 'Event type must be Online or In-person.';
    }

    // CATEGORY
    if (
        body.category !== undefined &&
        !validCategories.includes(body.category)
    ) {
        return 'Invalid event category.';
    }

    // EVENT DATE
    if (body.date !== undefined) {
        const parsedDate = new Date(body.date);

        if (
            typeof body.date !== 'string' ||
            body.date.trim() === '' ||
            Number.isNaN(parsedDate.getTime())
        ) {
            return 'Please provide a valid event date.';
        }
    }

    // LOCATION
    if (body.location !== undefined) {
        if (
            typeof body.location !== 'string' ||
            !body.location.trim() ||
            body.location.trim().length > 200
        ) {
            return 'Please provide a valid event location.';
        }
    }

    // CITY
    if (body.city !== undefined) {
        if (
            typeof body.city !== 'string' ||
            body.city.trim().length > 80
        ) {
            return 'City must be a valid text value.';
        }
    }

    // PROVINCE
    if (body.province !== undefined) {
        if (
            typeof body.province !== 'string' ||
            body.province.trim().length > 80
        ) {
            return 'Province must be a valid text value.';
        }
    }

    // COUNTRY
    if (body.country !== undefined) {
        if (
            typeof body.country !== 'string' ||
            body.country.trim().length > 80
        ) {
            return 'Country must be a valid text value.';
        }

        if (body.country.trim().toLowerCase() !== 'pakistan') {
            return 'Only venues in Pakistan are supported.';
        }
    }

    // VENUE
    if (body.venue !== undefined) {
        if (
            typeof body.venue !== 'string' ||
            body.venue.trim().length > 150
        ) {
            return 'Venue must be a valid text value.';
        }
    }

    // GOOGLE PLACE ID
    if (body.googlePlaceId !== undefined) {
        if (
            typeof body.googlePlaceId !== 'string' ||
            body.googlePlaceId.trim().length > 200
        ) {
            return 'Google Place ID must be a valid text value.';
        }
    }

    // PRICE
    if (body.price !== undefined) {
        if (
            typeof body.price !== 'number' ||
            !Number.isFinite(body.price) ||
            body.price < 0
        ) {
            return 'Price must be a non-negative number.';
        }
    }

    // AVAILABLE SEATS
    if (body.availableSeats !== undefined) {
        if (
            typeof body.availableSeats !== 'number' ||
            !Number.isInteger(body.availableSeats) ||
            body.availableSeats < 0
        ) {
            return 'Available seats must be a non-negative whole number.';
        }
    }

    // IMAGE AND BOOKING URL VALIDATION
    const urlFields = [
        'imageUrl',
        'bookingUrl'
    ];

    for (const field of urlFields) {
        if (body[field] !== undefined) {
            const value = body[field];

            if (
                typeof value !== 'string' ||
                (
                    value.trim() !== '' &&
                    !/^https?:\/\/.+/i.test(value.trim())
                )
            ) {
                return `${field} must be a valid HTTP or HTTPS URL.`;
            }
        }
    }

    // EVENT IMAGE GALLERY
    if (body.images !== undefined) {
        if (!Array.isArray(body.images)) {
            return 'Event images must be provided as an array.';
        }

        if (body.images.length > 8) {
            return 'You can upload a maximum of 8 event images.';
        }

        for (const image of body.images) {
            if (
                typeof image !== 'string' ||
                !/^https?:\/\/.+/i.test(image.trim())
            ) {
                return 'Every event image must be a valid HTTP or HTTPS URL.';
            }
        }
    }

    // COORDINATES
    if (body.coordinates !== undefined) {
        const coordinates = body.coordinates;

        if (
            !coordinates ||
            typeof coordinates !== 'object' ||
            Array.isArray(coordinates)
        ) {
            return 'Invalid coordinates.';
        }

        const coordinateKeys = Object.keys(coordinates);

        if (
            coordinateKeys.some(
                key => !['latitude', 'longitude'].includes(key)
            )
        ) {
            return 'Coordinates may only contain latitude and longitude.';
        }

        const { latitude, longitude } = coordinates;

        if (
            typeof latitude !== 'number' ||
            typeof longitude !== 'number' ||
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude) ||
            latitude < -90 ||
            latitude > 90 ||
            longitude < -180 ||
            longitude > 180
        ) {
            return 'Please provide valid latitude and longitude.';
        }
    }

    return null;
}


// HANDLE DATABASE VALIDATION ERRORS
function handleError(res, error) {
    if (
        error.name === 'ValidationError' ||
        error.name === 'CastError'
    ) {
        return res.status(400).json({
            message: 'Invalid event information.',
            error: error.message
        });
    }

    console.error('Event route error:', error);

    return res.status(500).json({
        message: 'Server error.'
    });
}


// CREATE EVENT
router.post(
    '/',
    authMiddleware,
    roleMiddleware('organizer'),
    async (req, res) => {
        try {
            const validationError =
                validateEventData(req.body, true);

            if (validationError) {
                return res.status(400).json({
                    message: validationError
                });
            }

            const eventData = {
                ...req.body,

                // Keep the existing primary image field compatible.
                imageUrl:
                    req.body.imageUrl ||
                    (
                        Array.isArray(req.body.images) &&
                            req.body.images.length > 0
                            ? req.body.images[0]
                            : undefined
                    ),

                category: req.body.category || 'Other',
                country: req.body.country || 'Pakistan',
                organizer: req.user.userId,
                eventSource: 'EventEase',
                providerName: 'EventEase',
                status: 'published'
            };

            const newEvent = new Event(eventData);

            const savedEvent = await newEvent.save();

            return res.status(201).json({
                message: 'Event created successfully!',
                event: savedEvent
            });

        } catch (error) {
            return handleError(res, error);
        }
    }
);


// GET ALL PUBLISHED EVENTS
router.get('/', async (req, res) => {
    try {
        const events = await Event.find({
            status: { $in: ['published', null] }
        })
            .populate('organizer', 'name email')
            .sort({ date: 1 })
            .lean();

        return res.status(200).json({
            message: 'Events fetched successfully!',
            events
        });

    } catch (error) {
        return handleError(res, error);
    }
});


// GET ORGANIZER'S OWN EVENTS
router.get(
    '/my-events',
    authMiddleware,
    roleMiddleware('organizer'),
    async (req, res) => {
        try {
            const events = await Event.find({
                organizer: req.user.userId,
                eventSource: 'EventEase'
            }).sort({ createdAt: -1 });

            return res.status(200).json({
                message: 'Your events fetched successfully!',
                events
            });

        } catch (error) {
            return handleError(res, error);
        }
    }
);


// GET EVENT BY ID
router.get('/:id', async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: 'Invalid event ID.'
            });
        }

        const event = await Event.findById(req.params.id)
            .populate('organizer', 'name email');

        if (
            !event ||
            (
                event.status !== 'published' &&
                event.status != null
            )
        ) {
            return res.status(404).json({
                message: 'Event not found.'
            });
        }

        return res.status(200).json({
            message: 'Event fetched successfully!',
            event
        });

    } catch (error) {
        return handleError(res, error);
    }
});


// UPDATE EVENT
router.put(
    '/:id',
    authMiddleware,
    roleMiddleware('organizer'),
    async (req, res) => {
        try {
            if (!mongoose.isValidObjectId(req.params.id)) {
                return res.status(400).json({
                    message: 'Invalid event ID.'
                });
            }

            const validationError =
                validateEventData(req.body);

            if (validationError) {
                return res.status(400).json({
                    message: validationError
                });
            }

            if (Object.keys(req.body).length === 0) {
                return res.status(400).json({
                    message:
                        'Please provide event information to update.'
                });
            }

            const event = await Event.findById(req.params.id);

            if (!event) {
                return res.status(404).json({
                    message: 'Event not found.'
                });
            }

            // EXTERNAL EVENTS CANNOT BE EDITED BY EVENTEASE ORGANIZERS
            if (event.eventSource === 'External') {
                return res.status(403).json({
                    message:
                        'External events cannot be edited through EventEase.'
                });
            }

            // CHECK EVENT OWNERSHIP
            if (
                !event.organizer ||
                event.organizer.toString() !== req.user.userId
            ) {
                return res.status(403).json({
                    message:
                        'You can only update your own events.'
                });
            }

            // PREVENT EMPTY CITY OR VENUE FOR IN-PERSON UPDATES
            if (
                event.type === 'In-person' ||
                req.body.type === 'In-person'
            ) {
                if (
                    req.body.city !== undefined &&
                    !req.body.city.trim()
                ) {
                    return res.status(400).json({
                        message: 'City cannot be empty for an in-person event.'
                    });
                }

                if (
                    req.body.venue !== undefined &&
                    !req.body.venue.trim()
                ) {
                    return res.status(400).json({
                        message: 'Venue cannot be empty for an in-person event.'
                    });
                }
            }

            // UPDATE ALL ALLOWED FIELDS
            allowedFields.forEach((field) => {
                if (req.body[field] !== undefined) {
                    event[field] = req.body[field];
                }
            });

            // KEEP PRIMARY IMAGE FIELD IN SYNC WITH GALLERY
            if (
                req.body.images !== undefined &&
                req.body.imageUrl === undefined
            ) {
                event.imageUrl =
                    req.body.images.length > 0
                        ? req.body.images[0]
                        : '';
            }

            // DEFAULT COUNTRY
            if (
                req.body.country === undefined &&
                !event.country
            ) {
                event.country = 'Pakistan';
            }

            const updatedEvent = await event.save();

            await updatedEvent.populate('organizer', 'name email');

            return res.status(200).json({
                message: 'Event updated successfully!',
                event: updatedEvent
            });

        } catch (error) {
            return handleError(res, error);
        }
    }
);


// DELETE EVENT
router.delete(
    '/:id',
    authMiddleware,
    roleMiddleware('organizer'),
    async (req, res) => {
        try {
            if (!mongoose.isValidObjectId(req.params.id)) {
                return res.status(400).json({
                    message: 'Invalid event ID.'
                });
            }

            const event = await Event.findById(req.params.id);

            if (!event) {
                return res.status(404).json({
                    message: 'Event not found.'
                });
            }

            // EXTERNAL EVENTS CANNOT BE DELETED BY ORGANIZERS
            if (event.eventSource === 'External') {
                return res.status(403).json({
                    message:
                        'External events cannot be deleted through EventEase.'
                });
            }

            // CHECK ORGANIZER OWNERSHIP SAFELY
            if (
                !event.organizer ||
                event.organizer.toString() !== req.user.userId
            ) {
                return res.status(403).json({
                    message:
                        'You can only delete your own events.'
                });
            }

            await Event.findByIdAndDelete(req.params.id);

            return res.status(200).json({
                message: 'Event deleted successfully!'
            });

        } catch (error) {
            return handleError(res, error);
        }
    }
);


module.exports = router;