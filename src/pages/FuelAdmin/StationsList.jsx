import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  Search, Filter, Plus, MapPin, User, Phone, 
  ArrowRight, FileText, X, CheckCircle2, AlertCircle, Loader2
} from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';

const StationsList = () => {
  const { user } = useSelector((state) => state.auth);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formStatus, setFormStatus] = useState(null);
  
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    stationLegalName: '',
    physicalLocation: '',
    internalStationId: '',
    officialContactNumber: '',
    stationManagerName: '',
    detailedAddress: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStations = async () => {
    try {
      const response = await axiosInstance.get('/admin/stations');
      if (response.data?.success) {
        setStations(response.data.data.stations);
      } else {
        setError('Failed to load stations data');
      }
    } catch (err) {
      console.error('Error fetching stations:', err);
      setError('An error occurred while loading stations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStations();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddStation = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormStatus(null);
    
    try {
      const response = await axiosInstance.post('/admin/stations', formData);
      if (response.data?.success) {
        setFormStatus({ type: 'success', message: 'Station created successfully!' });
        
        // Refresh the list
        fetchStations();
        
        // Close modal after 1.5 seconds
        setTimeout(() => {
          setShowAddModal(false);
          setFormStatus(null);
          setFormData({
            stationLegalName: '',
            physicalLocation: '',
            internalStationId: '',
            officialContactNumber: '',
            stationManagerName: '',
            detailedAddress: ''
          });
        }, 1500);
      } else {
        setFormStatus({ type: 'error', message: response.data.message || 'Failed to create station' });
      }
    } catch (err) {
      console.error('Error creating station:', err);
      setFormStatus({ 
        type: 'error', 
        message: err.response?.data?.message || 'An error occurred while creating the station' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatLastActive = (dateString) => {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now - date) / 1000);
      
      if (diffInSeconds < 60) return 'Just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
      return `${Math.floor(diffInSeconds / 86400)} days ago`;
    } catch (e) {
      console.warn('Invalid date string:', dateString, e);
      return 'Invalid date';
    }
  };

  const getStatusBadgeClass = (status) => {
    if (status === 'active') return 'bg-emerald-100 text-emerald-700';
    if (status === 'Maintenance') return 'bg-orange-100 text-orange-700';
    return 'bg-slate-100 text-slate-600';
  };

  const filteredStations = stations.filter(station => 
    station.stationName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    station.stationId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F6F8]">
        <Loader2 className="w-8 h-8 text-[#ECA12A] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-[1400px] mx-auto text-center">
        <div className="bg-red-50 text-red-500 p-4 rounded-xl border border-red-100 font-bold">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-[#ECA12A] rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          Welcome Back, {typeof user?.username === 'string' ? `Mr. ${user.username.split(' ')[0]}` : 'Mr. John'} 👋
        </h2>
        <p className="text-slate-800 mt-1 text-sm font-medium">Have a good day..</p>
      </div>

      <div className="border-b border-slate-200 pb-2">
        <h3 className="text-lg font-bold text-slate-800">Stations</h3>
        <p className="text-slate-500 text-[11px] font-medium mt-0.5">Stations Management System</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search stations by name or ID" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ECA12A]/20 focus:border-[#ECA12A] transition-all"
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button 
            onClick={() => { setShowAddModal(true); setFormStatus(null); }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#ECA12A] hover:bg-[#d69022] text-slate-900 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add New DFS Station
          </button>
        </div>
      </div>

      {/* Stations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredStations.length > 0 ? (
          filteredStations.map((station) => (
            <div key={station.stationId} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
              <div className="p-6 flex-1">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                      <h3 className="font-bold text-slate-900 text-base truncate" title={station.stationName}>{station.stationName}</h3>
                      <p className="text-[11px] font-medium text-slate-500 mt-0.5">{station.stationId}</p>
                    </div>
                  </div>
                </div>

                {/* Status & Last Active */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wide">Status</p>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${getStatusBadgeClass(station.status)}`}>
                      {station.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wide">Last Active</p>
                    <p className="text-sm font-medium text-slate-700">{formatLastActive(station.lastActivity)}</p>
                  </div>
                </div>

                {/* Info Items */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-medium truncate" title={station.location}>{station.location || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <User className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-medium truncate" title={station.admin || 'Unassigned'}>{station.admin || 'Unassigned'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-medium truncate">{station.phone || 'N/A'}</span>
                  </div>
                </div>

                {/* Tokens & Revenue */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wide">Total Tokens</p>
                    <p className="text-lg font-black text-slate-900">{station.totalTokens}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wide">Total Revenue</p>
                    <p className="text-lg font-black text-slate-900">₹{Number(station.totalRevenue).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>

              {/* Footer Button */}
              <Link 
                to={`/fuel-admin/stations/${station.stationId}`}
                className="bg-slate-50 border-t border-slate-100 p-4 flex items-center justify-between text-blue-500 hover:bg-blue-50 hover:text-blue-600 transition-colors group"
              >
                <span className="text-xs font-bold">Station Analytics</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-slate-100">
            No stations found matching "{searchTerm}"
          </div>
        )}
      </div>

      {/* Add New Station Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-[500px] my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Add New DFS Station</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">Configure and onboard a new Digital Fuel Station unit</p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-[#ECA12A] hover:bg-orange-50 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleAddStation} className="space-y-4">
                {formStatus && (
                  <div className={`flex items-start gap-3 p-3 rounded-xl text-sm font-medium ${
                    formStatus.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {formStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4 mt-0.5" /> : <AlertCircle className="w-4 h-4 mt-0.5" />}
                    <span>{formStatus.message}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label htmlFor="stationLegalName" className="text-xs font-bold text-slate-800">Station Legal Name</label>
                  <input id="stationLegalName" type="text" name="stationLegalName" value={formData.stationLegalName} onChange={handleInputChange} placeholder="Station Gamma" required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#ECA12A] focus:border-[#ECA12A]" />
                </div>
                
                <div className="space-y-1.5">
                  <label htmlFor="physicalLocation" className="text-xs font-bold text-slate-800">Physical Location</label>
                  <input id="physicalLocation" type="text" name="physicalLocation" value={formData.physicalLocation} onChange={handleInputChange} placeholder="City State" required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#ECA12A] focus:border-[#ECA12A]" />
                </div>
                
                <div className="space-y-1.5">
                  <label htmlFor="internalStationId" className="text-xs font-bold text-slate-800">Internal Station ID (DFS-XXX)</label>
                  <input id="internalStationId" type="text" name="internalStationId" value={formData.internalStationId} onChange={handleInputChange} placeholder="DFS-006" required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#ECA12A] focus:border-[#ECA12A]" />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="officialContactNumber" className="text-xs font-bold text-slate-800">Official Contact Number</label>
                  <input id="officialContactNumber" type="text" name="officialContactNumber" value={formData.officialContactNumber} onChange={handleInputChange} placeholder="+91-XXXXXXXXX" required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#ECA12A] focus:border-[#ECA12A]" />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="stationManagerName" className="text-xs font-bold text-slate-800">Station Manager Name</label>
                  <input id="stationManagerName" type="text" name="stationManagerName" value={formData.stationManagerName} onChange={handleInputChange} placeholder="Full Name" required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#ECA12A] focus:border-[#ECA12A]" />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="detailedAddress" className="text-xs font-bold text-slate-800">Detailed Address</label>
                  <textarea id="detailedAddress" rows="3" name="detailedAddress" value={formData.detailedAddress} onChange={handleInputChange} placeholder="Complete Address" required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#ECA12A] focus:border-[#ECA12A] resize-none"></textarea>
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 bg-[#ECA12A] hover:bg-[#d69022] text-slate-900 py-3 rounded-lg text-sm font-bold transition-colors mt-2 disabled:opacity-70"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create DFS Station'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StationsList;
