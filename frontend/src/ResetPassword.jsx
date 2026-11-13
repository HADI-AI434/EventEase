
import { useState } from 'react';
import { API_BASE_URL } from './api';
import './Auth.css';

function ResetPassword() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const email = params.get('email');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();

        if (isSubmitting) return;

        setMessage('');

        if (!token || !email) {
            setMessage('Invalid password reset link.');
            return;
        }

        if (password.length < 8) {
            setMessage('Password must be at least 8 characters.');
            return;
        }

        if (new TextEncoder().encode(password).length > 72) {
            setMessage('Password must not exceed 72 bytes.');
            return;
        }

        if (password !== confirmPassword) {
            setMessage('Passwords do not match.');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/auth/reset-password`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email,
                        token,
                        password
                    })
                }
            );

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                setMessage(
                    data.message || 'Unable to reset your password.'
                );
                return;
            }

            setIsSuccess(true);
            setMessage(data.message);

            setPassword('');
            setConfirmPassword('');

        } catch (error) {
            setMessage(
                'Unable to connect to the server. Please try again.'
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="auth-overlay">
            <div className="auth-card" role="main">
                <h1>Event<span>Ease</span></h1>

                <h2>
                    {isSuccess ? 'Password Reset Successful!' : 'Create New Password'}
                </h2>

                {!isSuccess && (
                    <>
                        <p>Enter your new password below.</p>

                        <form onSubmit={handleSubmit}>
                            <input
                                type="password"
                                placeholder="New Password"
                                aria-label="New Password"
                                autoComplete="new-password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />

                            <input
                                type="password"
                                placeholder="Confirm New Password"
                                aria-label="Confirm New Password"
                                autoComplete="new-password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                required
                            />

                            {message && (
                                <p className="auth-message" role="status">
                                    {message}
                                </p>
                            )}

                            <button
                                type="submit"
                                className="auth-submit"
                                disabled={isSubmitting}
                            >
                                {isSubmitting
                                    ? 'Please wait...'
                                    : 'Reset Password'}
                            </button>
                        </form>
                    </>
                )}

                {isSuccess && (
                    <>
                        <p className="auth-message" role="status">
                            {message}
                        </p>

                        <button
                            className="auth-submit"
                            onClick={() => {
                                window.location.href = '/';
                            }}
                        >
                            Return to Login
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export default ResetPassword;
