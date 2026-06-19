import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import PropTypes from 'prop-types';

// Switch UI Component
const ToggleSwitch = ({ checked, onChange }) => (
  <button 
    type="button"
    role="switch"
    aria-checked={checked}
    className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#59111c] focus:ring-offset-2 ${checked ? 'bg-[#59111c]' : 'bg-slate-300'}`}
    onClick={onChange}
  >
    <div 
      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${checked ? 'translate-x-6' : 'translate-x-0'}`}
    />
  </button>
);

ToggleSwitch.propTypes = {
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired
};

const Settings = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'notification', label: 'Notification' },
    { id: 'security', label: 'Security' },
    { id: 'support', label: 'Support' }
  ];

  // Form state
  const [profileForm, setProfileForm] = useState({
    merchantId: '',
    username: '',
    businessName: '',
    phoneNumber: '',
    email: '',
    businessAddress: ''
  });

  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    transaction: true,
    settlement: false
  });

  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [loading, setLoading] = useState({
    profile: false,
    notification: false,
    security: false
  });

  const [initialLoad, setInitialLoad] = useState(true);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setInitialLoad(true);
        // Fetch Profile
        const profileRes = await axiosInstance.get('/merchant/profile');
        if (profileRes.data?.success) {
          const data = profileRes.data.data;
          setProfileForm({
            merchantId: data.merchantId || '',
            username: data.username || '',
            businessName: data.businessName || '',
            phoneNumber: data.phoneNumber || '',
            email: data.email || '',
            businessAddress: data.businessAddress || ''
          });
        }

        // Fetch Notifications
        const notifRes = await axiosInstance.get('/merchant/notification-preferences');
        if (notifRes.data?.success) {
          setNotifications(notifRes.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch settings data', err);
      } finally {
        setInitialLoad(false);
      }
    };
    fetchData();
  }, []);

  const handleProfileChange = (e) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  };

  const saveProfile = async () => {
    try {
      setLoading(prev => ({ ...prev, profile: true }));
      await axiosInstance.put('/merchant/updateProfile', {
        businessName: profileForm.businessName,
        phoneNumber: profileForm.phoneNumber,
        businessAddress: profileForm.businessAddress
      });
      alert('Profile updated successfully');
    } catch (err) {
      console.error('Failed to update profile', err);
      alert('Failed to update profile');
    } finally {
      setLoading(prev => ({ ...prev, profile: false }));
    }
  };

  const handleSecurityChange = (e) => {
    setSecurityForm({ ...securityForm, [e.target.name]: e.target.value });
  };

  const saveSecurity = async () => {
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      alert("New password and confirm password don't match");
      return;
    }
    try {
      setLoading(prev => ({ ...prev, security: true }));
      await axiosInstance.put('/merchant/changePassword', {
        currentPassword: securityForm.currentPassword,
        newPassword: securityForm.newPassword,
        confirmPassword: securityForm.confirmPassword
      });
      alert('Password updated successfully');
      setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.error('Failed to update password', err);
      alert(err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(prev => ({ ...prev, security: false }));
    }
  };

  const toggleNotification = (key) => {
    setNotifications({ ...notifications, [key]: !notifications[key] });
  };

  const saveNotifications = async () => {
    try {
      setLoading(prev => ({ ...prev, notification: true }));
      await axiosInstance.put('/merchant/notification-preferences', notifications);
      alert('Notification preferences updated successfully');
    } catch (err) {
      console.error('Failed to update notifications', err);
      alert('Failed to update notifications');
    } finally {
      setLoading(prev => ({ ...prev, notification: false }));
    }
  };



  const renderProfile = () => (
    <div className="animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Business Profile</h2>
          <p className="text-sm text-slate-500 mt-1">Update your business and contact information</p>
        </div>
        <button 
          onClick={saveProfile}
          disabled={loading.profile}
          className="bg-[#59111c] text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-opacity-90 transition-colors flex items-center gap-2 disabled:opacity-70"
        >
          {loading.profile && <Loader2 className="w-4 h-4 animate-spin" />}
          Save Changes
        </button>
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="merchantId" className="text-sm font-bold text-slate-700">Merchant ID (Read-only)</label>
            <input 
              id="merchantId"
              type="text" 
              name="merchantId"
              value={profileForm.merchantId}
              readOnly
              className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-600 focus:outline-none"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-bold text-slate-700">Username (Read-only)</label>
            <input 
              id="username"
              type="text" 
              name="username"
              value={profileForm.username}
              readOnly
              className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-600 focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="businessName" className="text-sm font-bold text-slate-700">Business Name</label>
          <input 
            id="businessName"
            type="text" 
            name="businessName"
            value={profileForm.businessName}
            onChange={handleProfileChange}
            className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-[#59111c] focus:ring-1 focus:ring-[#59111c]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="phoneNumber" className="text-sm font-bold text-slate-700">Phone</label>
            <input 
              id="phoneNumber"
              type="text" 
              name="phoneNumber"
              value={profileForm.phoneNumber}
              onChange={handleProfileChange}
              className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-[#59111c] focus:ring-1 focus:ring-[#59111c]"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-bold text-slate-700">Email (Read-only)</label>
            <input 
              id="email"
              type="email" 
              name="email"
              value={profileForm.email}
              readOnly
              className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-600 focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="businessAddress" className="text-sm font-bold text-slate-700">Business Address</label>
          <input 
            id="businessAddress"
            type="text" 
            name="businessAddress"
            value={profileForm.businessAddress}
            onChange={handleProfileChange}
            className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-[#59111c] focus:ring-1 focus:ring-[#59111c]"
          />
        </div>
      </div>
    </div>
  );

  const renderNotification = () => (
    <div className="animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Notification Preferences</h2>
          <p className="text-sm text-slate-500 mt-1">Choose how you want to receive notifications</p>
        </div>
        <button 
          onClick={saveNotifications}
          disabled={loading.notification}
          className="bg-[#59111c] text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-opacity-90 transition-colors flex items-center gap-2 disabled:opacity-70"
        >
          {loading.notification && <Loader2 className="w-4 h-4 animate-spin" />}
          Save Changes
        </button>
      </div>

      <div className="space-y-4">
        {[
          { key: 'email', title: 'Email Notifications', desc: 'Receive important updates via email' },
          { key: 'sms', title: 'SMS Notifications', desc: 'Receive critical alerts via SMS' },
          { key: 'transaction', title: 'Transaction Alerts', desc: 'Get notified for every transaction' },
          { key: 'settlement', title: 'Settlement Reminders', desc: 'Reminder for daily settlement processing' },
        ].map((item) => (
          <div key={item.key} className="flex items-center justify-between p-5 rounded-xl border border-slate-300 bg-[#fbf9f9]">
            <div>
              <h4 className="text-base font-bold text-slate-800">{item.title}</h4>
              <p className="text-xs font-medium text-slate-600 mt-1">{item.desc}</p>
            </div>
            <ToggleSwitch 
              checked={notifications[item.key]} 
              onChange={() => toggleNotification(item.key)} 
            />
          </div>
        ))}
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Security Settings</h2>
          <p className="text-sm text-slate-500 mt-1">Manage your security preferences and access</p>
        </div>
        <button 
          onClick={saveSecurity}
          disabled={loading.security}
          className="bg-[#59111c] text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-opacity-90 transition-colors flex items-center gap-2 disabled:opacity-70"
        >
          {loading.security && <Loader2 className="w-4 h-4 animate-spin" />}
          Save Changes
        </button>
      </div>

      <h3 className="text-lg font-bold text-slate-800 mb-4 mt-8">Change Admin Password</h3>
      
      <div className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="currentPassword" className="text-sm font-bold text-slate-700">Current Password</label>
          <div className="relative">
            <input 
              id="currentPassword"
              type={showPassword.current ? "text" : "password"}
              name="currentPassword"
              value={securityForm.currentPassword}
              onChange={handleSecurityChange}
              className="w-full bg-white border border-slate-300 rounded-lg pl-4 pr-10 py-2.5 text-sm font-mono text-slate-800 focus:outline-none focus:border-[#59111c] focus:ring-1 focus:ring-[#59111c]"
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
        
        <div className="space-y-2">
          <label htmlFor="newPassword" className="text-sm font-bold text-slate-700">New Password</label>
          <div className="relative">
            <input 
              id="newPassword"
              type={showPassword.new ? "text" : "password"}
              name="newPassword"
              value={securityForm.newPassword}
              onChange={handleSecurityChange}
              className="w-full bg-white border border-slate-300 rounded-lg pl-4 pr-10 py-2.5 text-sm font-mono text-slate-800 focus:outline-none focus:border-[#59111c] focus:ring-1 focus:ring-[#59111c]"
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

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm font-bold text-slate-700">Confirm Password</label>
          <div className="relative">
            <input 
              id="confirmPassword"
              type={showPassword.confirm ? "text" : "password"}
              name="confirmPassword"
              value={securityForm.confirmPassword}
              onChange={handleSecurityChange}
              className="w-full bg-white border border-slate-300 rounded-lg pl-4 pr-10 py-2.5 text-sm font-mono text-slate-800 focus:outline-none focus:border-[#59111c] focus:ring-1 focus:ring-[#59111c]"
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
  );

  const renderSupport = () => (
    <div className="animate-in fade-in duration-300">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">Help & Support</h2>
        <p className="text-sm text-slate-500 mt-1">Get help and contact support</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button 
          type="button"
          onClick={() => navigate('/merchant/support?tab=faq')}
          className="text-left w-full bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        >
          <h3 className="text-lg font-bold text-slate-800">View FAQ</h3>
          <p className="text-sm font-medium text-slate-500 mt-2">Common questions and answers</p>
        </button>
        <button 
          type="button"
          onClick={() => navigate('/merchant/support?tab=guides')}
          className="text-left w-full bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        >
          <h3 className="text-lg font-bold text-slate-800">User Manual</h3>
          <p className="text-sm font-medium text-slate-500 mt-2">Complete guide to using the portal</p>
        </button>
        <button 
          type="button"
          onClick={() => navigate('/merchant/support?tab=guides')}
          className="text-left w-full bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        >
          <h3 className="text-lg font-bold text-slate-800">Video Tutorials</h3>
          <p className="text-sm font-medium text-slate-500 mt-2">Step-by-step video guides</p>
        </button>
        <button 
          type="button"
          onClick={() => navigate('/merchant/support?tab=contact')}
          className="text-left w-full bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        >
          <h3 className="text-lg font-bold text-slate-800">Contact Support</h3>
          <p className="text-sm font-medium text-slate-500 mt-2">Reach out to our support team</p>
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-[1200px] mx-auto p-8 font-sans space-y-8">
      {/* Welcome Banner */}
      <div className="bg-[#59111c] rounded-xl p-6 relative overflow-hidden shadow-sm">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          Welcome Back, {user?.username || user?.businessName || user?.name || 'Merchant'} 👋
        </h2>
        <p className="text-red-100 mt-1 text-sm font-medium">Have a good day..</p>
      </div>

      {/* Settings Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-900">Merchant Settings</h2>
        <p className="text-sm text-slate-500 mt-0.5">Manage your account and business settings</p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-slate-200/60 p-1.5 rounded-xl flex items-center mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 ${
              activeTab === tab.id 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="pb-10 min-h-[400px]">
        {initialLoad ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-[#59111c]" />
          </div>
        ) : (
          <>
            {activeTab === 'profile' && renderProfile()}
            {activeTab === 'notification' && renderNotification()}
            {activeTab === 'security' && renderSecurity()}
            {activeTab === 'support' && renderSupport()}
          </>
        )}
      </div>
    </div>
  );
};

export default Settings;
