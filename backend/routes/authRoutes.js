
const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../utils/emailService');

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

// USER REGISTRATION API
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

        const normalizedEmail = email.toLowerCase().trim();

        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(409).json({
                message: 'Email is already registered.'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const newUser = new User({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword
        });

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

// USER LOGIN API
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

        const user = await User.findOne({
            email: email.toLowerCase().trim()
        });

        if (!user) {
            return res.status(401).json({
                message: 'Invalid email or password.'
            });
        }

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

// FORGOT PASSWORD API
router.post('/forgot-password', async (req, res) => {
    let user;

    try {
        const { email } = req.body;

        if (
            typeof email !== 'string' ||
            !email.trim() ||
            email.trim().length > 254 ||
            !isValidEmail(email.trim())
        ) {
            return res.status(400).json({
                message: 'Please provide a valid email address.'
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        user = await User.findOne({
            email: normalizedEmail
        });

        // Use the same response whether the account exists or not.
        if (!user) {
            return res.status(200).json({
                message: 'If an account exists with that email, a password reset link will be sent.'
            });
        }

        if (!process.env.FRONTEND_URL) {
            throw new Error('FRONTEND_URL is not configured.');
        }

        // Generate a secure random token.
        const resetToken = crypto.randomBytes(32).toString('hex');

        // Store only the SHA-256 hash in the database.
        user.resetPasswordToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        // Token expires after 15 minutes.
        user.resetPasswordExpires = new Date(
            Date.now() + 15 * 60 * 1000
        );

        await user.save();

        // Construct the reset link using the trusted frontend URL.
        const resetUrl = new URL(
            '/reset-password',
            process.env.FRONTEND_URL
        );

        resetUrl.searchParams.set('token', resetToken);
        resetUrl.searchParams.set('email', normalizedEmail);

        try {
            await sendPasswordResetEmail(
                normalizedEmail,
                resetUrl.toString()
            );
        } catch (emailError) {
            console.error(
                'Password reset email failed:',
                emailError.message
            );

            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();
        }

        return res.status(200).json({
            message: 'If an account exists with that email, a password reset link will be sent.'
        });

    } catch (error) {
        console.error('Forgot password error:', error.message);

        return res.status(500).json({
            message: 'Unable to process your request right now.'
        });
    }
});

// RESET PASSWORD API
router.post('/reset-password', async (req, res) => {
    try {
        const { email, token, password } = req.body;

        if (
            typeof email !== 'string' ||
            typeof token !== 'string' ||
            typeof password !== 'string' ||
            !email.trim() ||
            !token.trim()
        ) {
            return res.status(400).json({
                message: 'Invalid password reset request.'
            });
        }

        if (!isValidEmail(email.trim()) || email.trim().length > 254) {
            return res.status(400).json({
                message: 'Invalid password reset request.'
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: 'Password must be at least 8 characters.'
            });
        }

        if (Buffer.byteLength(password, 'utf8') > 72) {
            return res.status(400).json({
                message: 'Password must not exceed 72 bytes.'
            });
        }

        // Hash the submitted token to compare with the database.
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        // Find the account with a matching, unexpired reset token.
        const user = await User.findOne({
            email: email.toLowerCase().trim(),
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({
                message: 'Password reset link is invalid or has expired.'
            });
        }

        // Hash and save the new password.
        user.password = await bcrypt.hash(password, 12);

        // Invalidate the reset token so it cannot be reused.
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        return res.status(200).json({
            message: 'Password has been reset successfully. You can now log in.'
        });

    } catch (error) {
        console.error('Reset password error:', error.message);

        return res.status(500).json({
            message: 'Unable to reset your password right now.'
        });
    }
});

// PROTECTED PROFILE ROUTE
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(
            req.user.userId
        ).select('-password');

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

// ADMIN-ONLY ROUTE
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

// ORGANIZER-ONLY ROUTE
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
