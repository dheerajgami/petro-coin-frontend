import React, { useEffect, useState, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { io } from 'socket.io-client';
import { 
  LayoutDashboard, Store, Package, ArrowRightLeft, 
  Settings, LogOut, Search, Bell, Droplets, HelpCircle, X
} from 'lucide-react';

const socket = io('http://192.168.1.46:5000');

const MerchantLayout = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    socket.on('new_notification', (data) => {
      setNotifications((prev) => [data, ...prev]);
    });
    
    return () => {
      socket.off('new_notification');
    };
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef(null);

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
    { name: 'Dashboard', path: '/merchant', icon: LayoutDashboard },
    { name: 'Outlet List', path: '/merchant/outlets', icon: Store },
    { name: 'Inventory Management', path: '/merchant/inventory', icon: Package },
    { name: 'Transaction', path: '/merchant/transactions', icon: ArrowRightLeft },
    { name: 'Settings', path: '/merchant/settings', icon: Settings },
    { name: 'Help & Support', path: '/merchant/support', icon: HelpCircle },
  ];

  const filteredNavItems = navItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                    {filteredNavItems.map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <li key={idx}>
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
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors text-slate-600"
            >
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border-2 border-slate-100"></span>
                </span>
              )}
            </button>
            
            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="bg-[#59111c] px-4 py-3 flex justify-between items-center">
                  <h3 className="font-semibold text-white">Live Notifications ({notifications.length})</h3>
                  <button onClick={() => setShowNotifications(false)} className="text-slate-300 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-sm">
                      No new notifications
                    </div>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {notifications.map((notif, index) => (
                        <li key={index} className="p-4 hover:bg-slate-50 transition-colors">
                          <p className="font-semibold text-sm text-slate-800">{notif.title || 'Notification'}</p>
                          <p className="text-xs text-slate-500 mt-1">{notif.message}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="border-t border-slate-100 p-2">
                    <button 
                      onClick={() => setNotifications([])}
                      className="w-full text-center text-xs font-semibold text-[#59111c] py-2 hover:bg-slate-50 rounded"
                    >
                      Clear All
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3 cursor-pointer">
            <img 
              src={`https://ui-avatars.com/api/?name=${user?.name || 'John Williams'}&background=e2e8f0&color=59111c`} 
              alt="User" 
              className="w-9 h-9 rounded-full border border-slate-200"
            />
            <div className="flex flex-col hidden sm:flex">
              <span className="text-sm font-semibold text-slate-800">{user?.name || 'John Williams'}</span>
              <span className="text-xs text-slate-500">{user?.email || 'john@456.com'}</span>
            </div>
            <svg className="w-4 h-4 text-slate-400 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
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
