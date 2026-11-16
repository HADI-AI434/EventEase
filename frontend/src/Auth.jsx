
import { API_BASE_URL } from './api';
import { useState } from 'react';
import './Auth.css';

function Auth({ onClose, onLogin }) {
    const [isLogin, setIsLogin] = useState(true);
    const [isForgotPassword, setIsForgotPassword] = useState(false);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // New: Customer or Organizer registration choice
    const [accountType, setAccountType] = useState('customer');

    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // LOGIN AND REGISTRATION
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

        // Only customer and organizer registration is permitted.
        if (
            !isLogin &&
            !['customer', 'organizer'].includes(accountType)
        ) {
            setMessage('Please select a valid account type.');
            return;
        }

        setIsSubmitting(true);

        try {
            const endpoint = isLogin
                ? `${API_BASE_URL}/api/auth/login`
                : `${API_BASE_URL}/api/auth/register`;

            const body = isLogin
                ? {
                    email: cleanEmail,
                    password
                }
                : {
                    name: cleanName,
                    email: cleanEmail,
                    password,
                    accountType
                };

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
                if (!data.token || !data.user) {
                    setMessage('Invalid login response from server.');
                    return;
                }

                onLogin(data.token, data.user);
                setMessage(`Welcome back, ${data.user.name}!`);
            } else {
                setMessage(
                    `Your ${accountType === 'organizer' ? 'Organizer' : 'Customer'} account was created successfully! You can now log in.`
                );

                setIsLogin(true);
                setPassword('');
                setConfirmPassword('');
                setAccountType('customer');
            }

        } catch (error) {
            setMessage('Unable to connect to the server. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    }

    // FORGOT PASSWORD
    async function handleForgotPassword(e) {
        e.preventDefault();

        if (isSubmitting) return;

        const cleanEmail = email.trim();

        if (!cleanEmail) {
            setMessage('Please enter your email address.');
            return;
        }

        setIsSubmitting(true);
        setMessage('');

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/auth/forgot-password`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: cleanEmail
                    })
                }
            );

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                setMessage(
                    data.message || 'Unable to process your request. Please try again.'
                );
                return;
            }

            setMessage(
                data.message ||
                'If an account exists with that email, a password reset link will be sent.'
            );

        } catch (error) {
            setMessage('Unable to connect to the server. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    }

    // SWITCH BETWEEN LOGIN AND REGISTRATION
    function handleModeSwitch() {
        if (isSubmitting) return;

        setIsLogin(!isLogin);
        setIsForgotPassword(false);
        setMessage('');
        setPassword('');
        setConfirmPassword('');
        setAccountType('customer');
    }

    // RETURN TO LOGIN FROM FORGOT PASSWORD
    function handleBackToLogin() {
        if (isSubmitting) return;

        setIsForgotPassword(false);
        setIsLogin(true);
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
                    {isForgotPassword
                        ? 'Forgot Password?'
                        : isLogin
                            ? 'Welcome Back!'
                            : 'Create Account'}
                </h2>

                <p>
                    {isForgotPassword
                        ? 'Enter your registered email address. We will send you a password reset link if an account exists.'
                        : isLogin
                            ? 'Login to discover amazing events.'
                            : 'Join EventEase and discover amazing experiences.'}
                </p>

                {/* FORGOT PASSWORD FORM */}
                {isForgotPassword ? (
                    <form onSubmit={handleForgotPassword}>
                        <input
                            type="email"
                            placeholder="Email Address"
                            aria-label="Email Address"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

                        {message && (
                            <p
                                className="auth-message"
                                role="status"
                                aria-live="polite"
                            >
                                {message}
                            </p>
                        )}

                        <button
                            type="submit"
                            className="auth-submit"
                            disabled={isSubmitting}
                        >
                            {isSubmitting
                                ? 'Sending...'
                                : 'Send Reset Link'}
                        </button>

                        <p className="auth-switch">
                            Remember your password?

                            <button
                                type="button"
                                onClick={handleBackToLogin}
                                disabled={isSubmitting}
                            >
                                {' '}Back to Login
                            </button>
                        </p>
                    </form>
                ) : (
                    <>
                        {/* LOGIN AND REGISTRATION FORM */}
                        <form onSubmit={handleSubmit}>
                            {!isLogin && (
                                <>
                                    <input
                                        type="text"
                                        placeholder="Full Name"
                                        aria-label="Full Name"
                                        autoComplete="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />

                                    {/* ACCOUNT TYPE SELECTION */}
                                    <div style={{
                                        textAlign: 'left',
                                        marginBottom: '15px'
                                    }}>
                                        <label
                                            htmlFor="accountType"
                                            style={{
                                                display: 'block',
                                                marginBottom: '8px',
                                                fontWeight: '600'
                                            }}
                                        >
                                            Choose Your Account Type
                                        </label>

                                        <select
                                            id="accountType"
                                            value={accountType}
                                            onChange={(e) =>
                                                setAccountType(e.target.value)
                                            }
                                            disabled={isSubmitting}
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                border: '1px solid #ccc',
                                                borderRadius: '6px',
                                                fontSize: '15px',
                                                backgroundColor: '#fff',
                                                color: '#222',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <option value="customer">
                                                Customer — Discover and book events
                                            </option>

                                            <option value="organizer">
                                                Organizer — Create and manage events
                                            </option>
                                        </select>

                                        <small style={{
                                            display: 'block',
                                            marginTop: '7px',
                                            color: '#666',
                                            lineHeight: '1.5'
                                        }}>
                                            Organizers can also discover and book
                                            events as customers.
                                        </small>
                                    </div>
                                </>
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
                                autoComplete={
                                    isLogin
                                        ? 'current-password'
                                        : 'new-password'
                                }
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
                                    onChange={(e) =>
                                        setConfirmPassword(e.target.value)
                                    }
                                    required
                                />
                            )}

                            {message && (
                                <p
                                    className="auth-message"
                                    role="status"
                                    aria-live="polite"
                                >
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

                        {/* FORGOT PASSWORD LINK */}
                        {isLogin && (
                            <p className="auth-switch">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsForgotPassword(true);
                                        setMessage('');
                                        setPassword('');
                                    }}
                                    disabled={isSubmitting}
                                >
                                    Forgot Password?
                                </button>
                            </p>
                        )}

                        {/* LOGIN / SIGNUP SWITCH */}
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
                    </>
                )}
            </div>
        </div>
    );
}

export default Auth;
