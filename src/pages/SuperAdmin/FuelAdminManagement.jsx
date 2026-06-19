import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, X, ChevronDown, Plus, Fuel, User, MapPin
} from 'lucide-react';
import { useSelector } from 'react-redux';
import Pagination from '../../components/Pagination';
import axiosInstance from '../../api/axiosInstance';

const dummyData = [
  { id: 'ST001', name: 'Station Alpha', location: 'Downtown, Main Street', admin: 'John Smith', contact: 'alpha@fuel.com\n+1 234-567-8901', inventory: '15,000L', status: 'Active' },
  { id: 'ST002', name: 'Station Beta', location: 'Westside, Oak Avenue', admin: 'Sarah Johnson', contact: 'beta@fuel.com\n+1 234-567-8901', inventory: '12,500L', status: 'Active' },
  { id: 'ST003', name: 'Station Gamma', location: 'Eastside, Pine Road', admin: 'Mike Davis', contact: 'gamma@fuel.com\n+1 234-567-8901', inventory: '18,200L', status: 'Active' },
  { id: 'ST004', name: 'Station Delta', location: 'Northside, Elm Street', admin: 'Emily Brown', contact: 'delta@fuel.com\n+1 234-567-8901', inventory: '8,500L', status: 'Active' },
  { id: 'ST005', name: 'Station Delta', location: 'Northside, Elm Street', admin: 'Emily Brown', contact: 'delta@fuel.com\n+1 234-567-8901', inventory: '8,500L', status: 'Active' },
];

const dummyOutlets = [
  { id: 'DFS-001', name: 'Station Alpha', status: 'Active', lastActive: 'Now', address: 'Sector 14, Gurugram', contactPerson: 'Rajesh Kumar', phone: '+91 98765 43210', totalTokens: '12,450', totalRevenue: '₹4,50,000' },
  { id: 'DFS-002', name: 'Station Beta', status: 'Active', lastActive: '10 mins ago', address: 'Connaught Place, Delhi', contactPerson: 'Anita Singh', phone: '+91 98765 43211', totalTokens: '8,900', totalRevenue: '₹3,20,000' },
  { id: 'DFS-003', name: 'Station Gamma', status: 'Maintenance', lastActive: '2 hours ago', address: 'Salt Lake, Kolkata', contactPerson: 'Subhash Bose', phone: '+91 98765 43212', totalTokens: '7,200', totalRevenue: '₹2,80,000' },
];

const dummyTokenActivity = [
  { txId: 'TXN001', type: 'Redemption', outlet: 'Station Alpha', amount: '500 tokens', fuel: '15L', time: '2026-01-21 14:30', status: 'Completed' },
  { txId: 'TXN002', type: 'Redemption', outlet: 'Station Beta', amount: '200 tokens', fuel: '100L', time: '2026-01-21 14:30', status: 'Completed' },
  { txId: 'TXN003', type: 'Redemption', outlet: 'Station Gamma', amount: '750 tokens', fuel: '150L', time: '2026-01-21 14:30', status: 'Completed' },
];

const dummyTransactions = [
  { txId: 'TXN20240521001', customer: 'John Doe', outlet: 'Station Alpha', type: 'Redemption', fuel: '50L', tokens: '500', amount: '$65.00', time: '2024-05-21 14:32:15', status: 'Completed' },
  { txId: 'TXN20240521002', customer: 'Jane Smith', outlet: 'Station Beta', type: 'Redemption', fuel: '30L', tokens: '300', amount: '$39.00', time: '2024-05-21 14:28:42', status: 'Completed' },
  { txId: 'TXN20240521003', customer: 'Mike Johnson', outlet: 'Station Gamma', type: 'Redemption', fuel: '75L', tokens: '750', amount: '$97.50', time: '2024-05-21 14:15:33', status: 'Completed' },
];

