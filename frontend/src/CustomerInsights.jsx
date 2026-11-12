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
    '#10b981',
    '#3b82f6',
    '#f59e0b',
    '#a78bfa',
    '#ef4444',
    '#06b6d4',
    '#ec4899',
    '#84cc16'
];

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

            if (
                savedUser?.user?.role &&
                savedUser.user.role !== 'customer'
            ) {
                throw new Error('Customer account required.');
            }

            const response = await fetch(
                `${API_BASE_URL}/api/analytics/customer`,
                {
                    method: 'GET',
                    cache: 'no-store',
                    headers: {
                        Authorization: `Bearer ${activetoken}`
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
                <h2>My Event Insights</h2>
                <p role="status">Loading your personal analytics...</p>            </section>
        );
    }

    if (error) {
        return (
            <section className="customer-insights">
                <h2>My Event Insights</h2>

                <p className="customer-insights-error" role="alert">
                    {error}
                </p>

                <button onClick={fetchCustomerAnalytics}>
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
                    onClick={fetchCustomerAnalytics}
                    disabled={loading}
                >
                    ↻ Refresh Insights
                </button>
            </div>

            {/* CUSTOMER SUMMARY */}
            <div className="customer-insights-stats">

                <div className="customer-insight-card">
                    <h3>Total Bookings</h3>
                    <p>{summary.totalBookings ?? 0}</p>
                </div>

                <div className="customer-insight-card">
                    <h3>Successful Bookings</h3>
                    <p>{summary.successfulBookings ?? 0}</p>
                </div>

                <div className="customer-insight-card">
                    <h3>Tickets Purchased</h3>
                    <p>{summary.ticketsPurchased ?? 0}</p>
                </div>

                <div className="customer-insight-card">
                    <h3>Total Spending</h3>
                    <p>{formatCurrency(summary.totalSpent)}</p>
                </div>

            </div>

            {/* CANCELLATION AND PREFERRED CATEGORY */}
            <div className="customer-insights-highlights">

                <div className="customer-highlight-card">
                    <span>Cancelled Bookings</span>
                    <strong>{summary.cancelledBookings ?? 0}</strong>
                </div>

                <div className="customer-highlight-card">
                    <span>Preferred Event Category</span>

                    <strong>
                        {analytics?.preferredCategory || 'Not available yet'}
                    </strong>
                </div>

            </div>

            {/* MONTHLY SPENDING */}
            <div className="customer-chart-card">
                <h3>Monthly Spending</h3>

                <p>
                    Track how much you spend on successful bookings each month.
                </p>

                {hasActivity ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={monthlyActivity}>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#334155"
                            />

                            <XAxis
                                dataKey="monthLabel"
                                stroke="#aab6c7"
                            />

                            <YAxis
                                stroke="#aab6c7"
                                tickFormatter={value =>
                                    `${(value / 1000).toFixed(0)}k`
                                }
                            />

                            <Tooltip
                                formatter={value => formatCurrency(value)}
                                contentStyle={{
                                    background: '#172235',
                                    border: '1px solid #334155',
                                    borderRadius: '8px',
                                    color: '#fff'
                                }}
                            />

                            <Line
                                type="monotone"
                                dataKey="spending"
                                name="Monthly Spending"
                                stroke="#10b981"
                                strokeWidth={3}
                                activeDot={{ r: 7 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <p>No spending activity available yet.</p>
                )}
            </div>

            {/* MONTHLY TICKETS */}
            <div className="customer-chart-card">
                <h3>Monthly Ticket Activity</h3>

                <p>
                    See how many tickets you purchased each month.
                </p>

                {hasActivity ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={monthlyActivity}>
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
                                dataKey="tickets"
                                name="Tickets Purchased"
                                fill="#3b82f6"
                                radius={[6, 6, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <p>No ticket activity available yet.</p>
                )}
            </div>

            {/* CATEGORY PREFERENCES */}
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
                                outerRadius={110}
                                label={({ category, percent }) =>
                                    `${category} ${(percent * 100).toFixed(0)}%`
                                }
                            >
                                {categoryData.map((item, index) => (
                                    <Cell
                                        key={item.category}
                                        fill={COLORS[index % COLORS.length]}
                                    />
                                ))}
                            </Pie>

                            <Tooltip
                                formatter={(value, name) => [
                                    value,
                                    name
                                ]}
                            />

                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <p>
                        Your event preferences will appear after your
                        first successful booking.
                    </p>
                )}
            </div>

        </section>
    );
}

export default CustomerInsights;
