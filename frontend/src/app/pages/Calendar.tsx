import { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getExpenses, type Expense } from '../../imports/expenseApi';
import { getSubscriptions, type Subscription } from '../../imports/subscriptionApi';
import { useAuth } from '../hooks/useAuth';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type DayActivity = {
  day: number;
  expenses: Array<{ amount: number; category: string }>;
  renewals: Array<{ service: string; amount: number }>;
};

const getDayExpenseTotal = (dayData: DayActivity) =>
  dayData.expenses.reduce((sum, expense) => sum + expense.amount, 0);

const getDayRenewalTotal = (dayData: DayActivity) =>
  dayData.renewals.reduce((sum, renewal) => sum + renewal.amount, 0);

const dateKey = (d: Date) => d.toISOString().slice(0, 10);

export default function Calendar() {
  const { token } = useAuth();
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(() => new Date().getDate());
  const [monthExpenses, setMonthExpenses] = useState<Expense[]>([]);
  const [monthSubscriptions, setMonthSubscriptions] = useState<Subscription[]>([]);

  const monthBounds = useMemo(() => {
    const start = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const end = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
    return {
      start,
      end,
      startIso: dateKey(start),
      endIso: dateKey(end),
      firstWeekday: start.getDay(),
      daysInMonth: end.getDate(),
    };
  }, [viewDate]);

  useEffect(() => {
    const loadMonthData = async () => {
      if (!token) return;
      try {
        const [expenseRes, subscriptions] = await Promise.all([
          getExpenses(token, {
            startDate: monthBounds.startIso,
            endDate: monthBounds.endIso,
            page: 1,
            limit: 500,
          }),
          getSubscriptions(token),
        ]);
        setMonthExpenses(expenseRes.data ?? []);
        setMonthSubscriptions(subscriptions);
      } catch (error) {
        console.error('Failed to load calendar data:', error);
      }
    };

    loadMonthData();
  }, [token, monthBounds.startIso, monthBounds.endIso]);

  const activityByDay = useMemo(() => {
    const map = new Map<number, DayActivity>();

    for (let day = 1; day <= monthBounds.daysInMonth; day += 1) {
      map.set(day, { day, expenses: [], renewals: [] });
    }

    monthExpenses.forEach((expense) => {
      const d = new Date(expense.date);
      if (d.getMonth() !== viewDate.getMonth() || d.getFullYear() !== viewDate.getFullYear()) return;
      const day = d.getDate();
      const slot = map.get(day);
      if (!slot) return;
      slot.expenses.push({
        amount: expense.amount,
        category: expense.categoryId?.name || 'Expense',
      });
    });

    monthSubscriptions.forEach((sub) => {
      const d = new Date(sub.nextBillingDate);
      if (d.getMonth() !== viewDate.getMonth() || d.getFullYear() !== viewDate.getFullYear()) return;
      const day = d.getDate();
      const slot = map.get(day);
      if (!slot) return;
      slot.renewals.push({ service: sub.name, amount: sub.amount });
    });

    return map;
  }, [monthExpenses, monthSubscriptions, viewDate, monthBounds.daysInMonth]);

  const selectedDayData = activityByDay.get(selectedDay) || { day: selectedDay, expenses: [], renewals: [] };
  const totalExpenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const daysWithExpenses = new Set(monthExpenses.map((e) => new Date(e.date).getDate())).size;

  const highestSpend = useMemo(() => {
    const totals = new Map<number, number>();
    monthExpenses.forEach((expense) => {
      const day = new Date(expense.date).getDate();
      totals.set(day, (totals.get(day) || 0) + expense.amount);
    });

    let topDay = 0;
    let topAmount = 0;
    totals.forEach((amount, day) => {
      if (amount > topAmount) {
        topAmount = amount;
        topDay = day;
      }
    });
    return { day: topDay, amount: topAmount };
  }, [monthExpenses]);

  const days = useMemo(() => {
    const grid: Array<DayActivity | null> = [];
    for (let i = 0; i < monthBounds.firstWeekday; i += 1) {
      grid.push(null);
    }
    for (let day = 1; day <= monthBounds.daysInMonth; day += 1) {
      grid.push(activityByDay.get(day) || { day, expenses: [], renewals: [] });
    }
    return grid;
  }, [monthBounds.firstWeekday, monthBounds.daysInMonth, activityByDay]);

  const now = new Date();
  const isCurrentMonth = now.getMonth() === viewDate.getMonth() && now.getFullYear() === viewDate.getFullYear();
  const today = isCurrentMonth ? now.getDate() : -1;

  const selectedDateLabel = new Date(viewDate.getFullYear(), viewDate.getMonth(), selectedDay).toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen">
      <Header title="Calendar" />
      
      <div className="p-4 sm:p-8 max-w-[1280px]">
        {/* Top Bar */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <button
              onClick={() => {
                setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
                setSelectedDay(1);
              }}
              className="p-2 hover:bg-[rgba(255,255,255,0.05)] rounded-lg"
            >
              <ChevronLeft className="w-5 h-5 text-[#94A3B8]" />
            </button>
            <h2 className="text-xl font-semibold text-[#E2E8F0]" style={{ fontFamily: "'Sora', sans-serif" }}>
              {viewDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </h2>
            <button
              onClick={() => {
                setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
                setSelectedDay(1);
              }}
              className="p-2 hover:bg-[rgba(255,255,255,0.05)] rounded-lg"
            >
              <ChevronRight className="w-5 h-5 text-[#94A3B8]" />
            </button>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#10B981]"></div>
              <span className="text-sm text-[#94A3B8]" style={{ fontFamily: "'Sora', sans-serif" }}>Expense</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#F59E0B]"></div>
              <span className="text-sm text-[#94A3B8]" style={{ fontFamily: "'Sora', sans-serif" }}>Renewal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#22D3EE]"></div>
              <span className="text-sm text-[#94A3B8]" style={{ fontFamily: "'Sora', sans-serif" }}>Both</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
          {/* Calendar Grid */}
          <div className="bg-[#111827] border border-[rgba(255,255,255,0.07)] rounded-[18px] p-6">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-2 sm:gap-4 mb-4">
              {daysOfWeek.map(day => (
                <div key={day} className="text-center text-sm font-medium text-[#64748B]" style={{ fontFamily: "'Sora', sans-serif" }}>
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2 sm:gap-4">
              {days.map((dayData, index) => {
                if (!dayData) {
                  return <div key={`blank-${index}`} className="aspect-square" />;
                }

                const hasExpenses = dayData.expenses.length > 0;
                const hasRenewals = dayData.renewals.length > 0;
                const isToday = dayData.day === today;
                const isSelected = dayData.day === selectedDay;
                const dayExpenseTotal = getDayExpenseTotal(dayData);
                const dayRenewalTotal = getDayRenewalTotal(dayData);
                const dayCombinedTotal = dayExpenseTotal + dayRenewalTotal;

                return (
                  <button
                    key={dayData.day}
                    onClick={() => setSelectedDay(dayData.day)}
                    className={`aspect-square min-h-[72px] sm:min-h-0 rounded-lg p-2 sm:p-3 transition-all hover:bg-[rgba(255,255,255,0.05)] ${
                      isToday ? 'ring-2 ring-[#22D3EE]' : ''
                    } ${isSelected ? 'bg-[#10B981]/10 border border-[#10B981]/50' : 'bg-[#0B1120] border border-[rgba(255,255,255,0.07)]'}`}
                  >
                    <div className="text-sm sm:text-lg font-medium text-[#E2E8F0] mb-1 sm:mb-2" style={{ fontFamily: "'DM Mono', monospace" }}>
                      {dayData.day}
                    </div>
                    <div className="space-y-1">
                      {hasExpenses && hasRenewals && (
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#22D3EE]"></div>
                          <span className="text-[10px] sm:text-xs text-[#22D3EE]" style={{ fontFamily: "'DM Mono', monospace" }}>
                            ₹{dayCombinedTotal.toLocaleString()}
                          </span>
                        </div>
                      )}
                      {hasExpenses && !hasRenewals && (
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></div>
                          <span className="text-[10px] sm:text-xs text-[#10B981]" style={{ fontFamily: "'DM Mono', monospace" }}>
                            ₹{dayExpenseTotal.toLocaleString()}
                          </span>
                        </div>
                      )}
                      {!hasExpenses && hasRenewals && (
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]"></div>
                          <span className="text-[10px] sm:text-xs text-[#F59E0B]" style={{ fontFamily: "'Sora', sans-serif" }}>
                            {dayData.renewals[0].service}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Day Detail Panel */}
          <div className="bg-[#111827] border border-[rgba(255,255,255,0.07)] rounded-[18px] p-6">
            <h3 className="text-lg font-semibold text-[#E2E8F0] mb-6" style={{ fontFamily: "'Sora', sans-serif" }}>
              {selectedDateLabel}
            </h3>

            <div className="space-y-6">
              {/* Expenses */}
              {selectedDayData.expenses.length > 0 && (
                <div>
                  <div className="text-sm text-[#94A3B8] mb-3" style={{ fontFamily: "'Sora', sans-serif" }}>Expenses</div>
                  <div className="space-y-3">
                    {selectedDayData.expenses.map((expense, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-[#0B1120] rounded-lg">
                        <div className="w-8 h-8 bg-[#10B981]/10 rounded-lg flex items-center justify-center">
                          <span className="text-lg">💰</span>
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-[#E2E8F0]" style={{ fontFamily: "'Sora', sans-serif" }}>
                            {expense.category}
                          </div>
                          <span className="inline-block px-2 py-0.5 bg-[#64748B]/10 text-[#94A3B8] rounded-full text-xs mt-1">
                            Expense
                          </span>
                        </div>
                        <div className="text-sm font-medium text-[#F43F5E]" style={{ fontFamily: "'DM Mono', monospace" }}>
                          ₹{expense.amount}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Renewals */}
              {selectedDayData.renewals.length > 0 && (
                <div>
                  <div className="text-sm text-[#94A3B8] mb-3" style={{ fontFamily: "'Sora', sans-serif" }}>Renewals</div>
                  <div className="space-y-3">
                    {selectedDayData.renewals.map((renewal, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-[#0B1120] rounded-lg">
                        <div className="w-8 h-8 bg-[#F59E0B]/10 rounded-lg flex items-center justify-center">
                          <span className="text-lg">🔄</span>
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-[#E2E8F0]" style={{ fontFamily: "'Sora', sans-serif" }}>
                            {renewal.service}
                          </div>
                          <span className="inline-block px-2 py-0.5 bg-[#F59E0B]/10 text-[#F59E0B] rounded-full text-xs mt-1">
                            Renewal
                          </span>
                        </div>
                        <div className="text-sm font-medium text-[#F59E0B]" style={{ fontFamily: "'DM Mono', monospace" }}>
                          ₹{renewal.amount}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedDayData.expenses.length === 0 && selectedDayData.renewals.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">📅</div>
                  <div className="text-sm text-[#64748B]" style={{ fontFamily: "'Sora', sans-serif" }}>
                    No activity on this day
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Monthly Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <div className="bg-[#111827] border border-[rgba(255,255,255,0.07)] rounded-[18px] p-6">
            <div className="text-sm text-[#94A3B8] mb-2" style={{ fontFamily: "'Sora', sans-serif" }}>Total Spent This Month</div>
            <div className="text-3xl font-medium text-[#E2E8F0]" style={{ fontFamily: "'DM Mono', monospace" }}>
              ₹{totalExpenses.toLocaleString()}
            </div>
          </div>
          <div className="bg-[#111827] border border-[rgba(255,255,255,0.07)] rounded-[18px] p-6">
            <div className="text-sm text-[#94A3B8] mb-2" style={{ fontFamily: "'Sora', sans-serif" }}>Days with Expenses</div>
            <div className="text-3xl font-medium text-[#E2E8F0]" style={{ fontFamily: "'DM Mono', monospace" }}>
              {daysWithExpenses}
            </div>
            <div className="text-xs text-[#64748B] mt-1">out of {monthBounds.daysInMonth} days</div>
          </div>
          <div className="bg-[#111827] border border-[rgba(255,255,255,0.07)] rounded-[18px] p-6">
            <div className="text-sm text-[#94A3B8] mb-2" style={{ fontFamily: "'Sora', sans-serif" }}>Highest Spend Day</div>
            <div className="text-3xl font-medium text-[#E2E8F0]" style={{ fontFamily: "'DM Mono', monospace" }}>
              {highestSpend.day ? `${viewDate.toLocaleDateString('en-IN', { month: 'short' })} ${highestSpend.day}` : '--'}
            </div>
            <div className="text-xs text-[#64748B] mt-1">₹{highestSpend.amount.toLocaleString()} spent</div>
          </div>
        </div>
      </div>
    </div>
  );
}
