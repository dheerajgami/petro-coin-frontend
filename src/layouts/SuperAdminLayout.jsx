import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { io } from 'socket.io-client';
import axiosInstance from '../api/axiosInstance';
import { 
  LayoutDashboard, Users, Store, Fuel, Coins, 
  ArrowRightLeft, ShieldCheck, Truck, BarChart3, 
  Settings, LogOut, Search, Bell, Droplets, X, CheckCheck, Clock, UserCheck
} from 'lucide-react';



const SuperAdminLayout = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef(null);
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const fetchProfileDetails = async () => {
    setProfileLoading(true);
    setShowProfileModal(true);
    try {
      const res = await axiosInstance.get('/admin/profile');
      if (res.data?.success) {
        setProfileData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setProfileLoading(false);
    }
  };

  // Format time ago

  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  // Fetch live notifications from API
  const fetchLiveNotifications = useCallback(async () => {
    try {
      setNotifLoading(true);
      const res = await axiosInstance.get('/admin/notifications/live');
      if (res.data?.success) {
        const fetched = res.data.data || [];
        setNotifications(fetched);
        setUnreadCount(fetched.filter(n => !n.is_read).length);
      }
    } catch (err) {
      console.error('Failed to fetch admin notifications:', err);
    } finally {
      setNotifLoading(false);
    }
  }, []);

  // Toggle bell and fetch
  const handleBellClick = () => {
    const next = !showNotifications;
    setShowNotifications(next);
    if (next) fetchLiveNotifications();
  };

  // Socket: add new live notification at top
  useEffect(() => {
    let activeSocket = null;
    if (user && user.id) {
      activeSocket = io('http://192.168.1.46:5000', {
        query: { userId: user.id, role: user.role }
      });
      activeSocket.on('new_notification', (data) => {
        console.log('Nayi notification aayi:', data);
        setNotifications((prev) => [{ ...data, is_read: false, created_at: new Date().toISOString() }, ...prev]);
        setUnreadCount((c) => c + 1);
      });
    }
    return () => {
      if (activeSocket) activeSocket.disconnect();
    };
  }, [user]);

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef(null);

  // Close dropdowns when clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = [
    { name: 'Dashboard', path: '/super-admin', icon: LayoutDashboard },
    { name: 'Customer Management', path: '/super-admin/customers', icon: Users },
    { name: 'Merchant Management', path: '/super-admin/merchants', icon: Store },
    { name: 'Fuel Station Management', path: '/super-admin/fuel-stations', icon: Fuel },
    { name: 'Transporter', path: '/super-admin/transporters', icon: Truck },
    { name: 'Merchant Admin', path: '/super-admin/merchant-admin', icon: UserCheck },
    { name: 'Fuel Admin', path: '/super-admin/fuel-admin', icon: UserCheck },
    { name: 'Token Management', path: '/super-admin/tokens', icon: Coins },
    { name: 'Transactions', path: '/super-admin/transactions', icon: ArrowRightLeft },
    { name: 'Compliance', path: '/super-admin/compliance', icon: ShieldCheck },
    { name: 'Report & Analytics', path: '/super-admin/reports', icon: BarChart3 },
    { name: 'System Settings', path: '/super-admin/settings', icon: Settings },
  ];

  const filteredNavItems = navItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNotificationClick = async (notif) => {
    // Optimistic remove
    setNotifications((prev) => prev.filter(n => n.id !== notif.id));
    if (!notif.is_read) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    
    // API call to delete or mark as read
    try {
      await axiosInstance.put(`/admin/notifications/${notif.id}/read`);
      // or axiosInstance.delete(`/admin/notifications/${notif.id}`) if you strictly want to delete it from DB
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
    
    setShowNotifications(false);
    
    // Navigate based on type
    const type = notif.type || '';
    if (type.includes('inventory_request') && !type.includes('outlet')) {
      navigate('/super-admin/tokens');
    } else if (type.includes('outlet') || type.includes('merchant')) {
      navigate('/super-admin/merchants');
    } else if (type.includes('kyc') || type.includes('compliance')) {
      navigate('/super-admin/compliance');
    } else {
      navigate('/super-admin'); // fallback
    }
  };

  const renderNotificationsContent = () => {
    if (notifLoading) {
      return (
        <div className="p-8 flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-[#1b2b4d] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Loading notifications...</p>
        </div>
      );
    }

    if (notifications.length === 0) {
      return (
        <div className="p-10 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
            <Bell className="w-6 h-6 text-slate-300" />
          </div>
          <p className="text-sm font-medium text-slate-500">No new notifications</p>
          <p className="text-xs text-slate-400">You're all caught up!</p>
        </div>
      );
    }

    return (
      <ul className="divide-y divide-slate-100">
        {notifications.map((notif, index) => (
          <li
            key={notif.id || index}
            onClick={() => handleNotificationClick(notif)}
            className={`px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors ${
              notif.is_read ? 'border-l-4 border-l-transparent' : 'bg-blue-50/50 border-l-4 border-l-blue-500'
            }`}
          >
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${
                  notif.is_read ? 'text-slate-700' : 'text-slate-900'
                }`}>
                  {notif.title || notif.type || 'Notification'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                  {notif.message || notif.body || ''}
                </p>
              </div>
              <div className="flex items-center gap-1 text-slate-400 shrink-0">
                <Clock className="w-3 h-3" />
                <span className="text-[10px]">{timeAgo(notif.created_at)}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <>
      <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1b2b4d] text-slate-300 flex flex-col h-full shrink-0 z-10 shadow-xl">
        {/* Logo Area */}
        <div className="h-[72px] flex items-center px-6 border-b border-slate-700/50 shrink-0">
          <Droplets className="w-7 h-7 text-blue-400 mr-2 shrink-0 animate-pulse" />
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-white leading-none">Daily</span>
            <span className="text-[10px] text-slate-400 font-normal mt-0.5">Financial Services</span>
          </div>
        </div>

        {/* Sidebar Nav */}
        <div className="flex-1 overflow-y-auto py-6 no-scrollbar">
          <ul className="space-y-1 px-4">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== '/super-admin');
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive 
                        ? 'bg-white text-[#1b2b4d] font-bold shadow-md' 
                        : 'hover:bg-white/5 hover:text-white text-slate-300'
                    }`}
                  >
                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#1b2b4d]' : 'text-slate-400'}`} />
                    <span className="text-sm">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Logout Button */}
        <div className="p-4 mb-2">
          <button 
            onClick={() => dispatch(logout())}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl hover:bg-white/5 hover:text-red-400 transition-colors text-left text-slate-300"
          >
            <LogOut className="w-5 h-5 text-slate-400 shrink-0" />
            <span className="text-sm font-medium">Log Out</span>
          </button>
        </div>
      </aside>

      {/* Right-side container (Header + Content) */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Topbar */}
        <header className="h-[72px] bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-20">
          {/* Search Bar */}
          <div className="flex-1 max-w-xl" ref={searchRef}>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search features, modules..." 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
                className="w-full pl-11 pr-4 py-2 bg-slate-100 border border-transparent rounded-full focus:bg-white focus:border-slate-300 focus:ring-4 focus:ring-slate-100 outline-none text-sm transition-all"
              />
              {/* Search Dropdown */}
              {showSearchResults && searchQuery.trim() !== '' && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 shadow-xl rounded-xl overflow-hidden z-50">
                  {filteredNavItems.length > 0 ? (
                    <ul className="max-h-64 overflow-y-auto">
                      {filteredNavItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <li key={item.path}>
                            <Link 
                              to={item.path} 
                              onClick={() => {
                                setShowSearchResults(false);
                                  setSearchQuery('');
                                }}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
                              >
                                <Icon className="w-4 h-4 text-slate-400" />
                                <span className="text-sm font-medium text-slate-700">{item.name}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <div className="p-4 text-sm text-slate-500 text-center">No modules found for "{searchQuery}"</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-5 ml-4">
              <div className="relative" ref={notifRef}>
                <button 
                  onClick={handleBellClick}
                  className="relative p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors text-slate-600 animate-none"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
                
                {/* Notification Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
                    {/* Header */}
                    <div className="bg-[#1b2b4d] px-4 py-3 flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-white text-sm">Live Notifications</h3>
                        {unreadCount > 0 && (
                          <p className="text-blue-200 text-xs mt-0.5">{unreadCount} unread</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {notifications.length > 0 && (
                          <button
                            onClick={() => { setNotifications([]); setUnreadCount(0); }}
                            className="flex items-center gap-1 text-xs text-blue-200 hover:text-white transition-colors"
                            title="Clear All"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            Clear
                          </button>
                        )}
                        <button onClick={() => setShowNotifications(false)} className="text-slate-300 hover:text-white ml-1">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="max-h-[400px] overflow-y-auto">
                      {renderNotificationsContent()}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-slate-100 px-4 py-2 bg-slate-50 flex justify-between items-center">
                      <span className="text-xs text-slate-400">{notifications.length} total notifications</span>
                      <button
                        onClick={fetchLiveNotifications}
                        className="text-xs font-semibold text-[#1b2b4d] hover:underline"
                      >
                        Refresh
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <div 
                onClick={fetchProfileDetails}
                className="flex items-center gap-3 cursor-pointer p-1.5 hover:bg-slate-100 rounded-full transition-colors"
              >
                <img 
                  src={profileData?.profile_photo 
                    ? (profileData.profile_photo.startsWith('http') ? profileData.profile_photo : `${axiosInstance.defaults.baseURL.replace('/api', '')}/${profileData.profile_photo.replace(/^\/+/, '')}`) 
                    : `https://ui-avatars.com/api/?name=${user?.name || 'Super admin'}&background=e2e8f0&color=1e293b`} 
                  alt="User" 
                  className="w-9 h-9 rounded-full object-cover border border-slate-200"
                />
                <div className="flex flex-col hidden sm:flex">
                  <span className="text-sm font-semibold text-slate-800">{user?.name || 'Super admin'}</span>
                  <span className="text-xs text-slate-500">{user?.email || 'admin@gmail.com'}</span>
                </div>
                <svg className="w-4 h-4 text-slate-400 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </header>
          
          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-8 bg-slate-50/50 relative">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Profile Details Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200 font-sans">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl relative border border-slate-200/50">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
              <h3 className="text-lg font-bold text-[#1b2b4d] flex items-center gap-2">
                <span>Admin Profile Details</span>
              </h3>
              <button 
                onClick={() => setShowProfileModal(false)} 
                className="p-2.5 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50 min-h-[300px]">
              {profileLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <div className="w-12 h-12 border-4 border-slate-200 border-t-[#1b2b4d] rounded-full animate-spin"></div>
                  <p className="text-slate-500 font-semibold text-sm">Fetching profile details...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Avatar & Hero */}
                  <div className="flex flex-col items-center text-center">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-slate-200 bg-white mb-3 shadow-md flex items-center justify-center">
                      {profileData?.profile_photo ? (
                        <img 
                          src={profileData.profile_photo.startsWith('http') ? profileData.profile_photo : `${axiosInstance.defaults.baseURL.replace('/api', '')}/${profileData.profile_photo.replace(/^\/+/, '')}`} 
                          alt="Avatar" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full bg-[#1b2b4d] text-white flex items-center justify-center text-3xl font-bold">
                          {(profileData?.fullName || user?.name || 'Super Admin').split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                      )}
                    </div>
                    <h4 className="text-lg font-bold text-[#1b2b4d]">{profileData?.fullName || user?.name || 'Super Admin'}</h4>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">
                      {capitalize(profileData?.role || user?.role || 'admin')}
                    </p>
                  </div>

                  {/* Profile details grid */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Admin ID</span>
                        <span className="font-bold text-[#1b2b4d] mt-1">
                          {profileData?.id ? `ADM${String(profileData.id).padStart(4, '0')}` : '-'}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Account Status</span>
                        <span className="mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            (profileData?.status || 'active').toLowerCase() === 'active' 
                              ? 'bg-emerald-50 text-emerald-700' 
                              : 'bg-red-50 text-red-700'
                          }`}>
                            {capitalize(profileData?.status || 'Active')}
                          </span>
                        </span>
                      </div>
                      <div className="flex flex-col col-span-2 border-t border-slate-50 pt-3">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Email Address</span>
                        <span className="font-semibold text-slate-700 mt-1">{profileData?.email || user?.email || 'admin@gmail.com'}</span>
                      </div>
                      <div className="flex flex-col col-span-2 border-t border-slate-50 pt-3">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Mobile Number</span>
                        <span className="font-semibold text-slate-700 mt-1">{profileData?.mobileNumber || '-'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 flex justify-between items-center bg-white">
              <button 
                onClick={() => {
                  setShowProfileModal(false);
                  dispatch(logout());
                }} 
                className="px-5 py-2.5 rounded-xl bg-red-50 text-red-600 text-sm font-bold hover:bg-red-100 transition-colors flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Log Out
              </button>
              <button 
                onClick={() => setShowProfileModal(false)} 
                className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SuperAdminLayout;
