
const mongoose = require('mongoose');
const Event = require('../models/Event');

// Use the same MongoDB connection as server.js
const MONGO_URI = 'mongodb://127.0.0.1:27017/eventease';

const externalEvents = [
    {
        externalId: 'PK-KHI-SLF-2026-001',
        title: '9th Sindh Literature Festival',
        description:
            'A two-day literature and cultural festival featuring literary discussions, cultural activities and creative performances in Karachi.',
        type: 'In-person',
        category: 'Arts',
        date: new Date('2026-11-21T10:00:00+05:00'),
        city: 'Karachi',
        venue: 'Mohatta Palace Museum',
        location: 'Mohatta Palace Museum, Karachi, Pakistan',
        imageUrl: '',
        bookingUrl: 'https://sindhliteraturefestival.com/pass/',
        eventSource: 'External',
        providerName: 'Sindh Literature Festival',
        sourceUrl: 'https://sindhliteraturefestival.com/faq/',
        price: 0,
        priceKnown: true,
        priceLabel: 'Free entry',
        availableSeats: 0,
        lastVerifiedAt: new Date(),
        status: 'published'
    },
    {
        externalId: 'PK-KHI-RSG-2026-001',
        title: 'Regional Scrum Gathering Karachi 2026',
        description:
            'A two-day professional technology and education gathering focused on Agile practices, Scrum, software development and industry knowledge sharing.',
        type: 'In-person',
        category: 'Technology',
        date: new Date('2026-12-12T09:00:00+05:00'),
        city: 'Karachi',
        venue: 'Mövenpick Hotel Karachi',
        location: 'Mövenpick Hotel Karachi, Karachi, Pakistan',
        imageUrl: '',
        bookingUrl: 'https://agilegatherings.pk/',
        eventSource: 'External',
        providerName: 'Agile Gatherings Pakistan',
        sourceUrl: 'https://agilegatherings.pk/',
        price: 5000,
        priceKnown: true,
        priceLabel:
            'Student: PKR 5,000 | Regular: PKR 30,000 | Late: PKR 35,000',
        availableSeats: 0,
        lastVerifiedAt: new Date(),
        status: 'published'
    }
];

async function importExternalEvents() {
    try {
        await mongoose.connect(MONGO_URI);

        console.log('MongoDB connected successfully!');

        await Event.init();

        let imported = 0;
        let updated = 0;

        for (const eventData of externalEvents) {
            const existingEvent = await Event.findOne({
                externalId: eventData.externalId
            });

            await Event.findOneAndUpdate(
                { externalId: eventData.externalId },
                { $set: eventData },
                {
                    upsert: true,
                    new: true,
                    runValidators: true,
                    setDefaultsOnInsert: true
                }
            );

            if (existingEvent) {
                updated++;
                console.log(`Updated: ${eventData.title}`);
            } else {
                imported++;
                console.log(`Imported: ${eventData.title}`);
            }
        }

        console.log('\nExternal event import completed!');
        console.log(`New events imported: ${imported}`);
        console.log(`Existing events updated: ${updated}`);
        console.log(`Total processed: ${externalEvents.length}`);

    } catch (error) {
        console.error('\nExternal event import failed:', error.message);
        process.exitCode = 1;

    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
            console.log('MongoDB connection closed.');
        }
    }
}

importExternalEvents();
