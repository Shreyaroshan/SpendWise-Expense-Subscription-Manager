import type { NotificationItem } from '../../imports/subscriptionApi';

export const getNotificationIconBgColor = (type: NotificationItem['type']) => {
  if (type === 'budget_alert') return 'bg-[#F43F5E]/10';
  if (type === 'renewal_reminder') return 'bg-[#F59E0B]/10';
  return 'bg-[#10B981]/10';
};

export const getNotificationIcon = (type: NotificationItem['type']) => {
  if (type === 'budget_alert') return '🔴';
  if (type === 'renewal_reminder') return '🟡';
  return '🟢';
};

export const filterNotifications = (
  notifications: NotificationItem[],
  filter: 'all' | 'unread' | 'renewal' | 'budget'
) => {
  return notifications.filter((notification) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.read;
    if (filter === 'renewal') return notification.type === 'renewal_reminder';
    if (filter === 'budget') return notification.type === 'budget_alert';
    return true;
  });
};
