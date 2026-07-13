import { describe, expect, it } from 'vitest';
import { filterNotifications, getNotificationIcon, getNotificationIconBgColor } from './notificationUtils';

const items = [
  { _id: '1', type: 'renewal_reminder', title: 'r', message: 'r', priority: 'medium', read: false, createdAt: '2026-01-01' },
  { _id: '2', type: 'budget_alert', title: 'b', message: 'b', priority: 'high', read: true, createdAt: '2026-01-02' },
  { _id: '3', type: 'general', title: 'g', message: 'g', priority: 'low', read: false, createdAt: '2026-01-03' },
] as const;

describe('notification utils', () => {
  it('filters unread notifications correctly', () => {
    const unread = filterNotifications([...items], 'unread');
    expect(unread).toHaveLength(2);
    expect(unread.every((n) => !n.read)).toBe(true);
  });

  it('filters renewal and budget notifications correctly', () => {
    expect(filterNotifications([...items], 'renewal')).toHaveLength(1);
    expect(filterNotifications([...items], 'budget')).toHaveLength(1);
  });

  it('returns expected icon helpers by type', () => {
    expect(getNotificationIcon('budget_alert')).toBe('🔴');
    expect(getNotificationIcon('renewal_reminder')).toBe('🟡');
    expect(getNotificationIcon('general')).toBe('🟢');
    expect(getNotificationIconBgColor('budget_alert')).toContain('#F43F5E');
  });
});
