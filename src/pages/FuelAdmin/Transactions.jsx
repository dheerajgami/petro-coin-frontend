import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Search, Flame, ChevronDown, Loader2 } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';

const FuelAdminTransactions = () => {
  const { user } = useSelector((state) => state.auth);
  const [searchTerm, setSearchTerm] = useState('');
  const [stationFilter, setStationFilter] = useState('Station Name');

  const [transactionsData, setTransactionsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await axiosInstance.get('/admin/transactions');
        if (response.data?.success) {
          setTransactionsData(response.data.data);
        } else {
          setError('Failed to load transactions data.');
        }
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError('An error occurred while loading data.');
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F6F8]">
        <Loader2 className="w-8 h-8 text-[#ECA12A] animate-spin" />
      </div>
    );
  }

  if (error || !transactionsData) {
    return (
      <div className="p-8 max-w-[1400px] mx-auto text-center">
        <div className="bg-red-50 text-red-500 p-4 rounded-xl border border-red-100 font-bold">
          {error || 'Unable to load transactions data.'}
        </div>
      </div>
    );
  }

  const filteredTransactions = transactionsData.transactions.filter(txn => 
    (txn.txnId || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 pb-12 max-w-[1400px] mx-auto space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-[#ECA12A] rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          Welcome Back, {typeof user?.username === 'string' ? `Mr. ${user.username.split(' ')[0]}` : 'Mr. John'} 👋
        </h2>
        <p className="text-slate-800 mt-1 text-sm font-medium">Have a good day..</p>
      </div>

      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-800">Transaction</h2>
        <p className="text-sm text-slate-500">View and track all Fuel transactions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-center">
          <p className="text-slate-700 text-lg font-bold mb-1">Total Transactions</p>
          <h3 className="text-3xl font-medium text-slate-900">{transactionsData.summary.totalTransactions.toLocaleString()}</h3>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-center">
          <p className="text-slate-700 text-lg font-bold mb-1">Total Revenue</p>
          <h3 className="text-3xl font-medium text-slate-900">₹{transactionsData.summary.totalRevenue.toLocaleString('en-IN')}</h3>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-center">
          <p className="text-slate-700 text-lg font-bold mb-1">Fuel Balance</p>
          <h3 className="text-3xl font-medium text-slate-900">{transactionsData.summary.totalFuelBalance.toLocaleString()} L</h3>
        </div>
      </div>

      {/* Filters Section */}
      <div className="flex flex-col md:flex-row items-center justify-between py-4 border-b border-slate-200 gap-4">
        <h3 className="text-slate-800 font-bold">Filters</h3>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          {/* Station Filter Dropdown */}
          <div className="relative">
            <select 
              value={stationFilter}
              onChange={(e) => setStationFilter(e.target.value)}
              className="appearance-none bg-white border border-slate-300 text-slate-700 py-2.5 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ECA12A]/20 focus:border-[#ECA12A] text-sm font-medium min-w-[160px] cursor-pointer"
            >
              <option value="Station Name">Station Name</option>
              <option value="Station Alpha">Station Alpha</option>
              <option value="Station Beta">Station Beta</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Search Bar with Button */}
          <div className="flex rounded-lg shadow-sm">
            <div className="relative flex-grow">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search by ID: txn_001" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 pl-9 pr-4 py-2.5 border-y border-l border-slate-300 rounded-l-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#ECA12A] focus:border-[#ECA12A] transition-all"
              />
            </div>
            <button className="bg-[#ECA12A] hover:bg-[#d99020] text-slate-900 font-medium px-6 py-2.5 rounded-r-lg border-y border-r border-[#ECA12A] transition-colors text-sm">
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-4">
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((txn) => (
            <div key={txn.txnId} className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-shadow">
              
              <div className="flex items-center gap-4">
                {/* Icon */}
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">
                  <Flame className="w-6 h-6 fill-current text-slate-400" />
                </div>
                
                {/* Details */}
                <div>
                  <h4 className="font-bold text-slate-800">{txn.type}</h4>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-slate-500 mt-1">
                    <span>ID: {txn.txnId}</span>
                    <span className="hidden sm:inline text-slate-300">•</span>
                    <span>{txn.timeAgo}</span>
                  </div>
                </div>
              </div>

              {/* Right Side Info */}
              <div className="text-right">
                <h4 className="font-bold text-slate-800">₹ {txn.amount?.toLocaleString('en-IN')}</h4>
                <p className="text-sm text-slate-500 mb-1">{txn.fuelLiters ? `${txn.fuelLiters} L` : `${txn.tokens || 0} Tokens`}</p>
                <span className={`inline-block px-3 py-0.5 rounded-full text-xs font-semibold border lowercase ${
                  txn.status === 'SUCCESS' ? 'bg-green-50 text-green-500 border-green-100' : 'bg-red-50 text-red-500 border-red-100'
                }`}>
                  {txn.status}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-slate-500 bg-white rounded-xl border border-slate-100">
            No transactions found matching "{searchTerm}"
          </div>
        )}
      </div>

    </div>
  );
};

export default FuelAdminTransactions;
