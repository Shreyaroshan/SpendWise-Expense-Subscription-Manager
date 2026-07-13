import { useEffect, useState } from 'react';
import Header from '../components/Header';
import { X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { deleteNotification, getNotifications, markAllNotificationsRead, markNotificationRead, type NotificationItem } from '../../imports/subscriptionApi';
import { filterNotifications, getNotificationIcon, getNotificationIconBgColor } from '../utils/notificationUtils';

export default function Notifications() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'renewal' | 'budget'>('all');
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadNotifications = async (nextPage = 1, append = false) => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await getNotifications(token, {
        page: nextPage,
        limit: 20,
        unreadOnly: filter === 'unread',
      });
      const items = res.data || [];
      setNotifications((prev) => (append ? [...prev, ...items] : items));
      setPage(res.pagination?.page || nextPage);
      setPages(res.pagination?.pages || 1);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, filter]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = filterNotifications(notifications, filter);

  const onMarkAllRead = async () => {
    if (!token) return;
    try {
      await markAllNotificationsRead(token);
      await loadNotifications(1, false);
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  };

  const onMarkOneRead = async (id: string, read: boolean) => {
    if (!token || read) return;
    try {
      await markNotificationRead(token, id);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const onDismiss = async (id: string) => {
    if (!token) return;
    try {
      setBusyId(id);
      await deleteNotification(token, id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (error) {
      console.error('Failed to dismiss notification:', error);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen">
      <Header title="Notifications" />
      
      <div className="p-8 max-w-[900px] mx-auto">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-[#F43F5E]/10 text-[#F43F5E] rounded-full text-sm font-medium">
              {unreadCount} unread
            </span>
          </div>
          <button onClick={onMarkAllRead} className="text-sm text-[#94A3B8] hover:text-[#E2E8F0]" style={{ fontFamily: "'Sora', sans-serif" }}>
            Mark all as read
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-6">
          <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg text-sm ${filter === 'all' ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30 font-medium' : 'bg-transparent border border-[rgba(255,255,255,0.07)] text-[#94A3B8]'}`}>
            All
          </button>
          <button onClick={() => setFilter('unread')} className={`px-4 py-2 rounded-lg text-sm ${filter === 'unread' ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30 font-medium' : 'bg-transparent border border-[rgba(255,255,255,0.07)] text-[#94A3B8]'}`}>
            Unread
          </button>
          <button onClick={() => setFilter('renewal')} className={`px-4 py-2 rounded-lg text-sm ${filter === 'renewal' ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30 font-medium' : 'bg-transparent border border-[rgba(255,255,255,0.07)] text-[#94A3B8]'}`}>
            Renewals
          </button>
          <button onClick={() => setFilter('budget')} className={`px-4 py-2 rounded-lg text-sm ${filter === 'budget' ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30 font-medium' : 'bg-transparent border border-[rgba(255,255,255,0.07)] text-[#94A3B8]'}`}>
            Budget Alerts
          </button>
        </div>

        {/* Notification List */}
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <div
              key={notification._id}
              onClick={() => onMarkOneRead(notification._id, notification.read)}
              className={`bg-[#111827] border rounded-[18px] p-6 transition-all hover:border-[rgba(255,255,255,0.15)] group ${
                !notification.read 
                  ? 'border-l-4 border-l-[#10B981] border-[rgba(255,255,255,0.07)]' 
                  : 'border-[rgba(255,255,255,0.07)]'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-full ${getNotificationIconBgColor(notification.type)} flex items-center justify-center flex-shrink-0`}>
                  <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className={`text-sm font-semibold mb-1 ${!notification.read ? 'text-[#E2E8F0]' : 'text-[#94A3B8]'}`} style={{ fontFamily: "'Sora', sans-serif" }}>
                        {notification.title}
                      </div>
                      <div className={`text-sm mb-2 ${!notification.read ? 'text-[#E2E8F0]' : 'text-[#64748B]'}`} style={{ fontFamily: "'Sora', sans-serif" }}>
                        {notification.message}
                      </div>
                      <div className="text-xs text-[#64748B]" style={{ fontFamily: "'Sora', sans-serif" }}>
                        {new Date(notification.createdAt).toLocaleString()}
                      </div>
                    </div>

                    {/* Dismiss Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDismiss(notification._id);
                      }}
                      disabled={busyId === notification._id}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-[rgba(255,255,255,0.05)] rounded disabled:opacity-50"
                    >
                      <X className="w-4 h-4 text-[#64748B] hover:text-[#E2E8F0]" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {!loading && !filteredNotifications.length && (
            <div className="text-sm text-[#94A3B8]">No notifications found for this filter.</div>
          )}
        </div>

        {/* Load More */}
        <div className="text-center mt-8">
          <button
            onClick={() => loadNotifications(page + 1, true)}
            disabled={loading || page >= pages}
            className="px-6 py-3 bg-transparent border border-[rgba(255,255,255,0.07)] text-[#E2E8F0] rounded-[10px] hover:bg-[rgba(255,255,255,0.05)] text-sm disabled:opacity-50"
          >
            {loading ? 'Loading...' : page >= pages ? 'No More Notifications' : 'Load More Notifications'}
          </button>
        </div>
      </div>
    </div>
  );
}
