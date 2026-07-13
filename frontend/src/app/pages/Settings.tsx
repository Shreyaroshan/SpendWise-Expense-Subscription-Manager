import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import Header from '../components/Header';
import { User, Lock, Globe, Bell, CreditCard, ChevronDown } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { changePassword } from '../../imports/authApi';
import { getSubscriptionCostStats, getUpcomingRenewals } from '../../imports/subscriptionApi';

type Tab = 'profile' | 'security' | 'preferences' | 'notifications' | 'plan';

export default function Settings() {
  const { user, updateProfile, token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [dateFormat, setDateFormat] = useState<'DD/MM/YYYY' | 'MM/DD/YYYY'>('DD/MM/YYYY');
  const [weekStartsOn, setWeekStartsOn] = useState<'Sunday' | 'Monday'>('Monday');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [notifPrefs, setNotifPrefs] = useState({
    email: true,
    inApp: true,
    renewalReminder: true,
    budgetAlert: true,
    budgetAlert80: true,
    budgetAlert100: true,
    monthlySummary: true,
    alertThreshold: 80,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityMessage, setSecurityMessage] = useState<string | null>(null);
  const [planStats, setPlanStats] = useState<{ activeCount: number; monthlyTotal: number; yearlyTotal: number } | null>(null);
  const [upcomingRenewals, setUpcomingRenewals] = useState<Array<{ _id: string; name: string; amount: number; nextBillingDate: string }>>([]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['profile', 'security', 'preferences', 'notifications', 'plan'].includes(tab)) {
      setActiveTab(tab as Tab);
    }
  }, [searchParams]);

  const onTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab);
      return next;
    }, { replace: true });
  };

  useEffect(() => {
    if (!user) return;

    setName(user.name || '');
    setPhoneNumber(user.phoneNumber || '');
    setAvatarUrl(user.avatarUrl || '');
    setCurrency(user.currency || 'INR');
    setTimezone(user.timezone || 'Asia/Kolkata');
    setDateFormat(user.preferences?.dateFormat || 'DD/MM/YYYY');
    setWeekStartsOn(user.preferences?.weekStartsOn || 'Monday');
    setTheme(user.preferences?.theme || 'dark');
    setNotifPrefs({
      email: user.notifPrefs?.email ?? true,
      inApp: user.notifPrefs?.inApp ?? true,
      renewalReminder: user.notifPrefs?.renewalReminder ?? true,
      budgetAlert: user.notifPrefs?.budgetAlert ?? true,
      budgetAlert80: user.notifPrefs?.budgetAlert80 ?? true,
      budgetAlert100: user.notifPrefs?.budgetAlert100 ?? true,
      monthlySummary: user.notifPrefs?.monthlySummary ?? true,
      alertThreshold: user.notifPrefs?.alertThreshold ?? 80,
    });
  }, [user]);

  useEffect(() => {
    const loadPlanData = async () => {
      if (!token) return;
      try {
        const [stats, renewals] = await Promise.all([
          getSubscriptionCostStats(token),
          getUpcomingRenewals(token, 30),
        ]);
        setPlanStats(stats);
        setUpcomingRenewals(renewals);
      } catch (error) {
        console.error('Failed to load plan data:', error);
      }
    };

    loadPlanData();
  }, [token]);

  const initials = useMemo(() => {
    if (!name.trim()) return 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [name]);

  const save = async (payload: {
    name?: string;
    phoneNumber?: string;
    avatarUrl?: string;
    currency?: string;
    timezone?: string;
    notifPrefs?: {
      email: boolean;
      inApp: boolean;
      renewalReminder: boolean;
      budgetAlert: boolean;
      budgetAlert80: boolean;
      budgetAlert100: boolean;
      monthlySummary: boolean;
      alertThreshold?: number;
    };
    preferences?: {
      dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY';
      weekStartsOn: 'Sunday' | 'Monday';
      theme: 'dark' | 'light';
    };
  }) => {
    setSaving(true);
    setMessage(null);
    try {
      await updateProfile(payload);
      setMessage('Saved successfully');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const onChangePhoto = async () => {
    const nextUrl = window.prompt('Paste profile image URL', avatarUrl || '');
    if (nextUrl === null) return;

    const trimmed = nextUrl.trim();
    if (!trimmed) {
      setAvatarUrl('');
      await save({ avatarUrl: '' });
      return;
    }

    setAvatarUrl(trimmed);
    await save({ avatarUrl: trimmed });
  };

  const saveProfile = async () => save({ name, phoneNumber, avatarUrl });
  const savePreferences = async () => save({
    currency,
    timezone,
    preferences: {
      dateFormat,
      weekStartsOn,
      theme,
    },
  });
  const saveNotificationPrefs = async () => save({ notifPrefs });

  const handleChangePassword = async () => {
    setSecurityMessage(null);

    if (!token) {
      setSecurityMessage('Not authenticated');
      return;
    }

    if (!currentPassword || !newPassword) {
      setSecurityMessage('Current and new password are required');
      return;
    }

    if (newPassword.length < 6) {
      setSecurityMessage('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setSecurityMessage('New password and confirm password do not match');
      return;
    }

    setSaving(true);
    try {
      await changePassword(token, { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSecurityMessage('Password changed successfully');
    } catch (error) {
      setSecurityMessage(error instanceof Error ? error.message : 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile' as Tab, label: 'Profile', icon: User },
    { id: 'security' as Tab, label: 'Security', icon: Lock },
    { id: 'preferences' as Tab, label: 'Preferences', icon: Globe },
    { id: 'notifications' as Tab, label: 'Notifications', icon: Bell },
    { id: 'plan' as Tab, label: 'Subscription Plan', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen">
      <Header title="Settings" />
      
      <div className="p-4 sm:p-8 max-w-[1280px]">
        <div className="grid grid-cols-[200px_1fr] gap-8">
          {/* Left Tab Menu */}
          <div className="bg-[#111827] border border-[rgba(255,255,255,0.07)] rounded-[18px] p-4 h-fit">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                      activeTab === tab.id
                        ? 'bg-[#10B981]/10 text-[#10B981]'
                        : 'text-[#94A3B8] hover:bg-[rgba(255,255,255,0.05)]'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm" style={{ fontFamily: "'Sora', sans-serif" }}>
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Content Panel */}
          <div className="bg-[#111827] border border-[rgba(255,255,255,0.07)] rounded-[18px] p-8">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div>
                <h2 className="text-2xl font-semibold text-[#E2E8F0] mb-6" style={{ fontFamily: "'Sora', sans-serif" }}>
                  Profile Settings
                </h2>

                {/* Profile Picture */}
                <div className="mb-8">
                  <label className="block text-sm text-[#94A3B8] mb-3">Profile Picture</label>
                  <div className="flex items-center gap-4">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Profile" className="w-20 h-20 rounded-full object-cover border border-[rgba(255,255,255,0.07)]" />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center text-white text-2xl font-semibold">
                        {initials}
                      </div>
                    )}
                    <button onClick={onChangePhoto} className="px-4 py-2 bg-[#0B1120] border border-[rgba(255,255,255,0.07)] text-[#E2E8F0] rounded-lg hover:bg-[rgba(255,255,255,0.05)] text-sm">
                      Change Photo
                    </button>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm text-[#94A3B8] mb-2">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 bg-[#0B1120] border border-[rgba(255,255,255,0.07)] rounded-lg text-[#E2E8F0] focus:outline-none focus:border-[#10B981]/50"
                      style={{ fontFamily: "'Sora', sans-serif" }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-[#94A3B8] mb-2">Email</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={user?.email || ''}
                        readOnly
                        className="w-full px-4 py-3 bg-[#0B1120] border border-[rgba(255,255,255,0.07)] rounded-lg text-[#E2E8F0] focus:outline-none focus:border-[#10B981]/50"
                        style={{ fontFamily: "'Sora', sans-serif" }}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-[#10B981]/10 text-[#10B981] rounded text-xs font-medium">
                        Verified
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-[#94A3B8] mb-2">Phone Number (optional)</label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+91 XXXXX XXXXX"
                      className="w-full px-4 py-3 bg-[#0B1120] border border-[rgba(255,255,255,0.07)] rounded-lg text-[#E2E8F0] placeholder:text-[#64748B] focus:outline-none focus:border-[#10B981]/50"
                      style={{ fontFamily: "'Sora', sans-serif" }}
                    />
                  </div>

                  <button
                    onClick={saveProfile}
                    disabled={saving}
                    className="px-6 py-3 bg-gradient-to-r from-[#10B981] to-[#059669] text-white rounded-[10px] font-medium hover:shadow-lg hover:shadow-[#10B981]/20 transition-all disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  {message && <div className="text-sm text-[#94A3B8]">{message}</div>}
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div>
                <h2 className="text-2xl font-semibold text-[#E2E8F0] mb-6" style={{ fontFamily: "'Sora', sans-serif" }}>
                  Preferences
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm text-[#94A3B8] mb-2">Currency</label>
                    <div className="relative">
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full px-4 py-3 bg-[#0B1120] border border-[rgba(255,255,255,0.07)] rounded-lg text-[#E2E8F0] focus:outline-none focus:border-[#10B981]/50 appearance-none"
                        style={{ fontFamily: "'DM Mono', monospace" }}
                      >
                        <option value="INR">INR ₹ - Indian Rupee</option>
                        <option value="USD">USD $ - US Dollar</option>
                        <option value="EUR">EUR € - Euro</option>
                        <option value="GBP">GBP £ - British Pound</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B] pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-[#94A3B8] mb-2">Timezone</label>
                    <div className="relative">
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full px-4 py-3 bg-[#0B1120] border border-[rgba(255,255,255,0.07)] rounded-lg text-[#E2E8F0] focus:outline-none focus:border-[#10B981]/50 appearance-none"
                        style={{ fontFamily: "'Sora', sans-serif" }}
                      >
                        <option value="Asia/Kolkata">IST (UTC+5:30)</option>
                        <option value="America/Los_Angeles">PST (UTC-8:00)</option>
                        <option value="America/New_York">EST (UTC-5:00)</option>
                        <option value="UTC">UTC (UTC+0:00)</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B] pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-[#94A3B8] mb-3">Date Format</label>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setDateFormat('DD/MM/YYYY')}
                        className={`flex-1 px-4 py-3 rounded-lg text-sm ${dateFormat === 'DD/MM/YYYY' ? 'bg-[#10B981]/10 border border-[#10B981]/50 text-[#10B981] font-medium' : 'bg-[#0B1120] border border-[rgba(255,255,255,0.07)] text-[#94A3B8]'}`}
                      >
                        DD/MM/YYYY
                      </button>
                      <button
                        onClick={() => setDateFormat('MM/DD/YYYY')}
                        className={`flex-1 px-4 py-3 rounded-lg text-sm ${dateFormat === 'MM/DD/YYYY' ? 'bg-[#10B981]/10 border border-[#10B981]/50 text-[#10B981] font-medium' : 'bg-[#0B1120] border border-[rgba(255,255,255,0.07)] text-[#94A3B8]'}`}
                      >
                        MM/DD/YYYY
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-[#94A3B8] mb-3">Week Starts On</label>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setWeekStartsOn('Sunday')}
                        className={`flex-1 px-4 py-3 rounded-lg text-sm ${weekStartsOn === 'Sunday' ? 'bg-[#10B981]/10 border border-[#10B981]/50 text-[#10B981] font-medium' : 'bg-[#0B1120] border border-[rgba(255,255,255,0.07)] text-[#94A3B8]'}`}
                      >
                        Sunday
                      </button>
                      <button
                        onClick={() => setWeekStartsOn('Monday')}
                        className={`flex-1 px-4 py-3 rounded-lg text-sm ${weekStartsOn === 'Monday' ? 'bg-[#10B981]/10 border border-[#10B981]/50 text-[#10B981] font-medium' : 'bg-[#0B1120] border border-[rgba(255,255,255,0.07)] text-[#94A3B8]'}`}
                      >
                        Monday
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-[#94A3B8] mb-3">Theme</label>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setTheme('dark')}
                        className={`flex-1 px-4 py-3 rounded-lg text-sm ${theme === 'dark' ? 'bg-[#10B981]/10 border border-[#10B981]/50 text-[#10B981] font-medium' : 'bg-[#0B1120] border border-[rgba(255,255,255,0.07)] text-[#94A3B8]'}`}
                      >
                        Dark
                      </button>
                      <button
                        onClick={() => setTheme('light')}
                        className={`flex-1 px-4 py-3 rounded-lg text-sm ${theme === 'light' ? 'bg-[#10B981]/10 border border-[#10B981]/50 text-[#10B981] font-medium' : 'bg-[#0B1120] border border-[rgba(255,255,255,0.07)] text-[#94A3B8]'}`}
                      >
                        Light
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={savePreferences}
                    disabled={saving}
                    className="px-6 py-3 bg-gradient-to-r from-[#10B981] to-[#059669] text-white rounded-[10px] font-medium hover:shadow-lg hover:shadow-[#10B981]/20 transition-all disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Preferences'}
                  </button>
                  {message && <div className="text-sm text-[#94A3B8]">{message}</div>}
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div>
                <h2 className="text-2xl font-semibold text-[#E2E8F0] mb-6" style={{ fontFamily: "'Sora', sans-serif" }}>
                  Notification Settings
                </h2>

                <div className="space-y-6">
                  {/* Email Notifications */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-sm font-medium text-[#E2E8F0]" style={{ fontFamily: "'Sora', sans-serif" }}>
                          Email Notifications
                        </div>
                        <div className="text-xs text-[#64748B]">Receive email updates</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifPrefs.email}
                          onChange={(e) =>
                            setNotifPrefs((prev) => ({
                              ...prev,
                              email: e.target.checked,
                            }))
                          }
                          className="sr-only peer"
                        />
                        <div className="sw-toggle-track w-11 h-6 bg-[#0B1120] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10B981]"></div>
                      </label>
                    </div>

                    <div className="ml-6 space-y-3">
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-[#94A3B8]">Subscription Renewal Reminders</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifPrefs.renewalReminder}
                            onChange={(e) =>
                              setNotifPrefs((prev) => ({
                                ...prev,
                                renewalReminder: e.target.checked,
                              }))
                            }
                            className="sr-only peer"
                          />
                          <div className="sw-toggle-track w-11 h-6 bg-[#0B1120] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10B981]"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-[#94A3B8]">Budget Alert Emails</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifPrefs.budgetAlert}
                            onChange={(e) =>
                              setNotifPrefs((prev) => ({
                                ...prev,
                                budgetAlert: e.target.checked,
                              }))
                            }
                            className="sr-only peer"
                          />
                          <div className="sw-toggle-track w-11 h-6 bg-[#0B1120] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10B981]"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* In-App Notifications */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-sm font-medium text-[#E2E8F0]" style={{ fontFamily: "'Sora', sans-serif" }}>
                          In-App Notifications
                        </div>
                        <div className="text-xs text-[#64748B]">Receive notifications within the app</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifPrefs.inApp}
                          onChange={(e) =>
                            setNotifPrefs((prev) => ({
                              ...prev,
                              inApp: e.target.checked,
                            }))
                          }
                          className="sr-only peer"
                        />
                        <div className="sw-toggle-track w-11 h-6 bg-[#0B1120] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10B981]"></div>
                      </label>
                    </div>

                    <div className="ml-6 space-y-3">
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-[#94A3B8]">Budget at 80% alert</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifPrefs.budgetAlert80}
                            onChange={(e) =>
                              setNotifPrefs((prev) => ({
                                ...prev,
                                budgetAlert80: e.target.checked,
                              }))
                            }
                            className="sr-only peer"
                          />
                          <div className="sw-toggle-track w-11 h-6 bg-[#0B1120] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10B981]"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-[#94A3B8]">Budget at 100% alert</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifPrefs.budgetAlert100}
                            onChange={(e) =>
                              setNotifPrefs((prev) => ({
                                ...prev,
                                budgetAlert100: e.target.checked,
                              }))
                            }
                            className="sr-only peer"
                          />
                          <div className="sw-toggle-track w-11 h-6 bg-[#0B1120] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10B981]"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-[#94A3B8]">Monthly summary report</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifPrefs.monthlySummary}
                            onChange={(e) =>
                              setNotifPrefs((prev) => ({
                                ...prev,
                                monthlySummary: e.target.checked,
                              }))
                            }
                            className="sr-only peer"
                          />
                          <div className="sw-toggle-track w-11 h-6 bg-[#0B1120] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10B981]"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Alert Threshold */}
                  <div>
                    <label className="block text-sm text-[#94A3B8] mb-3">
                      Alert me when budget reaches
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="50"
                        max="100"
                        value={notifPrefs.alertThreshold}
                        onChange={(e) =>
                          setNotifPrefs((prev) => ({
                            ...prev,
                            alertThreshold: Number(e.target.value),
                          }))
                        }
                        className="flex-1 h-2 bg-[#0B1120] rounded-lg appearance-none cursor-pointer accent-[#10B981]"
                      />
                      <div className="px-4 py-2 bg-[#0B1120] border border-[rgba(255,255,255,0.07)] rounded-lg text-[#E2E8F0] font-medium min-w-[60px] text-center" style={{ fontFamily: "'DM Mono', monospace" }}>
                        {notifPrefs.alertThreshold}%
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={saveNotificationPrefs}
                    disabled={saving}
                    className="px-6 py-3 bg-gradient-to-r from-[#10B981] to-[#059669] text-white rounded-[10px] font-medium hover:shadow-lg hover:shadow-[#10B981]/20 transition-all disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Settings'}
                  </button>
                  {message && <div className="text-sm text-[#94A3B8]">{message}</div>}
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div>
                <h2 className="text-2xl font-semibold text-[#E2E8F0] mb-6" style={{ fontFamily: "'Sora', sans-serif" }}>
                  Security
                </h2>
                <div className="space-y-5 max-w-xl">
                  <div>
                    <label className="block text-sm text-[#94A3B8] mb-2">Current Password</label>
                    <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full px-4 py-3 bg-[#0B1120] border border-[rgba(255,255,255,0.07)] rounded-lg text-[#E2E8F0]" />
                  </div>
                  <div>
                    <label className="block text-sm text-[#94A3B8] mb-2">New Password</label>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-3 bg-[#0B1120] border border-[rgba(255,255,255,0.07)] rounded-lg text-[#E2E8F0]" />
                  </div>
                  <div>
                    <label className="block text-sm text-[#94A3B8] mb-2">Confirm New Password</label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-3 bg-[#0B1120] border border-[rgba(255,255,255,0.07)] rounded-lg text-[#E2E8F0]" />
                  </div>
                  <button onClick={handleChangePassword} disabled={saving} className="px-6 py-3 bg-gradient-to-r from-[#10B981] to-[#059669] text-white rounded-[10px] font-medium disabled:opacity-50">
                    {saving ? 'Updating...' : 'Change Password'}
                  </button>
                  {securityMessage && <div className="text-sm text-[#94A3B8]">{securityMessage}</div>}
                </div>
              </div>
            )}

            {activeTab === 'plan' && (
              <div>
                <h2 className="text-2xl font-semibold text-[#E2E8F0] mb-6" style={{ fontFamily: "'Sora', sans-serif" }}>
                  Subscription Plan
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-[#0B1120] border border-[rgba(255,255,255,0.07)] rounded-lg">
                    <div className="text-xs text-[#94A3B8]">Active Subscriptions</div>
                    <div className="text-2xl text-[#E2E8F0]" style={{ fontFamily: "'DM Mono', monospace" }}>{planStats?.activeCount || 0}</div>
                  </div>
                  <div className="p-4 bg-[#0B1120] border border-[rgba(255,255,255,0.07)] rounded-lg">
                    <div className="text-xs text-[#94A3B8]">Monthly Cost</div>
                    <div className="text-2xl text-[#E2E8F0]" style={{ fontFamily: "'DM Mono', monospace" }}>₹{Math.round(planStats?.monthlyTotal || 0).toLocaleString()}</div>
                  </div>
                  <div className="p-4 bg-[#0B1120] border border-[rgba(255,255,255,0.07)] rounded-lg">
                    <div className="text-xs text-[#94A3B8]">Yearly Cost</div>
                    <div className="text-2xl text-[#E2E8F0]" style={{ fontFamily: "'DM Mono', monospace" }}>₹{Math.round(planStats?.yearlyTotal || 0).toLocaleString()}</div>
                  </div>
                </div>

                <div className="bg-[#0B1120] border border-[rgba(255,255,255,0.07)] rounded-lg p-4">
                  <div className="text-sm text-[#E2E8F0] mb-3">Upcoming Renewals (30 days)</div>
                  <div className="space-y-2">
                    {upcomingRenewals.map((renewal) => (
                      <div key={renewal._id} className="flex items-center justify-between text-sm text-[#94A3B8]">
                        <span>{renewal.name}</span>
                        <span style={{ fontFamily: "'DM Mono', monospace" }}>
                          ₹{renewal.amount} on {new Date(renewal.nextBillingDate).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                    {!upcomingRenewals.length && <div className="text-sm text-[#64748B]">No renewals in the next 30 days.</div>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
