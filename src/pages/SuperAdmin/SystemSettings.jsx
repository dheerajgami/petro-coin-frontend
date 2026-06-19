import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Globe, Shield, Bell, Users2, ChevronDown } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';

/* eslint-disable react/prop-types */
const ToggleSwitch = ({ enabled, setEnabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={enabled}
    className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out ${enabled ? 'bg-[#1b2b4d]' : 'bg-slate-300'}`}
    onClick={() => setEnabled(!enabled)}
  >
    <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${enabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
  </button>
);

const CustomCheckbox = ({ checked, onChange, label }) => (
  <label className="flex items-center gap-3 cursor-pointer group">
    <div className="relative flex items-center justify-center">
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div className={`w-5 h-5 rounded border ${checked ? 'bg-[#1b2b4d] border-[#1b2b4d]' : 'bg-white border-slate-300 group-hover:border-slate-400'} transition-colors flex items-center justify-center`}>
        {checked && (
          <svg className="w-3.5 h-3.5 text-white pointer-events-none" viewBox="0 0 14 14" fill="none">
            <path d="M3 8L6 11L11 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
    </div>
    <span className="text-sm font-semibold text-slate-700 select-none">{label}</span>
  </label>
);

const SystemSettings = () => {
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('General');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [supportPortal, setSupportPortal] = useState('');

  const tabs = ['General', 'Security', 'Notifications', 'Audit & Logs', 'Help & Support'];

  // State for General
  const [siteName, setSiteName] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [adminEmail, setAdminEmail] = useState('');

  // State for Security
  const [maxLoginAttempts, setMaxLoginAttempts] = useState('5');
  const [sessionTimeout, setSessionTimeout] = useState('30');
  const [twoFactor, setTwoFactor] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // State for Notifications
  const [emailNotif, setEmailNotif] = useState(false);
  const [smsNotif, setSmsNotif] = useState(false);
  const [notifTypes, setNotifTypes] = useState({
    newMerchant: false,
    kycRequired: false,
    transactionFlagged: false,
    highVolume: false,
    systemError: false
  });

  // State for Audit
  const [apiLogs, setApiLogs] = useState(false);
  const [auditLogs, setAuditLogs] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axiosInstance.get('/admin/settings');
        if (response.data?.success) {
          const data = response.data.data;
          setSiteName(data.site_name || '');
          setSiteUrl(data.site_url || '');
          setAdminEmail(data.admin_email || '');
          setMaxLoginAttempts(data.max_login_attempts?.toString() || '3');
          setSessionTimeout(data.session_timeout?.toString() || '10');
          setTwoFactor(data.require_2fa || false);
          setEmailNotif(data.receive_email_alerts || false);
          setSmsNotif(data.receive_sms_alerts || false);
          setNotifTypes({
            newMerchant: data.notify_new_merchant || false,
            kycRequired: data.notify_kyc_required || false,
            transactionFlagged: data.notify_transaction_flagged || false,
            highVolume: data.notify_high_volume || false,
            systemError: data.notify_system_error || false
          });
          setApiLogs(data.log_api_requests || false);
          setAuditLogs(data.log_admin_actions || false);

          if (data.last_updated) {
            setLastUpdated(new Date(data.last_updated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
          }
          setDocUrl(data.documentation_url || '');
          setSupportPortal(data.support_portal || '');
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      // General Settings update
      const payload = {
        site_name: siteName,
        site_url: siteUrl,
        admin_email: adminEmail,
        max_login_attempts: Number.parseInt(maxLoginAttempts),
        session_timeout: Number.parseInt(sessionTimeout),
        require_2fa: twoFactor,
        receive_email_alerts: emailNotif,
        receive_sms_alerts: smsNotif,
        notify_new_merchant: notifTypes.newMerchant,
        notify_kyc_required: notifTypes.kycRequired,
        notify_transaction_flagged: notifTypes.transactionFlagged,
        notify_high_volume: notifTypes.highVolume,
        notify_system_error: notifTypes.systemError,
        log_api_requests: apiLogs,
        log_admin_actions: auditLogs
      };

      const response = await axiosInstance.put('/admin/settings', payload);
      let pwdSuccess = true;
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          alert("New password and confirm password do not match!");
          pwdSuccess = false;
        } else if (currentPassword) {
          try {
            await axiosInstance.post('/admin/settings/change-password', {
              currentPassword, newPassword, confirmPassword
            });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
          } catch (e) {
            console.error("Failed to change password", e);
            alert("Failed to change password");
            pwdSuccess = false;
          }
        } else {
          alert("Please provide the current password to set a new password.");
          pwdSuccess = false;
        }
      }

      if (response.data?.success && pwdSuccess) {
        alert("Settings saved successfully!");
      }
    } catch (err) {
      console.error("Failed to save settings", err);
      alert("Failed to save settings");
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="p-8 flex justify-center items-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1b2b4d]"></div>
        </div>
      );
    }
    switch (activeTab) {
      case 'General':
        return (
          <div className="animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Globe className="w-7 h-7 text-slate-800" />
                <h2 className="text-2xl font-bold text-slate-800">General Settings</h2>
              </div>
              <button onClick={handleSave} className="bg-[#1b2b4d] hover:bg-[#13203b] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
                Save Changes
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="siteName" className="block text-sm font-bold text-slate-700 mb-2">Site Name</label>
                <input
                  id="siteName"
                  type="text"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 text-slate-800 text-sm font-medium"
                />
              </div>
              <div>
                <label htmlFor="siteUrl" className="block text-sm font-bold text-slate-700 mb-2">Site URL</label>
                <input
                  id="siteUrl"
                  type="text"
                  value={siteUrl}
                  onChange={(e) => setSiteUrl(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 text-slate-800 text-sm font-medium"
                />
              </div>
            </div>

            <div className="mb-10">
              <label htmlFor="adminEmail" className="block text-sm font-bold text-slate-700 mb-2">Admin Email</label>
              <input
                id="adminEmail"
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 text-slate-800 text-sm font-medium"
              />
            </div>

            <h3 className="text-xl font-bold text-slate-800 mb-4">Application Info</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-slate-100 border border-slate-300 rounded-lg px-4 py-2.5 opacity-80 cursor-not-allowed">
                <span className="block text-sm font-bold text-slate-800 mb-0.5">Version</span>
                <span className="text-xs text-slate-600 font-medium">1.0.0</span>
              </div>
              <div className="bg-slate-100 border border-slate-300 rounded-lg px-4 py-2.5 opacity-80 cursor-not-allowed">
                <span className="block text-sm font-bold text-slate-800 mb-0.5">Last Updated</span>
                <span className="text-xs text-slate-600 font-medium">{lastUpdated || 'Loading...'}</span>
              </div>
            </div>
          </div>
        );

      case 'Security':
        return (
          <div className="animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Shield className="w-7 h-7 text-slate-800" />
                <h2 className="text-2xl font-bold text-slate-800">Security Settings</h2>
              </div>
              <button onClick={handleSave} className="bg-[#1b2b4d] hover:bg-[#13203b] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
                Save Changes
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="relative">
                <label htmlFor="maxLoginAttempts" className="block text-sm font-bold text-slate-700 mb-2">Max Login Attempts</label>
                <div className="relative">
                  <select
                    id="maxLoginAttempts"
                    value={maxLoginAttempts}
                    onChange={(e) => setMaxLoginAttempts(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg appearance-none focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 text-slate-800 text-sm font-medium"
                  >
                    <option value="3">3</option>
                    <option value="5">5</option>
                    <option value="10">10</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none" />
                </div>
              </div>
              <div className="relative">
                <label htmlFor="sessionTimeout" className="block text-sm font-bold text-slate-700 mb-2">Session Timeout (minutes)</label>
                <div className="relative">
                  <select
                    id="sessionTimeout"
                    value={sessionTimeout}
                    onChange={(e) => setSessionTimeout(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg appearance-none focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 text-slate-800 text-sm font-medium"
                  >
                    <option value="15">15</option>
                    <option value="30">30</option>
                    <option value="60">60</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="bg-slate-100/60 border border-slate-300 rounded-lg p-4 flex items-center justify-between mb-10">
              <div>
                <h4 className="text-sm font-bold text-slate-800">Two-Factor Authentication</h4>
                <p className="text-xs text-slate-600 font-medium">Require 2FA for all admin accounts</p>
              </div>
              <ToggleSwitch enabled={twoFactor} setEnabled={setTwoFactor} />
            </div>

            <h3 className="text-xl font-bold text-slate-800 mb-6">Change Admin Password</h3>
            <div className="space-y-6">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-bold text-slate-700 mb-2">Current Password</label>
                <input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 text-slate-800 text-sm font-medium tracking-widest placeholder:tracking-normal"
                />
              </div>
              <div>
                <label htmlFor="newPassword" className="block text-sm font-bold text-slate-700 mb-2">New Password</label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 text-slate-800 text-sm font-medium tracking-widest placeholder:tracking-normal"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-bold text-slate-700 mb-2">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 text-slate-800 text-sm font-medium tracking-widest placeholder:tracking-normal"
                />
              </div>
            </div>
          </div>
        );

      case 'Notifications':
        return (
          <div className="animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Bell className="w-7 h-7 text-slate-800" />
                <h2 className="text-2xl font-bold text-slate-800">Notification Settings</h2>
              </div>
              <button onClick={handleSave} className="bg-[#1b2b4d] hover:bg-[#13203b] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
                Save Changes
              </button>
            </div>

            <div className="space-y-4 mb-10">
              <div className="bg-slate-100/60 border border-slate-300 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Email Notifications</h4>
                  <p className="text-xs text-slate-600 font-medium">Receive alerts and updates via email</p>
                </div>
                <ToggleSwitch enabled={emailNotif} setEnabled={setEmailNotif} />
              </div>
              <div className="bg-slate-100/60 border border-slate-300 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">SMS Notifications</h4>
                  <p className="text-xs text-slate-600 font-medium">Receive critical alerts via SMS</p>
                </div>
                <ToggleSwitch enabled={smsNotif} setEnabled={setSmsNotif} />
              </div>
            </div>

            <h3 className="text-xl font-bold text-slate-800 mb-6">Notification Types</h3>
            <div className="space-y-5 pl-2">
              <CustomCheckbox
                label="New merchant registration"
                checked={notifTypes.newMerchant}
                onChange={(c) => setNotifTypes({ ...notifTypes, newMerchant: c })}
              />
              <CustomCheckbox
                label="KYC verification required"
                checked={notifTypes.kycRequired}
                onChange={(c) => setNotifTypes({ ...notifTypes, kycRequired: c })}
              />
              <CustomCheckbox
                label="Transaction flagged"
                checked={notifTypes.transactionFlagged}
                onChange={(c) => setNotifTypes({ ...notifTypes, transactionFlagged: c })}
              />
              <CustomCheckbox
                label="High volume alert"
                checked={notifTypes.highVolume}
                onChange={(c) => setNotifTypes({ ...notifTypes, highVolume: c })}
              />
              <CustomCheckbox
                label="System error"
                checked={notifTypes.systemError}
                onChange={(c) => setNotifTypes({ ...notifTypes, systemError: c })}
              />
            </div>
          </div>
        );

      case 'Audit & Logs':
        return (
          <div className="animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Users2 className="w-7 h-7 text-slate-800" />
                <h2 className="text-2xl font-bold text-slate-800">Audit & Logging</h2>
              </div>
              <button onClick={handleSave} className="bg-[#1b2b4d] hover:bg-[#13203b] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
                Save Changes
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-100/60 border border-slate-300 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">API Logs</h4>
                  <p className="text-xs text-slate-600 font-medium">Log all API requests and responses</p>
                </div>
                <ToggleSwitch enabled={apiLogs} setEnabled={setApiLogs} />
              </div>
              <div className="bg-slate-100/60 border border-slate-300 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Audit Logs</h4>
                  <p className="text-xs text-slate-600 font-medium">Log all admin actions and changes</p>
                </div>
                <ToggleSwitch enabled={auditLogs} setEnabled={setAuditLogs} />
              </div>
            </div>
          </div>
        );

      case 'Help & Support':
        return (
          <div className="animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-8">
              <Users2 className="w-7 h-7 text-slate-800" />
              <h2 className="text-2xl font-bold text-slate-800">Help & Support</h2>
            </div>

            <div className="space-y-4">
              {/* Documentation */}
              <div className="bg-slate-100/60 border border-slate-300 rounded-lg p-5">
                <h4 className="text-base font-bold text-slate-800 mb-1">Documentation</h4>
                <p className="text-sm text-slate-700 font-medium mb-4">Access complete documentation and guides</p>
                <button
                  onClick={() => docUrl && window.open(docUrl, '_blank')}
                  className="bg-transparent border border-slate-400 hover:bg-white text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  View Documentation
                </button>
              </div>

              {/* Support Center */}
              <div className="bg-green-50 border border-green-300 rounded-lg p-5">
                <h4 className="text-base font-bold text-green-600 mb-1">Support Center</h4>
                <p className="text-sm text-green-600 font-medium mb-4">Contact our support team for assistance</p>
                <button
                  onClick={() => supportPortal && window.open(supportPortal, '_blank')}
                  className="bg-transparent border border-green-300 hover:bg-white text-green-600 px-6 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  Get Help
                </button>
              </div>

              {/* FAQ */}
              <div className="bg-purple-50 border border-purple-300 rounded-lg p-5">
                <h4 className="text-base font-bold text-purple-600 mb-1">FAQ</h4>
                <p className="text-sm text-purple-600 font-medium mb-4">Common questions and troubleshooting</p>
                <button
                  onClick={() => alert("FAQ module is currently not available.")}
                  className="bg-transparent border border-purple-300 hover:bg-white text-purple-600 px-6 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  View FAQ
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 relative pb-10">

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

      {/* Header text */}
      <div className="pt-2">
        <h3 className="text-lg font-bold text-slate-800">System Settings</h3>
        <p className="text-slate-500 text-sm font-medium">Configure system-wide settings and preferences</p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-[#e2e8f0] p-1.5 rounded-xl flex gap-1 mb-8 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap ${activeTab === tab
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200/50'
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl">
        {renderContent()}
      </div>

    </div>
  );
};

export default SystemSettings;
