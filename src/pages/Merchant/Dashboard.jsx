import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { Store, TrendingUp, Coins, Tag } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import axiosInstance from '../../api/axiosInstance';

// Fixed colors for the pie chart
const PIE_COLORS = ['#3b82f6', '#f97316', '#ef4444', '#10b981', '#8b5cf6'];

// Custom tooltip for Bar Charts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white px-4 py-2 border border-slate-200 shadow-xl rounded-lg text-center relative z-50">
        <p className="font-bold text-slate-800 text-xs mb-1">{label}</p>
        <p className="text-[10px] text-blue-500 font-semibold bg-blue-50 px-2 py-1 rounded">
          Value: {payload[0].value}
        </p>
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b border-r border-slate-200 rotate-45"></div>
      </div>
    );
  }
  return null;
};

CustomTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  label: PropTypes.string
};

const MerchantDashboard = () => {
  const { user } = useSelector((state) => state.auth);

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/merchant/dashboard');
        if (response.data?.success) {
          setDashboardData(response.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch merchant dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#59111c]"></div>
      </div>
    );
  }

  // Fallback to empty if data is null
  const stats = dashboardData || {};

  // Map API data for recharts
  const RevenueData = (stats.revenueDistribution || []).map(item => ({
    name: item.outlet,
    value: item.revenue
  }));

  const TokenMintedData = (stats.tokensMintedByOutlet || []).map(item => ({
    name: item.outlet,
    value: item.tokens
  }));

  const PieData = (stats.dfsFixedTokenUsage || []).map((item, index) => ({
    name: item.name,
    value: item.value,
    color: PIE_COLORS[index % PIE_COLORS.length]
  }));

  // Helper to get max value for YAxis domains to prevent tiny bars
  const maxRevenue = Math.max(...RevenueData.map(d => d.value), 100);
  const maxMinted = Math.max(...TokenMintedData.map(d => d.value), 100);

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 p-8 relative font-sans">

      {/* Welcome Banner */}
      <div className="bg-[#59111c] rounded-xl p-6 relative overflow-hidden shadow-sm">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          Welcome Back, {user?.username || user?.businessName || user?.name || 'Merchant'} 👋
        </h2>
        <p className="text-red-100 mt-1 text-sm font-medium">Have a good day..</p>
      </div>

      <div>
        <h3 className="text-lg font-bold text-slate-800">Outlet Management</h3>
        <p className="text-slate-500 text-sm">Monitor and manage all your business locations</p>
        <hr className="mt-3 border-slate-200" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Outlets */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-base font-bold text-slate-800">Total Outlets</h3>
              <p className="text-3xl font-black text-slate-900 mt-1">
                {stats.totalOutlets?.toString().padStart(2, '0') || '00'}
              </p>
            </div>
            <div className="p-3 bg-red-50 rounded-full">
              <Store className="w-8 h-8 text-[#59111c]" strokeWidth={1.5} />
            </div>
          </div>
          <p className="text-sm font-medium text-emerald-600 mt-4">All locations active</p>
        </div>

        {/* Total Daily Revenue */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-base font-bold text-slate-800">Total Daily Revenue</h3>
              <p className="text-3xl font-black text-slate-900 mt-1">
                {stats.totalDailyRevenue || 0}
              </p>
            </div>
            <div className="p-3 bg-red-50 rounded-full">
              <TrendingUp className="w-8 h-8 text-[#59111c]" strokeWidth={1.5} />
            </div>
          </div>
          <p className="text-sm font-medium text-emerald-600 mt-4">+12% from yesterday</p>
        </div>

        {/* Total DFS Tokens / Available Balance */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-base font-bold text-slate-800">Available Balance</h3>
              <p className="text-3xl font-black text-slate-900 mt-1">
                {stats.availableBalance || '$0'}
              </p>
            </div>
            <div className="p-3 bg-red-50 rounded-full">
              <Coins className="w-8 h-8 text-[#59111c]" strokeWidth={1.5} />
            </div>
          </div>
          <p className="text-sm font-medium text-orange-500 mt-4">Across all outlet</p>
        </div>

        {/* Total Tokens Minted */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-base font-bold text-slate-800">Total Tokens Minted</h3>
              <p className="text-3xl font-black text-slate-900 mt-1">
                {stats.totalTokenMinted?.toLocaleString() || 0}
              </p>
            </div>
            <div className="p-3 bg-red-50 rounded-full">
              <Tag className="w-8 h-8 text-[#59111c]" strokeWidth={1.5} />
            </div>
          </div>
          <p className="text-sm font-medium text-emerald-600 mt-4">Daily pre-mint activity</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Revenue Distribution Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-[#59111c] border-b-2 border-opacity-90">
            <h3 className="text-base font-bold text-slate-800">Revenue Distribution</h3>
            <p className="text-xs text-slate-500 mt-0.5">Daily revenue comparison across all outlets</p>
          </div>
          <div className="p-6 h-[320px]">
            {RevenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={RevenueData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }} barSize={50}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#475569' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#475569' }} domain={[0, maxRevenue * 1.2]} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="value" fill="#10b981" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">No revenue data available</div>
            )}
          </div>
        </div>

        {/* Tokens Minted Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-[#59111c] border-b-2 border-opacity-90">
            <h3 className="text-base font-bold text-slate-800">Tokens Minted by Outlet</h3>
            <p className="text-xs text-slate-500 mt-0.5">Pre-mint activity performance tracking</p>
          </div>
          <div className="p-6 h-[320px]">
            {TokenMintedData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={TokenMintedData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }} barSize={50}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#475569' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#475569' }} domain={[0, maxMinted * 1.2]} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">No token data available</div>
            )}
          </div>
        </div>

      </div>

      {/* Bottom Chart Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10">
        {/* DFS Fixed Token Usage Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center">
          <div className="w-full text-left mb-2">
            <h3 className="text-lg font-bold text-slate-800">DFS Fixed Token Usage</h3>
            <p className="text-xs text-slate-500 mt-0.5">Allocation vs Current Utilization</p>
          </div>

          <div className="w-full max-w-[300px] h-[250px] relative">
            {PieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={PieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {PieData.map((entry) => (
                        <Cell key={`cell-${entry.name}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* We can't perfectly position fixed overlays dynamically for varying array lengths without math, 
                    but we can use standard Recharts labels if we wanted. For now, since user wants exact UI,
                    and since dynamic data might have 1 item or 10 items, standard Recharts Tooltip is best. */}
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">No usage data available</div>
            )}
          </div>

          {/* Dynamic Legend */}
          {PieData.length > 0 && (
            <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
              {PieData.map((item) => (
                <div key={item.name} className="flex flex-col items-start text-left bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                    <span className="text-[10px] text-slate-700 font-bold leading-tight truncate w-full" title={item.name}>{item.name}</span>
                  </div>
                  <span className="text-sm font-black text-slate-900 ml-4">{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default MerchantDashboard;
