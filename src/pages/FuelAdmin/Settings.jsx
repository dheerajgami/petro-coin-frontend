import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { CheckCircle2, Loader2, Eye, EyeOff } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';

const FuelAdminSettings = () => {
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('Profile');
  const [showToast, setShowToast] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Profile Data from API
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Profile State
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Notification State
  const [notifications, setNotifications] = useState({
    email: true,
    sms: true,
    transaction: true,
    settlement: true
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axiosInstance.get('/admin/profile');
        if (response.data?.success) {
          const data = response.data.data;
          setProfileData(data);
          setPhone(data.mobileNumber || '');
          setAddress(data.address || '');
        } else {
          setError('Failed to load profile data.');
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('An error occurred while loading profile.');
      } finally {
        setLoading(false);
      }
    };

    const fetchNotifications = async () => {
      try {
        const response = await axiosInstance.get('/auth/notifications/preferences');
        if (response.data?.success) {
          setNotifications(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };

    fetchProfile();
    fetchNotifications();
  }, []);

  // Security State
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const saveProfile = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const response = await axiosInstance.patch('/admin/profile', {
        phone,
        address
      });
      if (response.data?.success) {
        if (response.data?.data) {
          setProfileData(response.data.data);
          setPhone(response.data.data.mobileNumber || phone);
          setAddress(response.data.data.address || address);
        }
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } else {
        setSaveError(response.data?.message || response.data?.error || 'Failed to update profile.');
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.response?.statusText || err.message || 'An error occurred while saving.';
      setSaveError(`Error: ${errorMsg} (Status: ${err.response?.status})`);
    } finally {
      setSaving(false);
    }
  };

  const saveNotifications = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const response = await axiosInstance.put('/auth/notifications/preferences', notifications);
      if (response.data?.success) {
        if (response.data?.data) {
          setNotifications(response.data.data);
        }
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } else {
        setSaveError(response.data?.message || response.data?.error || 'Failed to update preferences.');
      }
    } catch (err) {
      console.error('Error saving notifications:', err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.response?.statusText || err.message || 'An error occurred while saving.';
      setSaveError(`Error: ${errorMsg} (Status: ${err.response?.status})`);
    } finally {
      setSaving(false);
    }
  };

  const saveSecurity = async () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      setSaveError("Please fill all password fields.");
      return;
    }
    if (passwords.new !== passwords.confirm) {
      setSaveError("New password and confirm password do not match.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const response = await axiosInstance.patch('/auth/change-password', {
        currentPassword: passwords.current,
        newPassword: passwords.new,
        confirmPassword: passwords.confirm
      });
      if (response.data?.success) {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        setPasswords({ current: '', new: '', confirm: '' });
      } else {
        setSaveError(response.data?.message || response.data?.error || 'Failed to update password.');
      }
    } catch (err) {
      console.error('Error saving password:', err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.response?.statusText || err.message || 'An error occurred while saving password.';
      setSaveError(`Error: ${errorMsg} (Status: ${err.response?.status})`);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (activeTab === 'Profile') {
      await saveProfile();
    } else if (activeTab === 'Notification') {
      await saveNotifications();
    } else if (activeTab === 'Security') {
      await saveSecurity();
    } else {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleToggle = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const tabs = ['Profile', 'Notification', 'Security', 'Support'];

  const renderProfileTab = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Business Profile</h3>
          <p className="text-sm text-slate-500 mt-1">Update your business and contact information</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-[#ECA12A] hover:bg-[#d99020] text-slate-900 font-bold px-6 py-2 rounded-lg transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Save Changes
        </button>
      </div>

      {saveError && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium border border-red-100">
          {saveError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div>
          <label htmlFor="station_id" className="block text-sm font-bold text-slate-700 mb-2">Fuel Station ID (Read-only)</label>
          <input id="station_id" type="text" value={profileData?.station_id || ''} readOnly className="w-full border border-slate-300 rounded-lg p-3 text-sm text-slate-500 bg-slate-50 focus:outline-none cursor-not-allowed" />
        </div>
        <div>
          <label htmlFor="stationName" className="block text-sm font-bold text-slate-700 mb-2">Station Name (Read-only)</label>
          <input id="stationName" type="text" value={profileData?.stationName || ''} readOnly className="w-full border border-slate-300 rounded-lg p-3 text-sm text-slate-500 bg-slate-50 focus:outline-none cursor-not-allowed" />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-bold text-slate-700 mb-2">Phone</label>
          <input 
            id="phone"
            type="text" 
            value={phone} 
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border border-slate-300 rounded-lg p-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#ECA12A]/20 focus:border-[#ECA12A] transition-all" 
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-2">Email (Read-only)</label>
          <input id="email" type="text" value={profileData?.email || ''} readOnly className="w-full border border-slate-300 rounded-lg p-3 text-sm text-slate-500 bg-slate-50 focus:outline-none cursor-not-allowed" />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="address" className="block text-sm font-bold text-slate-700 mb-2">Station Address</label>
          <input 
            id="address"
            type="text" 
            value={address} 
            onChange={(e) => setAddress(e.target.value)}
            className="w-full border border-slate-300 rounded-lg p-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#ECA12A]/20 focus:border-[#ECA12A] transition-all" 
          />
        </div>
      </div>
    </div>
  );

  const renderNotificationTab = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Notification Preferences</h3>
          <p className="text-sm text-slate-500 mt-1">Choose how you want to receive notifications</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="bg-[#ECA12A] hover:bg-[#d99020] text-slate-900 font-bold px-6 py-2 rounded-lg transition-colors text-sm disabled:opacity-50 flex items-center gap-2">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Save Changes
        </button>
      </div>

      {saveError && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium border border-red-100 mb-4">
          {saveError}
        </div>
      )}

      <div className="space-y-4">
        {[
          { id: 'email', title: 'Email Notifications', desc: 'Receive important updates via email' },
          { id: 'sms', title: 'SMS Notifications', desc: 'Receive critical alerts via SMS' },
          { id: 'transaction', title: 'Transaction Alerts', desc: 'Get notified for every transaction' },
          { id: 'settlement', title: 'Settlement Reminders', desc: 'Reminder for daily settlement processing' },
        ].map(item => (
          <div key={item.id} className="flex items-center justify-between p-5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            <div>
              <h4 className="font-bold text-slate-800">{item.title}</h4>
              <p className="text-sm text-slate-500">{item.desc}</p>
            </div>
            <button 
              onClick={() => handleToggle(item.id)}
              className={`relative flex items-center w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out focus:outline-none ${notifications[item.id] ? 'bg-[#ECA12A]' : 'bg-slate-300'}`}
            >
              <span className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${notifications[item.id] ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Security Settings</h3>
          <p className="text-sm text-slate-500 mt-1">Manage your security preferences and access</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="bg-[#ECA12A] hover:bg-[#d99020] text-slate-900 font-bold px-6 py-2 rounded-lg transition-colors text-sm disabled:opacity-50 flex items-center gap-2">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Save Changes
        </button>
      </div>

      {saveError && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium border border-red-100 mb-4">
          {saveError}
        </div>
      )}

      <div className="w-full">
        <h4 className="text-lg font-bold text-slate-800 mb-6">Change Admin Password</h4>
        <div className="space-y-5">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-bold text-slate-700 mb-2">Current Password</label>
            <div className="relative">
              <input 
                id="currentPassword"
                type={showPassword.current ? "text" : "password"}
                placeholder="********"
                value={passwords.current}
                onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                className="w-full bg-white border border-slate-300 rounded-lg p-3 pr-10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#ECA12A]/20 focus:border-[#ECA12A] transition-all" 
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => ({ ...prev, current: !prev.current }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="newPassword" className="block text-sm font-bold text-slate-700 mb-2">New Password</label>
            <div className="relative">
              <input 
                id="newPassword"
                type={showPassword.new ? "text" : "password"}
                placeholder="********"
                value={passwords.new}
                onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                className="w-full bg-white border border-slate-300 rounded-lg p-3 pr-10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#ECA12A]/20 focus:border-[#ECA12A] transition-all" 
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-bold text-slate-700 mb-2">Confirm Password</label>
            <div className="relative">
              <input 
                id="confirmPassword"
                type={showPassword.confirm ? "text" : "password"}
                placeholder="********"
                value={passwords.confirm}
                onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                className="w-full bg-white border border-slate-300 rounded-lg p-3 pr-10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#ECA12A]/20 focus:border-[#ECA12A] transition-all" 
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSupportTab = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="border-b border-slate-100 pb-4">
        <h3 className="text-xl font-bold text-slate-800">Help & Support</h3>
        <p className="text-sm text-slate-500 mt-1">Get help and contact support</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { title: 'View FAQ', desc: 'Common questions and answers' },
          { title: 'User Manual', desc: 'Complete guide to using the portal' },
          { title: 'Video Tutorials', desc: 'Step-by-step video guides' },
          { title: 'Contact Support', desc: 'Reach out to our support team' },
        ].map((item) => (
          <div key={item.title} className="p-6 border border-slate-200 rounded-xl hover:shadow-md hover:border-[#ECA12A]/50 transition-all cursor-pointer group bg-white">
            <h4 className="text-xl font-bold text-slate-800 group-hover:text-[#ECA12A] transition-colors">{item.title}</h4>
            <p className="text-sm text-slate-500 mt-2">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#ECA12A] animate-spin" />
        </div>
      );
    }

    if (error && activeTab === 'Profile') {
      return (
        <div className="bg-red-50 text-red-500 p-4 rounded-xl border border-red-100 font-bold text-center mt-6">
          {error}
        </div>
      );
    }

    switch (activeTab) {
      case 'Profile':
        return renderProfileTab();
      case 'Notification':
        return renderNotificationTab();
      case 'Security':
        return renderSecurityTab();
      case 'Support':
        return renderSupportTab();
      default:
        return null;
    }
  };

  return (
    <div className="p-8 pb-12 max-w-[1400px] mx-auto space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-[#ECA12A] rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          Welcome Back, {typeof user?.username === 'string' ? `Mr. ${user.username.split(' ')[0]}` : 'Mr. John'} 👋
        </h2>
        <p className="text-slate-800 mt-1 text-sm font-medium">Have a good day..</p>
      </div>

      <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 min-h-[500px]">
        {/* Settings Header */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-800">Fuel Station Settings</h2>
          <p className="text-sm text-slate-500">Manage your account and business settings</p>
        </div>

        {/* Custom Tabs */}
        <div className="bg-slate-100/70 p-1.5 rounded-2xl flex flex-wrap gap-2 mb-10 w-full">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3.5 px-4 text-sm font-bold rounded-xl transition-all duration-200 ${
                activeTab === tab 
                  ? 'bg-white text-slate-800 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content Area */}
        <div className="w-full">
          {renderTabContent()}
        </div>
      </div>

      {/* Save Success Toast */}
      {showToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-top-5 fade-in duration-300 z-[100]">
          <CheckCircle2 className="w-6 h-6" />
          <div>
            <h4 className="font-bold text-sm">Changes Saved</h4>
            <p className="text-xs text-green-100">Your settings have been updated successfully.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FuelAdminSettings;
