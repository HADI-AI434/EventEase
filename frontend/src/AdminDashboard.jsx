import { API_BASE_URL } from './api';
import { useEffect, useState } from 'react';

import {
    ResponsiveContainer,
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from 'recharts';

import DashboardAnalyticsCharts from './DashboardAnalyticsCharts';

const CHART_COLORS = [
    '#10b981',
    '#3b82f6',
    '#f59e0b',
    '#a78bfa',
    '#ef4444',
    '#06b6d4',
    '#ec4899',
    '#84cc16'
];

function formatMonth(month) {
    if (!month) return '';

    const [year, monthNumber] = month.split('-');

    return new Date(
        Number(year),
        Number(monthNumber) - 1
    ).toLocaleDateString('en-US', {
        month: 'short',
        year: '2-digit'
    });
}

function formatCurrency(value) {
    return `Rs. ${Number(value || 0).toLocaleString('en-PK')}`;
}

function AdminDashboard({ onBack }) {
    const [dashboard, setDashboard] = useState(null);
    const [analytics, setAnalytics] = useState(null);

    const [loading, setLoading] = useState(true);
    const [analyticsLoading, setAnalyticsLoading] = useState(true);

    const [error, setError] = useState('');
    const [analyticsError, setAnalyticsError] = useState('');

    // FETCH EXISTING ADMIN DASHBOARD
    async function fetchAdminDashboard() {
        setLoading(true);
        setError('');

        try {
            const savedUser = JSON.parse(
                localStorage.getItem('eventeaseUser')
            );

            if (!savedUser?.token) {
                throw new Error('Please log in first.');
            }

            const response = await fetch(
                `${API_BASE_URL}/api/admin/dashboard`,
                {
                    headers: {
                        Authorization: `Bearer ${savedUser.token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || 'Unable to load admin dashboard.'
                );
            }

            setDashboard(data);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    // FETCH ADMIN ANALYTICS
    async function fetchAdminAnalytics() {
        setAnalyticsLoading(true);
        setAnalyticsError('');

        try {
            const savedUser = JSON.parse(
                localStorage.getItem('eventeaseUser')
            );

            if (!savedUser?.token) {
                throw new Error('Please log in first.');
            }

            const response = await fetch(
                `${API_BASE_URL}/api/admin/analytics`,
                {
                    headers: {
                        Authorization: `Bearer ${savedUser.token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || 'Unable to load admin analytics.'
                );
            }

            setAnalytics(data);

        } catch (err) {
            setAnalyticsError(err.message);
        } finally {
            setAnalyticsLoading(false);
        }
    }

    // REFRESH BOTH DASHBOARD AND ANALYTICS
    async function refreshAllData() {
        await Promise.all([
            fetchAdminDashboard(),
            fetchAdminAnalytics()
        ]);
    }

    useEffect(() => {
        refreshAllData();
    }, []);

    // LOADING SCREEN
    if (loading && !dashboard) {
        return (
            <div className="admin-dashboard">
                <p>Loading admin dashboard...</p>
            </div>
        );
    }

    // ERROR SCREEN
    if (error && !dashboard) {
        return (
            <div className="admin-dashboard">
                <p className="admin-error">{error}</p>

                <button onClick={refreshAllData}>
                    Try Again
                </button>

                <button onClick={onBack}>
                    Back to Home
                </button>
            </div>
        );
    }

    if (!dashboard) {
        return (
            <div className="admin-dashboard">
                <p>No dashboard data available.</p>

                <button onClick={refreshAllData}>
                    Try Again
                </button>
            </div>
        );
    }

    const stats = dashboard.statistics || {};

    const summary = analytics?.summary || {};

    const monthlyBookings = (
        analytics?.monthlyBookings || []
    ).map(item => ({
        ...item,
        monthLabel: formatMonth(item.month)
    }));

    const monthlyUsers = (
        analytics?.monthlyUsers || []
    ).map(item => ({
        ...item,
        monthLabel: formatMonth(item.month)
    }));

    const categoryData = analytics?.categoryBreakdown || [];

    const bookingStatusData = analytics?.bookingStatuses || [];

    const hasMonthlyBookings = monthlyBookings.length > 0;
    const hasMonthlyUsers = monthlyUsers.length > 0;
    const hasCategories = categoryData.length > 0;
    const hasBookingStatuses = bookingStatusData.length > 0;

    return (
        <div className="admin-dashboard">

            {/* HEADER */}
            <div className="admin-header">
                <h1>Admin Dashboard</h1>

                <div>
                    <button
                        onClick={refreshAllData}
                        disabled={loading || analyticsLoading}
                    >
                        {loading || analyticsLoading
                            ? 'Refreshing...'
                            : 'Refresh Data'}
                    </button>

                    <button onClick={onBack}>
                        Back to Home
                    </button>
                </div>
            </div>

            {error && (
                <p className="admin-error">{error}</p>
            )}

            {/* USER STATISTICS */}
            <section className="admin-section">
                <h2>User Statistics</h2>

                <div className="admin-stats-grid">
                    <div className="admin-stat-card">
                        <h3>Total Users</h3>
                        <p>{stats.totalUsers ?? 0}</p>
                    </div>

                    <div className="admin-stat-card">
                        <h3>Customers</h3>
                        <p>{stats.totalCustomers ?? 0}</p>
                    </div>

                    <div className="admin-stat-card">
                        <h3>Organizers</h3>
                        <p>{stats.totalOrganizers ?? 0}</p>
                    </div>

                    <div className="admin-stat-card">
                        <h3>Administrators</h3>
                        <p>{stats.totalAdmins ?? 0}</p>
                    </div>
                </div>
            </section>

            {/* PLATFORM STATISTICS */}
            <section className="admin-section">
                <h2>Platform Statistics</h2>

                <div className="admin-stats-grid">
                    <div className="admin-stat-card">
                        <h3>Total Events</h3>
                        <p>{stats.totalEvents ?? 0}</p>
                    </div>

                    <div className="admin-stat-card">
                        <h3>Total Bookings</h3>
                        <p>{stats.totalBookings ?? 0}</p>
                    </div>

                    <div className="admin-stat-card">
                        <h3>Successful Bookings</h3>
                        <p>{stats.successfulBookings ?? 0}</p>
                    </div>

                    <div className="admin-stat-card">
                        <h3>Cancelled Bookings</h3>
                        <p>{stats.cancelledBookings ?? 0}</p>
                    </div>

                    <div className="admin-stat-card">
                        <h3>Tickets Sold</h3>
                        <p>{stats.totalTicketsSold ?? 0}</p>
                    </div>

                    <div className="admin-stat-card">
                        <h3>Total Revenue</h3>
                        <p>{formatCurrency(stats.totalRevenue)}</p>
                    </div>
                </div>
            </section>

            {/* DASHBOARD ANALYTICS CHARTS */}
            <DashboardAnalyticsCharts dashboardType="admin" />

            {/* ANALYTICS SECTION */}
            <section className="admin-section admin-analytics-section">

                <h2>Platform Analytics</h2>

                {analyticsLoading && !analytics && (
                    <p>Loading analytics...</p>
                )}

                {analyticsError && (
                    <div className="admin-error">
                        <p>{analyticsError}</p>

                        <button onClick={fetchAdminAnalytics}>
                            Retry Analytics
                        </button>
                    </div>
                )}

                {analytics && (
                    <>
                        {/* ANALYTICS SUMMARY */}
                        <div className="admin-stats-grid">
                            <div className="admin-stat-card">
                                <h3>Published Events</h3>
                                <p>{summary.publishedEvents ?? 0}</p>
                            </div>

                            <div className="admin-stat-card">
                                <h3>External Events</h3>
                                <p>{summary.externalEvents ?? 0}</p>
                            </div>

                            <div className="admin-stat-card">
                                <h3>Successful Tickets</h3>
                                <p>{summary.ticketsSold ?? 0}</p>
                            </div>

                            <div className="admin-stat-card">
                                <h3>Platform Revenue</h3>
                                <p>{formatCurrency(summary.totalRevenue)}</p>
                            </div>
                        </div>

                        {/* MONTHLY BOOKINGS AND REVENUE */}
                        <div className="admin-chart-card">
                            <h3>Monthly Booking & Revenue Trends</h3>

                            {hasMonthlyBookings ? (
                                <div className="admin-chart">
                                    <ResponsiveContainer width="100%" height={320}>
                                        <LineChart data={monthlyBookings}>
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                stroke="#334155"
                                            />

                                            <XAxis
                                                dataKey="monthLabel"
                                                stroke="#aab6c7"
                                            />

                                            <YAxis
                                                yAxisId="left"
                                                stroke="#aab6c7"
                                            />

                                            <YAxis
                                                yAxisId="right"
                                                orientation="right"
                                                stroke="#aab6c7"
                                                tickFormatter={value =>
                                                    `${(value / 1000).toFixed(0)}k`
                                                }
                                            />

                                            <Tooltip
                                                formatter={(value, name) =>
                                                    name === 'Revenue'
                                                        ? formatCurrency(value)
                                                        : Number(value).toLocaleString()
                                                }
                                                contentStyle={{
                                                    background: '#172235',
                                                    border: '1px solid #334155',
                                                    borderRadius: '8px',
                                                    color: '#fff'
                                                }}
                                            />

                                            <Legend />

                                            <Line
                                                yAxisId="left"
                                                type="monotone"
                                                dataKey="bookings"
                                                name="Bookings"
                                                stroke="#10b981"
                                                strokeWidth={3}
                                                activeDot={{ r: 7 }}
                                            />

                                            <Line
                                                yAxisId="right"
                                                type="monotone"
                                                dataKey="revenue"
                                                name="Revenue"
                                                stroke="#3b82f6"
                                                strokeWidth={3}
                                                activeDot={{ r: 7 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <p>No monthly booking data available yet.</p>
                            )}
                        </div>

                        {/* MONTHLY TICKET SALES */}
                        <div className="admin-chart-card">
                            <h3>Monthly Tickets Sold</h3>

                            {hasMonthlyBookings ? (
                                <div className="admin-chart">
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={monthlyBookings}>
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                stroke="#334155"
                                            />

                                            <XAxis
                                                dataKey="monthLabel"
                                                stroke="#aab6c7"
                                            />

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
                                                fill="#10b981"
                                                radius={[6, 6, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <p>No ticket sales data available yet.</p>
                            )}
                        </div>

                        {/* MONTHLY USER REGISTRATIONS */}
                        <div className="admin-chart-card">
                            <h3>Monthly User Registrations</h3>

                            {hasMonthlyUsers ? (
                                <div className="admin-chart">
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={monthlyUsers}>
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                stroke="#334155"
                                            />

                                            <XAxis
                                                dataKey="monthLabel"
                                                stroke="#aab6c7"
                                            />

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
                                                dataKey="registrations"
                                                name="New Users"
                                                fill="#3b82f6"
                                                radius={[6, 6, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <p>No registration data available yet.</p>
                            )}
                        </div>

                        {/* CATEGORY AND BOOKING STATUS CHARTS */}
                        <div className="admin-chart-grid">

                            <div className="admin-chart-card">
                                <h3>Events by Category</h3>

                                {hasCategories ? (
                                    <div className="admin-chart">
                                        <ResponsiveContainer width="100%" height={300}>
                                            <PieChart>
                                                <Pie
                                                    data={categoryData}
                                                    dataKey="eventCount"
                                                    nameKey="category"
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={100}
                                                    label={({ category, percent }) =>
                                                        `${category} ${(percent * 100).toFixed(0)}%`
                                                    }
                                                >
                                                    {categoryData.map((item, index) => (
                                                        <Cell
                                                            key={item.category}
                                                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                                                        />
                                                    ))}
                                                </Pie>

                                                <Tooltip />

                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <p>No category data available yet.</p>
                                )}
                            </div>

                            <div className="admin-chart-card">
                                <h3>Booking Status Distribution</h3>

                                {hasBookingStatuses ? (
                                    <div className="admin-chart">
                                        <ResponsiveContainer width="100%" height={300}>
                                            <PieChart>
                                                <Pie
                                                    data={bookingStatusData}
                                                    dataKey="count"
                                                    nameKey="status"
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={100}
                                                    label={({ status, percent }) =>
                                                        `${status} ${(percent * 100).toFixed(0)}%`
                                                    }
                                                >
                                                    {bookingStatusData.map((item, index) => (
                                                        <Cell
                                                            key={item.status}
                                                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                                                        />
                                                    ))}
                                                </Pie>

                                                <Tooltip />

                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <p>No booking status data available yet.</p>
                                )}
                            </div>

                        </div>
                    </>
                )}
            </section>

            {/* ALL USERS */}
            <section className="admin-section">
                <h2>Registered Users</h2>

                <div className="admin-table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                            </tr>
                        </thead>

                        <tbody>
                            {(dashboard.users || []).map(user => (
                                <tr key={user._id}>
                                    <td>{user.name}</td>
                                    <td>{user.email}</td>
                                    <td>
                                        <span className={`admin-role ${user.role}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                </tr>
                            ))}

                            {(!dashboard.users || dashboard.users.length === 0) && (
                                <tr>
                                    <td colSpan="3">No users found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* ALL EVENTS */}
            <section className="admin-section">
                <h2>All Events</h2>

                <div className="admin-table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Event</th>
                                <th>Organizer</th>
                                <th>Available Seats</th>
                            </tr>
                        </thead>

                        <tbody>
                            {(dashboard.events || []).map(event => (
                                <tr key={event._id}>
                                    <td>{event.title}</td>
                                    <td>
                                        {event.organizer?.name || 'Unknown'}
                                    </td>
                                    <td>{event.availableSeats ?? 0}</td>
                                </tr>
                            ))}

                            {(!dashboard.events || dashboard.events.length === 0) && (
                                <tr>
                                    <td colSpan="3">No events found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* ALL BOOKINGS */}
            <section className="admin-section">
                <h2>All Bookings</h2>

                <div className="admin-table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Event</th>
                                <th>Tickets</th>
                                <th>Amount</th>
                                <th>Status</th>
                            </tr>
                        </thead>

                        <tbody>
                            {(dashboard.bookings || []).map(booking => (
                                <tr key={booking._id}>
                                    <td>
                                        {booking.customer?.name || 'Unknown'}
                                    </td>

                                    <td>
                                        {booking.event?.title || 'Event unavailable'}
                                    </td>

                                    <td>{booking.quantity}</td>

                                    <td>{formatCurrency(booking.totalAmount)}</td>

                                    <td>
                                        <span className={`admin-booking-status ${String(booking.status).toLowerCase()}`}>
                                            {booking.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}

                            {(!dashboard.bookings || dashboard.bookings.length === 0) && (
                                <tr>
                                    <td colSpan="5">No bookings found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

        </div>
    );
}

export default AdminDashboard;
