import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, setUser } from '../store/slices/authSlice';
import axiosInstance from '../api/axiosInstance';
import { io } from 'socket.io-client';
import { 
  LayoutDashboard, Store, Package, ArrowRightLeft, 
  Settings, LogOut, Search, Bell, Droplets, HelpCircle, X, ChevronDown, CheckCheck, Clock
} from 'lucide-react';



const MerchantLayout = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef(null);

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
      console.error('Failed to fetch notifications:', err);
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

  useEffect(() => {
    let activeSocket = null;
    if (user && user.id) {
      activeSocket = io('http://192.168.1.46:5000', {
        query: { userId: user.id, role: user.role }
      });
      activeSocket.on('new_notification', (data) => {
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
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axiosInstance.get('/auth/profile');
        if (response.data?.success) {
          dispatch(setUser(response.data.data));
        }
      } catch (error) {
        console.error('Failed to fetch profile', error);
      }
    };
    fetchProfile();
  }, [dispatch]);

  const navItems = [
    { name: 'Dashboard', path: '/merchant', icon: LayoutDashboard },
    { name: 'Outlet List', path: '/merchant/outlets', icon: Store },
    { name: 'Inventory Management', path: '/merchant/inventory', icon: Package },
    { name: 'Transactions', path: '/merchant/transactions', icon: ArrowRightLeft },
    { name: 'Settings', path: '/merchant/settings', icon: Settings },
    { name: 'Help & Support', path: '/merchant/support', icon: HelpCircle },
  ];

  const filteredNavItems = navItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderNotificationsContent = () => {
    if (notifLoading) {
      return (
        <div className="p-8 flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-[#59111c] border-t-transparent rounded-full animate-spin" />
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
            className={`px-4 py-3 hover:bg-slate-50 transition-colors ${
              notif.is_read ? 'border-l-4 border-l-transparent' : 'bg-red-50/40 border-l-4 border-l-[#59111c]'
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
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Topbar */}
      <header className="h-[72px] bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-20">
        {/* Logo Area */}
        <div className="flex items-center w-56">
          <Droplets className="w-8 h-8 text-slate-800 mr-2" />
          <span className="text-xl font-bold tracking-tight text-slate-900">Daily<span className="text-xs block text-slate-500 -mt-1 font-normal">Financial Services</span></span>
        </div>
        
        {/* Search Bar */}
        <div className="flex-1 max-w-xl ml-8" ref={searchRef}>
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
              className="relative p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors text-slate-600"
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
                <div className="bg-[#59111c] px-4 py-3 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-white text-sm">Live Notifications</h3>
                    {unreadCount > 0 && (
                      <p className="text-red-200 text-xs mt-0.5">{unreadCount} unread</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {notifications.length > 0 && (
                      <button
                        onClick={() => { setNotifications([]); setUnreadCount(0); }}
                        className="flex items-center gap-1 text-xs text-red-200 hover:text-white transition-colors"
                        title="Clear All"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        Clear
                      </button>
                    )}
                    <button onClick={() => setShowNotifications(false)} className="text-red-200 hover:text-white ml-1">
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
                    className="text-xs font-semibold text-[#59111c] hover:underline"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="relative" ref={profileRef}>
            <button 
              type="button"
              className="flex items-center gap-3 w-full text-left hover:bg-slate-50 p-2 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-[#59111c]/20"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <img 
                src={user?.profileImage || `https://ui-avatars.com/api/?name=${user?.username || user?.businessName || user?.name || 'Merchant'}&background=e2e8f0&color=59111c`} 
                alt="User" 
                className="w-9 h-9 rounded-full border border-slate-200 object-cover"
              />
              <div className="flex flex-col hidden sm:flex">
                <span className="text-sm font-semibold text-slate-800">{user?.username || user?.businessName || user?.name || 'Merchant'}</span>
                <span className="text-xs text-slate-500">{user?.email || 'merchant@yopmail.com'}</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 ml-1 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <img 
                      src={user?.profileImage || `https://ui-avatars.com/api/?name=${user?.username || user?.businessName || user?.name || 'Merchant'}&background=e2e8f0&color=59111c`} 
                      alt="User" 
                      className="w-12 h-12 rounded-full border-2 border-white shadow-sm object-cover"
                    />
                    <div className="overflow-hidden">
                      <h4 className="font-bold text-slate-800 truncate">{user?.username || user?.businessName || user?.name || 'Merchant'}</h4>
                      <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    </div>
                  </div>
                </div>
                <div className="p-2">
                  <div className="px-3 py-2">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Business Details</p>
                    <p className="text-sm text-slate-700 font-medium truncate">{user?.businessName || 'N/A'}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{user?.merchantId || 'N/A'}</p>
                  </div>
                  <div className="px-3 py-2">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Contact</p>
                    <p className="text-sm text-slate-700">{user?.phoneNumber || 'N/A'}</p>
                  </div>
                </div>
                <div className="border-t border-slate-100 p-2">
                  <Link 
                    to="/merchant/settings"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Account Settings
                  </Link>
                  <button 
                    onClick={() => {
                      setShowProfileMenu(false);
                      dispatch(logout());
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-1"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-[#59111c] text-white flex flex-col h-full shrink-0 z-10 shadow-xl">
          <div className="flex-1 overflow-y-auto py-6 no-scrollbar">
            <ul className="space-y-2 px-3">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== '/merchant');
                const Icon = item.icon;
                return (
                  <li key={item.name}>
                    <Link
                      to={item.path}
                      className={`flex items-center gap-3 px-4 py-3.5 rounded-lg transition-all duration-200 ${
                        isActive 
                          ? 'bg-slate-100 text-[#59111c] font-bold shadow-sm' 
                          : 'text-red-100/90 hover:bg-white/10 hover:text-white font-medium'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-[#59111c]' : 'text-red-200/80'}`} />
                      <span className="text-sm">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="p-3 mb-2">
            <button 
              onClick={() => dispatch(logout())}
              className="flex items-center gap-3 px-4 py-3.5 w-full rounded-lg hover:bg-white/10 hover:text-white transition-colors text-left text-red-100/90 font-medium"
            >
              <LogOut className="w-5 h-5 text-red-200/80" />
              <span className="text-sm">Log Out</span>
            </button>
          </div>
        </aside>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-[#f8f9fa] relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MerchantLayout;
