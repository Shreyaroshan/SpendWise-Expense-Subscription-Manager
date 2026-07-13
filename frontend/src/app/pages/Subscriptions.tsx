import { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import { Plus, Pencil, Pause, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import {
  checkRenewalReminders,
  createSubscription,
  deleteSubscription,
  getSubscriptionCostStats,
  getSubscriptions,
  getUpcomingRenewals,
  updateSubscription,
  updateSubscriptionStatus,
  type Subscription,
} from '../../imports/subscriptionApi';

export default function Subscriptions() {
  const { token } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [upcomingRenewals, setUpcomingRenewals] = useState<Array<{ _id: string; name: string; amount: number; nextBillingDate: string }>>([]);
  const [stats, setStats] = useState<{ activeCount: number; monthlyTotal: number; yearlyTotal: number } | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused' | 'cancelled'>('all');
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [billingCycle, setBillingCycle] = useState<'weekly' | 'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [nextBillingDate, setNextBillingDate] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<'active' | 'paused' | 'cancelled'>('active');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);
  const [checkingRenewals, setCheckingRenewals] = useState(false);

  const getDaysUntilRenewal = (nextBillingDate: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetRaw = new Date(nextBillingDate);
    const target = new Date(targetRaw.getFullYear(), targetRaw.getMonth(), targetRaw.getDate());
    const msPerDay = 1000 * 60 * 60 * 24;
    return Math.max(0, Math.floor((target.getTime() - today.getTime()) / msPerDay));
  };

  useEffect(() => {
    const loadData = async () => {
      if (!token) return;
      try {
        const [allSubs, renewals, totals] = await Promise.all([
          getSubscriptions(token, statusFilter === 'all' ? undefined : statusFilter),
          getUpcomingRenewals(token, 30),
          getSubscriptionCostStats(token),
        ]);
        setSubscriptions(allSubs);
        setUpcomingRenewals(renewals);
        setStats(totals);
      } catch (error) {
        console.error('Failed to load subscriptions:', error);
      }
    };

    loadData();
  }, [token, statusFilter]);

  const reload = async () => {
    if (!token) return;
    const [allSubs, renewals, totals] = await Promise.all([
      getSubscriptions(token, statusFilter === 'all' ? undefined : statusFilter),
      getUpcomingRenewals(token, 30),
      getSubscriptionCostStats(token),
    ]);
    setSubscriptions(allSubs);
    setUpcomingRenewals(renewals);
    setStats(totals);
  };

  const onCreateSubscription = async () => {
    setError('');
    if (!token || !name || !amount) {
      setError('Name and amount are required');
      return;
    }

    try {
      await createSubscription(token, {
        name,
        category: category || 'Other',
        amount: Number(amount),
        billingCycle,
        nextBillingDate,
        status,
        notes,
      });
      setShowModal(false);
      setName('');
      setCategory('');
      setAmount('');
      setBillingCycle('monthly');
      setNextBillingDate(new Date().toISOString().slice(0, 10));
      setStatus('active');
      setNotes('');
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create subscription');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setCategory('');
    setAmount('');
    setBillingCycle('monthly');
    setNextBillingDate(new Date().toISOString().slice(0, 10));
    setStatus('active');
    setNotes('');
    setError('');
  };

  const onEditSubscription = (sub: Subscription) => {
    setEditingId(sub._id);
    setName(sub.name);
    setCategory(sub.category || '');
    setAmount(String(sub.amount));
    setBillingCycle(sub.billingCycle);
    setNextBillingDate(new Date(sub.nextBillingDate).toISOString().slice(0, 10));
    setStatus(sub.status);
    setNotes(sub.notes || '');
    setShowModal(true);
  };

  const onSaveSubscription = async () => {
    if (editingId) {
      setError('');
      if (!token || !name || !amount) {
        setError('Name and amount are required');
        return;
      }

      try {
        await updateSubscription(token, editingId, {
          name,
          category: category || 'Other',
          amount: Number(amount),
          billingCycle,
          nextBillingDate,
          status,
          notes,
        });
        setShowModal(false);
        resetForm();
        await reload();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to update subscription');
      }
      return;
    }

    await onCreateSubscription();
  };

  const onTogglePause = async (sub: Subscription) => {
    if (!token) return;
    const nextStatus: Subscription['status'] = sub.status === 'paused' ? 'active' : 'paused';
    try {
      setActionBusyId(sub._id);
      await updateSubscriptionStatus(token, sub._id, nextStatus);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update status');
    } finally {
      setActionBusyId(null);
    }
  };

  const onCancelSubscription = async (sub: Subscription) => {
    if (!token) return;
    try {
      setActionBusyId(sub._id);
      await updateSubscriptionStatus(token, sub._id, 'cancelled');
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to cancel subscription');
    } finally {
      setActionBusyId(null);
    }
  };

  const onDeleteSubscription = async (sub: Subscription) => {
    if (!token) return;
    const confirmed = window.confirm(`Delete ${sub.name}? This cannot be undone.`);
    if (!confirmed) return;
    try {
      setActionBusyId(sub._id);
      await deleteSubscription(token, sub._id);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete subscription');
    } finally {
      setActionBusyId(null);
    }
  };

  const onCheckRenewalAlerts = async () => {
    if (!token) return;
    try {
      setCheckingRenewals(true);
      setError('');
      setInfoMessage('');
      const res = await checkRenewalReminders(token);
      const summary = res.data;
      setInfoMessage(
        `${res.message || 'Check completed'} (${summary.createdInApp} in-app, ${summary.sentEmail} email, ${summary.skippedExisting} already sent)`
      );
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to check renewal alerts');
    } finally {
      setCheckingRenewals(false);
    }
  };

  const cards = useMemo(() => {
    return subscriptions.map((sub) => {
      const daysUntil = getDaysUntilRenewal(sub.nextBillingDate);

      return {
        id: sub._id,
        sub,
        icon: '💳',
        name: sub.name,
        category: sub.category,
        amount: sub.amount,
        cycle: sub.billingCycle,
        nextBilling: new Date(sub.nextBillingDate).toLocaleDateString(),
        daysUntil,
        status: sub.status.charAt(0).toUpperCase() + sub.status.slice(1),
      };
    });
  }, [subscriptions]);

  const renewalCards = useMemo(() => {
    if (upcomingRenewals.length) {
      return upcomingRenewals.map((renewal) => ({
        id: renewal._id,
        icon: '🔁',
        name: renewal.name,
        date: new Date(renewal.nextBillingDate).toLocaleDateString(),
        amount: renewal.amount,
      }));
    }

    const today = new Date();
    return subscriptions
      .filter((sub) => sub.status === 'active')
      .map((sub) => ({
        id: sub._id,
        icon: '🔁',
        name: sub.name,
        dateObj: new Date(sub.nextBillingDate),
        amount: sub.amount,
      }))
      .filter((sub) => sub.dateObj >= today)
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
      .slice(0, 8)
      .map((sub) => ({
        id: sub.id,
        icon: sub.icon,
        name: sub.name,
        date: sub.dateObj.toLocaleDateString(),
        amount: sub.amount,
      }));
  }, [upcomingRenewals, subscriptions]);

  const totalMonthly = Math.round(stats?.monthlyTotal || 0);

  return (
    <div className="min-h-screen">
      <Header title="Subscriptions" />
      
      <div className="p-4 sm:p-8 max-w-[1280px]">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-[#111827] border border-[rgba(255,255,255,0.07)] rounded-lg">
              <span className="text-xs text-[#94A3B8]" style={{ fontFamily: "'Sora', sans-serif" }}>Monthly Cost:</span>
              <span className="ml-2 text-sm text-[#E2E8F0]" style={{ fontFamily: "'DM Mono', monospace" }}>₹{totalMonthly.toLocaleString()}</span>
            </div>
            <div className="px-4 py-2 bg-[#111827] border border-[rgba(255,255,255,0.07)] rounded-lg">
              <span className="text-xs text-[#94A3B8]" style={{ fontFamily: "'Sora', sans-serif" }}>Yearly:</span>
              <span className="ml-2 text-sm text-[#E2E8F0]" style={{ fontFamily: "'DM Mono', monospace" }}>
                ₹{Math.round(stats?.yearlyTotal || totalMonthly * 12).toLocaleString()}
              </span>
            </div>
            <div className="px-4 py-2 bg-[#111827] border border-[rgba(255,255,255,0.07)] rounded-lg">
              <span className="text-xs text-[#94A3B8]" style={{ fontFamily: "'Sora', sans-serif" }}>Active:</span>
              <span className="ml-2 text-sm text-[#E2E8F0]" style={{ fontFamily: "'DM Mono', monospace" }}>
                {stats?.activeCount || cards.filter((s) => s.status === 'Active').length}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onCheckRenewalAlerts}
              disabled={checkingRenewals}
              className="px-4 py-2.5 bg-transparent border border-[rgba(255,255,255,0.07)] text-[#E2E8F0] rounded-[10px] hover:bg-[rgba(255,255,255,0.05)] disabled:opacity-50"
            >
              {checkingRenewals ? 'Checking...' : 'Check Renewal Alerts'}
            </button>
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#10B981] to-[#059669] text-white rounded-[10px] font-medium hover:shadow-lg hover:shadow-[#10B981]/20 transition-all">
              <Plus className="w-5 h-5" />
              Add Subscription
            </button>
          </div>
        </div>
        {infoMessage && <div className="mb-4 text-sm text-[#22D3EE]">{infoMessage}</div>}
        {error && <div className="mb-4 text-sm text-[#F43F5E]">{error}</div>}

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-6">
          <button onClick={() => setStatusFilter('all')} className={`px-4 py-2 rounded-lg text-sm ${statusFilter === 'all' ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30' : 'bg-transparent border border-[rgba(255,255,255,0.07)] text-[#94A3B8]'}`}>
            All
          </button>
          <button onClick={() => setStatusFilter('active')} className={`px-4 py-2 rounded-lg text-sm ${statusFilter === 'active' ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30' : 'bg-transparent border border-[rgba(255,255,255,0.07)] text-[#94A3B8]'}`}>
            Active
          </button>
          <button onClick={() => setStatusFilter('paused')} className={`px-4 py-2 rounded-lg text-sm ${statusFilter === 'paused' ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30' : 'bg-transparent border border-[rgba(255,255,255,0.07)] text-[#94A3B8]'}`}>
            Paused
          </button>
          <button onClick={() => setStatusFilter('cancelled')} className={`px-4 py-2 rounded-lg text-sm ${statusFilter === 'cancelled' ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30' : 'bg-transparent border border-[rgba(255,255,255,0.07)] text-[#94A3B8]'}`}>
            Cancelled
          </button>
        </div>

        {/* Subscription Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {cards.map((card) => (
            <div 
              key={card.id}
              className="bg-[#111827] border border-[rgba(255,255,255,0.07)] rounded-[18px] p-6 hover:-translate-y-1 hover:border-[rgba(255,255,255,0.15)] transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#1A2540] to-[#0B1120] rounded-xl flex items-center justify-center text-2xl">
                    💳
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-[#E2E8F0]" style={{ fontFamily: "'Sora', sans-serif" }}>
                      {card.name}
                    </div>
                    <span className="inline-block px-2 py-0.5 bg-[#64748B]/10 text-[#94A3B8] rounded-full text-xs mt-1">
                      {card.category}
                    </span>
                  </div>
                </div>
              </div>

              {/* Amount */}
              <div className="mb-4">
                <div className="text-2xl font-medium text-[#E2E8F0]" style={{ fontFamily: "'DM Mono', monospace" }}>
                  ₹{card.amount}
                </div>
                <div className="text-xs text-[#64748B]" style={{ fontFamily: "'Sora', sans-serif" }}>
                  per {card.cycle}
                </div>
              </div>

              {/* Next Billing */}
              <div className="mb-4 flex items-center gap-2 text-sm text-[#94A3B8]">
                <span className="text-xs">📅</span>
                <span style={{ fontFamily: "'Sora', sans-serif" }}>Next billing: {card.nextBilling}</span>
              </div>

              {/* Status */}
              <div className="mb-4">
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                  card.sub.status === 'active' ? 'bg-[#10B981]/10 text-[#10B981]' :
                  card.sub.status === 'paused' ? 'bg-[#F59E0B]/10 text-[#F59E0B]' :
                  'bg-[#F43F5E]/10 text-[#F43F5E]'
                }`}>
                  {card.status}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="w-full h-1.5 bg-[#0B1120] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#F59E0B] to-[#D97706]"
                    style={{ width: `${Math.max(0, 100 - (card.daysUntil / 30) * 100)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-[#64748B] mt-1">
                  {card.daysUntil} days until renewal
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button onClick={() => onEditSubscription(card.sub)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#0B1120] border border-[rgba(255,255,255,0.07)] text-[#22D3EE] rounded-lg text-sm hover:bg-[rgba(255,255,255,0.05)]">
                  <Pencil className="w-4 h-4" />
                  Edit
                </button>
                <button onClick={() => onTogglePause(card.sub)} disabled={actionBusyId === card.id} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#0B1120] border border-[rgba(255,255,255,0.07)] text-[#F59E0B] rounded-lg text-sm hover:bg-[rgba(255,255,255,0.05)] disabled:opacity-50">
                  <Pause className="w-4 h-4" />
                  {card.sub.status === 'paused' ? 'Resume' : 'Pause'}
                </button>
                <button onClick={() => onCancelSubscription(card.sub)} disabled={actionBusyId === card.id || card.sub.status === 'cancelled'} className="flex items-center justify-center px-3 py-2 bg-[#0B1120] border border-[rgba(255,255,255,0.07)] text-[#F43F5E] rounded-lg text-sm hover:bg-[rgba(255,255,255,0.05)] disabled:opacity-50">
                  <X className="w-4 h-4" />
                </button>
                <button onClick={() => onDeleteSubscription(card.sub)} disabled={actionBusyId === card.id} className="flex items-center justify-center px-3 py-2 bg-[#0B1120] border border-[rgba(255,255,255,0.07)] text-[#F43F5E] rounded-lg text-sm hover:bg-[rgba(255,255,255,0.05)] disabled:opacity-50">
                  Del
                </button>
              </div>
            </div>
          ))}
          {!cards.length && (
            <div className="col-span-3 text-sm text-[#94A3B8]">No subscriptions yet. Add your first subscription to start tracking renewals.</div>
          )}
        </div>

        {/* Upcoming Renewals Banner */}
        <div className="bg-[#111827] border border-[rgba(255,255,255,0.07)] rounded-[18px] p-6">
          <h3 className="text-lg font-semibold text-[#E2E8F0] mb-4" style={{ fontFamily: "'Sora', sans-serif" }}>
            Upcoming Renewals (Next 30 Days)
          </h3>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {renewalCards.map((renewal) => (
              <div 
                key={renewal.id}
                className="flex-shrink-0 bg-[#0B1120] border border-[rgba(255,255,255,0.07)] rounded-lg p-4 w-40 hover:border-[#F59E0B]/50 transition-colors"
              >
                <div className="text-2xl mb-2">{renewal.icon}</div>
                <div className="text-sm text-[#E2E8F0] font-medium mb-1" style={{ fontFamily: "'Sora', sans-serif" }}>
                  {renewal.name}
                </div>
                <div className="text-xs text-[#64748B] mb-2" style={{ fontFamily: "'Sora', sans-serif" }}>
                  {renewal.date}
                </div>
                <div className="px-2 py-1 bg-[#F59E0B]/10 text-[#F59E0B] rounded text-xs font-medium text-center" style={{ fontFamily: "'DM Mono', monospace" }}>
                  ₹{renewal.amount}
                </div>
              </div>
            ))}
            {!renewalCards.length && (
              <div className="text-sm text-[#94A3B8]">No upcoming renewals in the next 30 days.</div>
            )}
          </div>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-[#111827] border border-[rgba(255,255,255,0.07)] rounded-[18px] p-8 w-full max-w-2xl mx-4">
              <h2 className="text-2xl font-semibold text-[#E2E8F0] mb-6" style={{ fontFamily: "'Sora', sans-serif" }}>
                Add Subscription
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Service name" className="px-4 py-3 bg-[#0B1120] border border-[rgba(255,255,255,0.07)] rounded-lg text-[#E2E8F0]" />
                  <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category (e.g. Entertainment)" className="px-4 py-3 bg-[#0B1120] border border-[rgba(255,255,255,0.07)] rounded-lg text-[#E2E8F0]" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" className="px-4 py-3 bg-[#0B1120] border border-[rgba(255,255,255,0.07)] rounded-lg text-[#E2E8F0]" />
                  <select value={billingCycle} onChange={(e) => setBillingCycle(e.target.value as 'weekly' | 'monthly' | 'quarterly' | 'yearly')} className="px-4 py-3 bg-[#0B1120] border border-[rgba(255,255,255,0.07)] rounded-lg text-[#E2E8F0]">
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                  <select value={status} onChange={(e) => setStatus(e.target.value as 'active' | 'paused' | 'cancelled')} className="px-4 py-3 bg-[#0B1120] border border-[rgba(255,255,255,0.07)] rounded-lg text-[#E2E8F0]">
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <input type="date" value={nextBillingDate} onChange={(e) => setNextBillingDate(e.target.value)} className="w-full px-4 py-3 bg-[#0B1120] border border-[rgba(255,255,255,0.07)] rounded-lg text-[#E2E8F0]" />
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" className="w-full px-4 py-3 bg-[#0B1120] border border-[rgba(255,255,255,0.07)] rounded-lg text-[#E2E8F0]" />

                {error && <div className="text-sm text-[#F43F5E]">{error}</div>}
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => { setShowModal(false); resetForm(); }} className="flex-1 px-4 py-3 bg-transparent border border-[rgba(255,255,255,0.07)] text-[#E2E8F0] rounded-[10px]">Cancel</button>
                <button onClick={onSaveSubscription} className="flex-1 px-4 py-3 bg-gradient-to-r from-[#10B981] to-[#059669] text-white rounded-[10px]">{editingId ? 'Update Subscription' : 'Save Subscription'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
