import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  MapPin, Droplets, Ticket, Clock, AlertCircle, CheckCircle2, X, Loader2
} from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';

const InventoryManagement = () => {
  const { user } = useSelector((state) => state.auth);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);
  const [restockAmount, setRestockAmount] = useState('');
  const [formStatus, setFormStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastInfo, setToastInfo] = useState({ show: false, message: '', type: 'request' });

  const [inventoryData, setInventoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInventoryData = async () => {
      try {
        const response = await axiosInstance.get('/admin/inventory');
        if (response.data?.success) {
          setInventoryData(response.data.data);
        } else {
          setError('Failed to load inventory data');
        }
      } catch (err) {
        console.error('Error fetching inventory data:', err);
        setError('An error occurred while loading inventory data.');
      } finally {
        setLoading(false);
      }
    };

    fetchInventoryData();
  }, []);

  const handleRestockClick = (station) => {
    setSelectedStation(station);
    setShowRestockModal(true);
    setFormStatus(null);
    setRestockAmount('');
  };

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    if (!restockAmount || restockAmount <= 0) {
      setFormStatus({ type: 'error', message: 'Please enter a valid amount.' });
      return;
    }
    
    setIsSubmitting(true);
    setFormStatus(null);

    try {
      const response = await axiosInstance.post('/fuel/restock', {
        stationId: selectedStation.stationId,
        amount: Number(restockAmount)
      });

      if (response.data?.success) {
        setToastInfo({ show: true, message: response.data.message || `Restock request for ${restockAmount}L sent to ${selectedStation?.stationName}!`, type: 'request' });
        setTimeout(() => setToastInfo({ show: false, message: '', type: 'request' }), 3000);
        setShowRestockModal(false);
        setFormStatus(null);
      } else {
        setFormStatus({ type: 'error', message: response.data?.message || 'Failed to submit restock request.' });
      }
    } catch (err) {
      console.error('Error submitting restock request:', err);
      setFormStatus({ type: 'error', message: err.response?.data?.message || 'An error occurred during restock request.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F6F8]">
        <Loader2 className="w-8 h-8 text-[#ECA12A] animate-spin" />
      </div>
    );
  }

  if (error || !inventoryData) {
    return (
      <div className="p-8 max-w-[1400px] mx-auto text-center">
        <div className="bg-red-50 text-red-500 p-4 rounded-xl border border-red-100 font-bold">
          {error || 'Unable to load inventory data.'}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-6 pb-12">
      
      {/* Welcome Banner */}
      <div className="bg-[#ECA12A] rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          Welcome Back, {user?.username ? `Mr. ${user.username.split(' ')[0]}` : 'Mr. John'} 👋
        </h2>
        <p className="text-slate-800 mt-1 text-sm font-medium">Have a good day..</p>
      </div>

      <div className="border-b border-slate-200 pb-2">
        <h3 className="text-lg font-bold text-slate-800">Inventory Management</h3>
        <p className="text-slate-500 text-[11px] font-medium mt-0.5">Network-wide fuel balance and token redemption tracking</p>
      </div>

      {/* 3 Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-center">
          <p className="text-sm font-bold text-slate-900 mb-1">Total Fuel</p>
          <p className="text-3xl font-bold text-slate-900 mb-2">
            {inventoryData.summary.totalFuelBalance >= 1000 
              ? (inventoryData.summary.totalFuelBalance / 1000).toFixed(1) + 'K' 
              : inventoryData.summary.totalFuelBalance.toLocaleString()} L
          </p>
          <p className="text-[11px] font-medium text-slate-500">{inventoryData.summary.overallFillPercentage}% of capacity</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-center">
          <p className="text-sm font-bold text-slate-900 mb-1">Tokens Redeemed</p>
          <p className="text-3xl font-bold text-slate-900 mb-2">{inventoryData.summary.totalTokensRedeemed.toLocaleString()}</p>
          <p className="text-[11px] font-medium text-slate-500">Total customer redemptions</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-center">
          <p className="text-sm font-bold text-slate-900 mb-1">Daily Consumption</p>
          <p className="text-3xl font-bold text-slate-900 mb-2">{inventoryData.summary.dailyConsumption.toLocaleString()} L</p>
          <p className="text-[11px] font-medium text-slate-500">Network average</p>
        </div>
      </div>

      {/* Station-wise Inventory Header & Filters */}
      <div className="pt-4">
        <div className="border-b border-slate-200 pb-2 mb-6">
          <h3 className="text-base font-bold text-slate-800">Station-wise Inventory</h3>
          <p className="text-slate-500 text-[11px] font-medium mt-0.5">Real-time fuel balance and token redemptions</p>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <p className="text-sm font-bold text-slate-800">Filters</p>
          
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <select className="bg-white border border-slate-300 text-slate-700 px-4 py-2.5 rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#ECA12A] focus:border-[#ECA12A] min-w-[160px]">
              <option>Station Name</option>
              <option>Status</option>
              <option>Location</option>
            </select>
            
            <div className="flex w-full sm:w-auto">
              <div className="relative flex-1">
                <input 
                  type="text" 
                  placeholder="Search by name email" 
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 rounded-l-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#ECA12A] focus:border-[#ECA12A] transition-all"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <button className="bg-[#ECA12A] hover:bg-[#d69022] text-slate-900 px-6 py-2.5 rounded-r-lg text-xs font-bold transition-colors">
                Search
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Station Cards List */}
      <div className="space-y-6">
        {inventoryData.stations.map((station) => {
          const fillPercentage = Number(station.fillPercentage) || 0;
          
          return (
            <div key={station.stationId} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col hover:shadow-md transition-shadow">
              
              {/* Header */}
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{station.stationName}</h3>
                  <div className="flex items-center gap-1.5 text-slate-500 mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-medium">{station.location || 'N/A'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                    station.status === 'HEALTHY' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                  }`}>
                    {station.status}
                  </span>
                  <button 
                    onClick={() => handleRestockClick(station)}
                    className="flex items-center gap-2 bg-[#ECA12A] hover:bg-[#d69022] text-slate-900 px-4 py-2 rounded-lg text-[11px] font-bold transition-colors"
                  >
                    <Droplets className="w-3.5 h-3.5" />
                    Restock
                  </button>
                </div>
              </div>

              {/* Data Columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* Fuel Balance */}
                <div>
                  <div className="flex items-center gap-1.5 text-slate-400 mb-2">
                    <Droplets className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wide">Fuel Balance</span>
                  </div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl font-bold text-slate-900">{station.fuelBalance.toLocaleString()}</span>
                    <span className="text-sm font-bold text-slate-400">/ {station.fuelCapacity.toLocaleString()} L</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 mb-2 overflow-hidden">
                    <div 
                      className={`h-1.5 rounded-full transition-all duration-500 ${fillPercentage > 30 ? 'bg-[#ECA12A]' : 'bg-red-500'}`} 
                      style={{ width: `${fillPercentage}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] font-medium text-slate-500">
                    {Math.round(fillPercentage)}% full • ~{station.supplyRemainingHours}h supply remaining
                  </p>
                </div>

                {/* Tokens Redeemed */}
                <div>
                  <div className="flex items-center gap-1.5 text-slate-400 mb-2">
                    <Ticket className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wide">Tokens Redeemed</span>
                  </div>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-3xl font-bold text-slate-900">{station.tokensRedeemed.toLocaleString()}</span>
                    <span className="text-sm font-bold text-slate-400">tokens</span>
                  </div>
                  <p className="text-[10px] font-medium text-slate-500">
                    Customer fuel purchases via token exchange.
                  </p>
                </div>

                {/* Last Restock */}
                <div>
                  <div className="flex items-center gap-1.5 text-slate-400 mb-2">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wide">Last Restock</span>
                  </div>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-3xl font-bold text-slate-900">
                      {station.lastRestockDate ? new Date(station.lastRestockDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <p className="text-[10px] font-medium text-slate-500">
                    {station.daysSinceRestock} days ago
                  </p>
                </div>

              </div>

            </div>
          );
        })}
      </div>

      {/* Restock Modal */}
      {showRestockModal && selectedStation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-[400px] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Restock Request</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">{selectedStation.stationName}</p>
              </div>
              <button 
                onClick={() => setShowRestockModal(false)}
                className="p-1.5 text-[#ECA12A] hover:bg-orange-50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleRestockSubmit} className="space-y-4">
                {formStatus && (
                  <div className={`flex items-start gap-3 p-3 rounded-xl text-sm font-medium ${
                    formStatus.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {formStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4 mt-0.5" /> : <AlertCircle className="w-4 h-4 mt-0.5" />}
                    <span>{formStatus.message}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label htmlFor="restock-amount" className="text-xs font-bold text-slate-800">Amount to Restock (Liters)</label>
                  <input 
                    id="restock-amount"
                    type="number" 
                    placeholder="e.g. 5000" 
                    value={restockAmount}
                    onChange={(e) => setRestockAmount(e.target.value)}
                    required 
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#ECA12A] focus:border-[#ECA12A]" 
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Max capacity available: {(selectedStation.fuelCapacity - selectedStation.fuelBalance).toLocaleString()} L
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowRestockModal(false)}
                    className="flex-1 bg-white border border-slate-300 text-slate-700 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="flex-1 bg-[#ECA12A] hover:bg-[#d69022] text-slate-900 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Confirm Restock
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastInfo.show && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-top-5 fade-in duration-300 z-[100] ${
          toastInfo.type === 'request' ? 'bg-[#ECA12A]' : 'bg-red-600'
        }`}>
          {toastInfo.type === 'request' ? <Clock className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
          <div>
            <h4 className="font-bold text-sm">
              {toastInfo.type === 'request' ? 'Request Submitted' : 'Error'}
            </h4>
            <p className="text-xs text-white/90">
              {toastInfo.message}
            </p>
          </div>
        </div>
      )}

    </div>
  );
};

export default InventoryManagement;
