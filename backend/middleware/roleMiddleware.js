
const roleMiddleware = (...allowedRoles) => {
    return (req, res, next) => {

        if (!req.user) {
            return res.status(401).json({
                message: 'Authentication required.'
            });
        }

        // Support new multi-role accounts and legacy tokens
        const userRoles = Array.isArray(req.user.roles)
            ? req.user.roles
            : req.user.role
                ? [req.user.role]
                : [];

        const hasPermission = allowedRoles.some(role =>
            userRoles.includes(role)
        );

        if (!hasPermission) {
            return res.status(403).json({
                message: 'Access denied. You do not have permission.'
            });
        }

        next();
    };
};

module.exports = roleMiddleware;
