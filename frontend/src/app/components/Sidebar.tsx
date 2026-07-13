import { Link, useLocation } from 'react-router';
import { 
  LayoutDashboard, 
  Receipt, 
  RotateCcw, 
  PiggyBank, 
  BarChart3, 
  CalendarDays, 
  Bell, 
  Settings,
  LogOut,
  Wallet
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/dashboard/expenses', label: 'Expenses', icon: Receipt },
  { path: '/dashboard/subscriptions', label: 'Subscriptions', icon: RotateCcw },
  { path: '/dashboard/budgets', label: 'Budgets', icon: PiggyBank },
  { path: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/dashboard/calendar', label: 'Calendar', icon: CalendarDays },
  { path: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { path: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  return (
    <div className="sw-sidebar relative w-full bg-gradient-to-b from-[#111827] to-[#0B1120] border-r border-[rgba(255,255,255,0.07)] flex flex-col md:fixed md:left-0 md:top-0 md:h-screen md:w-60">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-[rgba(255,255,255,0.07)]">
        <div className="w-8 h-8 bg-gradient-to-br from-[#10B981] to-[#059669] rounded-lg flex items-center justify-center">
          <Wallet className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-semibold text-[#E2E8F0]" style={{ fontFamily: "'Sora', sans-serif" }}>
          SpendWise
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 md:py-6 space-y-1 max-h-[50vh] overflow-y-auto md:max-h-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                isActive
                  ? 'bg-[#10B981]/10 text-[#10B981] border-l-4 border-[#10B981] -ml-3 pl-6'
                  : 'text-[#94A3B8] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#E2E8F0]'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span style={{ fontFamily: "'Sora', sans-serif" }}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-[rgba(255,255,255,0.07)]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center text-white font-semibold">
            {initials}
          </div>
          <div className="flex-1">
            <div className="text-sm text-[#E2E8F0]" style={{ fontFamily: "'Sora', sans-serif" }}>
              {user?.name || 'User'}
            </div>
            <div className="text-xs text-[#64748B]">{user?.email || 'No email'}</div>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[#94A3B8] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#E2E8F0] transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm" style={{ fontFamily: "'Sora', sans-serif" }}>Logout</span>
        </button>
      </div>
    </div>
  );
}