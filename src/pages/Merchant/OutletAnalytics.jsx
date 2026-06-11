import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { 
  Hexagon, TrendingUp, Briefcase, Loader, ArrowUpRight, CheckCircle, 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import axiosInstance from '../../api/axiosInstance';

// Mock Data for Charts (Waiting for backend charts data)
const DualChartData = [
  { day: 'Mon', Tokens: 1900, Revenue: 1800 },
  { day: 'Tue', Tokens: 1950, Revenue: 1750 },
  { day: 'Wed', Tokens: 2000, Revenue: 1400 },
  { day: 'Thu', Tokens: 1950, Revenue: 1700 },
  { day: 'Fri', Tokens: 650, Revenue: 2200 },
  { day: 'Sat', Tokens: 2000, Revenue: 1400 },
  { day: 'Sun', Tokens: 1950, Revenue: 1350 },
];

const SingleChartData = [
  { day: 'Mon', Revenue: 1600 },
  { day: 'Tue', Revenue: 2600 },
  { day: 'Wed', Revenue: 1300 },
  { day: 'Thu', Revenue: 1900 },
  { day: 'Fri', Revenue: 2000 },
  { day: 'Sat', Revenue: 800 },
  { day: 'Sun', Revenue: 1300 },
];

// Custom tooltips
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white px-4 py-2 border border-slate-200 shadow-xl rounded-lg text-center relative z-50">
        <p className="font-bold text-slate-800 text-xs mb-1">{label}</p>
        <p className="text-[10px] text-blue-500 font-semibold bg-blue-50 px-2 py-1 rounded">
          Revenue : {payload[0].value}
        </p>
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b border-r border-slate-200 rotate-45"></div>
      </div>
    );
  }
  return null;
};

const CustomDualTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white px-4 py-3 border border-slate-200 shadow-xl rounded-lg z-50">
        <p className="font-bold text-slate-800 text-xs mb-2 border-b border-slate-100 pb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-[11px] font-semibold mb-1" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const OutletAnalytics = () => {
  const { id } = useParams();
  const { user } = useSelector((state) => state.auth);
  
  const [activeTab, setActiveTab] = useState('Tokens Minting');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/merchant/outlets/${id}/dashboard`);
        if (response.data && response.data.success) {
          setData(response.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch outlet analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchAnalytics();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#59111c]"></div>
      </div>
    );
  }

  // Safe fallbacks for data rendering
  const metrics = data?.metrics || {};
  const minting = data?.tokensMinting || {};
  const recentTransactions = data?.recentTransactions || [];
  const inventory = data?.inventory || {};
  
  const denomsStr = (inventory.denominations || [])
    .map(d => `₹${d.denomination}`)
    .join(', ');

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 p-8 relative font-sans">
      
      {/* Welcome Banner */}
      <div className="bg-[#59111c] rounded-xl p-6 relative overflow-hidden shadow-sm">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          Welcome Back, {user?.name ? (user.name.includes('Mr') ? user.name : `Mr. ${user.name}`) : 'Mr. John'} 👋
        </h2>
        <p className="text-red-100 mt-1 text-sm font-medium">Have a good day..</p>
      </div>

      {/* Header Area */}
      <div className="flex justify-between items-end border-b border-slate-200 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Outlet ID #{id}</h3>
          <p className="text-slate-500 text-[11px] font-medium mt-0.5">Monitoring performance for this location</p>
        </div>
        <button className="bg-[#59111c] hover:bg-[#7a1a28] text-white px-6 py-2.5 rounded-lg text-xs font-bold transition-colors shadow-sm">
          Add New Outlet
        </button>
      </div>

      {/* Top 4 Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-[16px] p-5 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-[13px] font-bold text-slate-800">DFS Tokens</h3>
              <p className="text-2xl font-black text-slate-900 mt-0.5">₹ {metrics.dfsTokens || 0}</p>
            </div>
            <Hexagon className="w-8 h-8 text-[#59111c]" strokeWidth={1.5} />
          </div>
          <p className="text-[10px] font-semibold text-slate-500">View DFS fixed minted token</p>
        </div>

        <div className="bg-white rounded-[16px] p-5 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-[13px] font-bold text-slate-800">Today's Revenue</h3>
              <p className="text-2xl font-black text-slate-900 mt-0.5">₹ {metrics.todaysRevenue || 0}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-[#59111c]" strokeWidth={1.5} />
          </div>
          <p className="text-[10px] font-semibold text-slate-500">Per day revenue</p>
        </div>

        <div className="bg-white rounded-[16px] p-5 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-[13px] font-bold text-slate-800">Available Balance</h3>
              <p className="text-2xl font-black text-slate-900 mt-0.5">₹ {metrics.availableBalance || 0}</p>
            </div>
            <Briefcase className="w-8 h-8 text-[#59111c]" strokeWidth={1.5} />
          </div>
          <p className="text-[10px] font-semibold text-slate-500">View available balance in the wallet</p>
        </div>

        <div className="bg-white rounded-[16px] p-5 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-[13px] font-bold text-slate-800">Token Status</h3>
              <p className="text-2xl font-black text-slate-900 mt-0.5">{metrics.tokenStatus || 'Unknown'}</p>
            </div>
            <Loader className="w-8 h-8 text-[#59111c]" strokeWidth={1.5} />
          </div>
          <p className="text-[10px] font-semibold text-slate-500">Display token status breakdown</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Revenue & Token Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 pb-2">
            <h3 className="text-base font-bold text-slate-800">Revenue & Token Activity</h3>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">Last 7 days performance</p>
          </div>
          <div className="p-6 pt-0 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DualChartData} margin={{ top: 40, right: 10, left: -20, bottom: 0 }} barSize={12} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} domain={[0, 4400]} ticks={[0, 650, 1300, 1950, 2600, 3500, 4400]} />
                <Tooltip content={<CustomDualTooltip />} cursor={{fill: 'transparent'}} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }} />
                <Bar dataKey="Tokens" fill="#10b981" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Revenue" fill="#0ea5e9" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transaction Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 pb-2">
            <h3 className="text-base font-bold text-slate-800">Transaction Distribution</h3>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">Token activity breakdown</p>
          </div>
          <div className="p-6 pt-0 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={SingleChartData} margin={{ top: 40, right: 10, left: -20, bottom: 0 }} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} domain={[0, 4400]} ticks={[0, 650, 1300, 1950, 2600, 3500, 4400]} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                <Bar dataKey="Revenue" fill="#0ea5e9" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Interactive Tabs */}
      <div className="bg-[#f1f5f9] rounded-2xl p-1.5 flex justify-between items-center max-w-4xl mx-auto shadow-inner">
        {['Tokens Minting', 'Recent Transactions', 'Inventory'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-200 ${
              activeTab === tab 
                ? 'bg-white text-slate-800 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content Rendering */}
      <div className="mt-8 pb-12">
        
        {/* TAB 1: Tokens Minting */}
        {activeTab === 'Tokens Minting' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h3 className="text-sm font-bold text-slate-800 mb-2">Tokens Minted</h3>
              <p className="text-3xl font-black text-slate-900 mb-4">{minting.todayMinted || 0}</p>
              <p className="text-[11px] text-slate-500 font-medium leading-tight">Today's preminted token raised as per change</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h3 className="text-sm font-bold text-slate-800 mb-2">Total Tokens Minted</h3>
              <p className="text-3xl font-black text-slate-900 mb-4">{minting.totalMinted || 0}</p>
              <p className="text-[11px] text-slate-500 font-medium leading-tight">Total preminted token as per change</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h3 className="text-sm font-bold text-slate-800 mb-2">Tokens Redeemed</h3>
              <p className="text-3xl font-black text-slate-900 mb-4">{minting.todayRedeemed || 0}</p>
              <p className="text-[11px] text-slate-500 font-medium leading-tight">Total redeemed or burned token as change</p>
            </div>
          </div>
        )}

        {/* TAB 2: Recent Transactions */}
        {activeTab === 'Recent Transactions' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Recent Transactions</h3>
              <p className="text-[11px] font-medium text-slate-500">Your latest transactions and activities</p>
            </div>
            {recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {recentTransactions.map((txn, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${txn.type?.toLowerCase().includes('mint') ? 'bg-emerald-50' : 'bg-red-50'}`}>
                        {txn.type?.toLowerCase().includes('mint') ? (
                          <ArrowUpRight className="w-5 h-5 text-emerald-500" strokeWidth={3} />
                        ) : (
                          <CheckCircle className="w-5 h-5 text-red-500" strokeWidth={3} />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-800">{txn.type || 'Transaction'}</p>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">{txn.time || 'Recently'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-slate-800">{txn.amount}</p>
                      <span className="bg-emerald-100 text-emerald-600 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase mt-1 inline-block">
                        {txn.status || 'completed'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-8 text-center text-slate-500 text-sm border border-slate-200">
                No recent transactions found for this outlet.
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Inventory */}
        {activeTab === 'Inventory' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Inventory Management</h3>
              <p className="text-[11px] font-medium text-slate-500">Manage your token inventory and availability</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <p className="text-xs font-bold text-slate-600 mb-2">Total available value</p>
                <p className="text-2xl font-black text-slate-900 mb-4">₹ {inventory.totalAvailableValue || 0}</p>
                <p className="text-[11px] text-slate-500 font-medium">Fetch inventory from merchant account</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <p className="text-xs font-bold text-slate-600 mb-2">Active Denominations</p>
                <p className="text-2xl font-black text-slate-900 mb-4">{inventory.denominations?.length || 0} Types</p>
                <p className="text-[11px] text-slate-500 font-medium">
                  {denomsStr ? `${denomsStr} available` : 'No denominations available'}
                </p>
              </div>
            </div>
            <button className="w-full mt-2 bg-[#59111c] hover:bg-[#7a1a28] text-white py-3.5 rounded-xl text-sm font-bold transition-colors shadow-sm">
              Add more Inventory
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default OutletAnalytics;
