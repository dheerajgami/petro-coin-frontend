import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Users, ArrowRightLeft, UserCheck, Activity } from 'lucide-react';
import { useSelector } from 'react-redux';
import axiosInstance from '../../api/axiosInstance';

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [data, setData] = useState({
    stats: {
      activeUsers: 0,
      totalTransactions: 0,
      pendingApprovals: 0,
      systemUptime: "0%"
    },
    recentMerchants: [],
    fuelStationsOverview: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axiosInstance.get('/admin/dashboard-summary');
        if (response.data && response.data.success) {
          setData(response.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1b2b4d]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-8">
      
      {/* Notification Banner */}
      {data.stats.pendingApprovals > 0 && (
        <div className="flex items-center justify-between bg-slate-100 text-slate-700 px-6 py-3 rounded-full border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center">
              <img src={`https://ui-avatars.com/api/?name=Alert&background=cbd5e1`} alt="" className="w-full h-full" />
            </div>
            <span className="text-sm font-medium text-slate-800">
              New Approvals Request: You have {data.stats.pendingApprovals} pending approvals.
            </span>
          </div>
          <button className="text-slate-400 hover:text-slate-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="bg-[#a2c8db] rounded-xl p-8 relative overflow-hidden flex items-center shadow-sm">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            Welcome Back, {user?.name || 'Admin'} 👋
          </h2>
          <p className="text-slate-700 mt-1 text-sm font-medium">Have a good day..</p>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-[#8cb8cc] to-transparent pointer-events-none"></div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Active User', value: data?.stats?.activeUsers || 0, icon: Users },
          { label: 'Total Transactions', value: `$${Number(data?.stats?.totalTransactions || 0).toLocaleString()}`, icon: ArrowRightLeft },
          { label: 'Pending Approvals', value: data?.stats?.pendingApprovals || 0, icon: UserCheck },
          { label: 'System Uptime', value: data?.stats?.systemUptime || "0%", icon: Activity },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-1">{stat.label}</h3>
              <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
            </div>
            <div className="p-3">
              <stat.icon className="w-10 h-10 text-[#1b2b4d]" strokeWidth={1.5} />
            </div>
          </div>
        ))}
      </div>

      {/* Recent Merchant Applications */}
      <div>
        <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-2">
          <h3 className="text-base font-bold text-slate-800">Recent Merchant Applications</h3>
          <button 
            onClick={() => navigate('/super-admin/merchants')}
            className="bg-[#1b2b4d] hover:bg-slate-800 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            View All
          </button>
        </div>
        
        <div className="space-y-4">
          {data.recentMerchants && data.recentMerchants.length > 0 ? data.recentMerchants.map((item, i) => (
            <div key={i} className="flex items-center justify-between p-5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors">
              <div className="flex gap-6">
                <span className="text-slate-400 font-medium text-sm mt-1 w-6">{`0${i + 1}`}</span>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{item.businessName}</h4>
                  <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                    <span>ID: {item.merchantId}</span>
                    <span>|</span>
                    <span>{item.ownerName}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{item.phone}</p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded border text-xs font-semibold capitalize ${
                item.status === 'active' || item.status === 'approved' 
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                  : 'border-orange-200 bg-orange-50 text-orange-500'
              }`}>
                {item.status}
              </div>
            </div>
          )) : (
            <div className="p-6 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
              No recent applications found.
            </div>
          )}
        </div>
      </div>

      {/* Fuel Stations Overview */}
      <div>
        <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-2">
          <h3 className="text-base font-bold text-slate-800">Fuel Stations Overview</h3>
          <button 
            onClick={() => navigate('/super-admin/fuel-stations')}
            className="bg-[#1b2b4d] hover:bg-slate-800 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            View All
          </button>
        </div>
        
        <div className="space-y-4">
          {data.fuelStationsOverview && data.fuelStationsOverview.length > 0 ? data.fuelStationsOverview.map((item, i) => (
            <div key={i} className="flex items-center justify-between p-5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors">
              <div className="flex gap-6">
                <span className="text-slate-400 font-medium text-sm mt-1 w-6">{`0${i + 1}`}</span>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{item.stationName}</h4>
                  <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                    <span>ID: {item.stationId}</span>
                    <span>|</span>
                    <span>{item.city || 'N/A'}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{item.pumps} Pumps | {item.capacity} L</p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded border text-xs font-semibold capitalize ${
                item.status === 'active' 
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                  : 'border-slate-200 bg-slate-50 text-slate-500'
              }`}>
                {item.status}
              </div>
            </div>
          )) : (
            <div className="p-6 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
              No fuel stations found.
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default SuperAdminDashboard;
