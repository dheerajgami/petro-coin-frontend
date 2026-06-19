import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, X, ChevronDown, Plus, Store, Users, Coins, 
  AlertTriangle, CheckCircle, HelpCircle, Mail, Lock, MapPin, 
  User, Phone, Eye, ArrowLeft, Building2, PlusCircle, UserPlus
} from 'lucide-react';
import Pagination from '../../components/Pagination';
import { useSelector } from 'react-redux';
import axiosInstance from '../../api/axiosInstance';

const MerchantAdminManagement = () => {
  const { user } = useSelector((state) => state.auth);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Modals & Drawers
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [activeTab, setActiveTab] = useState('Overview');
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isAddOutletOpen, setIsAddOutletOpen] = useState(false);
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [selectedMint, setSelectedMint] = useState(null);
  const [isMintDetailsOpen, setIsMintDetailsOpen] = useState(false);

  // API State: Main Dashboard
  const [stats, setStats] = useState({
    totalMerchants: '0',
    totalOutlets: '0',
    tokensMinted: '0.00',
    pendingReview: '0',
    totalOutletsMonitored: '0',
    criticalLowStock: '0',
    reorderRequired: '0',
    stockNormal: '0'
  });
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(false);

  // API State: Details Drawer
  const [merchantDetails, setMerchantDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Form State: Add Outlet
  const [newOutlet, setNewOutlet] = useState({
    name: '',
    email: '',
    password: '',
    location: '',
    manager: '',
    contact: '+91-7877593063'
  });

  // Form State: Add Merchant Admin
  const [newAdmin, setNewAdmin] = useState({
    name: '',
    business: '',
    email: '',
    password: '',
    location: '',
    manager: '',
    contact: '+91-9988776655'
  });

  // Fetch Dashboard Stats & Merchants list
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/admin/merchant-admin-dashboard');
      if (res.data?.success) {
        const payload = res.data.data;
        if (payload.stats) {
          setStats({
            totalMerchants: String(payload.stats.totalMerchants || '0'),
            totalOutlets: String(payload.stats.totalOutlets || '0'),
            tokensMinted: Number(payload.stats.tokensMinted || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            pendingReview: String(payload.stats.pendingReview || '0'),
            totalOutletsMonitored: String(payload.stats.totalOutletsMonitored || '0'),
            criticalLowStock: String(payload.stats.criticalLowStock || '0'),
            reorderRequired: String(payload.stats.reorderRequired || '0'),
            stockNormal: String(payload.stats.stockNormal || '0')
          });
        }
        if (payload.list) {
          const mapped = payload.list.map(m => {
            const tokenVal = Number(m.tokens || 0);
            let invStatus = 'normal';
            if (tokenVal === 0) invStatus = 'low';
            else if (tokenVal < 500) invStatus = 'warning';

            return {
              id: m.id,
              adminId: m.adminId || `MER${String(m.id).padStart(3, '0')}`,
              name: m.companyName || 'N/A',
              business: m.companyName || 'N/A',
              outletsCount: Number(m.activeOutlets || 0),
              email: m.email || 'N/A',
              phone: m.contact || 'N/A',
              tokens: tokenVal,
              todayTxns: Number(m.todaysTxns || 0),
              todayVolume: Number(m.volume || 0),
              inventory: `${(tokenVal * 1.5).toLocaleString()} L remaining`,
              inventoryStatus: invStatus,
              status: m.status === 'active' || m.status === 'Active' ? 'Active' : 'Inactive'
            };
          });
          setMerchants(mapped);
        }
      }
    } catch (err) {
      console.error('Failed to fetch merchant admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch single merchant details for tabs
  const fetchMerchantDetails = async (merchantId) => {
    try {
      setDetailsLoading(true);
      const res = await axiosInstance.get(`/admin/merchant-admin-dashboard/merchant/${merchantId}/details`);
      if (res.data?.success) {
        setMerchantDetails(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch merchant details:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (selectedMerchant) {
      fetchMerchantDetails(selectedMerchant.adminId);
    } else {
      setMerchantDetails(null);
    }
  }, [selectedMerchant]);

  // Search filter implementation (Client Side)
  const filteredMerchants = merchants.filter(m => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      m.name.toLowerCase().includes(query) || 
      m.adminId.toLowerCase().includes(query) || 
      m.business.toLowerCase().includes(query) || 
      m.email.toLowerCase().includes(query);

    if (filterStatus === 'all') return matchesSearch;
    return matchesSearch && m.status.toLowerCase() === filterStatus.toLowerCase();
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredMerchants.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredMerchants.length / itemsPerPage);

  // Handlers
  const handleManageClick = (merchant) => {
    setSelectedMerchant(merchant);
    setActiveTab('Overview');
    setIsManageModalOpen(true);
  };

  const handleAddOutletSubmit = async (e) => {
    e.preventDefault();
    if (!newOutlet.name || !newOutlet.email || !newOutlet.location) {
      alert('Please fill out the required fields.');
      return;
    }

    try {
      const payload = {
        outletName: newOutlet.name,
        email: newOutlet.email,
        password: newOutlet.password || 'password123',
        location: newOutlet.location,
        contactNumber: newOutlet.contact
      };
      const res = await axiosInstance.post(`/admin/merchant-admin-dashboard/merchant/${selectedMerchant.id}/outlet`, payload);
      if (res.data?.success) {
        alert(`Outlet "${newOutlet.name}" successfully created!`);
        setIsAddOutletOpen(false);
        setNewOutlet({
          name: '',
          email: '',
          password: '',
          location: '',
          manager: '',
          contact: '+91-7877593063'
        });
        fetchMerchantDetails(selectedMerchant.adminId);
        fetchDashboardData(); // Refresh summary stats
      }
    } catch (err) {
      console.error('Failed to create outlet:', err);
      alert(err.response?.data?.message || 'Failed to create outlet.');
    }
  };

  const handleReviewMinting = async (mintId, status) => {
    if (!window.confirm(`Are you sure you want to ${status.toLowerCase()} this minting request?`)) return;
    try {
      const res = await axiosInstance.put(`/admin/merchant-admin-dashboard/minting/${mintId}/review`, { status });
      if (res.data?.success) {
        alert(`Minting request ${status.toLowerCase()} successfully!`);
        fetchMerchantDetails(selectedMerchant.adminId);
        fetchDashboardData(); // Refresh summary stats
      }
    } catch (err) {
      console.error('Failed to review minting request:', err);
      alert(err.response?.data?.message || 'Failed to review request.');
    }
  };

  const handleViewMintClick = (mint) => {
    setSelectedMint(mint);
    setIsMintDetailsOpen(true);
  };

  const handleAddAdminSubmit = async (e) => {
    e.preventDefault();
    if (!newAdmin.name || !newAdmin.business || !newAdmin.email || !newAdmin.password || !newAdmin.contact) {
      alert('Please fill out all fields.');
      return;
    }

    try {
      const payload = {
        adminName: newAdmin.name,
        companyName: newAdmin.business,
        email: newAdmin.email,
        password: newAdmin.password,
        contactNumber: newAdmin.contact
      };

      const res = await axiosInstance.post('/admin/merchant-admin', payload);
      if (res.data?.success) {
        alert(res.data.message || 'Merchant Admin created successfully!');
        setIsAddAdminOpen(false);
        setNewAdmin({
          name: '',
          business: '',
          email: '',
          password: '',
          location: '',
          manager: '',
          contact: '+91-9988776655'
        });
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Failed to create merchant admin:', err);
      alert(err.response?.data?.message || 'Failed to create merchant admin.');
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 relative">
      
      {/* Welcome Banner */}
      <div className="bg-[#a2c8db]/60 backdrop-blur-sm rounded-2xl p-6 relative overflow-hidden flex items-center border border-[#8cb8cc]/30 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            Welcome Back, Mr. {user?.name || 'John'} 👋
          </h2>
          <p className="text-slate-600 mt-1 text-xs font-semibold">Have a good day..</p>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-white/20 to-transparent pointer-events-none"></div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Merchants', value: stats.totalMerchants, icon: User },
          { label: 'Total Outlets', value: stats.totalOutlets, icon: User },
          { label: 'Tokens Minted', value: stats.tokensMinted, icon: User },
          { label: 'Pending Review', value: stats.pendingReview, icon: User },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-all relative overflow-hidden group">
            <div className="relative z-10 flex flex-col justify-between h-20">
              <h3 className="text-sm font-bold text-slate-500 tracking-tight">{stat.label}</h3>
              <p className="text-2xl font-black text-[#1b2b4d] leading-none">{stat.value}</p>
            </div>
            {/* Silhouette icon at bottom right */}
            <stat.icon 
              className="absolute -bottom-1 right-2 w-14 h-14 text-[#1b2b4d]/10 transition-transform group-hover:scale-105 duration-300"
              strokeWidth={1.5}
            />
          </div>
        ))}
      </div>

      {/* Filters, Search & Action Header */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 w-full lg:w-auto flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by ID" 
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1b2b4d] text-sm w-full transition-shadow bg-white text-slate-700 font-semibold"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setCurrentPage(1)}
            className="bg-[#1b2b4d] hover:bg-slate-800 text-white px-6 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
          >
            Search
          </button>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
          <div className="relative">
            <select 
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              className="appearance-none bg-slate-100 hover:bg-slate-200 text-slate-700 pl-9 pr-9 py-2 rounded-lg text-sm font-semibold transition-colors focus:outline-none cursor-pointer border border-slate-300"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
          <button 
            onClick={() => setIsAddAdminOpen(true)}
            className="bg-[#1b2b4d] hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <UserPlus className="w-4 h-4 animate-none" />
            Add New Merchant Admin
          </button>
        </div>
      </div>

      {/* Card Section: Outlet Inventory Overview (Horizontal Grid) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Outlet Inventory Overview</h3>
          <p className="text-xs text-slate-400 mt-0.5">Real-time stock levels across all merchant outlets</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Outlets Monitored', value: stats.totalOutletsMonitored, bgClass: 'bg-white', borderClass: 'border-slate-200', labelColor: 'text-slate-800' },
            { label: 'Critical Low Stock', value: stats.criticalLowStock, bgClass: 'bg-red-50/50', borderClass: 'border-red-200', labelColor: 'text-[#ef4444]' },
            { label: 'Reorder Required', value: stats.reorderRequired, bgClass: 'bg-amber-50/50', borderClass: 'border-amber-100', labelColor: 'text-[#f59e0b]' },
            { label: 'Stock Normal', value: stats.stockNormal, bgClass: 'bg-[#f0fdf4]', borderClass: 'border-emerald-100', labelColor: 'text-[#22c55e]' },
          ].map((overview) => (
            <div key={overview.label} className={`border rounded-xl p-4 flex flex-col justify-between h-24 shadow-sm ${overview.bgClass} ${overview.borderClass}`}>
              <div className={`text-xs font-bold ${overview.labelColor}`}>{overview.label}</div>
              <p className="text-2xl font-extrabold text-slate-800">{overview.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#f8fafc] text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Admin ID</th>
                <th className="px-6 py-4">Merchant Name</th>
                <th className="px-6 py-4">Business / Outlets</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Token</th>
                <th className="px-6 py-4">Today's Txns</th>
                <th className="px-6 py-4">Inventory</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentItems.length > 0 ? currentItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors text-slate-600 font-medium">
                  <td className="px-6 py-5 text-slate-900 font-bold">{item.adminId}</td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 text-sm">{item.name}</span>
                      <span className="text-xs text-slate-400 font-normal mt-0.5">Admin</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-slate-800 font-bold text-sm">{item.business}</span>
                      <span className="text-xs text-slate-400 font-normal mt-0.5">{item.outletsCount} Outlets</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col text-xs font-normal">
                      <span className="text-slate-800 font-semibold">{item.email}</span>
                      <span className="text-slate-400 mt-0.5">{item.phone}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 font-bold text-blue-600">{item.tokens.toLocaleString()}</td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-slate-800 font-bold">{item.todayTxns}</span>
                      <span className="text-xs text-slate-500 font-normal mt-0.5">Volume: ${item.todayVolume.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col justify-center">
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className={`h-2 w-2 rounded-full inline-block ${
                          item.inventoryStatus === 'normal' ? 'bg-emerald-500' :
                          item.inventoryStatus === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                        }`} />
                        <span className="text-slate-800 font-bold">{item.inventory.replace(' remaining', '')}</span>
                      </div>
                      <span className={`text-[10px] font-semibold mt-0.5 ml-3.5 ${
                        item.inventoryStatus === 'normal' ? 'text-emerald-600' :
                        item.inventoryStatus === 'warning' ? 'text-amber-500' : 'text-red-500'
                      }`}>
                        {item.inventoryStatus === 'normal' ? 'remaining' :
                         item.inventoryStatus === 'warning' ? 'Reorder required' : 'Low stock alert'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      item.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <button 
                      onClick={() => handleManageClick(item)}
                      className="text-blue-500 hover:text-blue-700 font-bold text-sm transition-colors cursor-pointer hover:underline"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="9" className="px-6 py-8 text-center text-slate-400">
                    No merchants found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-200 bg-white">
          <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            onPageChange={setCurrentPage} 
          />
        </div>
      </div>

      {/* --- MODAL 1: MANAGE MERCHANT (OVERVIEW/OUTLETS) --- */}
      {isManageModalOpen && selectedMerchant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsManageModalOpen(false)}></div>
          
          {/* Modal Panel */}
          <div className="relative bg-white w-full max-w-[850px] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1b2b4d] font-bold text-lg">
                  {selectedMerchant.name.split(' ').map(n=>n[0]).join('')}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-800">{selectedMerchant.name}</h3>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">{selectedMerchant.status}</span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">{selectedMerchant.business} • {selectedMerchant.outletsCount} Outlets</p>
                </div>
              </div>
              <button 
                onClick={() => setIsManageModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5.5 h-5.5" />
              </button>
            </div>

            {/* Tab navigation */}
            <div className="flex border-b border-slate-200 bg-white px-6 overflow-x-auto shrink-0 scrollbar-none">
              {['Overview', 'Outlets', 'Token Activity', 'Transactions', 'Inventory', 'Token Minting'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-3.5 px-4 font-semibold text-sm relative transition-colors ${
                    activeTab === tab 
                      ? 'text-[#1b2b4d]' 
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#1b2b4d]" />
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content Area */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50 min-h-[300px] flex flex-col">
              {detailsLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 gap-3">
                  <div className="w-8 h-8 border-4 border-[#1b2b4d] border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-slate-400 font-semibold">Fetching merchant data...</p>
                </div>
              ) : (
                <>
                  {activeTab === 'Overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Revenue (Today)</div>
                        <div className="text-3xl font-black text-[#1b2b4d] mt-2">
                          ${Number(merchantDetails?.overview?.totalRevenueToday || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </div>
                      </div>
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Active Tokens</div>
                        <div className="text-3xl font-black text-[#1b2b4d] mt-2">
                          {Number(merchantDetails?.overview?.activeTokens || 0).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'Outlets' && (
                    <div className="space-y-6 w-full">
                      {/* Controls inside Outlets tab */}
                      <div className="flex justify-between items-center">
                        <h4 className="text-base font-bold text-slate-800">Managed Outlets</h4>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => setIsAddOutletOpen(true)}
                            className="bg-[#1b2b4d] hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add New Outlet
                          </button>
                        </div>
                      </div>

                      {/* Grid list of outlets */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {merchantDetails?.outlets && merchantDetails.outlets.length > 0 ? (
                          merchantDetails.outlets.map(outlet => (
                            <div key={outlet.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow relative">
                              <span className={`absolute top-4 right-4 px-2 py-0.5 rounded text-[10px] font-bold ${
                                outlet.status === 'active' || outlet.status === 'Active' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {outlet.status}
                              </span>
                              
                              <div>
                                <h5 className="font-bold text-slate-800 text-sm truncate pr-12">{outlet.outletName}</h5>
                                <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                  <MapPin className="w-3 h-3 text-slate-300" /> {outlet.location || 'N/A'}
                                </p>
                              </div>

                              <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs border-t border-slate-100 pt-3">
                                <div>
                                  <span className="text-slate-400 text-[10px]">Revenue Today</span>
                                  <p className="font-bold text-slate-800">${Number(outlet.revenueToday || 0).toLocaleString()}</p>
                                </div>
                                <div>
                                  <span className="text-slate-400 text-[10px]">DFS Tokens</span>
                                  <p className="font-bold text-slate-800">${Number(outlet.dfsTokens || 0).toLocaleString()}</p>
                                </div>
                                <div>
                                  <span className="text-slate-400 text-[10px]">Tokens Minted</span>
                                  <p className="font-bold text-slate-800">{Number(outlet.tokensMinted || 0).toLocaleString()}</p>
                                </div>
                                <div>
                                  <span className="text-slate-400 text-[10px]">Settlement</span>
                                  <p className="font-bold text-emerald-600 font-mono">${Number(outlet.settlement || 0).toLocaleString()}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-3 text-center py-12 text-slate-400 text-sm">
                            No outlets created for this merchant yet.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'Token Activity' && (
                    <div className="space-y-6 w-full">
                      {/* Table */}
                      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-[#f8fafc] text-slate-700 font-bold border-b border-slate-200">
                              <tr>
                                <th className="px-6 py-3.5">Token ID</th>
                                <th className="px-6 py-3.5">Type</th>
                                <th className="px-6 py-3.5">Quantity</th>
                                <th className="px-6 py-3.5">Status</th>
                                <th className="px-6 py-3.5">Outlet</th>
                                <th className="px-6 py-3.5">Timestamp</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                              {merchantDetails?.tokenActivity && merchantDetails.tokenActivity.length > 0 ? (
                                merchantDetails.tokenActivity.map((act) => (
                                  <tr key={act.tokenId} className="hover:bg-slate-50/50">
                                    <td className="px-6 py-4 text-blue-600 font-semibold">TKN-{act.tokenId}</td>
                                    <td className="px-6 py-4 text-blue-500">{act.type}</td>
                                    <td className="px-6 py-4 text-slate-900 font-bold">
                                      {act.quantity < 0 ? '' : '+'}{Number(act.quantity).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                        act.status === 'SUCCESS' || act.status === 'Completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'
                                      }`}>
                                        {act.status}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4">{act.outlet || 'Central Account'}</td>
                                    <td className="px-6 py-4 text-slate-500">{new Date(act.timestamp).toLocaleString()}</td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                                    No token activity logs found.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'Transactions' && (
                    <div className="space-y-6 w-full">
                      {/* Table */}
                      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-[#f8fafc] text-slate-700 font-bold border-b border-slate-200">
                              <tr>
                                <th className="px-6 py-3.5">Txn ID</th>
                                <th className="px-6 py-3.5">Timestamp</th>
                                <th className="px-6 py-3.5">Customer</th>
                                <th className="px-6 py-3.5">Outlet</th>
                                <th className="px-6 py-3.5">Type</th>
                                <th className="px-6 py-3.5">Amount</th>
                                <th className="px-6 py-3.5">Status</th>
                                <th className="px-6 py-3.5">Tokens</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                              {merchantDetails?.transactions && merchantDetails.transactions.length > 0 ? (
                                merchantDetails.transactions.map((txn) => (
                                  <tr key={txn.txnId} className="hover:bg-slate-50/50">
                                    <td className="px-6 py-4 text-slate-800 font-semibold">TXN-{txn.txnId}</td>
                                    <td className="px-6 py-4 text-slate-500">{new Date(txn.timestamp).toLocaleString()}</td>
                                    <td className="px-6 py-4 text-slate-900 font-bold">{txn.customer || 'N/A'}</td>
                                    <td className="px-6 py-4">{txn.outlet || 'N/A'}</td>
                                    <td className="px-6 py-4">
                                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                        txn.type === 'MINT' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                                      }`}>{txn.type}</span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-900 font-bold">${Number(txn.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                    <td className="px-6 py-4">
                                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                        txn.status === 'SUCCESS' || txn.status === 'Completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'
                                      }`}>{txn.status}</span>
                                    </td>
                                    <td className="px-6 py-4 text-blue-600 font-bold">{Number(txn.tokens).toLocaleString()}</td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan="8" className="px-6 py-8 text-center text-slate-400">
                                    No transaction logs found.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'Inventory' && (
                    <div className="space-y-6 w-full">
                      {/* Summary Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                          <div className="text-slate-500 text-xs font-bold uppercase tracking-wide">Available Tokens</div>
                          <div className="text-2xl font-black text-[#1b2b4d] mt-2">
                            {Number(merchantDetails?.inventory?.topCards?.availableTokens || 0).toLocaleString()}
                          </div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                          <div className="text-slate-500 text-xs font-bold uppercase tracking-wide">Redeemed (This Month)</div>
                          <div className="text-2xl font-black text-[#1b2b4d] mt-2">
                            {Number(merchantDetails?.inventory?.topCards?.redeemedThisMonth || 0).toLocaleString()}
                          </div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                          <div className="text-slate-500 text-xs font-bold uppercase tracking-wide">Expired / Locked</div>
                          <div className="text-2xl font-black text-[#1b2b4d] mt-2">
                            {Number(merchantDetails?.inventory?.topCards?.expiredLocked || 0).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* Token Inventory by Outlet Section */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Token Inventory by Outlet</h4>
                        
                        {merchantDetails?.inventory?.outlets && merchantDetails.inventory.outlets.length > 0 ? (
                          merchantDetails.inventory.outlets.map((outletInv, idx) => (
                            <div key={outletInv.outletName} className="space-y-2">
                              <div className="text-xs font-bold text-slate-800">{idx + 1}. {outletInv.outletName}</div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Available</span>
                                  <p className="text-xl font-bold mt-1 text-blue-500">{Number(outletInv.available || 0).toLocaleString()} L</p>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Redeemed Today</span>
                                  <p className="text-xl font-bold mt-1 text-amber-500">{Number(outletInv.redeemedToday || 0).toLocaleString()} L</p>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Reserved</span>
                                  <p className="text-xl font-bold mt-1 text-purple-500">{Number(outletInv.reserved || 0).toLocaleString()} L</p>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6 text-slate-400 text-sm">No outlets inventory records found.</div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'Token Minting' && (
                    <div className="space-y-6 w-full">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">Token Minting History</h4>
                        <p className="text-xs text-slate-500 mt-0.5">Manage and track token generation for merchant operations</p>
                      </div>

                      {/* Table */}
                      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-[#f8fafc] text-slate-700 font-bold border-b border-slate-200">
                              <tr>
                                <th className="px-6 py-3.5">Mint ID</th>
                                <th className="px-6 py-3.5">Date</th>
                                <th className="px-6 py-3.5">Amount</th>
                                <th className="px-6 py-3.5">Purpose</th>
                                <th className="px-6 py-3.5">Approved By</th>
                                <th className="px-6 py-3.5">Status</th>
                                <th className="px-6 py-3.5 text-center">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                              {merchantDetails?.tokenMinting && merchantDetails.tokenMinting.length > 0 ? (
                                merchantDetails.tokenMinting.map((req) => (
                                  <tr key={req.mintId} className="hover:bg-slate-50/50">
                                    <td className="px-6 py-4 text-slate-900 font-semibold">MNT-{req.mintId}</td>
                                    <td className="px-6 py-4 text-slate-500">{new Date(req.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-emerald-600 font-bold">+{Number(req.amount).toLocaleString()}</td>
                                    <td className="px-6 py-4 text-slate-700">{req.purpose || 'N/A'}</td>
                                    <td className="px-6 py-4">{req.approvedBy}</td>
                                    <td className="px-6 py-4">
                                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                        req.status === 'Completed' || req.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-600' : 
                                        req.status === 'Pending' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'
                                      }`}>{req.status}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                      {req.status === 'Pending' ? (
                                        <div className="flex flex-col items-center gap-1">
                                          <button 
                                            onClick={() => handleReviewMinting(req.mintId, 'Approved')}
                                            className="text-emerald-600 hover:text-emerald-700 font-bold hover:underline text-xs cursor-pointer"
                                          >
                                            Approve
                                          </button>
                                          <button 
                                            onClick={() => handleReviewMinting(req.mintId, 'Rejected')}
                                            className="text-red-500 hover:text-red-600 font-bold hover:underline text-xs cursor-pointer"
                                          >
                                            Reject
                                          </button>
                                        </div>
                                      ) : (
                                        <button 
                                          onClick={() => handleViewMintClick(req)}
                                          className="text-blue-500 hover:text-blue-700 font-bold hover:underline text-xs cursor-pointer bg-transparent border-none p-0"
                                        >
                                          View
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan="7" className="px-6 py-8 text-center text-slate-400">
                                    No minting requests found.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {/* --- MODAL 2: ADD NEW OUTLET --- */}
      {isAddOutletOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAddOutletOpen(false)}></div>
          
          {/* Modal Panel */}
          <div className="relative bg-white w-full max-w-[500px] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col">
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800">Add New Outlet</h3>
                <p className="text-xs text-slate-500 mt-0.5">Enter the details for the new business location.</p>
              </div>
              <button 
                onClick={() => setIsAddOutletOpen(false)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddOutletSubmit} className="p-6 space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Outlet Name</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Enter Name"
                    className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1b2b4d]"
                    value={newOutlet.name}
                    onChange={(e) => setNewOutlet({ ...newOutlet, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Create e-mail ID</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="email" 
                    placeholder="Create e-mail ID"
                    className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1b2b4d]"
                    value={newOutlet.email}
                    onChange={(e) => setNewOutlet({ ...newOutlet, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Create Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="password" 
                    placeholder="Create Password"
                    className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1b2b4d]"
                    value={newOutlet.password}
                    onChange={(e) => setNewOutlet({ ...newOutlet, password: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Location</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Enter Location"
                    className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1b2b4d]"
                    value={newOutlet.location}
                    onChange={(e) => setNewOutlet({ ...newOutlet, location: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Outlet Manager</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Enter Outlet Manager Name"
                    className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1b2b4d]"
                    value={newOutlet.manager}
                    onChange={(e) => setNewOutlet({ ...newOutlet, manager: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Contact Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Contact Number"
                    className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1b2b4d]"
                    value={newOutlet.contact}
                    onChange={(e) => setNewOutlet({ ...newOutlet, contact: e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit"
                  className="w-full bg-[#1b2b4d] hover:bg-slate-800 text-white font-bold py-3 rounded-lg text-sm transition-colors shadow-sm cursor-pointer"
                >
                  Create Outlet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: ADD NEW MERCHANT ADMIN --- */}
      {isAddAdminOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAddAdminOpen(false)}></div>
          
          {/* Modal Panel */}
          <div className="relative bg-white w-full max-w-[500px] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col">
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800">Add New Merchant Admin</h3>
                <p className="text-xs text-slate-500 mt-0.5">Create a master administrator account for a merchant group.</p>
              </div>
              <button 
                onClick={() => setIsAddAdminOpen(false)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddAdminSubmit} className="p-6 space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Admin Name</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Enter Admin Name"
                    className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1b2b4d]"
                    value={newAdmin.name}
                    onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Business / Company Name</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Enter Company Name"
                    className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1b2b4d]"
                    value={newAdmin.business}
                    onChange={(e) => setNewAdmin({ ...newAdmin, business: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Email ID</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="email" 
                    placeholder="Enter Admin Email"
                    className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1b2b4d]"
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="password" 
                    placeholder="Create Password"
                    className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1b2b4d]"
                    value={newAdmin.password}
                    onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Contact Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Contact Number"
                    className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1b2b4d]"
                    value={newAdmin.contact}
                    onChange={(e) => setNewAdmin({ ...newAdmin, contact: e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit"
                  className="w-full bg-[#1b2b4d] hover:bg-slate-800 text-white font-bold py-3 rounded-lg text-sm transition-colors shadow-sm cursor-pointer"
                >
                  Create Merchant Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 4: VIEW MINT DETAILS --- */}
      {isMintDetailsOpen && selectedMint && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMintDetailsOpen(false)}></div>
          
          {/* Modal Panel */}
          <div className="relative bg-white w-full max-w-[450px] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col">
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800">Mint Request Details</h3>
                <p className="text-xs text-slate-500 mt-0.5">Detailed view of the token minting request.</p>
              </div>
              <button 
                onClick={() => setIsMintDetailsOpen(false)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Details Content */}
            <div className="p-6 space-y-4 text-left text-sm text-slate-600">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-500">Mint ID:</span>
                <span className="font-bold text-slate-800">MNT-{selectedMint.mintId}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-500">Date:</span>
                <span className="text-slate-800">{new Date(selectedMint.date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-500">Amount:</span>
                <span className="font-extrabold text-emerald-600 font-mono">+{Number(selectedMint.amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-500">Purpose:</span>
                <span className="text-slate-800">{selectedMint.purpose || 'Token Request'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-500">Approved By:</span>
                <span className="text-slate-800">{selectedMint.approvedBy || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center pb-2">
                <span className="font-bold text-slate-500">Status:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  selectedMint.status === 'Completed' || selectedMint.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-600' : 
                  selectedMint.status === 'Pending' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'
                }`}>{selectedMint.status}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button 
                onClick={() => setIsMintDetailsOpen(false)}
                className="bg-[#1b2b4d] hover:bg-slate-800 text-white font-bold px-5 py-2 rounded-lg text-sm transition-colors shadow-sm cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default MerchantAdminManagement;
