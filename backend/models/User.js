
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true
        },

        // NEW: SUPPORT MULTIPLE ROLES
        // Keep undefined temporarily for safe migration
        roles: {
            type: [{
                type: String,
                enum: ['customer', 'organizer', 'admin']
            }],
            default: undefined
        },

        // LEGACY FIELD: Keep until backend migration is complete
        role: {
            type: String,
            enum: ['customer', 'organizer', 'admin'],
            default: 'customer'
        },

        // PASSWORD RESET FIELDS
        resetPasswordToken: {
            type: String,
            default: undefined
        },

        resetPasswordExpires: {
            type: Date,
            default: undefined
        }
    },
    {
        timestamps: true
    }
);

const User = mongoose.model('User', userSchema);

module.exports = User;
