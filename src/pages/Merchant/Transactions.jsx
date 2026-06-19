import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Download,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';

const Transactions = () => {
  const { user } = useSelector((state) => state.auth);

  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    totalTransactions: 0,
    completedCount: 0,
    pendingCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Filters State
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/merchant/transactions');
        if (response.data?.success) {
          setTransactions(response.data.data.transactions || []);
          setStats(response.data.data.stats || {
            totalTransactions: 0,
            completedCount: 0,
            pendingCount: 0
          });
        }
      } catch (err) {
        console.error('Failed to fetch transactions', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const handleDownloadPDF = async () => {
    try {
      setIsExporting(true);
      const response = await axiosInstance.get('/merchant/transactions/export');
      if (response.data?.success) {
        const exportData = response.data.data;

        // Import jsPDF dynamically
        const { default: jsPDF } = await import('jspdf');
        const { default: autoTable } = await import('jspdf-autotable');

        const doc = new jsPDF();

        // Add Title
        doc.setFontSize(18);
        doc.setTextColor(89, 17, 28); // #59111c
        doc.text('Merchant Transactions Report', 14, 22);

        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

        // Define table columns
        const tableColumn = ["ID", "Type", "Amount", "Status", "Date", "Sender", "Receiver"];

        // Map data to rows
        const tableRows = exportData.map(txn => [
          `txn_${txn.transactionId?.toString().padStart(3, '0') || 'N/A'}`,
          txn.type || '-',
          `Rs. ${Number.parseFloat(txn.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          txn.status || '-',
          formatDate(txn.createdAt),
          txn.senderName || '-',
          txn.receiverName || '-'
        ]);

        // Generate auto table
        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: 35,
          styles: { fontSize: 9 },
          headStyles: { fillColor: [89, 17, 28] } // #59111c
        });

        // Save the PDF
        doc.save(`Merchant_Transactions_${new Date().toISOString().split('T')[0]}.pdf`);
      }
    } catch (err) {
      console.error('Failed to export transactions', err);
      alert('Failed to download PDF. Please try again later.');
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'completed') {
      return (
        <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-xs font-semibold capitalize">
          {s}
        </span>
      );
    }
    if (s === 'failed') {
      return (
        <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs font-semibold capitalize">
          {s}
        </span>
      );
    }
    return (
      <span className="px-3 py-1 bg-pink-100 text-pink-600 rounded-full text-xs font-semibold capitalize">
        {s || 'Pending'}
      </span>
    );
  };

  const getTransactionIcon = (type) => {
    const t = (type || '').toLowerCase();
    if (t === 'mint' || t === 'new mint token') {
      return (
        <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
          <ArrowUpRight className="w-5 h-5 text-emerald-500" strokeWidth={2} />
        </div>
      );
    }
    if (t === 'debit' || t === 'redeem') {
      return (
        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
          <ArrowDownLeft className="w-5 h-5 text-red-500" strokeWidth={2} />
        </div>
      );
    }
    // Default / Verification
    return (
      <div className="w-10 h-10 rounded-full bg-[#59111c] bg-opacity-10 flex items-center justify-center shrink-0">
        <CheckCircle2 className="w-5 h-5 text-[#59111c]" strokeWidth={2} />
      </div>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getTransactionTitle = (txn) => {
    if (txn.type === 'New Mint Token') return 'New Mint Token';
    if (txn.type === 'MINT') return 'Tokens Minted';
    if (txn.type === 'DEBIT') return 'Tokens Debited';
    return txn.type || 'Transaction';
  };

  const filteredTransactions = transactions.filter(txn => {
    // Type Filter
    if (typeFilter && typeFilter !== '') {
      if ((txn.type || '').toLowerCase() !== typeFilter.toLowerCase()) return false;
    }

    // Status Filter
    if (statusFilter && statusFilter !== '') {
      if ((txn.status || '').toLowerCase() !== statusFilter.toLowerCase()) return false;
    }

    // Search Query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      const sender = (txn.senderName || '').toLowerCase();
      const receiver = (txn.receiverName || '').toLowerCase();

      if (!sender.includes(query) && !receiver.includes(query)) {
        return false;
      }
    }

    return true;
  });

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const currentTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="max-w-[1400px] mx-auto p-8 font-sans space-y-6 relative">

      {/* Welcome Banner */}
      <div className="bg-[#59111c] rounded-xl p-6 relative overflow-hidden shadow-sm">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          Welcome Back, {user?.username || user?.businessName || user?.name || 'Merchant'} 👋
        </h2>
        <p className="text-red-100 mt-1 text-sm font-medium">Have a good day..</p>
      </div>

      {/* Header Section */}
      <div className="flex justify-between items-end border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Transactions</h2>
          <p className="text-sm text-slate-500 mt-1">View and track all merchant transactions</p>
        </div>
        <button
          onClick={handleDownloadPDF}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {isExporting ? 'Downloading...' : 'Download PDF'}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#59111c]" />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between h-32">
              <h3 className="text-base font-bold text-slate-800">Total Transactions</h3>
              <p className="text-3xl font-black text-slate-900 mt-2">{stats.totalTransactions}</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between h-32">
              <h3 className="text-base font-bold text-slate-800">Completed</h3>
              <p className="text-3xl font-black text-slate-900 mt-2">{stats.completedCount}</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between h-32">
              <h3 className="text-base font-bold text-slate-800">Pending</h3>
              <p className="text-3xl font-black text-slate-900 mt-2">{stats.pendingCount}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="font-bold text-slate-800 mr-4 w-full sm:w-auto">Filters</div>

            <div className="relative w-full sm:w-48">
              <select
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
                className="w-full appearance-none bg-white border border-slate-300 text-slate-700 text-sm rounded-lg pl-4 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#59111c] focus:border-transparent font-medium"
              >
                <option value="">Transaction Type</option>
                <option value="mint">Mint</option>
                <option value="debit">Debit</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>

            <div className="relative w-full sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="w-full appearance-none bg-white border border-slate-300 text-slate-700 text-sm rounded-lg pl-4 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#59111c] focus:border-transparent font-medium"
              >
                <option value="">Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>

            <div className="flex w-full sm:flex-1 h-10">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  placeholder="Search by name email"
                  className="w-full h-full bg-white border border-slate-300 text-sm pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#59111c] focus:border-transparent rounded-l-lg border-r-0"
                />
              </div>
              <button
                onClick={() => setCurrentPage(1)} // Search is applied in real-time on input change
                className="h-full px-6 bg-[#59111c] text-white text-sm font-semibold rounded-r-lg hover:bg-opacity-90 transition-colors border border-[#59111c]"
              >
                Search
              </button>
            </div>
          </div>

          {/* Transaction List */}
          <div className="space-y-4">
            {currentTransactions.length > 0 ? (
              currentTransactions.map((txn) => (
                <div key={txn._id || txn.transactionId} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    {getTransactionIcon(txn.type)}
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{getTransactionTitle(txn)}</h4>
                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-1 font-medium">
                        <span>ID: txn_{txn.transactionId?.toString().padStart(3, '0')}</span>
                        <span>{formatDate(txn.createdAt)}</span>
                        {txn.receiverName && (
                          <span className="hidden sm:inline-block border-l pl-4 border-slate-300">To: {txn.receiverName}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="font-bold text-slate-900">
                      {txn.type?.toLowerCase() === 'debit' ? '-' : ''}₹{Number.parseFloat(txn.amount).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </span>
                    {getStatusBadge(txn.status)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 bg-white rounded-xl border border-slate-200 text-slate-500">
                No transactions found.
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white px-4 py-3 border border-slate-200 rounded-xl shadow-sm mt-4">
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-700">
                    Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredTransactions.length)}</span> of{' '}
                    <span className="font-medium">{filteredTransactions.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                      <button
                        key={pageNumber}
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 focus:outline-offset-0 ${currentPage === pageNumber
                          ? 'z-10 bg-[#59111c] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#59111c]'
                          : 'text-slate-900 ring-1 ring-inset ring-slate-300 hover:bg-slate-50'
                          }`}
                      >
                        {pageNumber}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <ChevronRight className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </nav>
                </div>
              </div>

              {/* Mobile pagination */}
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <div className="flex items-center">
                  <span className="text-sm text-slate-700">
                    Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
                  </span>
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="relative ml-3 inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
};

export default Transactions;
