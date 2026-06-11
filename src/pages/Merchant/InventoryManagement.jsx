import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { X } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';

const InventoryManagement = () => {
  const { user } = useSelector((state) => state.auth);
  
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Modal Form State
  const [selectedDenomination, setSelectedDenomination] = useState('');
  const [unitsToAdd, setUnitsToAdd] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/merchant/inventory');
      if (response.data && response.data.success) {
        setInventory(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleAddInventory = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      
      // MOCK API CALL for adding inventory (Replace with actual endpoint when available)
      // await axiosInstance.post('/merchant/inventory/add', {
      //   denomination: Number(selectedDenomination),
      //   units: Number(unitsToAdd)
      // });
      
      // Simulating a network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Inventory added successfully! (Mock API)');
      setIsModalOpen(false);
      setSelectedDenomination('');
      setUnitsToAdd('');
      
      fetchInventory(); // Refresh data
    } catch (err) {
      console.error('Failed to add inventory:', err);
      alert('Failed to add inventory.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#59111c]"></div>
      </div>
    );
  }

  const stats = inventory || {};
  const breakdown = stats.breakdown || [];

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 p-8 relative font-sans">
      
      {/* Welcome Banner */}
      <div className="bg-[#59111c] rounded-xl p-6 relative overflow-hidden shadow-sm">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          Welcome Back, {user?.name ? (user.name.includes('Mr') ? user.name : `Mr. ${user.name}`) : 'Mr. John'} 👋
        </h2>
        <p className="text-red-100 mt-1 text-sm font-medium">Have a good day..</p>
      </div>

      {/* Header Area */}
      <div className="flex justify-between items-end border-b border-slate-200 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Inventory Management</h3>
          <p className="text-slate-500 text-[11px] font-medium mt-0.5">Manage your token inventory and availability</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#59111c] hover:bg-[#7a1a28] text-white px-6 py-2.5 rounded-lg text-xs font-bold transition-colors shadow-sm"
        >
          Add more Inventory
        </button>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-[16px] p-6 shadow-sm border border-slate-200">
          <p className="text-xs font-bold text-slate-800 mb-2">Total Value</p>
          <p className="text-3xl font-black text-slate-900 mb-4">₹{stats.totalValue?.toLocaleString() || 0}</p>
          <p className="text-[11px] text-slate-500 font-medium">Total inventory value</p>
        </div>

        <div className="bg-white rounded-[16px] p-6 shadow-sm border border-slate-200">
          <p className="text-xs font-bold text-slate-800 mb-2">Total Units</p>
          <p className="text-3xl font-black text-slate-900 mb-4">{stats.totalUnits?.toLocaleString() || 0}</p>
          <p className="text-[11px] text-slate-500 font-medium">Total available units</p>
        </div>

        <div className="bg-white rounded-[16px] p-6 shadow-sm border border-slate-200">
          <p className="text-xs font-bold text-slate-800 mb-2">Denominations</p>
          <p className="text-3xl font-black text-slate-900 mb-4">{stats.denominations || breakdown.length}</p>
          <p className="text-[11px] text-slate-500 font-medium">Active denomination types</p>
        </div>
      </div>

      {/* Inventory Breakdown Section */}
      <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-6">
        <h3 className="text-base font-bold text-slate-800 mb-1">Inventory Breakdown</h3>
        <p className="text-[11px] font-medium text-slate-500 mb-6">Detailed breakdown of all denomination inventories</p>

        {breakdown.length > 0 ? (
          <div className="space-y-6">
            {breakdown.map((item, index) => {
              // Safely handle totalTokens being 0 to avoid Infinity/NaN width calculations
              const total = item.totalTokens || 1; 
              const available = item.availableTokens || 0;
              const fillPercentage = Math.min((available / total) * 100, 100);

              return (
                <div key={index} className="flex items-center gap-6">
                  {/* Numbering */}
                  <span className="text-slate-400 font-medium text-sm w-6">
                    {(index + 1).toString().padStart(2, '0')}
                  </span>
                  
                  {/* Progress Bar Container */}
                  <div className="flex-1 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <p className="font-bold text-slate-900 text-sm">₹{item.denomination}</p>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                          ₹{item.totalValue?.toLocaleString() || 0} total value
                        </p>
                      </div>
                      <p className="text-xs font-bold text-[#59111c]">
                        {available}/{item.totalTokens || 0}
                      </p>
                    </div>
                    {/* The Bar */}
                    <div className="w-full bg-slate-200 rounded-full h-2.5 mt-3 overflow-hidden">
                      <div 
                        className="bg-[#59111c] h-2.5 rounded-full transition-all duration-500 ease-out" 
                        style={{ width: `${fillPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-slate-500 py-10 text-sm">
            No inventory denominations found.
          </div>
        )}
      </div>

      {/* Add Inventory Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-[480px] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Add more Inventory</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">Add more token inventory units to your existing stock</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-[#59111c] hover:bg-red-50 rounded-lg transition-colors"
                disabled={isSubmitting}
              >
                <X className="w-5 h-5" strokeWidth={3} />
              </button>
            </div>
            
            <div className="p-6">
              <form className="space-y-5" onSubmit={handleAddInventory}>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-2">Token Denomination</label>
                  <select 
                    value={selectedDenomination}
                    onChange={(e) => setSelectedDenomination(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#59111c] focus:border-[#59111c] bg-white text-slate-800" 
                    required 
                  >
                    <option value="" disabled>Select Denomination</option>
                    {breakdown.map((item, idx) => (
                      <option key={idx} value={item.denomination}>
                        ₹{item.denomination}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-2">Number of Units to Add</label>
                  <input 
                    type="number" 
                    min="1"
                    value={unitsToAdd}
                    onChange={(e) => setUnitsToAdd(e.target.value)}
                    placeholder="Enter quantity" 
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#59111c] focus:border-[#59111c]" 
                    required 
                  />
                  <p className="text-[10px] text-slate-400 mt-1.5">Specify the quantity of units to add to inventory</p>
                </div>
                
                <div className="pt-4 grid grid-cols-2 gap-4">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSubmitting}
                    className="w-full border border-slate-300 hover:bg-slate-50 text-slate-700 py-3 rounded-lg text-sm font-bold transition-colors disabled:opacity-70"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-[#59111c] hover:bg-[#7a1a28] text-white py-3 rounded-lg text-sm font-bold transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      'Confirm Addition'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default InventoryManagement;
