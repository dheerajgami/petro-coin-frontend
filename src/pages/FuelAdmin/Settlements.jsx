import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Wallet, Clock, TrendingUp, Search, Calendar, Download,
  CheckCircle2, X, Loader2
} from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';

const FuelAdminSettlements = () => {
  const { user } = useSelector((state) => state.auth);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showExportSuccess, setShowExportSuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [settlementsData, setSettlementsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSettlements = async () => {
      try {
        const response = await axiosInstance.get('/admin/settlements');
        if (response.data?.success) {
          setSettlementsData(response.data.data);
        } else {
          setError('Failed to load settlements data');
        }
      } catch (err) {
        console.error('Error fetching settlements:', err);
        setError('An error occurred while loading data.');
      } finally {
        setLoading(false);
      }
    };

    fetchSettlements();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F6F8]">
        <Loader2 className="w-8 h-8 text-[#ECA12A] animate-spin" />
      </div>
    );
  }

  if (error || !settlementsData) {
    return (
      <div className="p-8 max-w-[1400px] mx-auto text-center">
        <div className="bg-red-50 text-red-500 p-4 rounded-xl border border-red-100 font-bold">
          {error || 'Unable to load settlements data.'}
        </div>
      </div>
    );
  }

  // Derived state for filtering
  const filteredSettlements = settlementsData.settlements.filter(settlement =>
    (settlement.stationName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (settlement.stationId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (settlement.id || '').toString().toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Processed':
        return <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-semibold border border-green-100">Processed</span>;
      case 'Pending':
        return <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-xs font-semibold border border-orange-100">Pending</span>;
      case 'Review':
        return <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-semibold border border-blue-100">Review</span>;
      default:
        return <span className="px-3 py-1 bg-slate-50 text-slate-600 rounded-full text-xs font-semibold border border-slate-200">{status}</span>;
    }
  };


  const handleExport = async () => {
    try {
      setIsExporting(true);
      const response = await axiosInstance.get('/fuel/settlements/export', {
        responseType: 'blob',
      });
      // Create a download link and trigger it
      const url = globalThis.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `settlements_${new Date().toISOString().slice(0, 10)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      globalThis.URL.revokeObjectURL(url);
      setShowExportSuccess(true);
      setTimeout(() => setShowExportSuccess(false), 3000);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-8 pb-12 max-w-[1400px] mx-auto space-y-6">

      {/* Welcome Banner */}
      <div className="bg-[#ECA12A] rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          Welcome Back, {typeof user?.username === 'string' ? `Mr. ${user.username.split(' ')[0]}` : 'Mr. John'} 👋
        </h2>
        <p className="text-slate-800 mt-1 text-sm font-medium">Have a good day..</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Settled */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all">
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">Total Settled</p>
            <h3 className="text-3xl font-bold text-slate-800">₹{settlementsData.summary.totalSettled.toLocaleString('en-IN')}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Settlements */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all">
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">Pending Settlements</p>
            <h3 className="text-3xl font-bold text-slate-800">₹{settlementsData.summary.pendingSettlements.toLocaleString('en-IN')}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Total Transactions */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all">
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">Total Transactions</p>
            <h3 className="text-3xl font-bold text-slate-800">{settlementsData.summary.totalTransactions.toLocaleString('en-IN')}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Settlement Reports Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-8">
        <div className="p-6 border-b border-slate-100">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-1">Settlement Reports & Reconciliation</h2>
              <p className="text-sm text-slate-500">Track financial distributions between Master and Station units</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search stations by name or ID"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[#ECA12A]/20 focus:border-[#ECA12A] transition-all"
                />
              </div>
              <button
                onClick={() => setShowFilterModal(true)}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Calendar className="w-4 h-4" />
                Filter Date
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {isExporting ? 'Exporting...' : 'Export All'}
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">SETTLEMENT ID</th>
                <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">STATION NAME</th>
                <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">PERIOD / DESCRIPTION</th>
                <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">AMOUNT (INR)</th>
                <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">STATUS</th>
                <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">DATE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSettlements.length > 0 ? (
                filteredSettlements.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <span className="text-sm font-bold text-slate-700">{item.id}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800">{item.stationName}</span>
                        <span className="text-[11px] text-slate-400 font-medium">{item.stationId}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-slate-600">{item.period}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`text-sm font-bold ${item.amount < 0 ? 'text-red-500' : 'text-slate-800'}`}>
                        {item.amount < 0 ? '-' : ''}₹{Math.abs(item.amount).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-slate-500">{item.date}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    No settlements found matching "{searchTerm}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Filter by Date</h3>
              <button
                onClick={() => setShowFilterModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                <input id="startDate" type="date" className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ECA12A]/20 focus:border-[#ECA12A]" />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                <input id="endDate" type="date" className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ECA12A]/20 focus:border-[#ECA12A]" />
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setShowFilterModal(false)}
                className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowFilterModal(false)}
                className="px-5 py-2.5 text-sm font-bold text-white bg-[#ECA12A] hover:bg-[#d99020] rounded-xl transition-colors shadow-sm shadow-orange-200"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Success Toast */}
      {showExportSuccess && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-top-5 fade-in duration-300 z-[100]">
          <CheckCircle2 className="w-6 h-6" />
          <div>
            <h4 className="font-bold text-sm">Export Successful</h4>
            <p className="text-xs text-green-100">Settlements data has been downloaded as PDF.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FuelAdminSettlements;
