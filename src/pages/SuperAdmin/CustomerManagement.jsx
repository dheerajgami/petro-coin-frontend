import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, UserCog, UserCheck, Users, ChevronLeft, ChevronRight, X, ChevronDown } from 'lucide-react';
import Pagination from '../../components/Pagination';
import { useSelector } from 'react-redux';
import axiosInstance from '../../api/axiosInstance';

const CustomerManagement = () => {
  const { user } = useSelector((state) => state.auth);

  // Data state from API
  const [data, setData] = useState({
    stats: {
      total: 0,
      active: 0,
      suspended: 0,
      blocked: 0
    },
    customers: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);  
  const [drawerMode, setDrawerMode] = useState('view'); // 'view' | 'edit'
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  const itemsPerPage = 10;

  // Normalize customer data - maps filter/search API field names to table field names
  const normalizeCustomer = (item) => ({
    customerId: item.customerId || item.customer_id || '',
    name: item.name || item.full_name || '',
    contact: item.contact || item.mobile || item.mobile_number || item.phone || '',
    tokenUid: item.tokenUid || item.token_uid || item.tokenUID || '',
    registration: item.registration
      ? item.registration
      : item.createdAt
      ? new Date(item.createdAt).toISOString().split('T')[0]
      : '',
    status: item.status || '',
    verification: item.verification || item.kycStatus || item.verification_status || '',
    tokens: item.tokens ?? item.tokenBalance ?? item.token_balance ?? '',
    email: item.email || '',
  });

  // Fetch API Data
  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/admin/dashboard');
      if (response.data && response.data.success) {
        setData({
          stats: {
            total: response.data.data.total || 0,
            active: response.data.data.active || 0,
            suspended: response.data.data.suspended || 0,
            blocked: response.data.data.blocked || 0,
          },
          customers: response.data.data.customers || []
        });
      }
    } catch (err) {
      console.error("Failed to fetch customer data:", err);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setCurrentPage(1);
    if (!searchQuery.trim()) {
      fetchCustomerData();
      return;
    }
    try {
      setLoading(true);
      const { data: resData } = await axiosInstance.get('/admin/search', {
        params: { q: searchQuery, resource: 'customers' }
      });
      if (resData?.success) {
        setData(prev => ({ ...prev, customers: (resData.data || []).map(normalizeCustomer) }));
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
      fetchCustomerData();
      return;
    }
    try {
      setLoading(true);
      const { data: resData } = await axiosInstance.get('/admin/filter', {
        params: { resource: 'customers', status }
      });
      if (resData?.success) {
        setData(prev => ({ ...prev, customers: (resData.data || []).map(normalizeCustomer) }));
      }
    } catch (err) {
      console.error('Error filtering:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerData();
  }, []);

  const openDrawer = (customer, mode) => {
    // Map API fields to Drawer fields
    setSelectedCustomer({ 
      ...customer,
      id: customer.customerId,
      email: customer.email || 'N/A', // If email is missing in list API
      tokenBalance: customer.tokens || '0',
      preMintRequested: 'NO' // Assuming NO based on screenshot
    });
    setDrawerMode(mode);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedCustomer(null), 300);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedCustomer(prev => ({ ...prev, [name]: value }));
  };

  // Update Status API
  const handleUpdate = async () => {
    try {
      // Optimitiscally update UI
      setData(prev => ({
        ...prev,
        customers: prev.customers.map(c => 
          c.customerId === selectedCustomer.id 
            ? { ...c, status: selectedCustomer.status }
            : c
        )
      }));

      // API Call
      const response = await axiosInstance.put(`/admin/customerStatus/${selectedCustomer.id}`, {
        status: selectedCustomer.status
      });

      if (response.data && response.data.success) {
        closeDrawer();
        fetchCustomerData(); // Refresh to get updated stats
      } else {
        fetchCustomerData(); // Revert on failure
      }
    } catch (err) {
      console.error("Failed to update status", err);
      alert("Failed to update status. Please try again.");
      fetchCustomerData();
    }
  };

  // Pagination logic (filtering handled by API now)
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCustomers = data.customers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(data.customers.length / itemsPerPage);

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
            Welcome Back, {user?.name || 'Mr. John'} 👋
          </h2>
          <p className="text-slate-700 mt-1 text-sm font-medium">Have a good day..</p>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-[#8cb8cc] to-transparent pointer-events-none"></div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Customers', value: data.stats.total, icon: Users },
          { label: 'Active', value: data.stats.active, icon: UserCheck },
          { label: 'Suspended', value: data.stats.suspended, icon: UserCog },
          { label: 'Blocked', value: data.stats.blocked, icon: UserCog },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <h3 className="text-base font-semibold text-slate-800 mb-1">{stat.label}</h3>
              <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
            </div>
            <div className="p-3">
              <stat.icon className="w-10 h-10 text-[#1b2b4d]" strokeWidth={1.5} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Table Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm pb-4">
        
        {/* Table Header & Controls */}
        <div className="p-6 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">Customer Management</h3>
          
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
                <option value="suspended">Suspended</option>
                <option value="blocked">Blocked</option>
              </select>
              <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white pointer-events-none" />
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-white pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#f1f5f9] text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Customer ID</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Token UID</th>
                <th className="px-6 py-4">Registration</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Verification</th>
                <th className="px-6 py-4">Tokens</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentCustomers && currentCustomers.length > 0 ? currentCustomers.map((item, index) => (
                <tr key={index} className="hover:bg-slate-50 transition-colors text-slate-600 font-medium">
                  <td className="px-6 py-5">{item.customerId}</td>
                  <td className="px-6 py-5">{item.name}</td>
                  <td className="px-6 py-5">{item.contact}</td>
                  <td className="px-6 py-5">{item.tokenUid}</td>
                  <td className="px-6 py-5">{item.registration}</td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-md text-xs font-semibold capitalize ${
                      item.status?.toLowerCase() === 'active' || item.status?.toLowerCase() === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                      item.status?.toLowerCase() === 'suspended' ? 'bg-slate-200 text-slate-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-md text-xs font-semibold capitalize ${
                      item.verification?.toLowerCase() === 'verified' || item.verification?.toLowerCase() === 'approved' ? 'text-slate-600' :
                      item.verification?.toLowerCase() === 'pending' ? 'bg-orange-100 text-orange-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {item.verification}
                    </span>
                  </td>
                  <td className="px-6 py-5 font-medium text-slate-700">
                    {item.tokens}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-center gap-3">
                      <button 
                        onClick={() => openDrawer(item, 'view')} 
                        className="w-6 h-6 rounded-full border border-blue-400 flex items-center justify-center text-blue-500 hover:bg-blue-50 transition-colors" 
                        title="View"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => openDrawer(item, 'edit')} 
                        className="w-6 h-6 rounded-full bg-[#1b2b4d] flex items-center justify-center text-white hover:bg-slate-800 transition-colors" 
                        title="Edit"
                      >
                        <UserCog className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="9" className="px-6 py-8 text-center text-slate-500">
                    No customers found.
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

      {/* --- SIDE DRAWER (View / Edit Information) --- */}
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
              <h2 className="text-lg font-bold text-slate-800">
                {drawerMode === 'edit' ? 'Edit Customer Information' : 'Customer Information'}
              </h2>
              <button onClick={closeDrawer} className="text-slate-400 hover:text-slate-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-8 overflow-y-auto flex-1 space-y-8">
              
              {/* Form Grid 1 */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2">Customer Name</label>
                  <input 
                    type="text" 
                    name="name"
                    readOnly={drawerMode === 'view'}
                    value={selectedCustomer?.name || ''} 
                    onChange={handleInputChange}
                    className={`w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-700 focus:outline-none ${drawerMode === 'edit' ? 'focus:ring-2 focus:ring-[#1b2b4d]' : 'bg-slate-50'}`} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2">Customer ID</label>
                  <input 
                    type="text" 
                    name="id"
                    readOnly={drawerMode === 'view'}
                    value={selectedCustomer?.id || ''} 
                    onChange={handleInputChange}
                    className={`w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-700 focus:outline-none ${drawerMode === 'edit' ? 'focus:ring-2 focus:ring-[#1b2b4d]' : 'bg-slate-50'}`} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2">Email</label>
                  <input 
                    type="email" 
                    name="email"
                    readOnly={drawerMode === 'view'}
                    value={selectedCustomer?.email || 'N/A'} 
                    onChange={handleInputChange}
                    className={`w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-700 focus:outline-none ${drawerMode === 'edit' ? 'focus:ring-2 focus:ring-[#1b2b4d]' : 'bg-slate-50'}`} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2">Status</label>
                  {drawerMode === 'view' ? (
                    <div className="w-full border border-slate-300 rounded-lg px-4 py-2.5 bg-slate-50 flex items-center">
                      <span className={`px-3 py-1 rounded-md text-xs font-semibold capitalize ${
                        selectedCustomer?.status?.toLowerCase() === 'active' ? 'bg-emerald-100 text-emerald-600' :
                        selectedCustomer?.status?.toLowerCase() === 'suspended' ? 'bg-slate-200 text-slate-600' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {selectedCustomer?.status}
                      </span>
                    </div>
                  ) : (
                    <select 
                      name="status"
                      value={selectedCustomer?.status || 'active'}
                      onChange={handleInputChange}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1b2b4d] bg-white capitalize text-slate-700"
                    >
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Token Information Section */}
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">Token Information</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">Current Token Balance</label>
                    <input 
                      type="text" 
                      name="tokenBalance"
                      readOnly={drawerMode === 'view'}
                      value={selectedCustomer?.tokenBalance ? `$${selectedCustomer.tokenBalance}` : '---'} 
                      onChange={handleInputChange}
                      className={`w-full border border-slate-300 rounded-lg px-4 py-2.5 text-lg text-slate-700 focus:outline-none ${drawerMode === 'edit' ? 'focus:ring-2 focus:ring-[#1b2b4d]' : 'bg-slate-50'}`} 
                    />
                  </div>
                  <div>
                    <p className="block text-sm font-semibold text-slate-800 mb-2">Pre-Mint Requested</p>
                    <p className="text-slate-700 font-medium py-2.5 uppercase">No</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer Buttons */}
            <div className="p-6 border-t border-slate-200 flex justify-end gap-3 bg-slate-50">
              {drawerMode === 'view' ? (
                <button 
                  onClick={() => setDrawerMode('edit')}
                  className="bg-[#1b2b4d] hover:bg-slate-800 text-white px-6 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
                >
                  Edit
                  <UserCog className="w-4 h-4" />
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => setDrawerMode('view')}
                    className="bg-white border border-[#1b2b4d] text-[#1b2b4d] hover:bg-slate-50 px-6 py-2 rounded-xl text-sm font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleUpdate}
                    className="bg-[#1b2b4d] hover:bg-slate-800 text-white px-6 py-2 rounded-xl text-sm font-semibold transition-colors"
                  >
                    Update
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default CustomerManagement;
