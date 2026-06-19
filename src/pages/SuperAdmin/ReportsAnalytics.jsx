import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { CircleDollarSign, Receipt, RefreshCcw, UserCheck } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie
} from 'recharts';
import axiosInstance from '../../api/axiosInstance';

// --- CUSTOM TOOLTIPS ---
/* eslint-disable react/prop-types */
const CustomTransactionTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-slate-200 shadow-lg rounded-xl p-3 text-sm">
        <p className="font-semibold text-slate-800 mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={entry.name || index} style={{ color: entry.color }} className="font-medium">
            {entry.name === 'transactions' ? 'Transactions' : 'Revenue'} : {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const CustomFuelTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-red-600 text-white shadow-lg rounded-md p-3 text-sm relative">
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-red-600 rotate-45"></div>
        <p className="font-semibold relative z-10 text-center mb-1">Volume</p>
        {payload.map((entry, index) => (
          <p key={entry.name || index} className="font-bold relative z-10 text-center">
             {entry.name === 'petrol' ? 'Petrol' : 'Diesel'}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const ReportsAnalytics = () => {
  const { user } = useSelector((state) => state.auth);
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await axiosInstance.get('/admin/reports');
        if (response.data?.success) {
          setData(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch reports and analytics data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  if (loading || !data) {
    return (
      <div className="p-8 flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1b2b4d]"></div>
      </div>
    );
  }

  const { cards, transactionTrends, merchantStatus, fuelTypeDistribution } = data;

  const merchantStatusData = [
    { name: 'Approved', value: merchantStatus.approved || 0, color: '#1877f2', fill: '#1877f2' },
    { name: 'Pending', value: merchantStatus.pending || 0, color: '#f59e0b', fill: '#f59e0b' },
    { name: 'Rejected', value: merchantStatus.rejected || 0, color: '#ef4444', fill: '#ef4444' },
  ];

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 relative pb-10">
      
      {/* Welcome Banner */}
      <div className="bg-[#a2c8db] rounded-xl p-8 relative overflow-hidden flex items-center shadow-sm">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            Welcome Back, {user?.name || 'Mr. John'} 👋
          </h2>
          <p className="text-slate-700 mt-1 text-sm font-medium">Have a good day..</p>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-[#8cb8cc] to-transparent pointer-events-none"></div>
      </div>

      {/* Header text */}
      <div className="pt-2 border-b border-slate-200 pb-4">
        <h3 className="text-lg font-bold text-slate-800">Reports & Analytics</h3>
        <p className="text-slate-500 text-sm">Comprehensive business analytics and performance metrics</p>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow flex items-center justify-between">
          <div>
            <p className="text-base font-semibold text-slate-800 mb-1">Total Revenue</p>
            <h3 className="text-3xl font-bold text-slate-900 mb-2">{cards.totalRevenue.value}</h3>
            <p className={`text-sm font-medium ${cards.totalRevenue.isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
              {cards.totalRevenue.change} vs last month
            </p>
          </div>
          <div className="bg-[#1b2b4d] rounded-full p-3 shadow-lg">
            <CircleDollarSign className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow flex items-center justify-between">
          <div>
            <p className="text-base font-semibold text-slate-800 mb-1">Transactions</p>
            <h3 className="text-3xl font-bold text-slate-900 mb-2">{cards.transactions.value}</h3>
            <p className={`text-sm font-medium ${cards.transactions.isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
              {cards.transactions.change} vs last month
            </p>
          </div>
          <div className="bg-[#1b2b4d] rounded-full p-3 shadow-lg">
            <Receipt className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow flex items-center justify-between">
          <div>
            <p className="text-base font-semibold text-slate-800 mb-1">Avg Transaction</p>
            <h3 className="text-3xl font-bold text-slate-900 mb-2">{cards.avgTransaction.value}</h3>
            <p className={`text-sm font-medium ${cards.avgTransaction.isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
              {cards.avgTransaction.change} vs last month
            </p>
          </div>
          <div className="bg-[#1b2b4d] rounded-full p-3 shadow-lg">
            <RefreshCcw className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow flex items-center justify-between">
          <div>
            <p className="text-base font-semibold text-slate-800 mb-1">Conversion Rate</p>
            <h3 className="text-3xl font-bold text-slate-900 mb-2">{cards.conversionRate.value}</h3>
            <p className={`text-sm font-medium ${cards.conversionRate.isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
              {cards.conversionRate.change} vs last month
            </p>
          </div>
          <div className="bg-[#1b2b4d] rounded-full p-3 shadow-lg">
            <UserCheck className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>

      {/* Middle Row Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction Trends */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Transaction Trends</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={transactionTrends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} tickFormatter={(val) => val.toLocaleString()} />
                <RechartsTooltip content={<CustomTransactionTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="transactions" 
                  stroke="#8b5cf6" 
                  strokeWidth={3} 
                  dot={false}
                  activeDot={{ r: 8, strokeWidth: 2, fill: 'white', stroke: '#8b5cf6' }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#22c55e" 
                  strokeWidth={3} 
                  dot={false}
                  activeDot={{ r: 8, strokeWidth: 2, fill: 'white', stroke: '#22c55e' }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Merchant Status Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-2">Merchant Status Distribution</h3>
          <div className="flex-1 min-h-[250px] relative w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={merchantStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 600 }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Absolute positioning for specific labels mimicking the design */}
            <div className="absolute top-[10%] left-1/2 -translate-x-1/2 text-center pointer-events-none">
              <p className="text-red-500 font-bold text-sm">{merchantStatusData[2].value}</p>
              <p className="text-red-500 text-[10px]">Rejected</p>
            </div>
            <div className="absolute top-1/2 left-[5%] -translate-y-1/2 text-center pointer-events-none">
              <p className="text-orange-400 font-bold text-sm">{merchantStatusData[1].value}</p>
              <p className="text-orange-400 text-[10px]">Pending</p>
            </div>
            <div className="absolute top-1/2 right-[5%] -translate-y-1/2 text-center pointer-events-none">
              <p className="text-blue-500 font-bold text-sm">{merchantStatusData[0].value}</p>
              <p className="text-blue-500 text-[10px]">Approved</p>
            </div>
          </div>
          
          <div className="flex justify-center gap-6 mt-4">
            {merchantStatusData.map((item) => (
              <div key={item.name} className="flex flex-col items-center">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-xs font-semibold text-slate-700">{item.name}</span>
                </div>
                <span className="text-sm font-bold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Chart - Fuel Type Distribution */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-8">Fuel Type Distribution</h3>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={fuelTypeDistribution} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={15} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} tickFormatter={(val) => val.toLocaleString()} />
              <RechartsTooltip content={<CustomFuelTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '5 5' }} />
              
              {/* Lines with slight shadow/thick stroke for better visual hierarchy */}
              <Line 
                type="monotone" 
                dataKey="diesel" 
                stroke="#f97316" 
                strokeWidth={4} 
                dot={false}
                activeDot={{ r: 8, strokeWidth: 0, fill: '#f97316' }} 
              />
              <Line 
                type="monotone" 
                dataKey="petrol" 
                stroke="#dc2626" 
                strokeWidth={4} 
                dot={false}
                activeDot={{ r: 8, strokeWidth: 3, fill: 'white', stroke: '#dc2626' }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Custom Legend for bottom chart */}
        <div className="flex justify-center gap-10 mt-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#dc2626] rounded-sm"></div>
            <span className="text-sm font-semibold text-slate-600">Diesel</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#f97316] rounded-sm"></div>
            <span className="text-sm font-semibold text-slate-600">Petrol</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ReportsAnalytics;
