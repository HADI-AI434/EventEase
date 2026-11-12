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
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend
} from 'recharts';

const COLORS = [
    '#10b981',
    '#3b82f6',
    '#f59e0b',
    '#a78bfa',
    '#f87171',
    '#06b6d4',
    '#ec4899'
];

function getToken() {
    try {
        const savedUser = JSON.parse(
            localStorage.getItem('eventeaseUser')
        );

        return savedUser?.token;
    } catch {
        return null;
    }
}

function getMonthLabel(item) {
    const id = item?._id ?? item?.month ?? item?.date;

    if (id && typeof id === 'object') {
        const year = id.year;
        const month = id.month;

        if (year && month) {
            return new Date(year, month - 1).toLocaleDateString(
                'en-PK',
                { month: 'short', year: '2-digit' }
            );
        }
    }

    if (typeof id === 'string') {
        const parts = id.split('-');

        if (parts.length >= 2) {
            const date = new Date(
                Number(parts[0]),
                Number(parts[1]) - 1
            );

            if (!Number.isNaN(date.getTime())) {
                return date.toLocaleDateString(
                    'en-PK',
                    { month: 'short', year: '2-digit' }
                );
            }
        }

        return id;
    }

    return 'Unknown';
}

function getNumber(item, possibleKeys) {
    for (const key of possibleKeys) {
        const value = item?.[key];

        if (value !== undefined && value !== null) {
            const number = Number(value);

            if (Number.isFinite(number)) return number;
        }
    }

    return 0;
}

function ChartCard({ title, children }) {
    return (
        <div className="analytics-chart-card">
            <h3>{title}</h3>
            {children}
        </div>
    );
}

function EmptyChart() {
    return (
        <div className="chart-empty">
            No chart data is available yet.
        </div>
    );
}

