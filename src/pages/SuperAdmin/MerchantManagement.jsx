import React, { useState, useEffect } from 'react';
import { Package, Search, Filter, Eye, XCircle, CheckCircle2, PlusCircle, ChevronLeft, ChevronRight, X, ChevronDown } from 'lucide-react';
import Pagination from '../../components/Pagination';
import axiosInstance from '../../api/axiosInstance';

const MerchantManagement = () => {
  // Data state from API
  const [data, setData] = useState({
    dashboard: {
      totalMerchant: "0",
      pendingApproval: "0",
      approved: "0",
      preMintPending: "0"
    },
    merchantList: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  const itemsPerPage = 10;

  // Modals state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Outlet Form State
  const [newOutlet, setNewOutlet] = useState({
    outletName: '',
    email: '',
    password: '',
    location: '',
    outletManager: '',
    contactNumber: ''
  });
  const [isSubmittingOutlet, setIsSubmittingOutlet] = useState(false);
  const [outletError, setOutletError] = useState('');

  // Normalize merchant data - maps filter/search API field names to table field names
  const normalizeMerchant = (item) => ({
    merchantId: item.merchantId || item.merchant_id || '',
    businessName: item.businessName || item.business_name || '',
    applicant: item.applicant || item.name || item.full_name || '',
    contact: item.contact || item.mobile || item.phone || '',
    date: item.date
      ? item.date
      : item.createdAt
      ? new Date(item.createdAt).toISOString().split('T')[0]
      : '',
    status: item.status || '',
    preMint: item.preMint || item.tokenBalance || null,
    email: item.email || '',
    address: item.address || '',
  });

  // Fetch API Data
  const fetchMerchantData = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/admin/merchantManagement');
      if (response.data && response.data.success) {
        setData({
          dashboard: response.data.data.dashboard || {},
          merchantList: response.data.data.merchantList || []
        });
      }
    } catch (err) {
      console.error("Failed to fetch merchant data:", err);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setCurrentPage(1);
    if (!searchQuery.trim()) {
      fetchMerchantData();
      return;
    }
    try {
      setLoading(true);
      const { data: resData } = await axiosInstance.get('/admin/search', {
        params: { q: searchQuery, resource: 'merchants' }
      });
      if (resData?.success) {
        setData(prev => ({ ...prev, merchantList: (resData.data || []).map(normalizeMerchant) }));
      }
    } catch (err) {
      console.error('Error searching:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = async (e) => {
    const status = e.target.value;
    setFilterStatus(status);
    setCurrentPage(1);
    if (!status) {
      fetchMerchantData();
      return;
    }
    try {
      setLoading(true);
      const { data: resData } = await axiosInstance.get('/admin/filter', {
        params: { resource: 'merchants', status }
      });
      if (resData?.success) {
        setData(prev => ({ ...prev, merchantList: (resData.data || []).map(normalizeMerchant) }));
      }
    } catch (err) {
      console.error('Error filtering:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMerchantData();
  }, []);

  // Handle Status Update
  const handleStatusChange = async (merchantId, newStatusText) => {
    try {
      // Map dropdown text to API status format
      let apiStatus = 'pending';
      if (newStatusText === 'Approved') apiStatus = 'approved';
      if (newStatusText === 'Rejected') apiStatus = 'rejected';

      // 1. Optimistically update the UI instantly without waiting for API
      setSelectedMerchant(prev => ({ ...prev, status: apiStatus }));
      
      setData(prevData => ({
        ...prevData,
        merchantList: prevData.merchantList.map(merchant => 
          merchant.merchantId === merchantId 
            ? { ...merchant, status: apiStatus }
            : merchant
        )
      }));

      // 2. Send the API request
      const response = await axiosInstance.put(`/admin/merchant/${merchantId}/activate`, {
        status: apiStatus
      });

      if (response.data && response.data.success) {
        // Refresh the table data in background to sync with server
        fetchMerchantData();
      } else {
        // Revert on failure
        fetchMerchantData();
      }
    } catch (error) {
      console.error("Error updating status:", error);
      fetchMerchantData(); // Revert on failure
      alert("Failed to update status. Please check your network or API endpoint.");
    }
  };

  // Pagination logic (filtering handled by API now)
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMerchants = data.merchantList.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(data.merchantList.length / itemsPerPage);

  // Functions to open modals
  const openDrawer = (merchant) => {
    setSelectedMerchant({
      id: merchant.merchantId,
      businessName: merchant.businessName,
      applicantName: merchant.applicant,
      status: merchant.status,
      // Fallback details if API doesn't return them yet
      email: merchant.email || 'N/A',
      phone: merchant.contact || 'N/A',
      address: merchant.address || 'N/A',
      dateSubmitted: merchant.date || 'N/A',
      tokenBalance: merchant.tokenBalance || 'N/A',
      preMintRequested: merchant.preMint || 'N/A'
    });
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedMerchant(null);
  };

  const handleCreateOutlet = async (e) => {
    e.preventDefault();
    setOutletError('');
    setIsSubmittingOutlet(true);
    try {
      const response = await axiosInstance.post('/admin/create-outlet', newOutlet);
      if (response.data?.success) {
        setIsAddModalOpen(false);
        setNewOutlet({ outletName: '', email: '', password: '', location: '', outletManager: '', contactNumber: '' });
        fetchMerchantData(); // Refresh list after adding
      } else {
        setOutletError(response.data?.message || 'Failed to create outlet.');
      }
    } catch (err) {
      console.error('Error creating outlet:', err);
      setOutletError(err.response?.data?.message || 'An error occurred while creating outlet.');
    } finally {
      setIsSubmittingOutlet(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1b2b4d]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 relative">
      
      {/* Welcome Banner */}
      <div className="bg-[#a2c8db] rounded-xl p-8 relative overflow-hidden flex items-center shadow-sm">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            Merchant Management 🏪
          </h2>
          <p className="text-slate-700 mt-1 text-sm font-medium">Manage all your registered merchants and outlets.</p>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-[#8cb8cc] to-transparent pointer-events-none"></div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Merchant', value: data?.dashboard?.totalMerchant || '0' },
          { label: 'Pending Approval', value: data?.dashboard?.pendingApproval || '0' },
          { label: 'Approved', value: data?.dashboard?.approved || '0' },
          { label: 'Pre-Mint Pending', value: data?.dashboard?.preMintPending || '0' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <h3 className="text-base font-semibold text-slate-800 mb-1">{stat.label}</h3>
              <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
            </div>
            <div className="p-3">
              <Package className="w-10 h-10 text-[#1b2b4d]" strokeWidth={1.5} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Table Header & Controls */}
        <div className="p-6 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">Merchant List</h3>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search by ID or Name" 
                    className="pl-9 pr-4 py-2.5 border border-slate-300 rounded-l-lg focus:outline-none focus:ring-1 focus:ring-[#1b2b4d] text-sm w-72 transition-shadow"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
              <button 
                onClick={handleSearch}
                className="bg-[#1b2b4d] hover:bg-slate-800 text-white px-6 py-2.5 border border-[#1b2b4d] rounded-r-lg text-sm font-medium transition-colors"
              >
                Search
              </button>
            </div>
            <div className="relative">
              <select 
                value={filterStatus === '' ? 'default' : filterStatus}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val !== 'default') {
                    handleFilter({ target: { value: val === 'all' ? '' : val } });
                  }
                }}
                className="appearance-none bg-[#1b2b4d] hover:bg-slate-800 text-white pl-9 pr-9 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm focus:outline-none cursor-pointer"
              >
                <option value="default" disabled hidden>Filter</option>
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
              <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white pointer-events-none" />
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-white pointer-events-none" />
            </div>
            
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ml-2"
            >
              Add New Outlet
              <PlusCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#f1f5f9] text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Merchant ID</th>
                <th className="px-6 py-4">Business Name</th>
                <th className="px-6 py-4">Applicant</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Pre-Mint</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentMerchants.length > 0 ? currentMerchants.map((item, index) => (
                <tr key={index} className="hover:bg-slate-50 transition-colors text-slate-600 font-medium cursor-pointer" onDoubleClick={() => openDrawer(item)}>
                  <td className="px-6 py-5">{item.merchantId}</td>
                  <td className="px-6 py-5">{item.businessName}</td>
                  <td className="px-6 py-5">{item.applicant}</td>
                  <td className="px-6 py-5">{item.contact}</td>
                  <td className="px-6 py-5">{item.date}</td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-md text-xs font-semibold capitalize ${
                      item.status === 'pending' ? 'bg-orange-100 text-orange-600' :
                      item.status === 'active' || item.status === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 font-bold text-slate-800">
                    {item.preMint || 'Not Requested'}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <button onClick={() => openDrawer(item)} className="w-6 h-6 rounded-full border border-blue-400 flex items-center justify-center text-blue-500 hover:bg-blue-50 transition-colors" title="View">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      
                      {item.status === 'pending' ? (
                        <>
                          <button className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 transition-colors" title="Reject">
                            <XCircle className="w-4 h-4" />
                          </button>
                          <button className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white hover:bg-emerald-600 transition-colors" title="Approve">
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white hover:bg-blue-700 transition-colors" title="Action">
                          <PlusCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-slate-500">
                    No merchants found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-6 border-t border-slate-200">
          <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            onPageChange={setCurrentPage} 
          />
        </div>

      </div>

      {/* --- SIDE DRAWER (Business Information) --- */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeDrawer}
          ></div>
          
          {/* Drawer Panel */}
          <div className="relative w-full max-w-[600px] bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-800">Business Information</h2>
              <button onClick={closeDrawer} className="text-slate-400 hover:text-slate-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-8 overflow-y-auto flex-1 space-y-8">
              
              {/* Form Grid 1 */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2">Merchant ID</label>
                  <input type="text" readOnly value={selectedMerchant?.id || ''} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-700 focus:outline-none bg-slate-50" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2">Business Name</label>
                  <input type="text" readOnly value={selectedMerchant?.businessName || ''} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-700 focus:outline-none bg-slate-50" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2">Applicant Name</label>
                  <input type="text" readOnly value={selectedMerchant?.applicantName || ''} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-700 focus:outline-none bg-slate-50" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2">Status</label>
                  <select 
                    className={`w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 bg-white capitalize ${
                      selectedMerchant?.status === 'rejected' ? 'text-red-600 focus:ring-red-500' :
                      (selectedMerchant?.status === 'active' || selectedMerchant?.status === 'approved') ? 'text-emerald-600 focus:ring-emerald-500' :
                      'text-orange-600 focus:ring-orange-500'
                    }`}
                    value={selectedMerchant?.status === 'active' || selectedMerchant?.status === 'approved' ? 'Approved' : selectedMerchant?.status === 'rejected' ? 'Rejected' : 'Pending'}
                    onChange={(e) => handleStatusChange(selectedMerchant?.id, e.target.value)}
                  >
                    <option value="Approved">Approved</option>
                    <option value="Pending">Pending</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Contact Information Section */}
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">Contact Information</h3>
                <div className="grid grid-cols-4 gap-6 text-sm">
                  <div className="col-span-1">
                    <p className="font-semibold text-slate-800 mb-1">Email</p>
                    <p className="text-slate-600 break-words">{selectedMerchant?.email}</p>
                  </div>
                  <div className="col-span-1">
                    <p className="font-semibold text-slate-800 mb-1">Phone</p>
                    <p className="text-slate-600">{selectedMerchant?.phone}</p>
                  </div>
                  <div className="col-span-1">
                    <p className="font-semibold text-slate-800 mb-1">Address</p>
                    <p className="text-slate-600 leading-relaxed">{selectedMerchant?.address}</p>
                  </div>
                  <div className="col-span-1">
                    <p className="font-semibold text-slate-800 mb-1">Date Submitted</p>
                    <p className="text-slate-600">{selectedMerchant?.dateSubmitted}</p>
                  </div>
                </div>
              </div>

              {/* Token Information Section */}
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">Token Information</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">Current Token Balance</label>
                    <input type="text" readOnly value={selectedMerchant?.tokenBalance || '---'} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-lg text-slate-700 focus:outline-none bg-slate-50" />
                  </div>
                  <div>
                    <p className="block text-sm font-semibold text-slate-800 mb-2">Pre-Mint Requested</p>
                    <p className="text-slate-700 font-medium py-2.5">{selectedMerchant?.preMintRequested}</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* --- CENTER MODAL (Add New Outlet) --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsAddModalOpen(false)}
          ></div>

          {/* Modal Content */}
          <div className="relative w-full max-w-[450px] bg-white rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Add New Outlet</h2>
                <p className="text-xs text-slate-500 mt-1">Enter the details for the new business location.</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateOutlet} className="p-6 space-y-4">
              {outletError && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{outletError}</div>}
              
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">Outlet Name</label>
                <input 
                  type="text" 
                  placeholder="Enter Name" 
                  required
                  value={newOutlet.outletName}
                  onChange={(e) => setNewOutlet({...newOutlet, outletName: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">Create e-mail ID</label>
                <input 
                  type="email" 
                  placeholder="Create e-mail ID" 
                  required
                  value={newOutlet.email}
                  onChange={(e) => setNewOutlet({...newOutlet, email: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">Create Password</label>
                <input 
                  type="password" 
                  placeholder="Create Password" 
                  required
                  value={newOutlet.password}
                  onChange={(e) => setNewOutlet({...newOutlet, password: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">Location</label>
                <input 
                  type="text" 
                  placeholder="Enter Location" 
                  required
                  value={newOutlet.location}
                  onChange={(e) => setNewOutlet({...newOutlet, location: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">Outlet Manager</label>
                <input 
                  type="text" 
                  placeholder="Enter Manager Name" 
                  required
                  value={newOutlet.outletManager}
                  onChange={(e) => setNewOutlet({...newOutlet, outletManager: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">Contact Number</label>
                <input 
                  type="text" 
                  placeholder="+91-9999999999" 
                  required
                  value={newOutlet.contactNumber}
                  onChange={(e) => setNewOutlet({...newOutlet, contactNumber: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100" 
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmittingOutlet}
                className="w-full bg-[#1b2b4d] hover:bg-slate-800 disabled:opacity-50 text-white font-medium py-3 rounded-xl mt-4 transition-colors flex items-center justify-center"
              >
                {isSubmittingOutlet ? 'Creating...' : 'Create Outlet'}
              </button>
            </form>
            
          </div>
        </div>
      )}

    </div>
  );
};

export default MerchantManagement;
