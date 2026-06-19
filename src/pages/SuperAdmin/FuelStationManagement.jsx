import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, UserCog, Trash2, Fuel, Truck, Droplet, CircleDollarSign, X, ChevronDown } from 'lucide-react';
import Pagination from '../../components/Pagination';
import { useSelector } from 'react-redux';
import axiosInstance from '../../api/axiosInstance';

const FuelStationManagement = () => {
  const { user } = useSelector((state) => state.auth);

  const [data, setData] = useState({
    dashboard: {
      totalActiveStations: 0,
      totalCapacity: 0,
      fuelAvailable: 0,
      totalRevenue: 0
    },
    stations: []
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  const itemsPerPage = 10;

  // Normalize data to handle filter/search API mapping
  const normalizeStation = (item) => ({
    ...item,
    stationName: item.stationName || item.name || item.station_name || '',
    location: item.location || item.address || '',
    fuelAvailable: item.fuelAvailable || item.fuel_capacity || item.capacity || 0,
    pumps: item.pumps || item.pump_count || 0,
    staff: item.staff || item.staff_count || 0,
    status: item.status || '',
    revenue: item.revenue || item.total_revenue || 0,
    lastActivity: item.lastActivity || (item.updatedAt ? new Date(item.updatedAt).toISOString().split('T')[0] : '') || ''
  });

  // Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState('view'); // 'view' | 'edit'
  const [selectedStation, setSelectedStation] = useState(null);

  const fetchStations = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/fuel/management');
      if (response.data?.success) {
        setData({
          dashboard: response.data.data.dashboard || null,
          stations: response.data.data.fuelStations || []
        });
      }
    } catch (error) {
      console.error("Failed to fetch fuel stations", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setCurrentPage(1);
    if (!searchQuery.trim()) {
      fetchStations();
      return;
    }
    try {
      setLoading(true);
      const { data: resData } = await axiosInstance.get('/admin/search', {
        params: { q: searchQuery, resource: 'stations' }
      });
      if (resData?.success) {
        setData(prev => ({ ...prev, stations: (resData.data || []).map(normalizeStation) }));
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
      fetchStations();
      return;
    }
    try {
      setLoading(true);
      const { data: resData } = await axiosInstance.get('/admin/filter', {
        params: { resource: 'stations', status }
      });
      if (resData?.success) {
        setData(prev => ({ ...prev, stations: (resData.data || []).map(normalizeStation) }));
      }
    } catch (err) {
      console.error('Error filtering:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStations();
  }, []);

  const openDrawer = (station, mode) => {
    // Set default values for missing detailed fields
    setSelectedStation({ 
      ...station,
      streetAddress: station.location || '',
      city: 'Downtown District', // Dummy fallback
      state: 'CA', // Dummy fallback
      operatingHours: '24/7',
      phoneNumber: '+1 (555) 111-0001',
      email: 'jio@yopmail.com',
      current_fuel: station.fuelAvailable?.replace(/[^\d.-]/g, '') || '0',
      number_of_pumps: station.pumps || 0,
      staff_members: station.staff || 0,
      fuelCapacity: 50000 // Dummy fallback
    });
    setDrawerMode(mode);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedStation(null), 300);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedStation(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    try {
      const payload = {
        status: selectedStation.status,
        streetAddress: selectedStation.streetAddress,
        city: selectedStation.city,
        state: selectedStation.state,
        operatingHours: selectedStation.operatingHours,
        phoneNumber: selectedStation.phoneNumber,
        current_fuel: selectedStation.current_fuel.toString(),
        number_of_pumps: selectedStation.number_of_pumps.toString(),
        staff_members: selectedStation.staff_members.toString()
      };

      const response = await axiosInstance.put(`/fuel/management/${selectedStation.stationId}`, payload);
      
      if (response.data?.success) {
        closeDrawer();
        fetchStations(); // Refresh list
      }
    } catch (error) {
      console.error("Failed to update fuel station", error);
      alert("Failed to update fuel station.");
    }
  };

  const handleDeleteStation = async (stationId) => {
    if (!window.confirm("Are you sure you want to delete this fuel station? This will remove all operator user associations and station configurations.")) {
      return;
    }
    try {
      const response = await axiosInstance.delete(`/admin/fuel-stations/${stationId}`);
      if (response.data?.success) {
        alert("Fuel station deleted successfully.");
        fetchStations();
      } else {
        alert(response.data?.message || "Failed to delete fuel station.");
      }
    } catch (error) {
      console.error("Failed to delete fuel station", error);
      alert(error.response?.data?.message || "Failed to delete fuel station.");
    }
  };

  // Pagination logic (filtering handled by API now)
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentStations = data.stations.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(data.stations.length / itemsPerPage);

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1b2b4d]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 relative">
      
      {/* Welcome Banner */}
      <div className="bg-[#a2c8db] rounded-xl p-8 relative overflow-hidden flex items-center shadow-sm">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            Welcome Back, {user?.name || 'Mr. John'} 👋
          </h2>
          <p className="text-slate-700 mt-1 text-sm font-medium">Have a good day..</p>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-[#8cb8cc] to-transparent pointer-events-none"></div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Active Stations', value: data.dashboard?.totalActiveStations?.toString().padStart(2, '0') || '00', icon: Fuel },
          { label: 'Total Capacity', value: `${(data.dashboard?.totalCapacity || 0).toLocaleString()} L`, icon: Truck },
          { label: 'Fuel Available', value: `${(data.dashboard?.fuelAvailable || 0).toLocaleString()} L`, icon: Droplet },
          { label: 'Total Revenue', value: `$${(data.dashboard?.totalRevenue || 0).toLocaleString()}`, icon: CircleDollarSign },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <h3 className="text-base font-semibold text-slate-800 mb-1">{stat.label}</h3>
              <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
            </div>
            <div className="p-3">
              <stat.icon className="w-10 h-10 text-[#1b2b4d]" strokeWidth={1.5} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Table Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm pb-4">
        
        {/* Table Header & Controls */}
        <div className="p-6 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">Fuel Stations Management</h3>
          
          <div className="flex items-center gap-3">
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
                className="appearance-none bg-[#1b2b4d] hover:bg-slate-800 text-white pl-9 pr-9 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm focus:outline-none cursor-pointer"
              >
                <option value="default" disabled hidden>Filter</option>
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
                <option value="maintenance">Maintenance</option>
              </select>
              <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white pointer-events-none" />
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-white pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#f1f5f9] text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Station Name</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Fuel Available</th>
                <th className="px-6 py-4">Pumps</th>
                <th className="px-6 py-4">Staff</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Revenue</th>
                <th className="px-6 py-4">Last Activity</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentStations.length > 0 ? currentStations.map((item) => (
                <tr key={item.stationId} className="hover:bg-slate-50 transition-colors text-slate-600 font-medium">
                  <td className="px-6 py-5">{item.stationName}</td>
                  <td className="px-6 py-5">{item.location || 'N/A'}</td>
                  <td className="px-6 py-5">{item.fuelAvailable}</td>
                  <td className="px-6 py-5">{item.pumps}</td>
                  <td className="px-6 py-5">{item.staff}</td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-md text-xs font-semibold capitalize ${
                      item.status?.toLowerCase() === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 font-medium text-slate-700">${item.revenue}</td>
                  <td className="px-6 py-5 text-slate-500">{item.lastActivity}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => openDrawer(item, 'view')} 
                        className="w-6 h-6 rounded-full border border-blue-400 flex items-center justify-center text-blue-500 hover:bg-blue-50 transition-colors" 
                        title="View"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => openDrawer(item, 'edit')} 
                        className="w-6 h-6 rounded-full bg-[#1b2b4d] flex items-center justify-center text-white hover:bg-slate-800 transition-colors" 
                        title="Edit"
                      >
                        <UserCog className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteStation(item.id || item.stationId)}
                        className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 transition-colors" 
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="9" className="px-6 py-8 text-center text-slate-500">
                    No fuel stations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-6 border-t border-slate-200">
          <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            onPageChange={setCurrentPage} 
          />
        </div>
      </div>

      {/* --- SIDE DRAWER (View / Edit Information) --- */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeDrawer}
            aria-hidden="true"
          ></div>
          
          {/* Drawer Panel */}
          <div 
            className="relative bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col"
            style={{ width: '100%', maxWidth: '700px' }}
          >
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-800">
                {drawerMode === 'edit' ? 'Edit Fuel Station' : selectedStation?.stationName || 'Fuel Station'}
              </h2>
              <button onClick={closeDrawer} className="text-slate-400 hover:text-slate-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-8 overflow-y-auto flex-1 space-y-8">
              
              {drawerMode === 'view' ? (
                <>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="view-fuel" className="block text-sm font-semibold text-slate-800 mb-2">Fuel Available</label>
                      <input id="view-fuel" type="text" readOnly value={selectedStation?.fuelAvailable || ''} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-700 focus:outline-none bg-slate-50" />
                    </div>
                    <div>
                      <label htmlFor="view-capacity" className="block text-sm font-semibold text-slate-800 mb-2">Capacity Fuel</label>
                      <input id="view-capacity" type="text" readOnly value={selectedStation?.fuelCapacity ? `${selectedStation.fuelCapacity} L` : ''} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-700 focus:outline-none bg-slate-50" />
                    </div>
                    <div>
                      <label htmlFor="view-hours" className="block text-sm font-semibold text-slate-800 mb-2">Operating Hours</label>
                      <input id="view-hours" type="text" readOnly value={selectedStation?.operatingHours || ''} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-700 focus:outline-none bg-slate-50" />
                    </div>
                    <div>
                      <p className="block text-sm font-semibold text-slate-800 mb-2">Station Status</p>
                      <div className="w-full border border-slate-300 rounded-lg px-4 py-2.5 bg-slate-50 flex items-center">
                        <span className={`px-3 py-1 rounded-md text-xs font-semibold capitalize ${
                          selectedStation?.status?.toLowerCase() === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {selectedStation?.status || 'Active'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">Location Information</h3>
                    <div className="grid grid-cols-3 gap-6 text-sm">
                      <div className="col-span-1">
                        <p className="font-semibold text-slate-800 mb-1">Address</p>
                        <p className="text-slate-600 leading-relaxed">{selectedStation?.streetAddress}</p>
                      </div>
                      <div className="col-span-1">
                        <p className="font-semibold text-slate-800 mb-1">Phone</p>
                        <p className="text-slate-600">{selectedStation?.phoneNumber}</p>
                      </div>
                      <div className="col-span-1">
                        <p className="font-semibold text-slate-800 mb-1">Email</p>
                        <p className="text-slate-600 break-words">{selectedStation?.email}</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="edit-stationName" className="block text-sm font-semibold text-slate-800 mb-2">Station Name</label>
                      <input id="edit-stationName" type="text" name="stationName" value={selectedStation?.stationName || ''} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1b2b4d]" />
                    </div>
                    <div>
                      <label htmlFor="edit-status" className="block text-sm font-semibold text-slate-800 mb-2">Station Status</label>
                      <select id="edit-status" name="status" value={selectedStation?.status || 'active'} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1b2b4d] bg-white text-slate-700 capitalize">
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="edit-streetAddress" className="block text-sm font-semibold text-slate-800 mb-2">Street Address</label>
                      <input id="edit-streetAddress" type="text" name="streetAddress" value={selectedStation?.streetAddress || ''} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1b2b4d]" />
                    </div>
                    <div>
                      <label htmlFor="edit-operatingHours" className="block text-sm font-semibold text-slate-800 mb-2">Operating Hours</label>
                      <input id="edit-operatingHours" type="text" name="operatingHours" value={selectedStation?.operatingHours || ''} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1b2b4d]" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <label htmlFor="edit-city" className="block text-sm font-semibold text-slate-800 mb-2">City</label>
                      <input id="edit-city" type="text" name="city" value={selectedStation?.city || ''} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1b2b4d]" />
                    </div>
                    <div>
                      <label htmlFor="edit-state" className="block text-sm font-semibold text-slate-800 mb-2">State</label>
                      <input id="edit-state" type="text" name="state" value={selectedStation?.state || ''} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1b2b4d]" />
                    </div>
                    <div>
                      <label htmlFor="edit-operatingHours2" className="block text-sm font-semibold text-slate-800 mb-2">Operating Hours</label>
                      <input id="edit-operatingHours2" type="text" name="operatingHours" value={selectedStation?.operatingHours || ''} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1b2b4d]" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="edit-phoneNumber" className="block text-sm font-semibold text-slate-800 mb-2">Phone Number</label>
                      <input id="edit-phoneNumber" type="text" name="phoneNumber" value={selectedStation?.phoneNumber || ''} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1b2b4d]" />
                    </div>
                    <div>
                      <label htmlFor="edit-email" className="block text-sm font-semibold text-slate-800 mb-2">Email Address</label>
                      <input id="edit-email" type="text" name="email" value={selectedStation?.email || ''} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1b2b4d]" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="edit-fuelCapacity" className="block text-sm font-semibold text-slate-800 mb-2">Fuel Capacity (Liters)</label>
                      <input id="edit-fuelCapacity" type="number" name="fuelCapacity" value={selectedStation?.fuelCapacity || ''} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1b2b4d]" />
                    </div>
                    <div>
                      <label htmlFor="edit-current_fuel" className="block text-sm font-semibold text-slate-800 mb-2">Current Fuel (Liters)</label>
                      <input id="edit-current_fuel" type="number" name="current_fuel" value={selectedStation?.current_fuel || ''} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1b2b4d]" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="edit-number_of_pumps" className="block text-sm font-semibold text-slate-800 mb-2">Number of Pumps</label>
                      <input id="edit-number_of_pumps" type="number" name="number_of_pumps" value={selectedStation?.number_of_pumps || ''} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1b2b4d]" />
                    </div>
                    <div>
                      <label htmlFor="edit-staff_members" className="block text-sm font-semibold text-slate-800 mb-2">Staff Members</label>
                      <input id="edit-staff_members" type="number" name="staff_members" value={selectedStation?.staff_members || ''} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1b2b4d]" />
                    </div>
                  </div>
                </>
              )}

            </div>

            {/* Footer Buttons */}
            <div className="p-6 border-t border-slate-200 flex justify-end gap-3 bg-slate-50">
              {drawerMode === 'view' ? (
                <>
                  <button 
                    onClick={closeDrawer}
                    className="bg-white border border-[#1b2b4d] text-[#1b2b4d] hover:bg-slate-50 px-6 py-2 rounded-xl text-sm font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => setDrawerMode('edit')}
                    className="bg-[#1b2b4d] hover:bg-slate-800 text-white px-6 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
                  >
                    Edit
                    <UserCog className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => setDrawerMode('view')}
                    className="bg-white border border-[#1b2b4d] text-[#1b2b4d] hover:bg-slate-50 px-6 py-2 rounded-xl text-sm font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleUpdate}
                    className="bg-[#1b2b4d] hover:bg-slate-800 text-white px-6 py-2 rounded-xl text-sm font-semibold transition-colors"
                  >
                    Update
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default FuelStationManagement;
