import { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import { Download, TrendingUp, ThumbsUp, Bell } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useAuth } from '../hooks/useAuth';
import { downloadTransactionsCsv, getDashboardAnalytics } from '../../imports/analyticsApi';

const CHART_COLORS = ['#10B981', '#22D3EE', '#F59E0B', '#8B5CF6', '#F43F5E', '#64748B'];

const formatDateKey = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatAxisDate = (date: Date) =>
  date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
  });

const formatTooltipDate = (date: Date) =>
  date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

export default function Analytics() {
  const { token } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<'1M' | '3M' | '6M' | '1Y'>('1M');
  const [dashboardData, setDashboardData] = useState<{
    summary: {
      monthTotal: number;
    };
    categoryBreakdown: Array<{ name: string; total: number; color?: string }>;
    monthlyTrends: Array<{ _id: { year: number; month: number }; total: number }>;
    dailyTrends?: Array<{ _id: { year: number; month: number; day: number }; total: number }>;
  } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!token) return;
      try {
        const data = await getDashboardAnalytics(token, { period: selectedPeriod });
        setDashboardData(data);
      } catch (error) {
        console.error('Failed to load analytics:', error);
      }
    };

    loadData();
  }, [token, selectedPeriod]);

  const liveTrendData = useMemo(() => {
    if (dashboardData?.dailyTrends?.length) {
      const spendByDate = new Map<string, number>();
      dashboardData.dailyTrends.forEach((item) => {
        const key = `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`;
        spendByDate.set(key, (spendByDate.get(key) || 0) + item.total);
      });

      const now = new Date();
      const startMap = {
        '1M': new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0),
        '3M': new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0, 0),
        '6M': new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0, 0),
        '1Y': new Date(now.getFullYear() - 1, now.getMonth(), now.getDate(), 0, 0, 0, 0),
      } as const;

      const start = startMap[selectedPeriod];
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const trend: Array<{ month: string; fullDate: string; total: number }> = [];

      for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        const key = formatDateKey(date);
        trend.push({
          month: formatAxisDate(date),
          fullDate: formatTooltipDate(date),
          total: spendByDate.get(key) || 0,
        });
      }

      return trend;
    }

    if (!dashboardData?.monthlyTrends?.length) return [];
    return dashboardData.monthlyTrends.map((item) => ({
      month: `${String(item._id.month).padStart(2, '0')}/${String(item._id.year).slice(2)}`,
      fullDate: `${String(item._id.month).padStart(2, '0')}/${String(item._id.year).slice(2)}`,
      total: item.total,
    }));
  }, [dashboardData, selectedPeriod]);

  const liveCategoryData = useMemo(() => {
    if (!dashboardData?.categoryBreakdown?.length) return [];
    return dashboardData.categoryBreakdown.map((item, index) => ({
      name: item.name,
      value: item.total,
      color: item.color || CHART_COLORS[index % CHART_COLORS.length],
    }));
  }, [dashboardData]);

  const totalSpent = liveCategoryData.reduce((sum, item) => sum + item.value, 0);
  const avgDaily = liveTrendData.length ? Math.round(totalSpent / 28) : 0;
  const highestCategory = liveCategoryData.length
    ? liveCategoryData.reduce((max, item) => (item.value > max.value ? item : max), liveCategoryData[0])
    : null;
  const biggestMonth = liveTrendData.length ? Math.max(...liveTrendData.map((item) => item.total)) : 0;

  const topSpendingPeriods = useMemo(() => {
    return [...liveTrendData]
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
        .map((item) => ({ day: item.fullDate || item.month, amount: item.total }));
  }, [liveTrendData]);

  const trendXAxisInterval = useMemo(() => {
    switch (selectedPeriod) {
      case '1M':
        return 1;
      case '3M':
        return 10;
      case '6M':
        return 18;
      case '1Y':
        return 35;
      default:
        return 'preserveStartEnd';
    }
  }, [selectedPeriod]);

  const heatmapCells = useMemo(() => {
    const periodDaysMap = {
      '1M': 31,
      '3M': 93,
      '6M': 186,
      '1Y': 365,
    } as const;

    const days = periodDaysMap[selectedPeriod];
    const spendByDate = new Map<string, number>();

    (dashboardData?.dailyTrends || []).forEach((item) => {
      const key = `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`;
      spendByDate.set(key, item.total);
    });

    const today = new Date();
    const dates: Array<{ key: string; label: string; amount: number }> = [];
    for (let i = days - 1; i >= 0; i -= 1) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const key = formatDateKey(date);
      dates.push({
        key,
        label: date.toLocaleDateString(),
        amount: spendByDate.get(key) || 0,
      });
    }

    const maxAmount = dates.reduce((max, day) => Math.max(max, day.amount), 0);

    const getIntensity = (amount: number) => {
      if (amount <= 0 || maxAmount <= 0) return 0;
      const ratio = amount / maxAmount;
      if (ratio < 0.25) return 1;
      if (ratio < 0.5) return 2;
      if (ratio < 0.75) return 3;
      return 4;
    };

    return {
      maxAmount,
      cells: dates.map((day) => ({
        ...day,
        intensity: getIntensity(day.amount),
      })),
    };
  }, [dashboardData?.dailyTrends, selectedPeriod]);

  const onExportCsv = async () => {
    if (!token) return;
    try {
      await downloadTransactionsCsv(token);
    } catch (error) {
      console.error('CSV export failed:', error);
    }
  };

  return (
    <div className="min-h-screen">
      <Header title="Analytics" />
      
      <div className="p-4 sm:p-8 max-w-[1280px]">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 bg-[#111827] border border-[rgba(255,255,255,0.07)] rounded-lg p-1">
            {(['1M', '3M', '6M', '1Y'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-lg text-sm ${selectedPeriod === period ? 'bg-[#10B981] text-white font-medium' : 'text-[#94A3B8] hover:bg-[rgba(255,255,255,0.05)]'}`}
              >
                {period}
              </button>
            ))}
          </div>
          <button
            onClick={onExportCsv}
            className="flex items-center gap-2 px-4 py-2.5 bg-transparent border border-[rgba(255,255,255,0.07)] text-[#E2E8F0] rounded-[10px] hover:bg-[rgba(255,255,255,0.05)]"
          >
            <Download className="w-5 h-5" />
            Export CSV
          </button>
        </div>

        {/* KPI Chips */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#111827] border border-[rgba(255,255,255,0.07)] rounded-lg p-4">
            <div className="text-xs text-[#94A3B8] mb-1">Total Spent</div>
            <div className="text-xl font-medium text-[#E2E8F0]" style={{ fontFamily: "'DM Mono', monospace" }}>
              ₹{Math.round(dashboardData?.summary?.monthTotal || totalSpent).toLocaleString()}
            </div>
          </div>
          <div className="bg-[#111827] border border-[rgba(255,255,255,0.07)] rounded-lg p-4">
            <div className="text-xs text-[#94A3B8] mb-1">Avg Daily Spend</div>
            <div className="text-xl font-medium text-[#E2E8F0]" style={{ fontFamily: "'DM Mono', monospace" }}>
              ₹{avgDaily}
            </div>
          </div>
          <div className="bg-[#111827] border border-[rgba(255,255,255,0.07)] rounded-lg p-4">
            <div className="text-xs text-[#94A3B8] mb-1">Highest Category</div>
            <div className="text-xl font-medium text-[#E2E8F0]" style={{ fontFamily: "'DM Mono', monospace" }}>
              {highestCategory?.name || 'N/A'}
            </div>
          </div>
          <div className="bg-[#111827] border border-[rgba(255,255,255,0.07)] rounded-lg p-4">
            <div className="text-xs text-[#94A3B8] mb-1">Biggest Expense</div>
            <div className="text-xl font-medium text-[#E2E8F0]" style={{ fontFamily: "'DM Mono', monospace" }}>
              ₹{Math.round(biggestMonth).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Large Trend Chart */}
        <div className="bg-[#111827] border border-[rgba(255,255,255,0.07)] rounded-[18px] p-6 mb-8">
          <h3 className="text-lg font-semibold text-[#E2E8F0] mb-6" style={{ fontFamily: "'Sora', sans-serif" }}>
            {selectedPeriod} Spending Trend (Day-wise)
          </h3>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={liveTrendData}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="month"
                stroke="#64748B"
                interval={trendXAxisInterval}
                minTickGap={28}
                tickMargin={12}
                angle={-28}
                textAnchor="end"
                height={56}
                style={{ fontFamily: "'Sora', sans-serif", fontSize: 12 }}
              />
              <YAxis stroke="#64748B" style={{ fontFamily: "'DM Mono', monospace", fontSize: 12 }} />
              <Tooltip
                labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate || String(_)}
                contentStyle={{ backgroundColor: '#1A2540', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px' }}
                labelStyle={{ color: '#E2E8F0', fontFamily: "'Sora', sans-serif" }}
                itemStyle={{ color: '#94A3B8', fontFamily: "'DM Mono', monospace" }}
              />
              <Area type="monotone" dataKey="total" stroke="#10B981" strokeWidth={3} fill="url(#colorTotal)" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#10B981]"></div>
              <span className="text-sm text-[#94A3B8]">Total Spend</span>
            </div>
          </div>
        </div>

        {/* 3 Charts Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Category Donut */}
          <div className="bg-[#111827] border border-[rgba(255,255,255,0.07)] rounded-[18px] p-6">
            <h3 className="text-lg font-semibold text-[#E2E8F0] mb-4" style={{ fontFamily: "'Sora', sans-serif" }}>
              Category Breakdown
            </h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={liveCategoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {liveCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
              {liveCategoryData.slice(0, 4).map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-xs text-[#94A3B8]">{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Spending Days Bar Chart */}
          <div className="bg-[#111827] border border-[rgba(255,255,255,0.07)] rounded-[18px] p-6">
            <h3 className="text-lg font-semibold text-[#E2E8F0] mb-4" style={{ fontFamily: "'Sora', sans-serif" }}>
              Top 5 Spending Days
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topSpendingPeriods}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" stroke="#64748B" interval="preserveStartEnd" minTickGap={20} tickMargin={8} style={{ fontSize: 10 }} />
                <YAxis stroke="#64748B" style={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1A2540', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px' }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Bar dataKey="amount" fill="#10B981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            {!topSpendingPeriods.length && <div className="text-sm text-[#94A3B8]">No trend data yet.</div>}
          </div>

          {/* Spending Heatmap */}
          <div className="bg-[#111827] border border-[rgba(255,255,255,0.07)] rounded-[18px] p-6">
            <h3 className="text-lg font-semibold text-[#E2E8F0] mb-4" style={{ fontFamily: "'Sora', sans-serif" }}>
              Spending Heatmap
            </h3>
            <div className="overflow-x-auto">
              <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(31, minmax(0, 1fr))', minWidth: '560px' }}>
                {heatmapCells.cells.map((day) => {
                  const colors = ['#1f2937', '#064e3b', '#047857', '#10b981', '#34d399'];
                  return (
                    <div
                      key={day.key}
                      title={`${day.label}: ₹${Math.round(day.amount).toLocaleString()}`}
                      className="h-3.5 rounded-[3px]"
                      style={{ backgroundColor: colors[day.intensity] }}
                    />
                  );
                })}
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 text-xs text-[#94A3B8]">
              <span>{selectedPeriod} daily spend intensity</span>
              <span>Peak: ₹{Math.round(heatmapCells.maxAmount).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 mt-2 text-[11px] text-[#64748B]">
              <span>Less</span>
              {['#1f2937', '#064e3b', '#047857', '#10b981', '#34d399'].map((color) => (
                <span key={color} className="w-3 h-3 rounded-[2px]" style={{ backgroundColor: color }} />
              ))}
              <span>More</span>
            </div>
          </div>
        </div>

        {/* Insights Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-[#111827] border border-[rgba(255,255,255,0.07)] rounded-[18px] p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#F59E0B]/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-[#F59E0B]" />
              </div>
              <div>
                <div className="text-sm text-[#E2E8F0] mb-1" style={{ fontFamily: "'Sora', sans-serif" }}>
                  {highestCategory ? `${highestCategory.name} is your top category` : 'No category insights yet'}
                </div>
                <div className="text-xs text-[#64748B]">Add more transactions to unlock deeper insights.</div>
              </div>
            </div>
          </div>

          <div className="bg-[#111827] border border-[rgba(255,255,255,0.07)] rounded-[18px] p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#10B981]/10 rounded-lg flex items-center justify-center">
                <ThumbsUp className="w-6 h-6 text-[#10B981]" />
              </div>
              <div>
                <div className="text-sm text-[#E2E8F0] mb-1" style={{ fontFamily: "'Sora', sans-serif" }}>
                  {liveTrendData.length > 1 ? 'Your monthly trend is now being tracked' : 'Track at least 2 months for trend insights'}
                </div>
                <div className="text-xs text-[#64748B]">Insights become smarter as more data is logged.</div>
              </div>
            </div>
          </div>

          <div className="bg-[#111827] border border-[rgba(255,255,255,0.07)] rounded-[18px] p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#F43F5E]/10 rounded-lg flex items-center justify-center">
                <Bell className="w-6 h-6 text-[#F43F5E]" />
              </div>
              <div>
                <div className="text-sm text-[#E2E8F0] mb-1" style={{ fontFamily: "'Sora', sans-serif" }}>
                  {dashboardData ? 'Notifications and renewals synced with your account' : 'No alert data yet'}
                </div>
                <div className="text-xs text-[#64748B]">Enable notifications in Settings for proactive alerts.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
