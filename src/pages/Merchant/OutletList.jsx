import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { MapPin, Plus, X } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';

const OutletList = () => {
  const { user } = useSelector((state) => state.auth);
  
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    outletName: '',
    createEmailId: '',
    createPassword: '',
    location: '',
    outletManager: '',
    contactNumber: ''
  });

  // Fetch outlets
  const fetchOutlets = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/merchant/outlets');
      if (response.data && response.data.success) {
        setOutlets(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch outlets:', err);
      alert('Failed to load outlets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutlets();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateOutlet = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      // Constructing payload matching backend expectation
      const payload = {
        "outletName": formData.outletName,
        "createEmailId": formData.createEmailId,
        "createPassword": formData.createPassword,
        "location": formData.location,
        "outletManager": formData.outletManager,
        "contactNumber": formData.contactNumber
      };

      const response = await axiosInstance.post('/merchant/outlets', payload);
      
      if (response.data) {
        alert('Outlet created successfully!');
        setIsModalOpen(false);
        // Reset form
        setFormData({
          outletName: '',
          createEmailId: '',
          createPassword: '',
          location: '',
          outletManager: '',
          contactNumber: ''
        });
        // Refresh the list
        fetchOutlets();
      }
    } catch (err) {
      console.error('Failed to create outlet:', err);
      alert(err.response?.data?.message || 'Failed to create outlet. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 p-8 relative font-sans">
      {/* Welcome Banner */}
      <div className="bg-[#59111c] rounded-xl p-6 relative overflow-hidden shadow-sm">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          Welcome Back, {user?.name ? (user.name.includes('Mr') ? user.name : `Mr. ${user.name}`) : 'Mr. John'} 👋
        </h2>
        <p className="text-red-100 mt-1 text-sm font-medium">Have a good day..</p>
      </div>

      <div>
        <p className="text-xs text-slate-500 font-medium mb-1">Dashboard / Outlet List</p>
        <h3 className="text-lg font-bold text-slate-800">Outlet Management</h3>
        <p className="text-slate-500 text-sm">Monitor and manage all your business locations</p>
        <hr className="mt-4 border-slate-200" />
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#59111c]"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Existing Outlets */}
          {outlets.map((outlet) => (
            <div key={outlet.id} className="bg-white rounded-[20px] p-6 shadow-sm border-[1.5px] border-[#59111c] flex flex-col justify-between h-full">
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 leading-tight">{outlet.name}</h3>
                    <div className="flex items-center text-xs text-slate-500 mt-1.5 font-medium">
                      <MapPin className="w-3 h-3 mr-1" /> {outlet.location}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                    outlet.status === 'active' ? 'bg-green-100 text-green-700' : 
                    outlet.status === 'pending' ? 'bg-orange-100 text-orange-700' : 
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {outlet.status || 'Unknown'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-y-5 mt-6 mb-8">
                  <div>
                    <p className="text-[11px] text-slate-500 font-medium">Revenue Today</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">₹ {outlet.revenueToday || 0}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500 font-medium">DFS Tokens</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">₹ {outlet.dfsTokens || 0}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500 font-medium">Tokens Minted</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">{outlet.tokensMinted || 0}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500 font-medium">Settlement</p>
                    <p className="text-sm font-bold text-emerald-600 mt-0.5">₹ {outlet.settlement || 0}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center mt-auto border-t border-slate-100 pt-4">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-[#59111c] text-white flex items-center justify-center text-xs font-bold border-2 border-white z-10 shadow-sm uppercase">
                    {outlet.manager?.substring(0, 2) || 'JD'}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold border-2 border-white z-0 shadow-sm">
                    +1
                  </div>
                </div>
                <Link 
                  to={`/merchant/outlets/${outlet.id}`}
                  className="bg-[#59111c] hover:bg-[#7a1a28] text-white px-5 py-2 rounded-lg text-xs font-bold transition-colors"
                >
                  View Analytics
                </Link>
              </div>
            </div>
          ))}

          {/* Add New Outlet Card */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-white rounded-[20px] p-6 shadow-sm border border-slate-300 flex flex-col justify-center items-center h-full min-h-[280px] hover:bg-slate-50 transition-colors group"
          >
            <div className="w-12 h-12 flex items-center justify-center text-slate-800 mb-3 group-hover:scale-110 transition-transform">
              <Plus strokeWidth={2.5} className="w-10 h-10" />
            </div>
            <span className="text-sm font-bold text-slate-800">Add New Outlet</span>
          </button>

        </div>
      )}

      {/* Add Outlet Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-[480px] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Add New Outlet</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">Enter the details for the new business location.</p>
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
              <form className="space-y-4" onSubmit={handleCreateOutlet}>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">Outlet Name</label>
                  <input 
                    type="text" 
                    name="outletName"
                    value={formData.outletName}
                    onChange={handleInputChange}
                    placeholder="Enter Name" 
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#59111c] focus:border-[#59111c]" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">Create e-mail ID</label>
                  <input 
                    type="email" 
                    name="createEmailId"
                    value={formData.createEmailId}
                    onChange={handleInputChange}
                    placeholder="Create e-mail ID" 
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#59111c] focus:border-[#59111c]" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">Create Password</label>
                  <input 
                    type="password" 
                    name="createPassword"
                    value={formData.createPassword}
                    onChange={handleInputChange}
                    placeholder="Create Password" 
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#59111c] focus:border-[#59111c]" 
                    required 
                    minLength={8}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">Location</label>
                  <input 
                    type="text" 
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="Enter Location" 
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#59111c] focus:border-[#59111c]" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">Outlet Manager</label>
                  <input 
                    type="text" 
                    name="outletManager"
                    value={formData.outletManager}
                    onChange={handleInputChange}
                    placeholder="Enter Outlet Manager Name" 
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#59111c] focus:border-[#59111c]" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">Contact Number</label>
                  <input 
                    type="text" 
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleInputChange}
                    placeholder="+91-7877593063" 
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#59111c] focus:border-[#59111c]" 
                    required 
                  />
                </div>
                
                <div className="pt-2">
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-[#59111c] hover:bg-[#7a1a28] text-white py-3 rounded-lg text-sm font-bold transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      'Create Outlet'
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

export default OutletList;
