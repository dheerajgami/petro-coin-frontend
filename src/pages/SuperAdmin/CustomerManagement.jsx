import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, UserCog, UserCheck, Users, X, ChevronDown, Trash2 } from 'lucide-react';
import Pagination from '../../components/Pagination';
import { useSelector } from 'react-redux';
import axiosInstance from '../../api/axiosInstance';

// Helper Components & Functions
const getRegistrationDate = (item) => {
  if (item.registration) return item.registration;
  if (item.createdAt) return new Date(item.createdAt).toISOString().split('T')[0];
  return '';
};

/* eslint-disable react/prop-types */
const StatusBadge = ({ status }) => {
  const styles = {
    active: 'bg-emerald-100 text-emerald-600',
    approved: 'bg-emerald-100 text-emerald-600',
    suspended: 'bg-slate-200 text-slate-600',
    default: 'bg-red-100 text-red-600'
  };
  const className = styles[status?.toLowerCase()] || styles.default;
  return (
    <span className={`px-3 py-1 rounded-md text-xs font-semibold capitalize ${className}`}>
      {status}
    </span>
  );
};

const VerificationBadge = ({ verification }) => {
  const styles = {
    verified: 'text-slate-600',
    approved: 'text-slate-600',
    pending: 'bg-orange-100 text-orange-600',
    default: 'bg-red-100 text-red-600'
  };
  const className = styles[verification?.toLowerCase()] || styles.default;
  return (
    <span className={`px-3 py-1 rounded-md text-xs font-semibold capitalize ${className}`}>
      {verification}
    </span>
  );
};

