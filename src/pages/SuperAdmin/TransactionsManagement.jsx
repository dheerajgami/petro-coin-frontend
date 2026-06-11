import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, ChevronLeft, ChevronRight, AlertTriangle, ArrowLeft, Copy, ShieldAlert, MoreVertical, ArrowRight, ChevronDown } from 'lucide-react';
import Pagination from '../../components/Pagination';
import axiosInstance from '../../api/axiosInstance';

const TransactionsManagement = () => {
  const [currentView, setCurrentView] = useState('list'); // 'list', 'details', 'report'
  const [selectedTxn, setSelectedTxn] = useState(null);

  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  const [reportData, setReportData] = useState({
    reason: '',
    severityLevel: '',
    detailedDescription: '',
    freezeAccount: false,
    notifyUser: false
  });
  const [submittingReport, setSubmittingReport] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      // Fetch stats from existing endpoint
      const resStats = await axiosInstance.get('/admin/transactions');
      if (resStats.data?.success) {
        setStats(resStats.data.data.summary || null);
      }
      
      // Fetch full global list from common filter
      const resList = await axiosInstance.get('/admin/filter', { params: { resource: 'transactions' } });
      if (resList.data?.success) {
        setTransactions(resList.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setCurrentPage(1);
    if (!searchQuery.trim()) {
      fetchTransactions();
      return;
    }
    try {
      setLoading(true);
      const { data } = await axiosInstance.get('/admin/search', {
        params: { q: searchQuery, resource: 'transactions' }
      });
      if (data?.success) {
        setTransactions(data.data || []);
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
      fetchTransactions();
      return;
    }
    try {
      setLoading(true);
      const { data } = await axiosInstance.get('/admin/filter', {
        params: { resource: 'transactions', status }
      });
      if (data?.success) {
        setTransactions(data.data || []);
      }
    } catch (err) {
      console.error('Error filtering:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (view, txn) => {
    setActiveDropdown(null);
    if (view === 'details' || view === 'report') {
      try {
        setDetailLoading(true);
        const res = await axiosInstance.get(`/admin/transactions/${txn.txnId}`);
        if (res.data?.success) {
          setSelectedTxn(res.data.data);
          setCurrentView(view);
          if (view === 'report') {
            setReportData({ reason: '', severityLevel: '', detailedDescription: '', freezeAccount: false, notifyUser: false });
          }
        }
      } catch (err) {
        console.error('Error fetching details:', err);
        alert('Failed to fetch transaction details.');
      } finally {
        setDetailLoading(false);
      }
    } else {
      setCurrentView(view);
    }
  };

  const submitReport = async () => {
    if (!reportData.reason || !reportData.severityLevel) {
      alert('Please fill out the required report details.');
      return;
    }
    try {
      setSubmittingReport(true);
      const res = await axiosInstance.post(`/admin/transactions/${selectedTxn.transactionId}/report`, {
        reason: reportData.reason,
        severityLevel: reportData.severityLevel,
        detailedDescription: reportData.detailedDescription,
        freezeAccount: reportData.freezeAccount,
        notifyUser: reportData.notifyUser
      });
      if (res.data?.success) {
        alert('Report submitted successfully.');
        setCurrentView('list');
      }
    } catch (err) {
      console.error('Error submitting report:', err);
      alert('Failed to submit report.');
    } finally {
      setSubmittingReport(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-700';
      case 'Failed': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getTypeStyle = (type) => {
    switch (type) {
      case 'Redemption': return 'bg-green-100 text-green-700';
      case 'Transfer': return 'bg-indigo-100 text-indigo-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  // --- Views ---

  const renderListView = () => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentTransactions = transactions.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(transactions.length / itemsPerPage);

    return (
      <div className="w-full mx-auto space-y-6 relative font-sans">
        {/* Stats Cards */}
        {stats && (
          <div className="flex flex-wrap gap-4">
            {[
              { label: 'Total Transactions', value: stats.totalTransactions, icon: '💸' },
              { label: 'Total Revenue', value: stats.totalRevenue, icon: '💰' },
              { label: 'Total Tokens Burned', value: stats.totalTokensBurned, icon: '🔥' },
              { label: 'Total Fuel Balance', value: stats.totalFuelBalance, icon: '⛽' },
            ].map((stat, i) => (
              <div key={i} className="bg-white rounded-xl p-5 border border-slate-200 flex flex-1 min-w-[200px] justify-between items-center shadow-sm">
                <div>
                  <div className="text-sm font-semibold text-[#1b2b4d] mb-2">{stat.label}</div>
                  <div className="text-2xl font-bold text-[#1b2b4d]">{stat.value}</div>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-xl shrink-0">
                  {stat.icon}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Table Section */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-800">Transactions Management</h3>
            <div className="flex items-center gap-3 w-full sm:w-auto">
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
                  className="appearance-none bg-[#1b2b4d] hover:bg-slate-800 text-white pl-9 pr-9 py-2.5 rounded-lg text-sm font-medium transition-colors focus:outline-none cursor-pointer"
                >
                  <option value="default" disabled hidden>Filter</option>
                  <option value="all">All Statuses</option>
                  <option value="SUCCESS">Success</option>
                  <option value="FAILED">Failed</option>
                  <option value="PENDING">Pending</option>
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
                  <th className="px-6 py-4 font-semibold">Timestamp</th>
                  <th className="px-6 py-4 font-semibold">From</th>
                  <th className="px-6 py-4 font-semibold">To</th>
                  <th className="px-6 py-4 font-semibold">Type</th>
                  <th className="px-6 py-4 font-semibold">Amount</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Time Ago</th>
                  <th className="px-6 py-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan="9" className="text-center py-10 text-slate-500">Loading transactions...</td></tr>
                ) : currentTransactions.length === 0 ? (
                  <tr><td colSpan="9" className="text-center py-10 text-slate-500">No transactions found</td></tr>
                ) : (
                  currentTransactions.map((txn, index) => (
                    <tr key={txn.id || index} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-[#1b2b4d]">{txn.txnId}</td>
                      <td className="px-6 py-4 text-slate-600">{new Date(txn.createdAt).toLocaleString()}</td>
                      <td className="px-6 py-4">{txn.customerName || 'N/A'}</td>
                      <td className="px-6 py-4">{txn.stationName || txn.outlet || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${txn.type === 'Redemption' || txn.type === 'Burn' ? 'bg-green-100 text-green-700' : 'bg-indigo-100 text-indigo-700'}`}>
                            {txn.type === 'Redemption' || txn.type === 'Burn' ? <span className="text-green-600">✓</span> : <ArrowRight className="w-3 h-3 -rotate-45" />}
                            {txn.type}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold">{txn.amount}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${txn.status === 'SUCCESS' ? 'bg-green-100 text-green-700' : txn.status === 'FAILED' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>
                          {txn.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-sm">{txn.timeAgo || '-'}</td>
                      <td className="px-6 py-4 text-center relative">
                        <button
                          onClick={() => setActiveDropdown(activeDropdown === txn.id ? null : txn.id)}
                          className="p-1.5 rounded hover:bg-slate-200 text-slate-600 transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {activeDropdown === txn.id && (
                          <div className="absolute right-10 top-8 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-[999] py-1 text-left">
                            <button onClick={() => handleAction('details', txn)} className="w-full text-left px-4 py-2.5 text-sm text-[#1b2b4d] hover:bg-slate-50 flex items-center gap-3 font-semibold transition-colors">
                              {detailLoading ? <span className="animate-spin text-slate-400 border-2 border-slate-400 border-t-transparent rounded-full w-4 h-4" /> : <Eye className="w-4 h-4 text-slate-400" />} View details
                            </button>
                            <button onClick={() => handleAction('report', txn)} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 font-semibold transition-colors">
                              <AlertTriangle className="w-4 h-4 text-red-500" /> Report Suspicious
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
  };

  const renderDetailsView = () => (
    <div className="w-full mx-auto space-y-6 font-sans">
      <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
        <button onClick={() => setCurrentView('list')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h2 className="text-xl font-bold text-[#1b2b4d]">View Details</h2>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content Column */}
        <div className="flex-1 space-y-6 min-w-0">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 flex flex-col min-h-[260px]">
            <div className="flex justify-between items-start w-full">
              <span className={`border text-[11px] font-semibold px-3 py-1 rounded-full uppercase tracking-wide ${selectedTxn?.transactionStatus === 'SUCCESS' ? 'border-green-200 text-green-500 bg-green-50' : 'border-red-200 text-red-500 bg-red-50'}`}>
                {selectedTxn?.transactionStatus || 'UNKNOWN'}
              </span>
              <div className="text-right">
                <div className="text-slate-400 text-[11px] font-medium mb-0.5">Transaction ID</div>
                <div className="text-[#1b2b4d] font-bold text-sm">{selectedTxn?.transactionId}</div>
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center mt-2">
              <div className="text-slate-400 text-sm font-medium mb-1">Transaction Amount</div>
              <div className="text-5xl font-bold text-[#0f172a] tracking-tight">{selectedTxn?.amount} TOKENS</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="text-slate-500 text-sm mb-4">From (Sender)</div>
              <div className="font-semibold text-[#1b2b4d] text-base truncate">{selectedTxn?.senderName || 'N/A'}</div>
              <div className="text-slate-500 text-xs mt-1">{selectedTxn?.senderId || '-'}</div>
              <button className="text-blue-600 text-sm font-medium mt-4 hover:underline flex items-center gap-1">View Profile <ArrowRight className="w-3 h-3 -rotate-45" /></button>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="text-slate-500 text-sm mb-4">To (Recipient)</div>
              <div className="font-semibold text-[#1b2b4d] text-base truncate">{selectedTxn?.recipientName || 'N/A'}</div>
              <div className="text-slate-500 text-xs mt-1">{selectedTxn?.recipientId || '-'}</div>
              <button className="text-blue-600 text-sm font-medium mt-4 hover:underline flex items-center gap-1">View Profile <ArrowRight className="w-3 h-3 -rotate-45" /></button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-semibold text-[#1b2b4d] mb-6">Transaction Details</h3>
            <div className="flex flex-col">
              <div className="flex border-b border-slate-100 py-3">
                <div className="flex-1 flex justify-between pr-8">
                  <span className="text-slate-500 text-sm">Transaction Type</span>
                  <span className="font-semibold text-[#1b2b4d] text-sm">{selectedTxn?.transactionType || '-'}</span>
                </div>
                <div className="flex-1 flex justify-between pl-8">
                  <span className="text-slate-500 text-sm">Timestamp</span>
                  <span className="font-semibold text-[#1b2b4d] text-sm">{selectedTxn?.timestampFormatted || '-'}</span>
                </div>
              </div>
              <div className="flex py-3">
                <div className="flex-1 flex justify-between pr-8">
                  <span className="text-slate-500 text-sm">Network Fee</span>
                  <span className="font-semibold text-[#1b2b4d] text-sm">{selectedTxn?.networkFee || '-'}</span>
                </div>
                <div className="flex-1 flex justify-between pl-8">
                  <span className="text-slate-500 text-sm">Block Number</span>
                  <span className="font-semibold text-[#1b2b4d] text-sm">{selectedTxn?.blockNumber || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-semibold text-[#1b2b4d] mb-3">Transaction Description & Notes</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              {selectedTxn?.notes || '-'}
            </p>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="w-full lg:w-[350px] xl:w-[400px] shrink-0 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-[#1b2b4d] mb-6">Technical Details</h3>
            <div className="space-y-5">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <span className="text-slate-500 text-sm">Transaction Hash</span>
                <span className="font-mono text-sm text-slate-800 flex items-center gap-2">{selectedTxn?.txHash ? `${selectedTxn.txHash.substring(0, 6)}...${selectedTxn.txHash.substring(selectedTxn.txHash.length - 4)}` : '-'} {selectedTxn?.txHash && <Copy className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <span className="text-slate-500 text-sm">Location</span>
                <span className="text-sm font-semibold text-slate-800">{selectedTxn?.location || '-'}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <span className="text-slate-500 text-sm">Device</span>
                <span className="text-sm font-semibold text-slate-800">{selectedTxn?.deviceType || '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-sm">IP Address</span>
                <span className="text-sm font-semibold text-slate-800">{selectedTxn?.ipAddress || '-'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-[#1b2b4d] mb-6">Audit Trail</h3>
            <div className="relative border-l-2 border-slate-100 ml-2 space-y-8">
              {selectedTxn?.auditTrail?.length > 0 ? selectedTxn.auditTrail.map((step, i) => (
                <div key={i} className="pl-6 relative">
                  <div className="absolute w-2.5 h-2.5 bg-green-500 rounded-full border border-white" style={{ left: '-6px', top: '4px' }}></div>
                  <div className="text-sm font-semibold text-slate-800 leading-tight">{step.title}</div>
                  <div className="text-xs text-slate-400 mt-1">{step.time}</div>
                </div>
              )) : (
                <div className="text-slate-500 text-sm">No audit trail available</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderReportView = () => (
    <div className="w-full mx-auto space-y-6 font-sans">
      <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
        <button onClick={() => setCurrentView('list')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h2 className="text-xl font-bold text-[#1b2b4d]">Report Suspicious Transaction</h2>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content Column */}
        <div className="flex-1 space-y-6 min-w-0">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-[#1b2b4d] mb-5">Report Details</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-[#1b2b4d] mb-2 block">Reason for Report</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#1b2b4d] focus:ring-1 focus:ring-[#1b2b4d]"
                  value={reportData.reason}
                  onChange={e => setReportData({ ...reportData, reason: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[#1b2b4d]">Severity Level</label>
                <select
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#1b2b4d] focus:ring-1 focus:ring-[#1b2b4d]"
                  value={reportData.severityLevel}
                  onChange={e => setReportData({ ...reportData, severityLevel: e.target.value })}
                >
                  <option value="">Select severity</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[#1b2b4d]">Detailed Description</label>
                <textarea
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#1b2b4d] focus:ring-1 focus:ring-[#1b2b4d] h-32 resize-none"
                  placeholder="Please provide details about why this transaction is being reported..."
                  value={reportData.detailedDescription}
                  onChange={e => setReportData({ ...reportData, detailedDescription: e.target.value })}
                ></textarea>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-[#1b2b4d] mb-4">Immediate Actions</h3>
            <p className="text-sm text-slate-500 mb-5">Select any immediate actions to be taken on this account</p>
            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 w-4 h-4 text-[#1b2b4d] rounded border-slate-300 focus:ring-[#1b2b4d]"
                  checked={reportData.freezeAccount}
                  onChange={e => setReportData({ ...reportData, freezeAccount: e.target.checked })}
                />
                <div>
                  <div className="text-sm font-bold text-[#1b2b4d]">Temporarily freeze associated account</div>
                  <div className="text-xs text-slate-500 mt-0.5">Account will be unable to perform transactions</div>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 w-4 h-4 text-[#1b2b4d] rounded border-slate-300 focus:ring-[#1b2b4d]"
                  checked={reportData.notifyUser}
                  onChange={e => setReportData({ ...reportData, notifyUser: e.target.checked })}
                />
                <div>
                  <div className="text-sm font-bold text-[#1b2b4d]">Auto-notify user about investigation</div>
                  <div className="text-xs text-slate-500 mt-0.5">User will receive email notification</div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="w-full lg:w-[350px] xl:w-[400px] shrink-0 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-[#1b2b4d] mb-6">Transaction Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <span className="text-slate-500 text-sm">Amount</span>
                <span className="font-extrabold text-[#1b2b4d] text-xl">{selectedTxn?.amount} TOKENS</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <span className="text-slate-500 text-sm">Type</span>
                <span className="font-semibold text-slate-800 text-sm">{selectedTxn?.transactionType || '-'}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <span className="text-slate-500 text-sm">User</span>
                <span className="font-semibold text-slate-800 text-sm">{selectedTxn?.senderName || '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-sm">Date</span>
                <span className="font-semibold text-slate-800 text-sm">{selectedTxn?.timestampFormatted || '-'}</span>
              </div>
            </div>
          </div>

          <div className="bg-red-50 rounded-xl border border-red-100 p-6">
            <div className="flex items-center gap-2 text-red-600 font-bold mb-3">
              <ShieldAlert className="w-5 h-5" /> Security Protocol
            </div>
            <p className="text-sm text-red-600/80 mb-4 leading-relaxed">
              Upon submission, the following actions will be automatically triggered:
            </p>
            <ul className="space-y-2 text-sm text-red-700 font-medium">
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></div> <span className="leading-tight">Transaction will be flagged in the system</span></li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></div> <span className="leading-tight">Security team will be notified immediately</span></li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></div> <span className="leading-tight">User wallet will be monitored for 72 hours</span></li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></div> <span className="leading-tight">Investigation case file will be created</span></li>
            </ul>
          </div>

          <button
            onClick={submitReport}
            disabled={submittingReport}
            className="w-full py-3.5 bg-[#1b2b4d] hover:bg-[#111c33] text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
          >
            {submittingReport ? 'Submitting...' : 'Review Report'} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full mx-auto space-y-6 relative font-sans">
      {/* Banner available on all views */}
      <div className="bg-gradient-to-r from-[#e4eff3] to-[#c9d7dc] rounded-xl px-6 py-5 relative overflow-hidden min-h-[70px] flex flex-col justify-center shadow-sm border border-slate-200">
        <div className="relative z-10">
          <h2 className="text-base md:text-lg font-bold text-[#1b2b4d] flex items-center gap-2">Welcome Back, Mr. John <span className="text-lg">👋</span></h2>
          <p className="text-slate-600 text-xs mt-0.5 font-medium">Have a good day..</p>
        </div>
      </div>

      {currentView === 'list' && renderListView()}
      {currentView === 'details' && selectedTxn && renderDetailsView()}
      {currentView === 'report' && selectedTxn && renderReportView()}
    </div>
  );
};

export default TransactionsManagement;
