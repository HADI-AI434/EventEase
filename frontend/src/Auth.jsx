import { API_BASE_URL } from './api';
import { useState } from 'react';
import './Auth.css';

function Auth({ onClose, onLogin }) {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();

        if (isSubmitting) return;

        setMessage('');

        const cleanName = name.trim();
        const cleanEmail = email.trim();

        if (!isLogin && !cleanName) {
            setMessage('Please enter your full name.');
            return;
        }

        if (!isLogin && password !== confirmPassword) {
            setMessage('Passwords do not match.');
            return;
        }

        if (password.length < 8) {
            setMessage('Password must be at least 8 characters.');
            return;
        }

        setIsSubmitting(true);

        try {
            const endpoint = isLogin
                ? `${API_BASE_URL}/api/auth/login`
                : `${API_BASE_URL}/api/auth/register`;

            const body = isLogin
                ? { email: cleanEmail, password }
                : { name: cleanName, email: cleanEmail, password };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                setMessage(
                    data.message || 'Something went wrong. Please try again.'
                );
                return;
            }

            if (isLogin) {
                onLogin(data.token, data.user);
                setMessage(`Welcome back, ${data.user.name}!`);
            } else {
                setMessage('Account created successfully! You can now log in.');
                setIsLogin(true);
                setPassword('');
                setConfirmPassword('');
            }

        } catch (error) {
            setMessage('Unable to connect to the server. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    }

    function handleModeSwitch() {
        if (isSubmitting) return;

        setIsLogin(!isLogin);
        setMessage('');
        setPassword('');
        setConfirmPassword('');
    }

    return (
        <div className="auth-overlay">
            <div
                className="auth-card"
                role="dialog"
                aria-modal="true"
                aria-labelledby="auth-heading"
            >
                <button
                    type="button"
                    className="auth-close"
                    onClick={onClose}
                    aria-label="Close authentication window"
                >
                    ✕
                </button>

                <h1>Event<span>Ease</span></h1>

                <h2 id="auth-heading">
                    {isLogin ? 'Welcome Back!' : 'Create Account'}
                </h2>

                <p>
                    {isLogin
                        ? 'Login to discover amazing events.'
                        : 'Join EventEase and discover amazing experiences.'}
                </p>

                <form onSubmit={handleSubmit}>
                    {!isLogin && (
                        <input
                            type="text"
                            placeholder="Full Name"
                            aria-label="Full Name"
                            autoComplete="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    )}

                    <input
                        type="email"
                        placeholder="Email Address"
                        aria-label="Email Address"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        aria-label="Password"
                        autoComplete={isLogin ? 'current-password' : 'new-password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    {!isLogin && (
                        <input
                            type="password"
                            placeholder="Confirm Password"
                            aria-label="Confirm Password"
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    )}

                    {message && (
                        <p className="auth-message" role="status" aria-live="polite">
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
                            : isLogin
                                ? 'Login'
                                : 'Create Account'}
                    </button>
                </form>

                <p className="auth-switch">
                    {isLogin
                        ? "Don't have an account?"
                        : 'Already have an account?'}

                    <button
                        type="button"
                        onClick={handleModeSwitch}
                        disabled={isSubmitting}
                    >
                        {isLogin ? ' Sign Up' : ' Login'}
                    </button>
                </p>
            </div>
        </div>
    );
}

export default Auth;
