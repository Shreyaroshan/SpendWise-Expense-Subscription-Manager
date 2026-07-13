import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Bell, ChevronDown, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getNotifications } from '../../imports/subscriptionApi';

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const currencyLabel = useMemo(() => {
    const code = user?.currency || 'INR';
    const symbols: Record<string, string> = {
      INR: '₹',
      USD: '$',
      EUR: '€',
      GBP: '£',
    };

    return `${code} ${symbols[code] || ''}`.trim();
  }, [user?.currency]);

  useEffect(() => {
    const loadUnreadCount = async () => {
      if (!token) {
        setUnreadCount(0);
        return;
      }

      try {
        const res = await getNotifications(token, { page: 1, limit: 1, unreadOnly: true });
        setUnreadCount(res.pagination?.total || 0);
      } catch (error) {
        console.error('Failed to load unread notifications:', error);
      }
    };

    loadUnreadCount();
  }, [token, location.pathname]);

  const isNotificationsPage = location.pathname === '/dashboard/notifications';

  return (
    <div className="sw-header min-h-16 bg-[#111827] border-b border-[rgba(255,255,255,0.07)] flex flex-col gap-3 md:flex-row md:items-center md:justify-between px-4 py-4 md:px-8 md:py-0">
      {/* Page Title */}
      <h1 className="text-xl md:text-2xl font-semibold text-[#E2E8F0]" style={{ fontFamily: "'Sora', sans-serif" }}>
        {title}
      </h1>

      {/* Right Section */}
      <div className="flex items-center gap-2 md:gap-4 flex-wrap justify-end">
        {/* Notification Bell */}
        <button
          onClick={() => navigate('/dashboard/notifications')}
          className="relative p-2 hover:bg-[rgba(255,255,255,0.05)] rounded-lg transition-colors"
          aria-label="Open notifications"
        >
          <Bell className={`w-5 h-5 ${isNotificationsPage ? 'text-[#E2E8F0]' : 'text-[#94A3B8]'}`} />
          {unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-[#F43F5E] rounded-full"></span>}
        </button>

        {/* Currency Selector */}
        <button
          onClick={() => navigate('/dashboard/settings?tab=preferences')}
          className="flex items-center gap-2 px-3 py-2 bg-[#0B1120] border border-[rgba(255,255,255,0.07)] rounded-lg text-[#E2E8F0] hover:bg-[rgba(255,255,255,0.05)] transition-colors"
          aria-label="Open currency preferences"
        >
          <span style={{ fontFamily: "'DM Mono', monospace" }}>{currencyLabel}</span>
          <ChevronDown className="w-4 h-4 text-[#64748B]" />
        </button>

        {/* User Avatar */}
        <button
          onClick={() => navigate('/dashboard/settings?tab=profile')}
          className="p-1.5 hover:bg-[rgba(255,255,255,0.05)] rounded-lg transition-colors"
          aria-label="Open profile settings"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
        </button>
      </div>
    </div>
  );
}
