import { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import { Wallet, PiggyBank, RotateCcw, TrendingUp, ArrowRight } from 'lucide-react';
import { PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router';
import { getDashboardAnalytics } from '../../imports/analyticsApi';
import { getUpcomingRenewals } from '../../imports/subscriptionApi';
import { getExpenses, type Expense } from '../../imports/expenseApi';
import { getBudgetProgress, type BudgetProgress } from '../../imports/budgetApi';

const CHART_COLORS = ['#10B981', '#22D3EE', '#F59E0B', '#8B5CF6', '#F43F5E', '#64748B'];

export default function Dashboard() {
  const { token } = useAuth();
  const [dashboardData, setDashboardData] = useState<{
    summary: {
      monthTotal: number;
      monthCount: number;
      activeSubscriptionCount: number;
      monthlySubscriptionTotal: number;
      activeBudgetCount: number;
    };
    categoryBreakdown: Array<{ name: string; total: number; color?: string; icon?: string }>;
    monthlyTrends: Array<{ _id: { year: number; month: number }; total: number }>;
    dailyTrends: Array<{ _id: { year: number; month: number; day: number }; total: number }>;
  } | null>(null);
  const [upcomingRenewals, setUpcomingRenewals] = useState<Array<{ _id: string; name: string; amount: number; nextBillingDate: string }>>([]);
  const [recentTransactions, setRecentTransactions] = useState<Expense[]>([]);
  const [budgetProgress, setBudgetProgress] = useState<BudgetProgress[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!token) return;

      try {
        const [dashboard, renewals, expenses, budgets] = await Promise.all([
          getDashboardAnalytics(token),
          getUpcomingRenewals(token, 7),
          getExpenses(token, { page: 1, limit: 5 }),
          getBudgetProgress(token),
        ]);
        setDashboardData(dashboard);
        setUpcomingRenewals(renewals);
        setRecentTransactions(expenses.data || []);
        setBudgetProgress(budgets || []);
      } catch (error) {
        console.error('Failed to load dashboard:', error);
        setDashboardData(null);
        setUpcomingRenewals([]);
        setRecentTransactions([]);
        setBudgetProgress([]);
      }
    };

    loadData();
  }, [token]);

  const categories = useMemo(() => {
    if (!dashboardData?.categoryBreakdown?.length) return [];
    return dashboardData.categoryBreakdown.map((item, index) => ({
      name: item.name,
      value: item.total,
      color: item.color || CHART_COLORS[index % CHART_COLORS.length],
    }));
  }, [dashboardData]);

  const trends = useMemo(() => {
    if (!dashboardData) return [];

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

    const dayTotals = new Map<number, number>();
    (dashboardData.dailyTrends || [])
      .filter((item) => item._id.year === currentYear && item._id.month === currentMonth)
      .forEach((item) => {
        dayTotals.set(item._id.day, (dayTotals.get(item._id.day) || 0) + item.total);
      });

    const trendDays = Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;
      return {
        day: String(day).padStart(2, '0'),
        expenses: dayTotals.get(day) || 0,
      };
    });

    return trendDays;
  }, [dashboardData, budgetProgress]);

  const totalSpent = categories.reduce((sum, item) => sum + item.value, 0);
  const totalBudget = budgetProgress.reduce((sum, item) => sum + item.amount, 0);
  const spentAgainstBudget = budgetProgress.reduce((sum, item) => sum + item.spent, 0);
  const budgetRemaining = Math.max(0, totalBudget - spentAgainstBudget);
  const budgetUsedPct = totalBudget > 0 ? Math.round((spentAgainstBudget / totalBudget) * 100) : 0;
  const savingsRate = totalBudget > 0 ? Math.round((budgetRemaining / totalBudget) * 100) : 0;
  const monthSpendTotal = dashboardData?.summary.monthTotal || totalSpent;
  const monthlySubscriptionTotal = dashboardData?.summary.monthlySubscriptionTotal || 0;
  const subscriptionSharePct = monthSpendTotal > 0
    ? Math.min(100, Math.round((monthlySubscriptionTotal / monthSpendTotal) * 100))
    : 0;

  return (
    <div className="min-h-screen">
      <Header title="Dashboard" />
      
      <div className="p-4 sm:p-8 max-w-[1280px]">
        {/* Top Row - 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          <StatCard
            label="Total Spent"
            value={`₹${Math.round(dashboardData?.summary.monthTotal || totalSpent).toLocaleString()}`}
            icon={Wallet}
            trend={{ value: `${dashboardData?.summary.monthCount || 0} txns`, isPositive: true }}
            progress={Math.min(100, budgetUsedPct || 0)}
            glowColor="emerald"
          />
          <StatCard
            label="Budget Remaining"
            value={`₹${Math.round(budgetRemaining).toLocaleString()}`}
            icon={PiggyBank}
            badge={totalBudget > 0 ? `${Math.max(0, 100 - budgetUsedPct)}% left` : 'No budgets'}
            progress={Math.max(0, 100 - budgetUsedPct)}
            glowColor="cyan"
          />
          <StatCard
            label="Subscriptions / Month"
            value={`₹${Math.round(dashboardData?.summary.monthlySubscriptionTotal || 0).toLocaleString()}`}
            icon={RotateCcw}
            badge={`${dashboardData?.summary.activeSubscriptionCount || 0} active`}
            progress={subscriptionSharePct}
            glowColor="amber"
          />
          <StatCard
            label="Savings Rate"
            value={`${savingsRate}%`}
            icon={TrendingUp}
            trend={{ value: totalBudget > 0 ? 'vs set budgets' : 'set budgets to track', isPositive: true }}
            progress={Math.min(100, savingsRate)}
            glowColor="purple"
          />
        </div>

        {/* Middle Row - 2 Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-[60%_40%] gap-6 mb-8">
          {/* Monthly Spending Trend */}
          <div className="bg-[#111827] border border-[rgba(255,255,255,0.07)] rounded-[18px] p-6">
            <h3 className="text-lg font-semibold text-[#E2E8F0] mb-6" style={{ fontFamily: "'Sora', sans-serif" }}>
              Monthly Spending Trend
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trends}>
                <defs>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" stroke="#64748B" style={{ fontFamily: "'Sora', sans-serif", fontSize: 12 }} />
                <YAxis stroke="#64748B" style={{ fontFamily: "'DM Mono', monospace", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1A2540', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px' }}
                  labelStyle={{ color: '#E2E8F0', fontFamily: "'Sora', sans-serif" }}
                  itemStyle={{ color: '#94A3B8', fontFamily: "'DM Mono', monospace" }}
                />
                <Area type="monotone" dataKey="expenses" stroke="#10B981" strokeWidth={2} fill="url(#colorExpenses)" />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#10B981]"></div>
                <span className="text-sm text-[#94A3B8]" style={{ fontFamily: "'Sora', sans-serif" }}>Expenses</span>
              </div>
            </div>
          </div>

          {/* Category Spending Pie Chart */}
          <div className="bg-[#111827] border border-[rgba(255,255,255,0.07)] rounded-[18px] p-6">
            <h3 className="text-lg font-semibold text-[#E2E8F0] mb-4" style={{ fontFamily: "'Sora', sans-serif" }}>
              Category Spending
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={categories}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {categories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="text-center -mt-32 mb-20">
              <div className="text-2xl font-medium text-[#E2E8F0]" style={{ fontFamily: "'DM Mono', monospace" }}>
                ₹{totalSpent.toLocaleString()}
              </div>
              <div className="text-xs text-[#64748B]">Total</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {categories.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-xs text-[#94A3B8]" style={{ fontFamily: "'Sora', sans-serif" }}>
                    {item.name}
                  </span>
                  <span className="text-xs text-[#64748B] ml-auto" style={{ fontFamily: "'DM Mono', monospace" }}>
                    ₹{item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Row - Recent Transactions & Upcoming Renewals */}
        <div className="grid grid-cols-1 xl:grid-cols-[65%_35%] gap-6">
          {/* Recent Transactions */}
          <div className="bg-[#111827] border border-[rgba(255,255,255,0.07)] rounded-[18px] p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-[#E2E8F0]" style={{ fontFamily: "'Sora', sans-serif" }}>
                Recent Transactions
              </h3>
              <Link to="/dashboard/expenses" className="text-sm text-[#10B981] hover:text-[#059669] flex items-center gap-1">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.07)]">
                    <th className="text-left py-3 px-2 text-xs text-[#64748B] font-medium" style={{ fontFamily: "'Sora', sans-serif" }}>Category</th>
                    <th className="text-left py-3 px-2 text-xs text-[#64748B] font-medium" style={{ fontFamily: "'Sora', sans-serif" }}>Description</th>
                    <th className="text-left py-3 px-2 text-xs text-[#64748B] font-medium" style={{ fontFamily: "'Sora', sans-serif" }}>Date</th>
                    <th className="text-right py-3 px-2 text-xs text-[#64748B] font-medium" style={{ fontFamily: "'Sora', sans-serif" }}>Amount</th>
                    <th className="text-left py-3 px-2 text-xs text-[#64748B] font-medium" style={{ fontFamily: "'Sora', sans-serif" }}>Method</th>
                    <th className="text-left py-3 px-2 text-xs text-[#64748B] font-medium" style={{ fontFamily: "'Sora', sans-serif" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.length ? recentTransactions.map((tx) => (
                    <tr key={tx._id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.02)]">
                      <td className="py-3 px-2">
                        <span className="text-xl">{tx.categoryId?.icon || '📦'}</span>
                      </td>
                      <td className="py-3 px-2 text-sm text-[#E2E8F0]" style={{ fontFamily: "'Sora', sans-serif" }}>{tx.description || '-'}</td>
                      <td className="py-3 px-2 text-sm text-[#94A3B8]" style={{ fontFamily: "'Sora', sans-serif" }}>{new Date(tx.date).toLocaleDateString()}</td>
                      <td className="py-3 px-2 text-right text-sm text-[#F43F5E]" style={{ fontFamily: "'DM Mono', monospace" }}>₹{Math.abs(tx.amount)}</td>
                      <td className="py-3 px-2 text-sm text-[#94A3B8]" style={{ fontFamily: "'Sora', sans-serif" }}>{tx.paymentMethod}</td>
                      <td className="py-3 px-2">
                        <span className="px-2 py-1 rounded-full text-xs bg-[#10B981]/10 text-[#10B981]">
                          Logged
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-sm text-[#94A3B8]">No transactions yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Upcoming Renewals */}
          <div className="bg-[#111827] border border-[rgba(255,255,255,0.07)] rounded-[18px] p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-[#E2E8F0]" style={{ fontFamily: "'Sora', sans-serif" }}>
                Upcoming Renewals
              </h3>
              <span className="px-2 py-1 rounded-full text-xs bg-[#F59E0B]/10 text-[#F59E0B]">
                {upcomingRenewals.length} this week
              </span>
            </div>
            <div className="space-y-4">
              {(upcomingRenewals.length
                ? upcomingRenewals.map((item) => ({
                    id: item._id,
                    icon: '🔁',
                    name: item.name,
                    date: new Date(item.nextBillingDate).toLocaleDateString(),
                    amount: item.amount,
                    urgency: 'medium',
                  }))
                : [])
                .map((renewal) => (
                <div key={renewal.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[rgba(255,255,255,0.02)]">
                  <span className="text-2xl">{renewal.icon}</span>
                  <div className="flex-1">
                    <div className="text-sm text-[#E2E8F0] font-medium" style={{ fontFamily: "'Sora', sans-serif" }}>
                      {renewal.name}
                    </div>
                    <div className="text-xs text-[#64748B]" style={{ fontFamily: "'Sora', sans-serif" }}>
                      {renewal.date}
                    </div>
                  </div>
                  <div className={`text-sm font-medium ${
                    renewal.urgency === 'high' ? 'text-[#F43F5E]' : 
                    renewal.urgency === 'medium' ? 'text-[#F59E0B]' : 
                    'text-[#94A3B8]'
                  }`} style={{ fontFamily: "'DM Mono', monospace" }}>
                    ₹{renewal.amount}
                  </div>
                </div>
              ))}
              {!upcomingRenewals.length && (
                <div className="text-sm text-[#94A3B8]">No renewals in the next 7 days</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
