
const express = require('express');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
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

// GET AUTHORIZED ROLES
// Supports multi-role accounts and legacy accounts.
function getUserRoles(user) {
    let roles = Array.isArray(user.roles)
        ? user.roles.filter(role =>
            ['customer', 'organizer', 'admin'].includes(role)
        )
        : [];

    // Admin accounts have separate permissions.
    if (roles.includes('admin') || user.role === 'admin') {
        return ['admin'];
    }

    // Organizers also receive Customer permissions.
    if (roles.includes('organizer') || user.role === 'organizer') {
        return ['customer', 'organizer'];
    }

    if (roles.length === 0) {
        return ['customer'];
    }

    return [...new Set(roles)];
}

// CREATE AUTHENTICATION TOKEN
function createAuthToken(user, roles) {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured.');
    }

    return jwt.sign(
        {
            userId: user._id,
            role: user.role,
            roles
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
}

// REGISTRATION VALIDATION
function validateRegistration(name, email, password, accountType) {
    if (
        typeof name !== 'string' ||
        typeof email !== 'string' ||
        typeof password !== 'string' ||
        typeof accountType !== 'string'
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

    // Public registration cannot create Admin accounts.
    if (!['customer', 'organizer'].includes(accountType)) {
        return 'Please select a valid account type.';
    }

    return null;
}

// USER REGISTRATION API
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, accountType } = req.body;

        const validationError = validateRegistration(
            name,
            email,
            password,
            accountType
        );

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

        const assignedRoles = accountType === 'organizer'
            ? ['customer', 'organizer']
            : ['customer'];

        const newUser = new User({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            roles: assignedRoles,
            role: accountType
        });

        await newUser.save();

        return res.status(201).json({
            message: 'Account created successfully!',
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                roles: assignedRoles
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

        const userRoles = getUserRoles(user);
        const token = createAuthToken(user, userRoles);

        return res.status(200).json({
            message: 'Login successful!',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                roles: userRoles
            }
        });

    } catch (error) {
        console.error('Login error:', error.message);

        return res.status(500).json({
            message: 'Server error during login.'
        });
    }
});

// BECOME AN ORGANIZER API
router.post('/become-organizer', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                message: 'User account not found.'
            });
        }

        const currentRoles = getUserRoles(user);

        if (currentRoles.includes('admin')) {
            return res.status(403).json({
                message: 'Administrator accounts cannot use this upgrade.'
            });
        }

        user.roles = [
            ...new Set([
                ...currentRoles,
                'customer',
                'organizer'
            ])
        ];

        user.role = 'organizer';

        await user.save();

        const updatedRoles = getUserRoles(user);
        const token = createAuthToken(user, updatedRoles);

        return res.status(200).json({
            success: true,
            message: 'Your account has successfully been upgraded to Organizer!',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                roles: updatedRoles
            }
        });

    } catch (error) {
        console.error('Become organizer error:', error.message);

        return res.status(500).json({
            message: 'Unable to upgrade your account right now.'
        });
    }
});

// ADMIN PROMOTION API
// Only an existing Admin can promote another registered user.
router.patch(
    '/promote-to-admin',
    authMiddleware,
    roleMiddleware('admin'),
    async (req, res) => {
        try {
            const { targetUserId } = req.body;

            if (
                typeof targetUserId !== 'string' ||
                !mongoose.Types.ObjectId.isValid(targetUserId)
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide a valid user ID.'
                });
            }

            // Prevent self-promotion.
            if (
                targetUserId.toString() ===
                req.user.userId.toString()
            ) {
                return res.status(403).json({
                    success: false,
                    message: 'You cannot promote yourself.'
                });
            }

            const targetUser = await User.findById(targetUserId);

            if (!targetUser) {
                return res.status(404).json({
                    success: false,
                    message: 'Target user was not found.'
                });
            }

            const currentRoles = getUserRoles(targetUser);

            if (currentRoles.includes('admin')) {
                return res.status(409).json({
                    success: false,
                    message: 'This user is already an Administrator.'
                });
            }

            // Admin is a separate permission set.
            targetUser.roles = ['admin'];
            targetUser.role = 'admin';

            await targetUser.save();

            return res.status(200).json({
                success: true,
                message: 'User successfully promoted to Administrator.',
                user: {
                    id: targetUser._id,
                    name: targetUser.name,
                    email: targetUser.email,
                    role: targetUser.role,
                    roles: ['admin']
                }
            });

        } catch (error) {
            console.error('Admin promotion error:', error.message);

            return res.status(500).json({
                success: false,
                message: 'Unable to promote this user right now.'
            });
        }
    }
);

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

        if (!user) {
            return res.status(200).json({
                message: 'If an account exists with that email, a password reset link will be sent.'
            });
        }

        if (!process.env.FRONTEND_URL) {
            throw new Error('FRONTEND_URL is not configured.');
        }

        const resetToken = crypto.randomBytes(32).toString('hex');

        user.resetPasswordToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        user.resetPasswordExpires = new Date(
            Date.now() + 15 * 60 * 1000
        );

        await user.save();

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

        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

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

        user.password = await bcrypt.hash(password, 12);

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

        const userRoles = getUserRoles(user);

        return res.status(200).json({
            message: 'Profile accessed successfully!',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                roles: userRoles
            }
        });

    } catch (error) {
        console.error('Profile error:', error.message);

        return res.status(500).json({
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
