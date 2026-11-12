
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const adminRoutes = require('./routes/adminRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const customerAnalyticsRoutes = require('./routes/customerAnalyticsRoutes');
const adminAnalyticsRoutes = require('./routes/adminAnalyticsRoutes');

const app = express();
const MONGODB_URI = process.env.MONGODB_URI;
console.log(
    'MongoDB URI configured:',
    MONGODB_URI ? 'YES' : 'NO',
    'Atlas:',
    MONGODB_URI?.startsWith('mongodb+srv://') ? 'YES' : 'NO'
);
if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is missing.');
}

// CORS CONFIGURATION
const allowedOrigins = (
    process.env.CORS_ORIGIN ||
    'http://localhost:5173'
)
    .split(',')
    .map(origin => origin.trim());

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests without an Origin header, such as PowerShell.
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error('Origin not allowed by CORS.'));
    }
}));

// REQUEST BODY LIMIT
app.use(express.json({ limit: '1mb' }));

// CONNECT TO MONGODB BEFORE HANDLING API REQUESTS
let dbConnectionPromise;

async function connectToDatabase(req, res, next) {
    try {
        if (mongoose.connection.readyState !== 1) {
            if (!dbConnectionPromise) {
                dbConnectionPromise = mongoose.connect(MONGODB_URI)
                    .catch(error => {
                        dbConnectionPromise = null;
                        throw error;
                    });
            }

            await dbConnectionPromise;
        }

        next();
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        next(error);
    }
}

app.use(connectToDatabase);

// API ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/analytics/customer', customerAnalyticsRoutes);
app.use('/api/admin/analytics', adminAnalyticsRoutes);

// HOME ROUTE
app.get('/', (req, res) => {
    res.status(200).send('Welcome to EventEase Backend!');
});

// HEALTH CHECK
app.get('/api/test', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'React can communicate with EventEase Backend!',
        database: mongoose.connection.readyState === 1
            ? 'connected'
            : 'disconnected'
    });
});

// NOT FOUND HANDLER
app.use((req, res) => {
    res.status(404).json({
        message: 'API endpoint not found.'
    });
});

// CENTRAL ERROR HANDLER
app.use((error, req, res, next) => {
    console.error('Server error:', error.message);

    if (error.message === 'Origin not allowed by CORS.') {
        return res.status(403).json({
            message: 'Request origin is not allowed.'
        });
    }

    if (error.type === 'entity.too.large') {
        return res.status(413).json({
            message: 'Request body is too large.'
        });
    }

    if (error instanceof SyntaxError && error.status === 400) {
        return res.status(400).json({
            message: 'Invalid JSON request body.'
        });
    }

    return res.status(500).json({
        message: 'Internal server error.'
    });
});

// EXPORT EXPRESS APP FOR VERCEL
module.exports = app;