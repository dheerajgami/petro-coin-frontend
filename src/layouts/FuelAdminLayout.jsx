import React, { useEffect, useState, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, setUser } from '../store/slices/authSlice';
import axiosInstance from '../api/axiosInstance';
import {
  LayoutDashboard, MapPin, Package, ArrowRightLeft,
  Settings, LogOut, Search, Bell, Droplets, Banknote, ChevronDown,
  Building2, Phone, Shield
} from 'lucide-react';

const FuelAdminLayout = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchAuthProfile = async () => {
      try {
        const response = await axiosInstance.get('/auth/profile');
        if (response.data?.success) {
          const authData = response.data.data;
          dispatch(setUser({
            ...user,
            username: authData.fullName || user?.username,
            fullName: authData.fullName,
            email: authData.email || user?.email,
            profileImage: authData.profile_photo || user?.profileImage,
            role: authData.role,
            stationName: authData.stationName,
            stationId: authData.station_id,
            mobileNumber: authData.mobileNumber,
            webAccessStatus: authData.webAccessStatus
          }));
        }
      } catch (err) {
        console.error('Failed to fetch auth profile in layout:', err);
      }
    };
    fetchAuthProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    dispatch(logout());
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/fuel-admin' },
    { icon: MapPin, label: 'Stations', path: '/fuel-admin/stations' },
    { icon: Package, label: 'Inventory Management', path: '/fuel-admin/inventory' },
    { icon: Banknote, label: 'Settlements', path: '/fuel-admin/settlements' },
    { icon: ArrowRightLeft, label: 'Transactions', path: '/fuel-admin/transactions' },
    { icon: Settings, label: 'Settings', path: '/fuel-admin/settings' },
  ];

  return (
    <div className="flex h-screen bg-[#F5F6F8] font-sans overflow-hidden">

      {/* Sidebar - Golden Yellow color from screenshot */}
      <div className="w-[280px] bg-[#ECA12A] flex flex-col flex-shrink-0 z-20 h-full relative">
        {/* Logo Area */}
        <div className="h-[80px] bg-white flex items-center px-8 shrink-0">
          <div className="flex items-center gap-2">
            <Droplets className="w-8 h-8 text-black" strokeWidth={2.5} />
            <div className="flex flex-col">
              <span className="text-xl font-black text-black leading-none tracking-tight">Daily</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Fuel Admin</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-8 overflow-y-auto space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/fuel-admin' && location.pathname.startsWith(item.path));
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${isActive
                    ? 'bg-white shadow-sm'
                    : 'hover:bg-white/20'
                  }`}
              >
                <Icon
                  className={`w-5 h-5 transition-colors ${isActive ? 'text-black' : 'text-black/80'
                    }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className={`text-sm tracking-wide ${isActive ? 'font-bold text-black' : 'font-semibold text-black/80'
                  }`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 shrink-0 mb-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3.5 w-full rounded-xl transition-all hover:bg-white/20 text-black/80 hover:text-black group"
          >
            <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" strokeWidth={2} />
            <span className="text-sm font-semibold tracking-wide">Log Out</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F5F6F8]">
        {/* Top Header */}
        <header className="h-[80px] bg-white flex items-center justify-between px-8 shrink-0 z-10 border-b border-slate-200">

          {/* Left - Empty spacer / Page breadcrumb */}
          <div className="flex-1" />

          {/* Right Area - Search, Notifications & Profile */}
          <div className="flex items-center gap-4">
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search"
                className="w-52 pl-10 pr-4 py-2 bg-slate-100 border border-transparent rounded-full text-sm text-slate-600 focus:outline-none focus:bg-white focus:border-slate-300 focus:ring-4 focus:ring-slate-100 focus:w-64 transition-all duration-300 placeholder:text-slate-400"
              />
            </div>

            <button className="relative p-2 text-slate-400 hover:text-[#ECA12A] bg-slate-100 rounded-full hover:bg-orange-50 transition-colors">
              <Bell className="w-5 h-5" strokeWidth={2} />
              {/* Mock Notification Badge */}
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>

            <div className="h-8 w-px bg-slate-200"></div>

            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity focus:outline-none"
              >
                <div className="w-10 h-10 rounded-full bg-[#ECA12A] flex items-center justify-center text-white font-bold shadow-sm overflow-hidden border-2 border-white relative">
                  {user?.profileImage ? (
                    <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span>{user?.username?.[0]?.toUpperCase() || 'F'}</span>
                  )}
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <div className="flex flex-col items-start hidden sm:flex">
                  <span className="text-sm font-bold text-slate-800">{user?.username || user?.fullName || 'John Williams'}</span>
                  <span className="text-[11px] font-medium text-slate-500">{user?.email || 'john@456.com'}</span>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-3 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">

                  {/* Header with avatar */}
                  <div className="bg-gradient-to-br from-[#ECA12A]/10 to-orange-50 px-4 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#ECA12A] flex items-center justify-center text-white font-bold overflow-hidden border-2 border-white shadow-md shrink-0 relative">
                        {user?.profileImage ? (
                          <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-lg">{(user?.username || user?.fullName || 'F')[0].toUpperCase()}</span>
                        )}
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-900 truncate">{user?.fullName || user?.username || 'John Williams'}</p>
                        <p className="text-[11px] text-slate-500 truncate">{user?.email || 'fuel@yopmail.com'}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#ECA12A]/20 text-[#9a6c00] rounded-full text-[10px] font-bold uppercase tracking-wide">
                            <Shield className="w-2.5 h-2.5" />
                            {user?.role || 'Fuel Admin'}
                          </span>
                          {user?.webAccessStatus === 'approved' && (
                            <span className="inline-flex items-center px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-wide">
                              Approved
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Station Info */}
                  <div className="px-4 py-3 space-y-2 border-b border-slate-100">
                    {user?.stationName && (
                      <div className="flex items-center gap-2.5 text-slate-600">
                        <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                          <Building2 className="w-3.5 h-3.5 text-blue-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Station</p>
                          <p className="text-xs font-semibold text-slate-700 truncate">{user.stationName}</p>
                        </div>
                        {user?.stationId && (
                          <span className="ml-auto shrink-0 text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{user.stationId}</span>
                        )}
                      </div>
                    )}
                    {user?.mobileNumber && (
                      <div className="flex items-center gap-2.5 text-slate-600">
                        <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
                          <Phone className="w-3.5 h-3.5 text-green-500" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Mobile</p>
                          <p className="text-xs font-semibold text-slate-700">{user.mobileNumber}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="py-1.5">
                    <Link to="/fuel-admin/settings" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:text-black hover:bg-slate-50 transition-colors">
                      <Settings className="w-4 h-4" />
                      <span className="font-medium">Account Settings</span>
                    </Link>
                  </div>

                  <div className="border-t border-slate-100 py-1.5">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default FuelAdminLayout;