function DashboardAnalyticsCharts({ dashboardType }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function fetchAnalytics() {
            const token = getToken();

            if (!token) {
                setError('Please log in again to view analytics.');
                setLoading(false);
                return;
            }

            const endpoint =
                dashboardType === 'admin'
                    ? `${API_BASE_URL}/api/admin/analytics`
                    : `${API_BASE_URL}/api/analytics/organizer`;

            try {
                setLoading(true);
                setError('');

                const response = await fetch(endpoint, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(
                        result.message || 'Unable to load analytics.'
                    );
                }

                setData(result);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchAnalytics();
    }, [dashboardType]);

    if (loading) {
        return (
            <section className="dashboard-analytics">
                <p>Loading analytics charts...</p>
            </section>
        );
    }

    if (error) {
        return (
            <section className="dashboard-analytics">
                <p className="analytics-error">{error}</p>
            </section>
        );
    }

    if (!data) return null;

    const admin = dashboardType === 'admin';

    const source = admin
        ? data
        : (data.analytics || data);

    const monthlySource = admin
        ? (source.monthlyBookings || [])
        : (source.monthlyTrends || []);

    const monthlyData = monthlySource.map(item => ({
        month: getMonthLabel(item),
        bookings: getNumber(item, [
            'totalBookings',
            'bookings',
            'bookingCount',
            'count'
        ]),
        tickets: getNumber(item, [
            'totalTickets',
            'ticketsSold',
            'tickets',
            'quantity'
        ]),
        revenue: getNumber(item, [
            'totalRevenue',
            'revenue',
            'amount',
            'totalAmount'
        ]),
        users: getNumber(item, [
            'totalUsers',
            'users',
            'userCount',
            'count'
        ])
    }));

    const categorySource = admin
        ? (source.categoryBreakdown || [])
        : (source.salesByEvent || []);

    const categoryData = categorySource.map(item => ({
        name: item.category ||
            item.eventTitle ||
            item.title ||
            item._id ||
            'Other',
        value: getNumber(item, [
            'count',
            'eventCount',
            'totalBookings',
            'ticketsSold',
            'totalTickets',
            'quantity',
            'revenue',
            'totalRevenue'
        ])
    })).filter(item => item.value > 0);

    const hasMonthlyData = monthlyData.length > 0;
    const monthlyUserData = (source.monthlyUsers || []).map(item => ({
        month: getMonthLabel(item),
        users: getNumber(item, [
            'totalUsers',
            'users',
            'userCount',
            'count'
        ])
    }));

    const hasMonthlyUserData = monthlyUserData.length > 0;
    const hasCategoryData = categoryData.length > 0;

    return (
        <section className="dashboard-analytics">
            <div className="dashboard-analytics-heading">
                <h2>
                    {admin ? 'Platform Analytics' : 'Event Performance Analytics'}
                </h2>

                <p>
                    {admin
                        ? 'Visual overview of platform activity and event categories.'
                        : 'Visual overview of your event bookings and performance.'}
                </p>
            </div>

            <div className="dashboard-charts-grid">
                <ChartCard title="Monthly Revenue">
                    {monthlyData.some(item => item.revenue > 0) ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <LineChart data={monthlyData}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#29364a"
                                />
                                <XAxis dataKey="month" stroke="#aab6c7" />
                                <YAxis stroke="#aab6c7" />
                                <Tooltip
                                    contentStyle={{
                                        background: '#172235',
                                        border: '1px solid #29364a',
                                        color: '#fff'
                                    }}
                                    formatter={value => [
                                        `PKR ${Number(value).toLocaleString('en-PK')}`,
                                        'Revenue'
                                    ]}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="revenue"
                                    name="Revenue"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    dot={{ r: 4 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : <EmptyChart />}
                </ChartCard>

                <ChartCard title={admin ? 'Monthly Bookings' : 'Monthly Tickets Sold'}>
                    {hasMonthlyUserData ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={monthlyData}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#29364a"
                                />
                                <XAxis dataKey="month" stroke="#aab6c7" />
                                <YAxis allowDecimals={false} stroke="#aab6c7" />
                                <Tooltip
                                    contentStyle={{
                                        background: '#172235',
                                        border: '1px solid #29364a',
                                        color: '#fff'
                                    }}
                                />
                                <Bar
                                    dataKey={admin ? 'bookings' : 'tickets'}
                                    name={admin ? 'Bookings' : 'Tickets'}
                                    fill="#3b82f6"
                                    radius={[6, 6, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <EmptyChart />}
                </ChartCard>

                <ChartCard title={admin ? 'Event Category Breakdown' : 'Event Performance Comparison'}>
                    {hasCategoryData ? (
                        <ResponsiveContainer width="100%" height={300}>
                            {admin ? (
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={100}
                                        label
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell
                                                key={`${entry.name}-${index}`}
                                                fill={COLORS[index % COLORS.length]}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            ) : (
                                <BarChart
                                    data={categoryData}
                                    layout="vertical"
                                    margin={{ left: 15, right: 20 }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="#29364a"
                                    />
                                    <XAxis type="number" stroke="#aab6c7" />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        width={110}
                                        stroke="#aab6c7"
                                    />
                                    <Tooltip />
                                    <Bar
                                        dataKey="value"
                                        name="Tickets / Bookings"
                                        fill="#10b981"
                                        radius={[0, 6, 6, 0]}
                                    />
                                </BarChart>
                            )}
                        </ResponsiveContainer>
                    ) : <EmptyChart />}
                </ChartCard>

                {admin && (
                    <ChartCard title="Monthly User Registrations">
                        {hasMonthlyData ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={monthlyUserData}>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="#29364a"
                                    />
                                    <XAxis dataKey="month" stroke="#aab6c7" />
                                    <YAxis allowDecimals={false} stroke="#aab6c7" />
                                    <Tooltip />
                                    <Bar
                                        dataKey="users"
                                        name="Registrations"
                                        fill="#a78bfa"
                                        radius={[6, 6, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <EmptyChart />}
                    </ChartCard>
                )}
            </div>
        </section>
    );
}

export default DashboardAnalyticsCharts;
