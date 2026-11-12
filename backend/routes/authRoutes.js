const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// EMAIL VALIDATION
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// REGISTRATION INPUT VALIDATION
function validateRegistration(name, email, password) {
    if (
        typeof name !== 'string' ||
        typeof email !== 'string' ||
        typeof password !== 'string'
    ) {
        return 'Please provide valid registration information.';
    }

    if (name.trim().length < 2 || name.trim().length > 80) {
        return 'Name must contain between 2 and 80 characters.';
    }

    if (
        email.trim().length > 254 ||
        !isValidEmail(email.trim())
    ) {
        return 'Please provide a valid email address.';
    }

    if (password.length < 8) {
        return 'Password must be at least 8 characters.';
    }

    if (Buffer.byteLength(password, 'utf8') > 72) {
        return 'Password must not exceed 72 bytes.';
    }

    return null;
}

// User Registration API
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const validationError =
            validateRegistration(name, email, password);

        if (validationError) {
            return res.status(400).json({
                message: validationError
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            email: email.toLowerCase().trim()
        });

        if (existingUser) {
            return res.status(409).json({
                message: 'Email is already registered.'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create new user
        const newUser = new User({
            name,
            email,
            password: hashedPassword
        });

        // Save user in MongoDB
        await newUser.save();

        res.status(201).json({
            message: 'Account created successfully!',
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        });

    } catch (error) {
        console.error('Registration error:', error.message);

        if (error.code === 11000) {
            return res.status(409).json({
                message: 'Email is already registered.'
            });
        }

        return res.status(500).json({
            message: 'Server error during registration.'
        });
    }
});

// User Login API
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (
            typeof email !== 'string' ||
            typeof password !== 'string' ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: 'Please enter a valid email and password.'
            });
        }

        if (email.trim().length > 254) {
            return res.status(400).json({
                message: 'Invalid email or password.'
            });
        }

        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET is not configured.');

            return res.status(500).json({
                message: 'Authentication service is unavailable.'
            });
        }

        // Find user by email
        const user = await User.findOne({
            email: email.toLowerCase().trim()
        });

        if (!user) {
            return res.status(401).json({
                message: 'Invalid email or password.'
            });
        }

        // Compare entered password with hashed password
        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(401).json({
                message: 'Invalid email or password.'
            });
        }

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({
            message: 'Login successful!',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);

        res.status(500).json({
            message: 'Server error during login.'
        });
    }
});

// Protected profile route
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');

        if (!user) {
            return res.status(404).json({
                message: 'User not found.'
            });
        }

        res.status(200).json({
            message: 'Profile accessed successfully!',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        res.status(500).json({
            message: 'Server error.'
        });
    }
});

router.get(
    '/admin-only',

    authMiddleware,
    roleMiddleware('admin'),
    (req, res) => {
        res.status(200).json({
            message: 'Welcome Admin! You have access to this route.'
        });
    }
);

router.get(
    '/organizer-only',
    authMiddleware,
    roleMiddleware('organizer'),
    (req, res) => {
        res.status(200).json({
            message: 'Welcome Organizer! You have access to organizer features.'
        });
    }
);

module.exports = router;