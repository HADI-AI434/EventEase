
const nodemailer = require('nodemailer');

const requiredVariables = [
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
    'EMAIL_FROM'
];

const missingVariables = requiredVariables.filter(
    (variable) => !process.env[variable]
);

if (missingVariables.length > 0) {
    throw new Error(
        `Missing email configuration: ${missingVariables.join(', ')}`
    );
}

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

async function sendPasswordResetEmail(to, resetUrl) {
    return transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject: 'Reset Your EventEase Password',
        text: `You requested a password reset for your EventEase account.

Open this link to create a new password:
${resetUrl}

This link expires in 15 minutes and can only be used once.

If you did not request this reset, you can ignore this email.`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
                <h2>Reset Your EventEase Password</h2>
                <p>You requested a password reset for your EventEase account.</p>
                <p>
                    <a href="${resetUrl}"
                       style="background: #2563eb; color: white;
                       padding: 12px 20px; text-decoration: none;
                       border-radius: 6px; display: inline-block;">
                        Reset My Password
                    </a>
                </p>
                <p>This link expires in 15 minutes and can only be used once.</p>
                <p>If you did not request this reset, you can ignore this email.</p>
                <p>EventEase Team</p>
            </div>
        `
    });
}

module.exports = {
    transporter,
    sendPasswordResetEmail
};
