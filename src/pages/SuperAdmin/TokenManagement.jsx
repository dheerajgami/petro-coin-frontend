import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, Eye, ChevronLeft, ChevronRight, X, ArrowRightLeft, AlertTriangle, Flame, Box, Calendar, Copy, Check, Info, ChevronDown } from 'lucide-react';
import Pagination from '../../components/Pagination';
import { useSelector } from 'react-redux';
import axiosInstance from '../../api/axiosInstance';

const DotsIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>;
const HexagonIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><circle cx="12" cy="12" r="3"/></svg>;

const TokenManagement = () => {
  const { user } = useSelector((state) => state.auth);

  const [tokens, setTokens] = useState([]);
  const [stats, setStats] = useState({
    totalTokens: 0,
    activeTokens: 0,
    redeemedTokens: 0,
    lostStolenTokens: 0,
    totalValue: 0,
    issuedThisMonth: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [activeDropdown, setActiveDropdown] = useState(null);
  const [modalType, setModalType] = useState(null); // 'details', 'transfer', 'lost', 'burn'
  const [selectedToken, setSelectedToken] = useState(null);
  const dropdownRef = useRef(null);

  // States for Modals
  const [copied, setCopied] = useState(false);
  const [transferData, setTransferData] = useState({ email: '', quantity: '', notes: '' });
  const [lostData, setLostData] = useState({ type: 'Lost', date: '', location: '', description: '', reportedBy: 'Admin User' });
  const [burnData, setBurnData] = useState({ quantity: '', reason: 'Fraudulent Activity', date: '', description: '' });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchQuery.trim()) params.search = searchQuery;
      if (filterStatus) params.status = filterStatus;

      const response = await axiosInstance.get('/admin/tokens/dashboard', { params });
      if (response.data?.success) {
        setStats(response.data.data.stats || {});
        setTokens(response.data.data.tokens || []);
      }
    } catch (error) {
      console.error('Error fetching token dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [filterStatus]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchDashboardData();
  };

  const handleFilterChange = (e) => {
    setFilterStatus(e.target.value);
    setCurrentPage(1);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (id) => {
    if (activeDropdown === id) setActiveDropdown(null);
    else setActiveDropdown(id);
  };

  const openModal = (type, token) => {
    setSelectedToken(token);
    setModalType(type);
    setActiveDropdown(null);
    setCopied(false);
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedToken(null);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Pagination Logic
  const filteredTokens = tokens.filter(t => 
    (t.tokenId && t.tokenId.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (t.ownerName && t.ownerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (t.tokenUid && t.tokenUid.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTokens = filteredTokens.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTokens.length / itemsPerPage);

  return (
    <div className="w-full mx-auto space-y-6 relative font-sans">
      
      {/* Welcome Banner */}
      <div 
        className="bg-[#a2c8db] rounded-2xl relative flex items-center shadow-sm overflow-hidden w-full"
        style={{ height: '100px', padding: '1.5rem' }}
      >
        <div className="relative z-10">
          <h2 className="text-xl md:text-[22px] font-bold text-[#1b2b4d] flex items-center gap-2 m-0 p-0 leading-none">
            Welcome Back, Mr. {user?.name?.split(' ')[0] || 'John'} 👋
          </h2>
          <p className="text-[#1b2b4d]/80 mt-2 text-sm font-medium leading-none">Have a good day..</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="flex flex-wrap lg:flex-nowrap gap-4 w-full">
        {[
          { label: 'Total Tokens', value: stats.totalTokens || 0 },
          { label: 'Active Tokens', value: stats.activeTokens || 0 },
          { label: 'Lost/Stolen', value: stats.lostStolenTokens || 0 },
          { label: 'Total Value', value: stats.totalValue ? `$${stats.totalValue.toLocaleString()}` : '$0' },
          { label: 'Issued This Month', value: stats.issuedThisMonth || 0 },
        ].map((stat, i) => (
          <div 
            key={i} 
            className="bg-white rounded-2xl border border-slate-200 flex justify-between items-center shadow-sm flex-1"
            style={{ padding: '1.25rem', minWidth: '180px' }}
          >
            <div className="flex flex-col gap-1">
              <h3 className="text-[13px] font-bold text-[#1b2b4d] m-0 leading-none">{stat.label}</h3>
              <p className="text-2xl font-black text-[#1b2b4d] m-0 leading-none mt-2">{stat.value}</p>
            </div>
            <div>
              <HexagonIcon className="w-8 h-8 text-[#1b2b4d] opacity-80" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm pb-4">
        
        {/* Table Header & Controls */}
        <div className="p-5 flex flex-wrap gap-4 items-center justify-between border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-800">Token Management</h3>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search by ID or Owner" 
                    className="pl-9 pr-4 py-2 border border-slate-200 rounded-l-lg focus:outline-none focus:ring-1 focus:ring-[#1b2b4d] text-sm w-64 transition-shadow"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
              <button 
                onClick={handleSearch}
                className="bg-[#1b2b4d] hover:bg-slate-800 text-white px-5 py-2 border border-[#1b2b4d] rounded-r-lg text-sm font-semibold transition-colors"
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
                    handleFilterChange({ target: { value: val === 'all' ? '' : val } });
                  }
                }}
                className="appearance-none bg-[#1b2b4d] hover:bg-slate-800 text-white pl-9 pr-9 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm focus:outline-none cursor-pointer"
              >
                <option value="default" disabled hidden>Filter</option>
                <option value="all">All Statuses</option>
                <option value="Available">Available</option>
                <option value="Active">Active</option>
                <option value="Lost">Lost / Stolen</option>
                <option value="Burned">Burned</option>
              </select>
              <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white pointer-events-none" />
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-white pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-visible pb-16">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#f8f9fa] text-slate-700 font-bold text-[13px] border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Token ID</th>
                <th className="px-6 py-4">Token UID</th>
                <th className="px-6 py-4">Owner</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Quantity</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Issue Date</th>
                <th className="px-6 py-4">Expiry Date</th>
                <th className="px-6 py-4">Last Transaction</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="10" className="px-6 py-4 text-center text-slate-500">Loading tokens...</td></tr>
              ) : currentTokens.length === 0 ? (
                <tr><td colSpan="10" className="px-6 py-4 text-center text-slate-500">No tokens found</td></tr>
              ) : (
                currentTokens.map((item) => (
                  <tr key={item.tokenId} className="hover:bg-slate-50 transition-colors text-slate-600 font-medium relative text-[13px]">
                    <td className="px-6 py-4 font-bold text-slate-600">{item.tokenId}</td>
                    <td className="px-6 py-4 text-slate-500">{item.tokenUid}</td>
                    <td className="px-6 py-4 text-slate-600">{item.ownerName}</td>
                    
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[11px] font-bold ${
                        item.ownerType === 'Customer' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                      }`}>
                        {item.ownerType || 'Unknown'}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 text-slate-600">{item.quantity}</td>
                    
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold ${
                        item.status === 'Available' || item.status === 'Active' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'
                      }`}>
                        {item.status}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 text-slate-500">{item.issueDate}</td>
                    <td className="px-6 py-4 text-slate-500">{item.expiryDate}</td>
                    <td className="px-6 py-4 text-slate-500">{item.lastTransaction || 'N/A'}</td>
                    
                    <td className="px-6 py-4 text-center relative">
                      <button 
                        onClick={() => toggleDropdown(item.tokenId)}
                        className="p-2 rounded-full hover:bg-slate-200 transition-colors text-slate-800"
                      >
                        <DotsIcon className="w-5 h-5" />
                      </button>

                      {activeDropdown === item.tokenId && (
                        <div 
                          ref={dropdownRef}
                          className="absolute bg-white rounded-xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.15)] border border-slate-100 z-50 py-2 right-12 top-2 w-48 text-left"
                        >
                          <button onClick={() => openModal('details', item)} className="w-full text-left px-5 py-2.5 text-sm font-bold text-[#1b2b4d]/80 hover:bg-slate-50 flex items-center gap-3">
                            <Eye className="w-4 h-4 text-slate-500" strokeWidth={2.5} /> View details
                          </button>
                          <button onClick={() => openModal('transfer', item)} className="w-full text-left px-5 py-2.5 text-sm font-bold text-[#1b2b4d]/80 hover:bg-slate-50 flex items-center gap-3">
                            <ArrowRightLeft className="w-4 h-4 text-slate-500" strokeWidth={2.5} /> Transfer Token
                          </button>
                          <button onClick={() => openModal('lost', item)} className="w-full text-left px-5 py-2.5 text-sm font-bold text-[#1b2b4d]/80 hover:bg-slate-50 flex items-center gap-3">
                            <AlertTriangle className="w-4 h-4 text-slate-500" strokeWidth={2.5} /> Mark lost/Stolen
                          </button>
                          <button onClick={() => openModal('burn', item)} className="w-full text-left px-5 py-2.5 text-sm font-bold text-[#1b2b4d]/80 hover:bg-slate-50 flex items-center gap-3">
                            <Flame className="w-4 h-4 text-slate-500" strokeWidth={2.5} /> Burn
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

        {/* Pagination */}
        {totalPages > 0 && (
          <div className="border-t border-slate-100">
            <Pagination 
              currentPage={currentPage} 
              totalPages={totalPages} 
              onPageChange={setCurrentPage} 
            />
          </div>
        )}
      </div>

      {/* ======================= MODALS ======================= */}

      {/* 1. Token Details Modal */}
      {modalType === 'details' && selectedToken && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col relative border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-white shrink-0">
              <h3 className="text-lg font-bold text-[#1b2b4d] flex items-center gap-3">
                <X className="w-5 h-5 text-slate-400 cursor-pointer hover:text-slate-700 transition-colors" onClick={closeModal} />
                Token Details
              </h3>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-bold text-[#1b2b4d] mb-2 block">Token ID</label>
                  <input type="text" readOnly value={selectedToken.tokenId} className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-700 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-sm font-bold text-[#1b2b4d] mb-2 block">Token UID</label>
                  <input type="text" readOnly value={selectedToken.tokenUid} className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-700 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-sm font-bold text-[#1b2b4d] mb-2 block">Owner</label>
                  <input type="text" readOnly value={selectedToken.ownerName} className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-700 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-sm font-bold text-[#1b2b4d] mb-2 block">Owner Type</label>
                  <div className="w-full p-2.5 border border-slate-300 rounded-lg bg-white flex items-center">
                    <span className={`inline-flex items-center justify-center px-3 py-0.5 rounded-full text-[11px] font-bold ${
                      selectedToken.ownerType === 'Customer' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                    }`}>{selectedToken.ownerType}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <h4 className="text-sm font-bold text-[#1b2b4d] mb-4">Activity</h4>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-bold text-[#1b2b4d] mb-2 block">Current Holder</label>
                    <input type="text" readOnly value={selectedToken.currentHolder || ''} className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-700 text-sm focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-[#1b2b4d] mb-2 block">Token Value / Unit</label>
                    <div className="relative">
                      <input type="text" readOnly value={`${selectedToken.tokenValue || ''} (${selectedToken.tokenUnit || ''} Unit)`} className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-700 text-sm pr-10 focus:outline-none" />
                      <button onClick={() => handleCopy(selectedToken.tokenUid)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-bold text-[#1b2b4d] mb-2 block">Last Redemption / Used At</label>
                    <input type="text" readOnly value={selectedToken.usedAt || 'Never'} className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-700 text-sm focus:outline-none" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-bold text-[#1b2b4d] mb-2 block">Last Txn</label>
                    <input type="text" readOnly value={selectedToken.lastTransaction || 'N/A'} className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-700 text-sm focus:outline-none" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-bold text-[#1b2b4d] mb-2 block">Issued By</label>
                    <input type="text" readOnly value={selectedToken.issuedBy || 'System Admin'} className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-700 text-sm focus:outline-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-[#1b2b4d] mb-2 block">Token Quantity</label>
                <div className="bg-slate-100/50 border border-slate-300 rounded-lg p-6 flex justify-between items-center">
                  <span className="font-semibold text-slate-800">Current Balance</span>
                  <span className="font-bold text-[#1b2b4d] text-lg">{selectedToken.quantity}</span>
                </div>
              </div>

            </div>

            <div className="p-5 border-t border-slate-200 flex justify-end gap-3 bg-white shrink-0">
              <button onClick={closeModal} className="px-5 py-2 rounded-lg border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={() => setModalType('transfer')} className="px-5 py-2 rounded-lg bg-[#1b2b4d] text-white text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors">
                Transfer Token <ArrowRightLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setModalType('lost')} className="px-5 py-2 rounded-lg bg-[#1b2b4d] text-white text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors">
                Mark lost <AlertTriangle className="w-4 h-4" />
              </button>
              <button onClick={() => setModalType('burn')} className="px-5 py-2 rounded-lg bg-[#1b2b4d] text-white text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors">
                Burn <Flame className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Transfer Token Modal */}
      {modalType === 'transfer' && selectedToken && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col relative border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-white shrink-0">
              <h3 className="text-lg font-bold text-[#1b2b4d] flex items-center gap-3">
                <X className="w-5 h-5 text-slate-400 cursor-pointer hover:text-slate-700 transition-colors" onClick={closeModal} />
                Transfer Token
              </h3>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              <div>
                <label className="text-sm font-bold text-[#1b2b4d] mb-2 block">Token ID</label>
                <input type="text" readOnly value={selectedToken.tokenId} className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-700 text-sm focus:outline-none" />
              </div>
              
              <div>
                <h4 className="text-sm font-bold text-[#1b2b4d] mb-1">Transfer Information</h4>
                <p className="text-xs text-slate-500 mb-3">Once transferred, the recipient will receive full ownership of the tokens. This action cannot be undone.</p>
                <label className="text-sm font-bold text-[#1b2b4d] mb-2 block">From</label>
                <div className="bg-slate-100 border border-slate-300 rounded-lg p-3 flex justify-between items-center">
                  <span className="font-semibold text-slate-800 text-sm">Current Owner</span>
                  <span className="text-slate-600 text-sm">{selectedToken.ownerName}</span>
                </div>
              </div>

              <div className="pt-2">
                <h4 className="text-sm font-bold text-[#1b2b4d] mb-4">Transfer Details</h4>
                <div className="grid grid-cols-2 gap-6 mb-4">
                  <div>
                    <label className="text-sm font-bold text-[#1b2b4d] mb-2 block">Recipient Email</label>
                    <input type="email" placeholder="Search recipient email" className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-700 text-sm focus:border-[#1b2b4d] focus:ring-1 focus:ring-[#1b2b4d] outline-none transition-all" value={transferData.email} onChange={e => setTransferData({...transferData, email: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-[#1b2b4d] mb-2 block">Quantity to Transfer</label>
                    <input type="number" placeholder="0" className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-700 text-sm focus:border-[#1b2b4d] focus:ring-1 focus:ring-[#1b2b4d] outline-none transition-all" value={transferData.quantity} onChange={e => setTransferData({...transferData, quantity: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-bold text-[#1b2b4d] mb-2 block">Notes (Optional)</label>
                  <textarea rows="3" placeholder="type note" className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-700 text-sm focus:border-[#1b2b4d] focus:ring-1 focus:ring-[#1b2b4d] outline-none transition-all" value={transferData.notes} onChange={e => setTransferData({...transferData, notes: e.target.value})}></textarea>
                </div>
              </div>

              {/* Transfer Summary */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center mb-4">Transfer Summary</h5>
                <div className="space-y-2 mb-4 text-[13px]">
                  <div className="flex justify-between items-center">
                    <span className="text-[#1b2b4d] font-semibold">From Account:</span>
                    <span className="text-slate-600">{selectedToken.ownerName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#1b2b4d] font-semibold">To Account:</span>
                    <span className="text-slate-600">{transferData.email || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#1b2b4d] font-semibold">Type:</span>
                    <span className="text-slate-600">{selectedToken.ownerType}</span>
                  </div>
                </div>
                <div className="bg-slate-100 rounded-lg p-3 flex justify-between items-center border border-slate-200">
                  <span className="font-semibold text-slate-800 text-sm">Tokens to Transfer:</span>
                  <span className="font-bold text-[#1b2b4d] text-sm">{transferData.quantity || '0'}</span>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-200 flex justify-end gap-3 bg-white shrink-0">
              <button onClick={closeModal} className="px-5 py-2 rounded-lg border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={closeModal} className="px-5 py-2 rounded-lg bg-[#1b2b4d] text-white text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors">
                Confirm Transfer <ArrowRightLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Mark Lost/Stolen Modal */}
      {modalType === 'lost' && selectedToken && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col relative border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-white shrink-0">
              <h3 className="text-lg font-bold text-[#1b2b4d] flex items-center gap-3">
                <X className="w-5 h-5 text-slate-400 cursor-pointer hover:text-slate-700 transition-colors" onClick={closeModal} />
                Mark Lost/Stolen
              </h3>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              <div>
                <label className="text-sm font-bold text-[#1b2b4d] mb-2 block">Token ID</label>
                <input type="text" readOnly value={selectedToken.tokenId} className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-700 text-sm focus:outline-none" />
              </div>
              
              <div>
                <h4 className="text-sm font-bold text-[#1b2b4d] mb-1">Important Notice</h4>
                <p className="text-[13px] text-slate-600 leading-tight">Marking this token as lost or stolen will immediately deactivate it. The token holder will be notified, and this action will be logged for audit purposes.</p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-[#1b2b4d] mb-3">Incident Type</h4>
                <div className="grid grid-cols-2 gap-4">
                  <label className={`border rounded-lg p-3 cursor-pointer flex justify-between items-start transition-colors ${lostData.type === 'Lost' ? 'border-[#1b2b4d] bg-slate-50' : 'border-slate-300 hover:bg-slate-50'}`}>
                    <div>
                      <div className="font-semibold text-[#1b2b4d] text-sm">Lost</div>
                      <div className="text-xs text-slate-500">Token was lost by the owner</div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mt-1 ${lostData.type === 'Lost' ? 'border-[#1b2b4d]' : 'border-slate-300'}`}>
                      {lostData.type === 'Lost' && <div className="w-2 h-2 rounded-full bg-[#1b2b4d]"></div>}
                    </div>
                    <input type="radio" className="hidden" name="incidentType" value="Lost" checked={lostData.type === 'Lost'} onChange={(e) => setLostData({...lostData, type: e.target.value})} />
                  </label>
                  
                  <label className={`border rounded-lg p-3 cursor-pointer flex justify-between items-start transition-colors ${lostData.type === 'Stolen' ? 'border-[#1b2b4d] bg-slate-50' : 'border-slate-300 hover:bg-slate-50'}`}>
                    <div>
                      <div className="font-semibold text-[#1b2b4d] text-sm">Stolen</div>
                      <div className="text-xs text-slate-500">Token was stolen or compromised</div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mt-1 ${lostData.type === 'Stolen' ? 'border-[#1b2b4d]' : 'border-slate-300'}`}>
                      {lostData.type === 'Stolen' && <div className="w-2 h-2 rounded-full bg-[#1b2b4d]"></div>}
                    </div>
                    <input type="radio" className="hidden" name="incidentType" value="Stolen" checked={lostData.type === 'Stolen'} onChange={(e) => setLostData({...lostData, type: e.target.value})} />
                  </label>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-[#1b2b4d] mb-4">Incident Details</h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-bold text-[#1b2b4d] mb-2 block">Date Reported</label>
                    <div className="relative">
                      <input type="date" className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-700 text-sm focus:border-[#1b2b4d] focus:ring-1 focus:ring-[#1b2b4d] outline-none transition-all" value={lostData.date} onChange={e => setLostData({...lostData, date: e.target.value})} />
                      <Calendar className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-[#1b2b4d] mb-2 block">Location Where {lostData.type}</label>
                    <input type="text" placeholder="e.g. central Bus Station" className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-700 text-sm focus:border-[#1b2b4d] focus:ring-1 focus:ring-[#1b2b4d] outline-none transition-all" value={lostData.location} onChange={e => setLostData({...lostData, location: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-[#1b2b4d] mb-2 block">Detailed Description</label>
                    <textarea rows="2" placeholder="Describe the circumstances of the incident" className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-700 text-sm focus:border-[#1b2b4d] focus:ring-1 focus:ring-[#1b2b4d] outline-none transition-all" value={lostData.description} onChange={e => setLostData({...lostData, description: e.target.value})}></textarea>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-[#1b2b4d] mb-2 block">Reported By</label>
                    <input type="text" readOnly className="w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50 text-[#1b2b4d] text-sm focus:outline-none" value={lostData.reportedBy} />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-200 flex justify-end gap-3 bg-white shrink-0">
              <button onClick={closeModal} className="px-5 py-2 rounded-lg border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={closeModal} className="px-5 py-2 rounded-lg text-white text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity" style={{ backgroundColor: '#f97316' }}>
                Proceed to Confirm <AlertTriangle className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Burn Token Modal */}
      {modalType === 'burn' && selectedToken && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col relative border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-white shrink-0">
              <h3 className="text-lg font-bold text-[#1b2b4d] flex items-center gap-3">
                <X className="w-5 h-5 text-slate-400 cursor-pointer hover:text-slate-700 transition-colors" onClick={closeModal} />
                Burn Token
              </h3>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              <div>
                <label className="text-sm font-bold text-[#1b2b4d] mb-2 block">Token ID</label>
                <input type="text" readOnly value={selectedToken.tokenId} className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-700 text-sm focus:outline-none" />
              </div>
              
              <div>
                <h4 className="text-sm font-bold text-[#1b2b4d] mb-1">Critical Action - No Undo</h4>
                <p className="text-[13px] text-slate-600 leading-tight">Burning tokens will permanently destroy them. This action is irreversible. Proceed only if you are absolutely certain.</p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-[#1b2b4d] mb-3">Current Token Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-100 border border-slate-300 rounded-lg p-3">
                    <div className="font-semibold text-[#1b2b4d] text-sm">Current Balance</div>
                    <div className="text-sm text-slate-600">{selectedToken.quantity}</div>
                  </div>
                  <div className="bg-slate-100 border border-slate-300 rounded-lg p-3 flex justify-between items-center">
                    <div className="font-semibold text-[#1b2b4d] text-sm">Status</div>
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-green-200/50 text-green-700">
                      {selectedToken.status}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-[#1b2b4d] mb-4 border-t border-slate-100 pt-4">Burn Details</h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-bold text-[#1b2b4d] mb-2 block">Quantity to Burn</label>
                    <input type="number" placeholder="0" className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-700 text-sm focus:border-[#1b2b4d] focus:ring-1 focus:ring-[#1b2b4d] outline-none transition-all" value={burnData.quantity} onChange={e => setBurnData({...burnData, quantity: e.target.value})} />
                  </div>
                  
                  <div>
                    <label className="text-sm font-bold text-[#1b2b4d] mb-2 block">Reason for Burning</label>
                    <div className="grid grid-cols-2 gap-3">
                      {['Fraudulent Activity', 'Damaged/Defective', 'Duplicate Token', 'Expired Token', 'System Maintenance', 'Other Reason'].map(reason => (
                        <label key={reason} className={`border rounded-lg p-3 cursor-pointer flex justify-between items-center transition-colors ${burnData.reason === reason ? 'border-[#1b2b4d] bg-slate-50' : 'border-slate-300 hover:bg-slate-50'}`}>
                          <div className="font-medium text-slate-700 text-sm">{reason}</div>
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${burnData.reason === reason ? 'border-[#1b2b4d]' : 'border-slate-300'}`}>
                            {burnData.reason === reason && <div className="w-2 h-2 rounded-full bg-[#1b2b4d]"></div>}
                          </div>
                          <input type="radio" className="hidden" name="burnReason" value={reason} checked={burnData.reason === reason} onChange={(e) => setBurnData({...burnData, reason: e.target.value})} />
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-[#1b2b4d] mb-2 block">Burn Date</label>
                    <div className="relative">
                      <input type="date" className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-700 text-sm focus:border-[#1b2b4d] focus:ring-1 focus:ring-[#1b2b4d] outline-none transition-all" value={burnData.date} onChange={e => setBurnData({...burnData, date: e.target.value})} />
                      <Calendar className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-[#1b2b4d] mb-2 block">Detailed Description</label>
                    <textarea rows="2" placeholder="Describe the circumstances of the incident" className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-700 text-sm focus:border-[#1b2b4d] focus:ring-1 focus:ring-[#1b2b4d] outline-none transition-all" value={burnData.description} onChange={e => setBurnData({...burnData, description: e.target.value})}></textarea>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-200 flex justify-end gap-3 bg-white shrink-0">
              <button onClick={closeModal} className="px-5 py-2 rounded-lg border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={closeModal} className="px-5 py-2 rounded-lg text-white text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity" style={{ backgroundColor: '#ef4444' }}>
                Proceed to Confirm <Flame className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TokenManagement;
