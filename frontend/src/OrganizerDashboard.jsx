import { API_BASE_URL } from './api';
import { useState, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

import {
    ResponsiveContainer,
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from 'recharts';

import DashboardAnalyticsCharts from './DashboardAnalyticsCharts';

function OrganizerDashboard({ onBack }) {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    // ORGANIZER ANALYTICS STATES
    const [analytics, setAnalytics] = useState(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(true);
    const [analyticsError, setAnalyticsError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingEventId, setEditingEventId] = useState(null);

    // QR TICKET VERIFICATION STATES
    const [showScanner, setShowScanner] = useState(false);
    const [verificationResult, setVerificationResult] = useState(null);
    const [scanning, setScanning] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'In-person',
        category: 'Other',
        date: '',
        location: '',
        price: '',
        availableSeats: ''
    });

    // FETCH ORGANIZER'S EVENTS
    async function fetchMyEvents() {
        try {
            const savedUser = JSON.parse(
                localStorage.getItem('eventeaseUser')
            );

            if (!savedUser?.token) {
                throw new Error('Please log in first.');
            }

            const response = await fetch(
                `${API_BASE_URL}/api/events/my-events`,
                {
                    headers: {
                        Authorization: `Bearer ${savedUser.token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch events.');
            }

            setEvents(data.events);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    // FETCH ORGANIZER ANALYTICS
    async function fetchOrganizerAnalytics() {
        try {
            const savedUser = JSON.parse(
                localStorage.getItem('eventeaseUser')
            );

            if (!savedUser?.token) {
                throw new Error('Please log in first.');
            }

            const response = await fetch(
                `${API_BASE_URL}/api/analytics/organizer`,
                {
                    headers: {
                        Authorization: `Bearer ${savedUser.token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || 'Failed to fetch analytics.'
                );
            }

            setAnalytics(data.analytics);

        } catch (err) {
            setAnalyticsError(err.message);

        } finally {
            setAnalyticsLoading(false);
        }
    }


    useEffect(() => {
        fetchMyEvents();
        fetchOrganizerAnalytics();
    }, []);

    // SCAN QR CODE FROM AN UPLOADED IMAGE

    async function handleImageUpload(e) {
        const file = e.target.files?.[0];

        if (!file) return;

        setVerificationResult(null);
        setScanning(true);

        try {
            const savedUser = JSON.parse(
                localStorage.getItem('eventeaseUser')
            );

            if (!savedUser?.token) {
                throw new Error('Please log in first.');
            }

            const qrScanner = new Html5Qrcode(
                'eventease-image-reader'
            );

            try {
                const decodedText = await qrScanner.scanFile(file, true);

                console.log('QR decoded text:', JSON.stringify(decodedText));

                const response = await fetch(
                    `${API_BASE_URL}/api/bookings/verify/${encodeURIComponent(decodedText.trim())}`,
                    {
                        headers: {
                            Authorization: `Bearer ${savedUser.token}`
                        }
                    }
                );

                const data = await response.json();

                console.log('Verification API response:', data);
                console.log('Verification HTTP status:', response.status);

                setVerificationResult({
                    ...data,
                    valid: response.ok && data.valid
                });

            } finally {
                // Clean up without allowing a cleanup error
                // to overwrite the actual verification result.
                try {
                    await qrScanner.clear();
                } catch (cleanupError) {
                    console.warn('QR scanner cleanup:', cleanupError);
                }
            }

        } catch (error) {
            setVerificationResult({
                valid: false,
                message: error.message?.toLowerCase().includes('qr code')
                    ? 'No readable QR code found in this image. Please try another image.'
                    : error.message || 'Unable to scan the uploaded image.'
            });

        } finally {
            setScanning(false);
            e.target.value = '';
        }
    }


    // HANDLE INPUT CHANGES
    function handleChange(e) {
        const { name, value } = e.target;

        setFormData({
            ...formData,
            [name]: value
        });
    }

    function handleEditClick(event) {
        const eventDate = new Date(event.date);

        const localDate = new Date(
            eventDate.getTime() -
            eventDate.getTimezoneOffset() * 60000
        ).toISOString().slice(0, 16);

        setFormData({
            title: event.title,
            description: event.description,
            type: event.type,
            category: event.category || 'Other',
            date: localDate,
            location: event.location,
            price: event.price,
            availableSeats: event.availableSeats
        });

        setEditingEventId(event._id);
        setShowForm(true);
        setMessage('');

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // DELETE EVENT
    async function handleDeleteEvent(eventId) {
        const confirmDelete = window.confirm(
            'Are you sure you want to delete this event?'
        );

        if (!confirmDelete) {
            return;
        }

        try {
            const savedUser = JSON.parse(
                localStorage.getItem('eventeaseUser')
            );

            const response = await fetch(
                `${API_BASE_URL}/api/events/${eventId}`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${savedUser.token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Event deletion failed.');
            }

            setMessage('Event deleted successfully!');
            await fetchMyEvents();

        } catch (err) {
            setMessage(err.message);
        }
    }

    // CREATE A NEW EVENT
    async function handleCreateEvent(e) {
        e.preventDefault();

        setSubmitting(true);
        setMessage('');

        try {
            const savedUser = JSON.parse(
                localStorage.getItem('eventeaseUser')
            );

            const url = editingEventId
                ? `${API_BASE_URL}/api/events/${editingEventId}`
                : `${API_BASE_URL}/api/events`;

            const response = await fetch(url, {
                method: editingEventId ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${savedUser.token}`
                },
                body: JSON.stringify({
                    ...formData,
                    price: Number(formData.price),
                    availableSeats: Number(formData.availableSeats)
                })
            }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    (editingEventId ? 'Event update failed.' : 'Event creation failed.')
                );
            }

            setMessage(
                editingEventId
                    ? 'Event updated successfully!'
                    : 'Event created successfully!'
            );

            setFormData({
                title: '',
                description: '',
                type: 'In-person',
                category: 'Other',
                date: '',
                location: '',
                price: '',
                availableSeats: ''
            });

            setShowForm(false);
            setEditingEventId(null);
            await fetchMyEvents();

        } catch (err) {
            setMessage(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return <h2>Loading your events...</h2>;
    }

    if (error) {
        return <p>{error}</p>;
    }


    // BEST-PERFORMING EVENT
    const bestPerformingEvent = analytics?.salesByEvent
        ?.filter(event => event.ticketsSold > 0)
        .sort((a, b) => {
            // First compare ticket sales
            if (b.ticketsSold !== a.ticketsSold) {
                return b.ticketsSold - a.ticketsSold;
            }

            // If ticket sales are equal, compare revenue
            return b.revenue - a.revenue;
        })[0] || null;


    return (
        <div className="organizer-dashboard">
            <h1>Organizer Dashboard</h1>
            <button
                className="login-btn"
                onClick={() => {
                    setVerificationResult(null);
                    setShowScanner(!showScanner);
                }}
            >
                {showScanner ? 'Close Scanner' : 'Scan Ticket'}
            </button>
            <button
                className="login-btn"
                onClick={onBack}
            >
                ← Back to Home
            </button>

            <button
                className="login-btn"
                onClick={() => {
                    if (showForm) {
                        setShowForm(false);
                    } else {
                        setEditingEventId(null);
                        setFormData({
                            title: '',
                            description: '',
                            type: 'In-person',
                            category: 'Other',
                            date: '',
                            location: '',
                            price: '',
                            availableSeats: ''
                        });
                        setShowForm(true);
                    }

                    setMessage('');
                }}
            >
                {showForm ? 'Cancel' : 'Create New Event'}
            </button>

            {message && <p>{message}</p>}

            {showScanner && (
                <div className="ticket-scanner-section">
                    <h2>Scan Customer Ticket</h2>

                    <p>Upload the customer's QR code image to verify their ticket.</p>

                    <div className="qr-upload-section">
                        <h3>Or Upload QR Ticket Image</h3>

                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={scanning}
                        />

                        <p>Choose a screenshot or photo containing the customer's QR code.</p>
                    </div>



                    <div
                        id="eventease-image-reader"
                        style={{ display: 'none' }}
                    />

                    {scanning && <p>Verifying ticket...</p>}


                    {verificationResult && (
                        <div className={`verification-result ${verificationResult.valid
                            ? 'ticket-valid'
                            : verificationResult.message?.toLowerCase().includes('already used')
                                ? 'ticket-used'
                                : 'ticket-invalid'
                            }`}>

                            <h3>
                                {verificationResult.valid
                                    ? 'Ticket Valid! Entry Approved'
                                    : verificationResult.message?.toLowerCase().includes('already used')
                                        ? 'Ticket Already Used!'
                                        : 'Ticket Invalid!'}
                            </h3>

                            <p>{verificationResult.message}</p>

                            {verificationResult.ticket && (
                                <>
                                    <p>Event: {verificationResult.ticket.event}</p>

                                    <p>
                                        Date: {new Date(
                                            verificationResult.ticket.date
                                        ).toLocaleString()}
                                    </p>

                                    <p>Location: {verificationResult.ticket.location}</p>

                                    <p>Tickets: {verificationResult.ticket.quantity}</p>

                                    <p>Status: {verificationResult.ticket.status}</p>

                                    <p>
                                        Reference: {verificationResult.ticket.bookingReference}
                                    </p>

                                    {verificationResult.ticket.usedAt && (
                                        <p>
                                            Entry recorded: {new Date(
                                                verificationResult.ticket.usedAt
                                            ).toLocaleString()}
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                </div>
            )}

            {showForm && (
                <form onSubmit={handleCreateEvent}>
                    <h2>{editingEventId ? 'Edit Event' : 'Create Event'}</h2>
                    <input
                        type="text"
                        name="title"
                        placeholder="Event Title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                    />

                    <textarea
                        name="description"
                        placeholder="Event Description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                    />

                    <select
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                    >
                        <option value="In-person">In-person</option>
                        <option value="Online">Online</option>
                    </select>

                    <div className="form-group">
                        <label htmlFor="event-category">Event Category</label>

                        <select
                            id="event-category"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            required
                        >
                            <option value="Music">Music</option>
                            <option value="Technology">Technology</option>
                            <option value="Business">Business</option>
                            <option value="Education">Education</option>
                            <option value="Arts">Arts</option>
                            <option value="Food">Food</option>
                            <option value="Sports">Sports</option>
                            <option value="Community">Community</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <input
                        type="datetime-local"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        required
                    />

                    <input
                        type="text"
                        name="location"
                        placeholder="Event Location"
                        value={formData.location}
                        onChange={handleChange}
                        required
                    />

                    <input
                        type="number"
                        name="price"
                        placeholder="Ticket Price (Rs.)"
                        min="0"
                        value={formData.price}
                        onChange={handleChange}
                        required
                    />

                    <input
                        type="number"
                        name="availableSeats"
                        placeholder="Available Seats"
                        min="1"
                        step="1"
                        value={formData.availableSeats}
                        onChange={handleChange}
                        required
                    />

                    <button type="submit" disabled={submitting}>
                        {submitting
                            ? 'Saving...'
                            : editingEventId
                                ? 'Update Event'
                                : 'Create Event'}
                    </button>
                </form>
            )}


            {/* ORGANIZER ANALYTICS DASHBOARD */}
            <section className="analytics-section">
                <h2>Organizer Analytics</h2>

                {analyticsLoading ? (
                    <p>Loading analytics...</p>
                ) : analyticsError ? (
                    <p>{analyticsError}</p>
                ) : analytics && (
                    <div className="analytics-grid">

                        {/* BOOKING SUCCESS RATE */}
                        <div className="analytics-card">
                            <h3>Booking Success Rate</h3>
                            <p>{analytics.bookingSuccessRate}%</p>
                            <small>
                                {analytics.successfulBookings} successful bookings
                            </small>
                        </div>

                        {/* CANCELLATION RATE */}
                        <div className="analytics-card">
                            <h3>Cancellation Rate</h3>
                            <p>{analytics.cancellationRate}%</p>
                            <small>
                                {analytics.cancelledBookings} cancelled bookings
                            </small>
                        </div>


                        <div className="analytics-card">
                            <h3>Total Events</h3>
                            <p>{analytics.totalEvents}</p>
                        </div>

                        <div className="analytics-card">
                            <h3>Total Bookings</h3>
                            <p>{analytics.totalBookings}</p>
                        </div>

                        <div className="analytics-card">
                            <h3>Tickets Sold</h3>
                            <p>{analytics.ticketsSold}</p>
                        </div>

                        <div className="analytics-card">
                            <h3>Total Revenue</h3>
                            <p>Rs. {analytics.totalRevenue}</p>
                        </div>

                        <div className="analytics-card">
                            <h3>Cancelled Bookings</h3>
                            <p>{analytics.cancelledBookings}</p>
                        </div>

                        <div className="analytics-card">
                            <h3>Available Seats</h3>
                            <p>{analytics.totalAvailableSeats}</p>
                        </div>

                    </div>
                )}
            </section>

            {/* DASHBOARD ANALYTICS CHARTS */}
            <DashboardAnalyticsCharts dashboardType="organizer" />

            {/* EVENT-WISE SALES CHART */}
            <section className="sales-chart-section">
                <h2>Event Sales Performance</h2>

                {analytics?.salesByEvent?.length > 0 ? (
                    <div className="sales-chart">

                        {analytics.salesByEvent.map((event, index) => {
                            const maxTickets = Math.max(
                                ...analytics.salesByEvent.map(
                                    item => item.ticketsSold
                                ),
                                1
                            );

                            const barWidth =
                                (event.ticketsSold / maxTickets) * 100;

                            return (
                                <div className="sales-chart-item" key={index}>
                                    <h3>{event.eventTitle}</h3>

                                    <div className="sales-bar-background">
                                        <div
                                            className="sales-bar"
                                            style={{ width: `${barWidth}%` }}
                                        />
                                    </div>

                                    <p>Tickets Sold: {event.ticketsSold}</p>
                                    <p>Revenue: Rs. {event.revenue}</p>
                                </div>
                            );
                        })}

                    </div>
                ) : (
                    <p>No sales data available yet.</p>
                )}
            </section>



            {/* MONTHLY ANALYTICS AND EVENT PERFORMANCE */}
            <section className="monthly-analytics-section">

                <h2>Sales Analytics</h2>

                <div className="organizer-charts-grid">

                    {/* MONTHLY REVENUE */}
                    <div className="monthly-chart-card">
                        <h3>Monthly Revenue</h3>
                        <p className="chart-description">
                            Revenue generated from successful bookings.
                        </p>

                        {analytics?.monthlyTrends?.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={analytics.monthlyTrends}>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="#334155"
                                    />

                                    <XAxis dataKey="month" stroke="#aab6c7" />
                                    <YAxis
                                        stroke="#aab6c7"
                                        tickFormatter={value =>
                                            `${(value / 1000).toFixed(0)}k`
                                        }
                                    />

                                    <Tooltip
                                        formatter={value =>
                                            `Rs. ${Number(value).toLocaleString()}`
                                        }
                                        contentStyle={{
                                            background: '#172235',
                                            border: '1px solid #334155',
                                            borderRadius: '8px',
                                            color: '#fff'
                                        }}
                                    />

                                    <Line
                                        type="monotone"
                                        dataKey="revenue"
                                        name="Revenue"
                                        stroke="#10b981"
                                        strokeWidth={3}
                                        activeDot={{ r: 7 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <p>No monthly revenue data available yet.</p>
                        )}
                    </div>

                    {/* MONTHLY TICKET SALES */}
                    <div className="monthly-chart-card">
                        <h3>Monthly Ticket Sales</h3>
                        <p className="chart-description">
                            Number of tickets sold each month.
                        </p>

                        {analytics?.monthlyTrends?.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={analytics.monthlyTrends}>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="#334155"
                                    />

                                    <XAxis dataKey="month" stroke="#aab6c7" />
                                    <YAxis stroke="#aab6c7" />

                                    <Tooltip
                                        contentStyle={{
                                            background: '#172235',
                                            border: '1px solid #334155',
                                            borderRadius: '8px',
                                            color: '#fff'
                                        }}
                                    />

                                    <Bar
                                        dataKey="ticketsSold"
                                        name="Tickets Sold"
                                        fill="#3b82f6"
                                        radius={[6, 6, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <p>No monthly ticket sales data available yet.</p>
                        )}
                    </div>

                    {/* EVENT PERFORMANCE */}
                    <div className="monthly-chart-card event-performance-chart">
                        <h3>Event Performance Comparison</h3>
                        <p className="chart-description">
                            Compare ticket sales across your events.
                        </p>

                        {analytics?.salesByEvent?.length > 0 ? (
                            <ResponsiveContainer width="100%" height={320}>
                                <BarChart
                                    data={analytics.salesByEvent}
                                    layout="vertical"
                                    margin={{ left: 15, right: 25 }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="#334155"
                                    />

                                    <XAxis type="number" stroke="#aab6c7" />

                                    <YAxis
                                        type="category"
                                        dataKey="eventTitle"
                                        stroke="#aab6c7"
                                        width={120}
                                        tick={{ fontSize: 11 }}
                                    />

                                    <Tooltip
                                        contentStyle={{
                                            background: '#172235',
                                            border: '1px solid #334155',
                                            borderRadius: '8px',
                                            color: '#fff'
                                        }}
                                    />

                                    <Legend />

                                    <Bar
                                        dataKey="ticketsSold"
                                        name="Tickets Sold"
                                        fill="#10b981"
                                        radius={[0, 5, 5, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <p>No event performance data available yet.</p>
                        )}
                    </div>

                </div>
            </section>



            {/* BEST-PERFORMING EVENT */}
            <section className="best-event-section">
                <h2>Best-Performing Event</h2>

                {bestPerformingEvent ? (
                    <div className="best-event-card">
                        <div className="best-event-icon">🏆</div>

                        <div className="best-event-details">
                            <h3>{bestPerformingEvent.eventTitle}</h3>

                            <p className="best-event-description">
                                Your top-performing event based on ticket sales.
                            </p>

                            <div className="best-event-stats">
                                <div>
                                    <span>Tickets Sold</span>
                                    <strong>{bestPerformingEvent.ticketsSold}</strong>
                                </div>

                                <div>
                                    <span>Revenue Earned</span>
                                    <strong>Rs. {bestPerformingEvent.revenue}</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <p>No successful ticket sales yet. Your best-performing event will appear here.</p>
                )}
            </section>


            <h2>My Events</h2>

            {events.length === 0 ? (
                <p>You haven't created any events yet.</p>
            ) : (
                <div className="event-grid">
                    {events.map((event) => (
                        <div className="event-card" key={event._id}>
                            <h3>{event.title}</h3>
                            <p>Type: {event.type}</p>
                            <p>
                                Date: {new Date(event.date).toLocaleString()}
                            </p>
                            <p>Location: {event.location}</p>
                            <p>Price: Rs. {event.price}</p>
                            <p>Available Seats: {event.availableSeats}</p>
                            <button
                                className="login-btn"
                                onClick={() => handleEditClick(event)}
                            >
                                Edit Event
                            </button>
                            <button
                                className="login-btn"
                                onClick={() => handleDeleteEvent(event._id)}
                            >
                                Delete Event
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default OrganizerDashboard;