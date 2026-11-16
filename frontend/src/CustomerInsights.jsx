
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

const COLORS = [
    '#6258e8',
    '#ff8066',
    '#159b72',
    '#3985d8',
    '#e7a23b',
    '#9b72d0',
    '#df6595',
    '#63a7a1'
];

const TOOLTIP_STYLE = {
    background: '#ffffff',
    border: '1px solid #e6e8f0',
    borderRadius: '12px',
    color: '#20243a',
    boxShadow: '0 8px 24px rgba(32, 36, 58, 0.10)',
    padding: '10px 14px'
};

const AXIS_STYLE = {
    fill: '#737991',
    fontSize: 12
};

function formatCurrency(value) {
    return `Rs. ${Number(value || 0).toLocaleString('en-PK')}`;
}

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

// Supports both new multi-role accounts and older accounts.
function getUserRoles(user) {
    if (Array.isArray(user?.roles)) {
        return user.roles;
    }

    if (user?.role === 'organizer') {
        return ['customer', 'organizer'];
    }

    return user?.role ? [user.role] : [];
}

function CustomerInsights({ token }) {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    async function fetchCustomerAnalytics() {
        setLoading(true);
        setError('');

        try {
            let savedUser = null;

            try {
                savedUser = JSON.parse(
                    localStorage.getItem('eventeaseUser')
                );
            } catch {
                savedUser = null;
            }

            const activeToken = token || savedUser?.token;

            if (!activeToken) {
                throw new Error('Please log in to view your insights.');
            }

            const userRoles = getUserRoles(savedUser?.user);

            if (
                userRoles.length > 0 &&
                !userRoles.includes('customer')
            ) {
                throw new Error('Customer account required.');
            }

            const response = await fetch(
                `${API_BASE_URL}/api/analytics/customer`,
                {
                    method: 'GET',
                    cache: 'no-store',
                    headers: {
                        Authorization: `Bearer ${activeToken}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || 'Unable to load customer insights.'
                );
            }

            setAnalytics(data);

        } catch (err) {
            setError(err.message);

        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchCustomerAnalytics();
    }, [token]);

    if (loading) {
        return (
            <section className="customer-insights">
                <div className="customer-insights-header">
                    <div>
                        <p className="customer-insights-eyebrow">
                            YOUR EVENT ACTIVITY
                        </p>
                        <h2>My Event Insights</h2>
                    </div>
                </div>

                <p role="status">
                    Loading your personal analytics...
                </p>
            </section>
        );
    }

    if (error) {
        return (
            <section className="customer-insights">
                <div className="customer-insights-header">
                    <div>
                        <p className="customer-insights-eyebrow">
                            YOUR EVENT ACTIVITY
                        </p>
                        <h2>My Event Insights</h2>
                    </div>
                </div>

                <p className="customer-insights-error" role="alert">
                    {error}
                </p>

                <button
                    type="button"
                    onClick={fetchCustomerAnalytics}
                >
                    Try Again
                </button>
            </section>
        );
    }

    const summary = analytics?.summary || {};

    const monthlyActivity = (
        analytics?.monthlyActivity || []
    ).map(item => ({
        ...item,
        monthLabel: formatMonth(item.month)
    }));

    const categoryData = analytics?.categoryBreakdown || [];

    const hasActivity = monthlyActivity.length > 0;
    const hasCategories = categoryData.length > 0;

    return (
        <section className="customer-insights">

            <div className="customer-insights-header">
                <div>
                    <p className="customer-insights-eyebrow">
                        YOUR EVENT ACTIVITY
                    </p>

                    <h2>My Event Insights</h2>

                    <p>
                        Understand your bookings, spending and event interests.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={fetchCustomerAnalytics}
                    disabled={loading}
                >
                    ↻ Refresh Insights
                </button>
            </div>

            <div className="customer-insights-stats">

                <div className="customer-insight-card">
                    <span className="insight-card-label">
                        Total Bookings
                    </span>
                    <p>{summary.totalBookings ?? 0}</p>
                </div>

                <div className="customer-insight-card">
                    <span className="insight-card-label">
                        Successful Bookings
                    </span>
                    <p>{summary.successfulBookings ?? 0}</p>
                </div>

                <div className="customer-insight-card">
                    <span className="insight-card-label">
                        Tickets Purchased
                    </span>
                    <p>{summary.ticketsPurchased ?? 0}</p>
                </div>

                <div className="customer-insight-card">
                    <span className="insight-card-label">
                        Total Spending
                    </span>
                    <p>{formatCurrency(summary.totalSpent)}</p>
                </div>

            </div>

            <div className="customer-insights-highlights">

                <div className="customer-highlight-card">
                    <span>Cancelled Bookings</span>
                    <strong>
                        {summary.cancelledBookings ?? 0}
                    </strong>
                </div>

                <div className="customer-highlight-card">
                    <span>Preferred Event Category</span>

                    <strong>
                        {analytics?.preferredCategory || 'Not available yet'}
                    </strong>
                </div>

            </div>

            <div className="customer-chart-card">
                <h3>Monthly Spending</h3>

                <p>
                    Track how much you spend on successful bookings each month.
                </p>

                {hasActivity ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart
                            data={monthlyActivity}
                            margin={{
                                top: 10,
                                right: 15,
                                left: 5,
                                bottom: 5
                            }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#e6e8f0"
                                vertical={false}
                            />

                            <XAxis
                                dataKey="monthLabel"
                                tick={AXIS_STYLE}
                                axisLine={{ stroke: '#d6d9e5' }}
                                tickLine={false}
                            />

                            <YAxis
                                tick={AXIS_STYLE}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={value =>
                                    `${(value / 1000).toFixed(0)}k`
                                }
                            />

                            <Tooltip
                                formatter={value => formatCurrency(value)}
                                contentStyle={TOOLTIP_STYLE}
                            />

                            <Line
                                type="monotone"
                                dataKey="spending"
                                name="Monthly Spending"
                                stroke="#6258e8"
                                strokeWidth={3}
                                dot={{
                                    r: 4,
                                    fill: '#6258e8',
                                    strokeWidth: 2,
                                    stroke: '#ffffff'
                                }}
                                activeDot={{
                                    r: 7,
                                    fill: '#ff8066',
                                    stroke: '#ffffff',
                                    strokeWidth: 2
                                }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <p className="chart-empty">
                        No spending activity available yet.
                    </p>
                )}
            </div>

            <div className="customer-chart-card">
                <h3>Monthly Ticket Activity</h3>

                <p>
                    See how many tickets you purchased each month.
                </p>

                {hasActivity ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                            data={monthlyActivity}
                            margin={{
                                top: 10,
                                right: 15,
                                left: 5,
                                bottom: 5
                            }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#e6e8f0"
                                vertical={false}
                            />

                            <XAxis
                                dataKey="monthLabel"
                                tick={AXIS_STYLE}
                                axisLine={{ stroke: '#d6d9e5' }}
                                tickLine={false}
                            />

                            <YAxis
                                tick={AXIS_STYLE}
                                axisLine={false}
                                tickLine={false}
                            />

                            <Tooltip
                                contentStyle={TOOLTIP_STYLE}
                            />

                            <Bar
                                dataKey="tickets"
                                name="Tickets Purchased"
                                fill="#ff8066"
                                radius={[7, 7, 0, 0]}
                                maxBarSize={55}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <p className="chart-empty">
                        No ticket activity available yet.
                    </p>
                )}
            </div>

            <div className="customer-chart-card">
                <h3>My Event Preferences</h3>

                <p>
                    Your event interests based on successful bookings.
                </p>

                {hasCategories ? (
                    <ResponsiveContainer width="100%" height={340}>
                        <PieChart>
                            <Pie
                                data={categoryData}
                                dataKey="tickets"
                                nameKey="category"
                                cx="50%"
                                cy="50%"
                                outerRadius={105}
                                innerRadius={55}
                                paddingAngle={3}
                                label={({ category, percent }) =>
                                    `${category} ${(percent * 100).toFixed(0)}%`
                                }
                            >
                                {categoryData.map((item, index) => (
                                    <Cell
                                        key={item.category}
                                        fill={COLORS[index % COLORS.length]}
                                        stroke="#ffffff"
                                        strokeWidth={2}
                                    />
                                ))}
                            </Pie>

                            <Tooltip
                                contentStyle={TOOLTIP_STYLE}
                            />

                            <Legend
                                verticalAlign="bottom"
                                height={35}
                                wrapperStyle={{
                                    color: '#737991',
                                    fontSize: '12px'
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <p className="chart-empty">
                        Your event preferences will appear after your
                        first successful booking.
                    </p>
                )}
            </div>

        </section>
    );
}

export default CustomerInsights;
