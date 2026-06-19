import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Legend, Cell
} from 'recharts';
import { DollarSign, Fuel, CircleDashed, Users, ArrowUpRight, Loader2 } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';

const COLORS = ['#3B82F6', '#10B981', '#F5B041', '#8B5CF6', '#F97316', '#EC4899', '#14B8A6'];

const FuelAdminDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axiosInstance.get('/admin/fuel-dashboard');
        if (response.data?.success) {
          setDashboardData(response.data.data);
        } else {
          setError('Failed to load dashboard data');
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('An error occurred while loading dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F6F8]">
        <Loader2 className="w-8 h-8 text-[#ECA12A] animate-spin" />
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="p-8 max-w-[1400px] mx-auto text-center">
        <div className="bg-red-50 text-red-500 p-4 rounded-xl border border-red-100 font-bold">
          {error || 'Unable to load dashboard.'}
        </div>
      </div>
    );
  }

  const revenueData = dashboardData?.revenuePerformance || [];
  const tokenData = dashboardData?.tokenRedemptionShare || [];

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-6">

      {/* Welcome Banner */}
      <div className="bg-[#ECA12A] rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          Welcome Back, {typeof user?.username === 'string' ? `Mr. ${user.username.split(' ')[0]}` : 'Mr. John'} 👋
        </h2>
        <p className="text-slate-800 mt-1 text-sm font-medium">Have a good day..</p>
      </div>

      <div className="border-b border-slate-200 pb-2">
        <h3 className="text-lg font-bold text-slate-800">Station Management</h3>
        <p className="text-slate-500 text-[11px] font-medium mt-0.5">Welcome to Fuel Station Management System</p>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 mb-4">
            <DollarSign className="w-5 h-5" />
          </div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Total Revenue (All Stations)</p>
          <p className="text-3xl font-black text-slate-900 mb-3">₹{dashboardData.totalRevenue.toLocaleString('en-IN')}</p>
          <div className="flex items-center gap-2">
            <span className="flex items-center text-emerald-500 text-xs font-bold">
              <ArrowUpRight className="w-3 h-3 mr-0.5" />
              +12.5%
            </span>
            <span className="text-xs text-slate-400 font-medium">from last month</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 mb-4">
            <Fuel className="w-5 h-5" />
          </div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Active Stations</p>
          <p className="text-3xl font-black text-slate-900 mb-3">{dashboardData.activeStations} <span className="text-slate-400 text-xl font-bold">/ {dashboardData.totalStations}</span></p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">{dashboardData.stationsMaintenance} Currently Maintenance</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 mb-4">
            <CircleDashed className="w-5 h-5" />
          </div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Tokens Burned Today</p>
          <p className="text-3xl font-black text-slate-900 mb-3">{dashboardData.tokensBurnedToday.toLocaleString()}</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">transactions count: {dashboardData.todaysTransactions}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 mb-4">
            <Users className="w-5 h-5" />
          </div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">System Operators</p>
          <p className="text-3xl font-black text-slate-900 mb-3">{dashboardData.systemOperatorsTotal}</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">{dashboardData.systemOperatorsActive} Active Now</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Bar Chart - 2/3 width */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-800">Revenue Performance by Station</h3>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Monthly revenue breakdown across all units</p>
            </div>
          </div>
          <div className="flex-1 w-full min-h-[300px]">
            {revenueData && revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="stationName" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(value) => `₹${value / 1000}k`} />
                  <Tooltip
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [`₹${value}`, 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">No revenue data available</div>
            )}
          </div>
        </div>

        {/* Donut Chart - 1/3 width */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col relative">
          <h3 className="font-bold text-slate-800">Token Redemption Share</h3>
          <p className="text-xs font-medium text-slate-500 mt-0.5 mb-6">Distribution across top stations</p>
          <div className="flex-1 w-full min-h-[250px] relative">
            {tokenData && tokenData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tokenData}
                    cx="50%"
                    cy="45%"
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="tokens"
                    nameKey="stationName"
                  >
                    {tokenData.map((entry, index) => (
                      <Cell key={`cell-${entry.stationName || index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">No token data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800">Individual Station Analytics (DFS Units)</h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50">
                <th className="py-3 px-6 text-xs font-bold tracking-wide text-slate-500 uppercase border-b border-slate-200">Station Name</th>
                <th className="py-3 px-6 text-xs font-bold tracking-wide text-slate-500 uppercase border-b border-slate-200">Location</th>
                <th className="py-3 px-6 text-xs font-bold tracking-wide text-slate-500 uppercase border-b border-slate-200 text-right">Today's Tokens</th>
                <th className="py-3 px-6 text-xs font-bold tracking-wide text-slate-500 uppercase border-b border-slate-200 text-right">Revenue (INR)</th>
                <th className="py-3 px-6 text-xs font-bold tracking-wide text-slate-500 uppercase border-b border-slate-200 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {dashboardData.stationAnalytics && dashboardData.stationAnalytics.length > 0 ? (
                dashboardData.stationAnalytics.map((row, index) => (
                  <tr key={row.id || row.station_id || row.stationName || index} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-none">
                    <td className="py-4 px-6">
                      <p className="text-sm font-bold text-slate-800">{row.stationName}</p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-xs font-medium text-slate-500">{row.location || 'N/A'}</p>
                    </td>
                    <td className="py-4 px-6 text-right text-sm font-bold text-slate-700">
                      {row.todaysTokens}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <p className="text-sm font-bold text-slate-900">₹{row.revenue.toLocaleString('en-IN')}</p>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold capitalize tracking-wider ${row.status === 'Online' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${row.status === 'Online' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400 text-sm">No station analytics data</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default FuelAdminDashboard;