// Normalize customer data - maps filter/search API field names to table field names
const normalizeCustomer = (item) => ({
  customerId: item.customerId || item.customer_id || '',
  name: item.name || item.full_name || '',
  contact: item.contact || item.mobile || item.mobile_number || item.phone || '',
  tokenUid: item.tokenUid || item.token_uid || item.tokenUID || '',
  registration: getRegistrationDate(item),
  status: item.status || '',
  verification: item.verification || item.kycStatus || item.verification_status || '',
  tokens: item.tokens ?? item.tokenBalance ?? item.token_balance ?? '',
  email: item.email || '',
});
/* eslint-enable react/prop-types */

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

  const [searchQuery, setSearchQuery] = useState('');

  // Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState('view'); // 'view' | 'edit'
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  const itemsPerPage = 10;

  // Token Modal State
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [selectedTokenDetails, setSelectedTokenDetails] = useState(null);


  // Fetch API Data
  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/admin/dashboard');
      if (response.data?.success) {
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

  const handleTokenClick = (transferData) => {
    setSelectedTokenDetails(transferData);
    setIsTokenModalOpen(true);
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

      if (response.data?.success) {
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

  const handleDeleteCustomer = async (customerId) => {
    if (!globalThis.confirm(`Are you sure you want to delete customer ${customerId}?`)) return;
    try {
      const response = await axiosInstance.delete(`/admin/users/${customerId}`);
      if (response.data?.success) {
        alert("Customer deleted successfully.");
        fetchCustomerData();
      }
    } catch (err) {
      console.error("Failed to delete customer:", err);
      alert(err.response?.data?.message || "Failed to delete customer.");
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
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex items-center justify-between hover:shadow-md transition-shadow">
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
              {currentCustomers && currentCustomers.length > 0 ? currentCustomers.map((item) => (
                <tr key={item.customerId} className="hover:bg-slate-50 transition-colors text-slate-600 font-medium">
                  <td className="px-6 py-5">{item.customerId}</td>
                  <td className="px-6 py-5">{item.name}</td>
                  <td className="px-6 py-5">{item.contact}</td>
                  <td className="px-6 py-5">{item.tokenUid}</td>
                  <td className="px-6 py-5">{item.registration}</td>
                  <td className="px-6 py-5">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-6 py-5">
                    <VerificationBadge verification={item.verification} />
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
                      <button
                        onClick={() => handleDeleteCustomer(item.customerId)}
                        className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-red-600 hover:bg-red-200 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
          {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeDrawer}
            aria-hidden="true"
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
                  <label htmlFor="drawer-name" className="block text-sm font-semibold text-slate-800 mb-2">Customer Name</label>
                  <input
                    id="drawer-name"
                    type="text"
                    name="name"
                    readOnly={drawerMode === 'view'}
                    value={selectedCustomer?.name || ''}
                    onChange={handleInputChange}
                    className={`w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-700 focus:outline-none ${drawerMode === 'edit' ? 'focus:ring-2 focus:ring-[#1b2b4d]' : 'bg-slate-50'}`}
                  />
                </div>
                <div>
                  <label htmlFor="drawer-id" className="block text-sm font-semibold text-slate-800 mb-2">Customer ID</label>
                  <input
                    id="drawer-id"
                    type="text"
                    name="id"
                    readOnly={drawerMode === 'view'}
                    value={selectedCustomer?.id || ''}
                    onChange={handleInputChange}
                    className={`w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-700 focus:outline-none ${drawerMode === 'edit' ? 'focus:ring-2 focus:ring-[#1b2b4d]' : 'bg-slate-50'}`}
                  />
                </div>
                <div>
                  <label htmlFor="drawer-email" className="block text-sm font-semibold text-slate-800 mb-2">Email</label>
                  <input
                    id="drawer-email"
                    type="email"
                    name="email"
                    readOnly={drawerMode === 'view'}
                    value={selectedCustomer?.email || 'N/A'}
                    onChange={handleInputChange}
                    className={`w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-700 focus:outline-none ${drawerMode === 'edit' ? 'focus:ring-2 focus:ring-[#1b2b4d]' : 'bg-slate-50'}`}
                  />
                </div>
                <div>
                  {drawerMode === 'view' ? (
                    <p className="block text-sm font-semibold text-slate-800 mb-2">Status</p>
                  ) : (
                    <label htmlFor="drawer-status" className="block text-sm font-semibold text-slate-800 mb-2">Status</label>
                  )}
                  {drawerMode === 'view' ? (
                    <div className="w-full border border-slate-300 rounded-lg px-4 py-2.5 bg-slate-50 flex items-center">
                      <StatusBadge status={selectedCustomer?.status} />
                    </div>
                  ) : (
                    <select
                      id="drawer-status"
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
                    <label htmlFor="drawer-tokenBalance" className="block text-sm font-semibold text-slate-800 mb-2">Current Token Balance</label>
                    <input
                      id="drawer-tokenBalance"
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

                {/* Token Transfer Activity Table */}
                <div className="mt-8">
                  <div className="flex justify-between items-end mb-4 pb-2 border-b border-slate-100">
                    <h4 className="text-sm font-bold text-slate-800">Live Token Transfers</h4>
                    <span className="text-xs text-slate-500 font-semibold bg-emerald-50 border border-emerald-100 text-emerald-600 px-3 py-1 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Live Updates
                    </span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm max-h-[350px] overflow-y-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-[#f8fafc] text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-10">
                        <tr>
                          <th className="px-6 py-4">Date/Time</th>
                          <th className="px-6 py-4">Token ID</th>
                          <th className="px-6 py-4">Token Details</th>
                          <th className="px-6 py-4">Transferred By</th>
                          <th className="px-6 py-4">Value</th>
                          <th className="px-6 py-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {/* Fallback mock data since no live transfer API yet */}
                        {[
                          { id: 'TXN-8841', tokenId: 'TKN-667385RN620010', tokenName: 'Pre-minted Token', tokenType: 'Pre-minted', date: '2026-06-16 14:30', counterparty: 'Reliance Petrol Pump', counterpartyId: 'mer0001', amount: '0.50 L', status: 'Completed' },
                          { id: 'TXN-9120', tokenId: 'TKN-998245RX440021', tokenName: 'Dynamic Token', tokenType: 'Dynamic', date: '2026-06-15 10:12', counterparty: 'HP Downtown Branch', counterpartyId: 'mer0023', amount: '1.00 L', status: 'Completed' },
                          { id: 'TXN-7742', tokenId: 'TKN-112345RN110055', tokenName: 'Pre-minted Token', tokenType: 'Pre-minted', date: '2026-06-10 09:15', counterparty: 'Indian Oil Station 5', counterpartyId: 'mer0056', amount: '2.50 L', status: 'Completed' }
                        ].map((tx, idx) => (
                          <tr 
                            key={idx} 
                            onClick={() => handleTokenClick(tx)}
                            className="hover:bg-slate-50 transition-colors text-slate-600 font-medium cursor-pointer"
                          >
                            <td className="px-6 py-4 text-slate-500 text-xs">{tx.date}</td>
                            <td className="px-6 py-4 font-bold text-slate-800">{tx.tokenId}</td>
                            <td className="px-6 py-4">
                              <p className="font-bold text-slate-900">{tx.tokenName}</p>
                              <p className={`text-xs font-semibold mt-1 inline-block px-2 py-0.5 rounded-full border ${tx.tokenType === 'Pre-minted' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-purple-50 text-purple-600 border-purple-100'}`}>
                                {tx.tokenType}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-bold text-slate-800">{tx.counterparty}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{tx.counterpartyId}</p>
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-900 text-base">{tx.amount}</td>
                            <td className="px-6 py-4">
                              <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1.5 rounded-full font-semibold text-xs flex items-center gap-1.5 w-max">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                {tx.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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

      {/* --- TOKEN DETAILS MODAL (Pop-up on row click) --- */}
      {isTokenModalOpen && selectedTokenDetails && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsTokenModalOpen(false)}></div>
          <div className="relative w-full max-w-[600px] bg-white rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#f8fafc] rounded-t-2xl">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Token Transfer Details</h2>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">Transfer ID: {selectedTokenDetails.id}</p>
              </div>
              <button onClick={() => setIsTokenModalOpen(false)} className="text-slate-400 hover:text-slate-700 bg-white rounded-full p-1 shadow-sm transition-colors border border-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Token Details</p>
                  <p className="text-lg font-bold text-slate-900">{selectedTokenDetails.tokenName}</p>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold mt-1 border ${selectedTokenDetails.tokenType === 'Pre-minted' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-purple-50 text-purple-600 border-purple-100'}`}>
                    {selectedTokenDetails.tokenType}
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Transferred By</p>
                  <p className="text-lg font-bold text-slate-900">{selectedTokenDetails.counterparty}</p>
                  <p className="text-sm text-slate-500 font-medium mt-0.5">{selectedTokenDetails.counterpartyId}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-2">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Date / Time</p>
                  <p className="text-sm font-bold text-slate-900">{selectedTokenDetails.date}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Amount</p>
                  <p className="text-lg font-bold text-slate-900">{selectedTokenDetails.amount}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mt-1 ${selectedTokenDetails.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                    {selectedTokenDetails.status}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end">
              <button onClick={() => setIsTokenModalOpen(false)} className="bg-[#1b2b4d] hover:bg-slate-800 text-white px-6 py-2 rounded-lg text-sm font-semibold transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CustomerManagement;
