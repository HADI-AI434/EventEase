
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Normalize roles using the database as the source of truth.
function getUserRoles(user) {
    const roles = Array.isArray(user.roles)
        ? user.roles.filter(role =>
            ['customer', 'organizer', 'admin'].includes(role)
        )
        : [];

    // Admin accounts have a separate permission set.
    if (roles.includes('admin') || user.role === 'admin') {
        return ['admin'];
    }

    // Organizers also have Customer permissions.
    if (roles.includes('organizer') || user.role === 'organizer') {
        return ['customer', 'organizer'];
    }

    return ['customer'];
}

const authMiddleware = async (req, res, next) => {
    try {
        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET is not configured.');

            return res.status(500).json({
                message: 'Authentication service is unavailable.'
            });
        }

        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                message: 'Access denied. No token provided.'
            });
        }

        const token = authHeader.split(' ')[1];

        // Verify identity and token signature.
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        if (!decoded.userId) {
            return res.status(401).json({
                message: 'Invalid authentication token.'
            });
        }

        // Fetch current permissions from MongoDB.
        const user = await User.findById(decoded.userId)
            .select('name email role roles');

        if (!user) {
            return res.status(401).json({
                message: 'User account no longer exists.'
            });
        }

        const currentRoles = getUserRoles(user);

        // Attach database-authorized information.
        req.user = {
            userId: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            roles: currentRoles
        };

        next();

    } catch (error) {
        if (
            error.name === 'JsonWebTokenError' ||
            error.name === 'TokenExpiredError' ||
            error.name === 'NotBeforeError'
        ) {
            return res.status(401).json({
                message: 'Invalid or expired token.'
            });
        }

        console.error('Authentication middleware error:', error);

        return res.status(500).json({
            message: 'Authentication verification failed.'
        });
    }
};

module.exports = authMiddleware;
