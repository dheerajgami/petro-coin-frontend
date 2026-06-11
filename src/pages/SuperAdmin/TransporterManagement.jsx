import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, MoreVertical, Send, Clock, Navigation, MapPin, ChevronLeft, ChevronRight, ArrowLeft, ChevronDown } from 'lucide-react';
import Pagination from '../../components/Pagination';
import { useSelector } from 'react-redux';
import axiosInstance from '../../api/axiosInstance';

const TransporterManagement = () => {
  const { user } = useSelector((state) => state.auth);
  const [currentView, setCurrentView] = useState('list');
  const [selectedJourney, setSelectedJourney] = useState(null);
  const [journeys, setJourneys] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  const itemsPerPage = 10;

  // Normalize data to handle filter/search API mapping
  const normalizeJourney = (item) => ({
    ...item,
    transactionId: item.transactionId || item.transaction_id || item.id || '',
    conductor: item.conductor || item.conductorId || item.conductor_id || '',
    customer: item.customer || item.customerId || item.customer_id || '',
    route: item.route || { boardingPoint: 'N/A', destination: 'N/A' },
    tokensUsed: item.tokensUsed || item.tokens_used || item.amount || 0,
    verification: item.verification || item.verificationStatus || item.verification_status || 'QR Code',
    status: item.status === 'SUCCESS' ? 'Completed' : item.status === 'FAILED' ? 'Failed' : item.status || 'Pending',
    timestamp: item.timestamp || item.createdAt || item.created_at ? new Date(item.timestamp || item.createdAt || item.created_at).toLocaleString() : ''
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleAction = (view, journey) => {
    setSelectedJourney(journey);
    setCurrentView(view);
    setActiveDropdown(null);
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/admin/transporter/dashboard');
      if (res.data?.success) {
        setStats(res.data.data.stats || null);
        setJourneys(res.data.data.journeys || []);
      }
    } catch (err) {
      console.error('Error fetching transporter dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setCurrentPage(1);
    if (!searchQuery.trim()) {
      fetchDashboardData();
      return;
    }
    try {
      setLoading(true);
      const { data } = await axiosInstance.get('/admin/search', {
        params: { q: searchQuery, resource: 'transporters' }
      });
      if (data?.success) {
        setJourneys((data.data || []).map(normalizeJourney));
      }
    } catch (err) {
      console.error('Error searching transporters:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = async (e) => {
    const status = e.target.value;
    setFilterStatus(status);
    setCurrentPage(1);
    if (!status) {
      fetchDashboardData();
      return;
    }
    try {
      setLoading(true);
      const { data } = await axiosInstance.get('/admin/filter', {
        params: { resource: 'transporters', status }
      });
      if (data?.success) {
        setJourneys((data.data || []).map(normalizeJourney));
      }
    } catch (err) {
      console.error('Error filtering transporters:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full mx-auto space-y-6 relative font-sans">
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#e4eff3] to-[#c9d7dc] rounded-xl px-6 py-5 relative overflow-hidden min-h-[70px] flex flex-col justify-center shadow-sm border border-slate-200">
        <div className="relative z-10">
          <h2 className="text-base md:text-lg font-bold text-[#1b2b4d] flex items-center gap-2">
            Welcome Back, Mr. {user?.name?.split(' ')[0] || 'John'} <span className="text-lg">👋</span>
          </h2>
          <p className="text-slate-600 text-xs mt-0.5 font-medium">Have a good day..</p>
        </div>
      </div>

      {currentView === 'list' && renderListView()}
      {currentView === 'details' && selectedJourney && renderDetailsView()}
    </div>
  );

  function renderListView() {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentJourneys = journeys.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(journeys.length / itemsPerPage);

    return (
      <div className="space-y-6">
        {/* Stats Cards */}
      {stats && (
        <div className="flex flex-wrap gap-4">
          {[
            { label: 'Total Transactions', value: stats.totalTransactions },
            { label: 'Completed', value: stats.completed },
            { label: 'Pending Verification', value: stats.pendingVerification },
            { label: 'Tokens Redeemed', value: stats.tokensRedeemed },
            { label: 'Active Conductors', value: stats.activeConductors },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-xl p-5 border border-slate-200 flex flex-col flex-1 min-w-[150px] shadow-sm">
              <div className="text-2xl font-bold text-[#1b2b4d] mb-1">{stat.value}</div>
              <div className="text-xs font-semibold text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

        {/* Table Section */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-800">Transporter Management</h3>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by ID or Driver"
                    className="pl-9 pr-4 py-2.5 border border-slate-300 rounded-l-lg focus:outline-none focus:ring-1 focus:ring-[#1b2b4d] text-sm w-72 transition-shadow bg-white"
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
                  className="appearance-none bg-[#1b2b4d] hover:bg-slate-800 text-white pl-9 pr-9 py-2.5 rounded-lg text-sm font-medium transition-colors focus:outline-none cursor-pointer"
                >
                  <option value="default" disabled hidden>Filter</option>
                  <option value="all">All Statuses</option>
                  <option value="SUCCESS">Success</option>
                  <option value="FAILED">Failed</option>
                </select>
                <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white pointer-events-none" />
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-white pointer-events-none" />
              </div>
            </div>
          </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
              <tr>
                <th className="px-6 py-4 font-semibold">Transaction ID</th>
                <th className="px-6 py-4 font-semibold">Conductor</th>
                <th className="px-6 py-4 font-semibold">Customer</th>
                <th className="px-6 py-4 font-semibold">Route</th>
                <th className="px-6 py-4 font-semibold">Tokens Used</th>
                <th className="px-6 py-4 font-semibold">Verification</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Timestamp</th>
                <th className="px-6 py-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="9" className="text-center py-10 text-slate-500">Loading journeys...</td></tr>
              ) : journeys.length === 0 ? (
                <tr><td colSpan="9" className="text-center py-10 text-slate-500">No journeys found</td></tr>
              ) : (
                currentJourneys.map((journey, index) => (
                  <tr key={index} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-600">{journey.transactionId}</td>
                    <td className="px-6 py-4 font-semibold text-slate-700">{journey.conductor}</td>
                    <td className="px-6 py-4 text-slate-700">{journey.customer}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col text-xs text-slate-500 gap-1.5">
                        <div className="flex items-center gap-1.5"><Navigation className="w-3 h-3 rotate-45 text-slate-400" /> {journey.route?.boardingPoint}</div>
                        <div className="flex items-center gap-1.5"><Clock className="w-3 h-3 text-slate-400" /> {journey.route?.destination}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-blue-50 text-blue-500 px-3 py-1.5 rounded-xl text-xs font-bold">
                        {journey.tokensUsed}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="border border-purple-200 text-purple-600 bg-purple-50 px-3 py-1 rounded-full text-[11px] font-bold">
                        {journey.verification || 'QR Code'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${journey.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-600'}`}>
                        {journey.status === 'Completed' ? '✓ Completed' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{journey.timestamp}</td>
                    <td className="px-6 py-4 text-center relative">
                      <button
                        onClick={() => setActiveDropdown(activeDropdown === journey.transactionId ? null : journey.transactionId)}
                        className="p-1.5 rounded hover:bg-slate-200 text-slate-600 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {activeDropdown === journey.transactionId && (
                        <div className="absolute right-10 top-8 w-40 bg-white border border-slate-200 rounded-lg shadow-xl z-[999] py-1 text-left">
                          <button 
                            onClick={() => handleAction('details', journey)}
                            className="w-full text-left px-4 py-2.5 text-sm text-[#1b2b4d] hover:bg-slate-50 flex items-center gap-3 font-semibold transition-colors"
                          >
                            <Eye className="w-4 h-4 text-slate-400" /> View details
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-slate-200">
          <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            onPageChange={setCurrentPage} 
          />
        </div>
      </div>
      </div>
    );
  }

  function renderDetailsView() {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
          <button onClick={() => setCurrentView('list')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h2 className="text-xl font-bold text-[#1b2b4d]">Journey Details</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 flex flex-col min-h-[220px] relative">
              <div className="flex justify-between items-start w-full">
                <span className={`border text-[11px] font-semibold px-3 py-1 rounded-full uppercase tracking-wide ${selectedJourney.status === 'Completed' ? 'border-green-200 text-green-500 bg-green-50' : 'border-orange-200 text-orange-500 bg-orange-50'}`}>
                  {selectedJourney.status}
                </span>
                <div className="text-right">
                  <div className="text-slate-400 text-[11px] font-medium mb-0.5">Transaction ID</div>
                  <div className="text-[#1b2b4d] font-bold text-sm">{selectedJourney.transactionId}</div>
                </div>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center mt-6">
                <div className="text-slate-400 text-sm font-medium mb-1">Tokens Used</div>
                <div className="text-5xl font-bold text-[#0f172a] tracking-tight">{selectedJourney.tokensUsed}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="text-slate-500 text-sm mb-2">Conductor</div>
                <div className="font-semibold text-[#1b2b4d] text-lg">{selectedJourney.conductor}</div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="text-slate-500 text-sm mb-2">Customer</div>
                <div className="font-semibold text-[#1b2b4d] text-lg">{selectedJourney.customer}</div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-semibold text-[#1b2b4d] mb-4">Route Details</h3>
              <div className="flex items-center gap-6">
                <div className="flex-1 bg-slate-50 rounded-lg p-4 border border-slate-100 flex items-center gap-3">
                  <Navigation className="w-5 h-5 rotate-45 text-blue-500" />
                  <div>
                    <div className="text-xs text-slate-500 font-medium">Boarding Point</div>
                    <div className="text-sm font-semibold text-[#1b2b4d] mt-0.5">{selectedJourney.route?.boardingPoint}</div>
                  </div>
                </div>
                <div className="flex-1 bg-slate-50 rounded-lg p-4 border border-slate-100 flex items-center gap-3">
                  <Clock className="w-5 h-5 text-emerald-500" />
                  <div>
                    <div className="text-xs text-slate-500 font-medium">Destination</div>
                    <div className="text-sm font-semibold text-[#1b2b4d] mt-0.5">{selectedJourney.route?.destination}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-[#1b2b4d] mb-4">Journey Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <span className="text-slate-500 text-sm">Timestamp</span>
                  <span className="font-semibold text-slate-800 text-sm">{selectedJourney.timestamp}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <span className="text-slate-500 text-sm">Tokens Used</span>
                  <span className="font-bold text-blue-600 text-sm">{selectedJourney.tokensUsed} TOKENS</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <span className="text-slate-500 text-sm">Verification</span>
                  <span className="font-semibold text-purple-600 text-sm">{selectedJourney.verification}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm">Status</span>
                  <span className="font-semibold text-slate-800 text-sm">{selectedJourney.status}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default TransporterManagement;