const FuelAdminManagement = () => {
  const { user } = useSelector((state) => state.auth);

  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [stations, setStations] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalAdmin: 0,
    totalOutlets: 0,
    todaysTransactions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/admin/stations');
      if (response.data?.success) {
        setStations(response.data.data.stations || []);
        setDashboardStats({
          totalAdmin: response.data.data.totalAdmin || 0,
          totalOutlets: response.data.data.totalOutlets || 0,
          todaysTransactions: response.data.data.todaysTransactions || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching stations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStations = stations.filter(s => 
    s.stationId?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.stationName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentStations = filteredStations.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredStations.length / itemsPerPage) || 1;

  // Modals
  const [selectedStation, setSelectedStation] = useState(null);
  const [activeTab, setActiveTab] = useState('Outlets');
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isAddStationOpen, setIsAddStationOpen] = useState(false);

  const [outlets, setOutlets] = useState([]);
  const [loadingOutlets, setLoadingOutlets] = useState(false);
  const [stationDetails, setStationDetails] = useState(null);

  const [outletsSearch, setOutletsSearch] = useState('');
  const [tokenSearch, setTokenSearch] = useState('');
  const [transactionSearch, setTransactionSearch] = useState('');

  const [toastInfo, setToastInfo] = useState({ show: false, message: '' });

  const showFeatureToast = (featureName) => {
    setToastInfo({ show: true, message: `${featureName} feature will be available in the next update!` });
    setTimeout(() => setToastInfo({ show: false, message: '' }), 3000);
  };

  const filteredOutlets = outlets.filter(o => 
    o.stationId?.toLowerCase().includes(outletsSearch.toLowerCase()) || 
    o.stationName?.toLowerCase().includes(outletsSearch.toLowerCase())
  );

  const filteredTokenActivity = (stationDetails?.tokenActivity || []).filter(t => 
    t.txId?.toLowerCase().includes(tokenSearch.toLowerCase()) ||
    t.outlet?.toLowerCase().includes(tokenSearch.toLowerCase())
  );

  const filteredTransactions = (stationDetails?.transactions || []).filter(t => 
    t.txId?.toLowerCase().includes(transactionSearch.toLowerCase()) ||
    t.outlet?.toLowerCase().includes(transactionSearch.toLowerCase())
  );

  const [newStation, setNewStation] = useState({
    stationLegalName: '',
    physicalLocation: '',
    internalStationId: '',
    officialContactNumber: '',
    stationManagerName: '',
    detailedAddress: ''
  });
  const [isSubmittingStation, setIsSubmittingStation] = useState(false);
  const [stationError, setStationError] = useState('');

  const fetchOutlets = async (stationId) => {
    try {
      setLoadingOutlets(true);
      const response = await axiosInstance.get(`/admin/managed-outlets/${stationId}`);
      if (response.data?.success) {
        const data = response.data.data;
        if (data) {
          setStationDetails(data);
          const formattedOutlet = {
            stationId: data.stationId,
            stationName: data.stationName,
            status: data.stationStatus || 'active',
            lastActivity: data.lastActivity,
            location: data.locationInformation?.address,
            admin: data.admin || 'N/A',
            phone: data.locationInformation?.phone,
            totalTokens: data.tokensBurnedToday || '0',
            totalRevenue: data.totalRevenueToday || '0'
          };
          setOutlets([formattedOutlet]);
        } else {
          setOutlets([]);
        }
      }
    } catch (error) {
      console.error('Error fetching outlets:', error);
      setOutlets([]);
    } finally {
      setLoadingOutlets(false);
    }
  };

  const handleCreateStation = async (e) => {
    e.preventDefault();
    setStationError('');
    setIsSubmittingStation(true);
    try {
      const response = await axiosInstance.post('/admin/managed-outlets', newStation);
      if (response.data?.success) {
        setIsAddStationOpen(false);
        setNewStation({
          stationLegalName: '',
          physicalLocation: '',
          internalStationId: '',
          officialContactNumber: '',
          stationManagerName: '',
          detailedAddress: ''
        });
        fetchStations(); // Refresh main table just in case it appears there
      } else {
        setStationError(response.data?.message || 'Failed to create outlet.');
      }
    } catch (err) {
      console.error('Error creating outlet:', err);
      setStationError(err.response?.data?.message || 'An error occurred.');
    } finally {
      setIsSubmittingStation(false);
    }
  };

  // Handlers
  const handleManageClick = (station) => {
    setSelectedStation(station);
    setActiveTab('Outlets');
    setIsManageModalOpen(true);
    fetchOutlets(station.stationId);
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-sm font-bold text-slate-800">Total Admin</h3>
          <p className="text-3xl font-black text-[#1b2b4d] mt-2">{dashboardStats.totalAdmin}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-sm font-bold text-slate-800">Total Outlets</h3>
          <p className="text-3xl font-black text-[#1b2b4d] mt-2">{dashboardStats.totalOutlets}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-sm font-bold text-slate-800">Today's Transactions</h3>
          <p className="text-3xl font-black text-[#1b2b4d] mt-2">{dashboardStats.todaysTransactions}</p>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 w-full lg:w-auto flex-1 max-w-2xl">
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
          <button onClick={() => showFeatureToast('Advanced Search')} className="bg-[#1b2b4d] hover:bg-slate-800 text-white px-6 py-2 rounded-lg text-sm font-semibold transition-colors">
            Search
          </button>
          <button onClick={() => showFeatureToast('Advanced Filter')} className="bg-[#1b2b4d] hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
            Filter <Filter className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
          <button 
            onClick={() => setIsAddStationOpen(true)}
            className="bg-[#1b2b4d] hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center shadow-sm"
          >
            Add New Station
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#f8fafc] text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Station ID</th>
                <th className="px-6 py-4">Station Name</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Admin</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Inventory</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-slate-500">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1b2b4d]"></div>
                    </div>
                  </td>
                </tr>
              ) : currentStations.length > 0 ? (
                currentStations.map((item, index) => (
                  <tr key={item.stationId || index} className="hover:bg-slate-50/50 transition-colors text-slate-600 font-medium">
                    <td className="px-6 py-5 text-slate-900 font-bold">{item.stationId}</td>
                    <td className="px-6 py-5 text-slate-900 font-bold">{item.stationName}</td>
                    <td className="px-6 py-5">{item.location}</td>
                    <td className="px-6 py-5">{item.admin || 'N/A'}</td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col text-xs font-semibold">
                        <span className="text-slate-800">{item.email}</span>
                        <span className="text-slate-400 mt-0.5">{item.phone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 font-bold text-blue-500">{item.inventory} L</td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${item.status?.toLowerCase() === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
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
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-slate-500">
                    No stations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-slate-200 bg-white">
          <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            onPageChange={setCurrentPage} 
          />
        </div>
      </div>

      {/* --- MODAL 1: ADD NEW STATION --- */}
      {isAddStationOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAddStationOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Add New Station</h3>
                <p className="text-xs text-slate-500 mt-0.5">Configure and onboard a new Digital Fuel Station unit</p>
              </div>
              <button onClick={() => setIsAddStationOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateStation} className="px-6 pb-6 space-y-4">
              {stationError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs font-semibold">
                  {stationError}
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Station Legal Name</label>
                <input required type="text" value={newStation.stationLegalName} onChange={(e) => setNewStation({...newStation, stationLegalName: e.target.value})} placeholder="Station Gamma" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-[#1b2b4d] text-sm font-semibold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Physical Location</label>
                <input required type="text" value={newStation.physicalLocation} onChange={(e) => setNewStation({...newStation, physicalLocation: e.target.value})} placeholder="City State" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-[#1b2b4d] text-sm font-semibold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Internal Station ID (DFS-XXX)</label>
                <input required type="text" value={newStation.internalStationId} onChange={(e) => setNewStation({...newStation, internalStationId: e.target.value})} placeholder="DFS-006" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-[#1b2b4d] text-sm font-semibold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Official Contact Number</label>
                <input required type="text" value={newStation.officialContactNumber} onChange={(e) => setNewStation({...newStation, officialContactNumber: e.target.value})} placeholder="+91-XXXXXXXXX" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-[#1b2b4d] text-sm font-semibold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Station Manager Name</label>
                <input required type="text" value={newStation.stationManagerName} onChange={(e) => setNewStation({...newStation, stationManagerName: e.target.value})} placeholder="Full Name" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-[#1b2b4d] text-sm font-semibold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Address</label>
                <textarea required value={newStation.detailedAddress} onChange={(e) => setNewStation({...newStation, detailedAddress: e.target.value})} placeholder="Complete Address" rows="3" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-[#1b2b4d] text-sm font-semibold resize-none"></textarea>
              </div>
              <button 
                type="submit"
                disabled={isSubmittingStation}
                className="w-full bg-[#1b2b4d] hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition-colors shadow-sm mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSubmittingStation ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  'Create Station'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: MANAGE STATION --- */}
      {isManageModalOpen && selectedStation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsManageModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            
            {/* Header */}
            <div className="px-6 py-5 bg-white flex items-center justify-between shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <User className="w-6 h-6 text-[#1b2b4d]" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-slate-800">{selectedStation.name}</h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">{selectedStation.status}</span>
                  </div>
                  <p className="text-sm text-slate-500 font-medium">{selectedStation.location}</p>
                </div>
              </div>
              <button onClick={() => setIsManageModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 bg-white px-6 overflow-x-auto shrink-0 justify-between">
              {['Outlets', 'Token Activity', 'Transactions', 'Inventory'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-2 font-bold text-sm relative transition-colors ${
                    activeTab === tab 
                      ? 'text-emerald-600' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-6 overflow-y-auto flex-1 bg-white min-h-[400px]">
              
              {activeTab === 'Outlets' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-bold text-slate-800">Managed Outlets</h4>
                    <button 
                      onClick={() => setIsAddStationOpen(true)}
                      className="bg-[#1b2b4d] hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                    >
                      Add New Outlet
                    </button>
                  </div>

                  <div className="flex items-center gap-3 w-full">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Search by ID" 
                        className="pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-[#1b2b4d] text-sm w-full font-semibold"
                        value={outletsSearch}
                        onChange={(e) => setOutletsSearch(e.target.value)}
                      />
                    </div>
                    <button onClick={() => showFeatureToast('Outlets Search')} className="bg-[#1b2b4d] hover:bg-slate-800 transition-colors text-white px-6 py-2.5 rounded-lg text-sm font-semibold">Search</button>
                    <button onClick={() => showFeatureToast('Outlets Filter')} className="bg-[#1b2b4d] hover:bg-slate-800 transition-colors text-white px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2">
                      Filter <Filter className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {loadingOutlets ? (
                      <div className="col-span-3 flex justify-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1b2b4d]"></div>
                      </div>
                    ) : filteredOutlets.length > 0 ? (
                      filteredOutlets.map((outlet, idx) => (
                        <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <h5 className="font-bold text-slate-800 text-sm">{outlet.stationName}</h5>
                              <p className="text-xs text-slate-400">{outlet.stationId}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <span className="text-slate-400 mb-1 block">Status</span>
                              <span className={`px-2 py-0.5 rounded font-bold capitalize ${outlet.status?.toLowerCase() === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
                                {outlet.status}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 mb-1 block">Last Active</span>
                              <span className="font-semibold text-slate-800">
                                {outlet.lastActivity ? new Date(outlet.lastActivity).toLocaleDateString() : 'N/A'}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2 text-xs font-semibold text-slate-600 pt-3 border-t border-slate-100">
                            <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {outlet.location || 'N/A'}</p>
                            <p className="flex items-center gap-2"><User className="w-3.5 h-3.5 text-slate-400" /> {outlet.admin || 'N/A'}</p>
                            <p className="flex items-center gap-2"><svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg> {outlet.phone || 'N/A'}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                            <div>
                              <span className="text-slate-400 text-xs block">Total Tokens</span>
                              <p className="font-black text-slate-800 text-sm mt-0.5">{outlet.totalTokens || '0'}</p>
                            </div>
                            <div>
                              <span className="text-slate-400 text-xs block">Total Revenue</span>
                              <p className="font-black text-slate-800 text-sm mt-0.5">₹{outlet.totalRevenue || '0'}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-3 text-center text-slate-500 py-10">
                        No outlets found.
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-center mt-6">
                    <Pagination currentPage={1} totalPages={10} onPageChange={() => {}} />
                  </div>
                </div>
              )}

              {activeTab === 'Token Activity' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 w-full">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Search by ID" 
                        className="pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-[#1b2b4d] text-sm w-full font-semibold"
                        value={tokenSearch}
                        onChange={(e) => setTokenSearch(e.target.value)}
                      />
                    </div>
                    <button onClick={() => showFeatureToast('Token Search')} className="bg-[#1b2b4d] hover:bg-slate-800 transition-colors text-white px-6 py-2.5 rounded-lg text-sm font-semibold">Search</button>
                    <button onClick={() => showFeatureToast('Token Filter')} className="bg-[#1b2b4d] hover:bg-slate-800 transition-colors text-white px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2">
                      Filter <Filter className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="bg-slate-50/50 rounded-xl border border-slate-200 overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-[#f8fafc] text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-4">Transaction ID</th>
                          <th className="px-6 py-4">Type</th>
                          <th className="px-6 py-4">Outlet</th>
                          <th className="px-6 py-4">Amount</th>
                          <th className="px-6 py-4">Fuel</th>
                          <th className="px-6 py-4">Time/Date</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {filteredTokenActivity.length > 0 ? (
                          filteredTokenActivity.map((act, idx) => (
                            <tr key={idx} className="bg-white hover:bg-slate-50">
                              <td className="px-6 py-4 text-slate-900 font-semibold">{act.txId}</td>
                              <td className="px-6 py-4 text-blue-500 font-semibold">{act.type}</td>
                              <td className="px-6 py-4 text-slate-800 font-bold">{act.outlet}</td>
                              <td className="px-6 py-4 text-slate-600">{act.amount}</td>
                              <td className="px-6 py-4 text-slate-600">{act.fuel}</td>
                              <td className="px-6 py-4 text-slate-500">{act.time}</td>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-max ${act.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-orange-50 text-orange-600 border border-orange-100'}`}>
                                  {act.status === 'Completed' && '✓'} {act.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <button onClick={() => showFeatureToast('Manage Token')} className="text-blue-500 hover:text-blue-700 transition-colors hover:underline font-semibold">Manage</button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="8" className="px-6 py-8 text-center text-slate-500">
                              No token activity found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-center mt-6">
                    <Pagination currentPage={1} totalPages={10} onPageChange={() => {}} />
                  </div>
                </div>
              )}

              {activeTab === 'Transactions' && (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
                      <h4 className="text-sm font-bold text-slate-800">Total Revenue (Today)</h4>
                      <p className="text-3xl font-black text-slate-900 mt-2">{stationDetails?.totalRevenueToday || '$0.00'}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
                      <h4 className="text-sm font-bold text-slate-800">Tokens Burned Today</h4>
                      <p className="text-3xl font-black text-slate-900 mt-2">{stationDetails?.tokensBurnedToday || '0'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Search by ID" 
                        className="pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-[#1b2b4d] text-sm w-full font-semibold"
                        value={transactionSearch}
                        onChange={(e) => setTransactionSearch(e.target.value)}
                      />
                    </div>
                    <button onClick={() => showFeatureToast('Transaction Search')} className="bg-[#1b2b4d] hover:bg-slate-800 transition-colors text-white px-6 py-2.5 rounded-lg text-sm font-semibold">Search</button>
                    <button onClick={() => showFeatureToast('Transaction Filter')} className="bg-[#1b2b4d] hover:bg-slate-800 transition-colors text-white px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2">
                      Filter <Filter className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="bg-slate-50/50 rounded-xl border border-slate-200 overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-[#f8fafc] text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-4">Transaction ID</th>
                          <th className="px-6 py-4">Customer</th>
                          <th className="px-6 py-4">Outlet</th>
                          <th className="px-6 py-4">Type</th>
                          <th className="px-6 py-4">Fuel Amount</th>
                          <th className="px-6 py-4">Tokens</th>
                          <th className="px-6 py-4">Amount</th>
                          <th className="px-6 py-4">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {filteredTransactions.length > 0 ? (
                          filteredTransactions.map((txn, idx) => (
                            <tr key={idx} className="bg-white hover:bg-slate-50">
                              <td className="px-6 py-4 text-slate-600">{txn.txId}</td>
                              <td className="px-6 py-4 text-slate-900 font-bold">{txn.customer}</td>
                              <td className="px-6 py-4 text-slate-600">{txn.outlet}</td>
                              <td className="px-6 py-4">
                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-500 border border-red-100">{txn.type}</span>
                              </td>
                              <td className="px-6 py-4 text-slate-900 font-bold">{txn.fuel}</td>
                              <td className="px-6 py-4 text-blue-500 font-bold">{txn.tokens}</td>
                              <td className="px-6 py-4 text-slate-900 font-bold">{txn.amount}</td>
                              <td className="px-6 py-4 text-slate-500">{txn.time}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="8" className="px-6 py-8 text-center text-slate-500">
                              No transactions found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-center mt-6">
                    <Pagination currentPage={1} totalPages={10} onPageChange={() => {}} />
                  </div>
                </div>
              )}

              {activeTab === 'Inventory' && (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
                      <h4 className="text-sm font-bold text-slate-800">Total Available Fuel</h4>
                      <p className="text-3xl font-black text-slate-900 mt-2">{stationDetails?.inventory?.overview?.totalAvailableFuel || '0L'}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
                      <h4 className="text-sm font-bold text-slate-800">Redeemed (This Month)</h4>
                      <p className="text-3xl font-black text-slate-900 mt-2">{stationDetails?.inventory?.overview?.redeemedThisMonth || '0L'}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
                      <h4 className="text-sm font-bold text-slate-800">Reserved</h4>
                      <p className="text-3xl font-black text-slate-900 mt-2">{stationDetails?.inventory?.overview?.reservedFuel || '0L'}</p>
                    </div>
                  </div>

                  {/* Token Inventory by Outlet Section */}
                  <div className="space-y-4 pt-4">
                    <h4 className="text-base font-bold text-slate-800">Token Inventory by Outlet</h4>
                    
                    {(stationDetails?.inventory?.outletsInventory || []).length > 0 ? (
                      (stationDetails?.inventory?.outletsInventory || []).map((inv, idx) => (
                        <div key={idx} className="space-y-3 pt-2">
                          <div className="text-sm font-bold text-slate-800">{idx + 1}. {inv.name}</div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                              <span className="text-slate-800 font-bold text-sm">Available</span>
                              <p className="text-2xl font-bold mt-1 text-blue-500">{inv.available || '0L'}</p>
                            </div>
                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                              <span className="text-slate-800 font-bold text-sm">Redeemed Today</span>
                              <p className="text-2xl font-bold mt-1 text-orange-500">{inv.redeemedToday || '0L'}</p>
                            </div>
                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                              <span className="text-slate-800 font-bold text-sm">Reserved</span>
                              <p className="text-2xl font-bold mt-1 text-[#8b5cf6]">{inv.reserved || '0L'}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-slate-500 text-center py-6">
                        No outlet inventory data available.
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-center pt-8 pb-4">
                    <Pagination currentPage={1} totalPages={10} onPageChange={() => {}} />
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastInfo.show && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-[#1b2b4d] text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-top-5 fade-in duration-300 z-[100]">
          <div className="flex flex-col">
            <h4 className="font-bold text-sm">Action Registered</h4>
            <p className="text-xs text-blue-100 mt-0.5">{toastInfo.message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FuelAdminManagement;
