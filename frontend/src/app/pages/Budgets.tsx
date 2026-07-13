import { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import { Plus, ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useAuth } from '../hooks/useAuth';
import { createBudget, deleteBudget, getBudgetProgress, updateBudget, type BudgetProgress } from '../../imports/budgetApi';
import { getCategories, type Category } from '../../imports/categoryApi';

const getProgressColor = (percentage: number) => {
  if (percentage < 50) return 'from-[#10B981] to-[#059669]';
  if (percentage < 80) return 'from-[#F59E0B] to-[#D97706]';
  return 'from-[#F43F5E] to-[#DC2626]';
};

const getProgressBgColor = (percentage: number) => {
  if (percentage < 50) return 'bg-[#10B981]/10';
  if (percentage < 80) return 'bg-[#F59E0B]/10';
  return 'bg-[#F43F5E]/10';
};

export default function Budgets() {
  const { token } = useAuth();
  const [progress, setProgress] = useState<BudgetProgress[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [alertThreshold, setAlertThreshold] = useState(80);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busyBudgetId, setBusyBudgetId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!token) return;
      try {
        const [data, cats] = await Promise.all([
          getBudgetProgress(token),
          getCategories(token),
        ]);
        setProgress(data);
        setCategories(cats.filter((c) => c.type === 'expense' || c.type === 'both'));
      } catch (error) {
        console.error('Failed to load budgets:', error);
      }
    };

    loadData();
  }, [token]);

  const reloadProgress = async () => {
    if (!token) return;
    const data = await getBudgetProgress(token);
    setProgress(data);
  };

  const resetForm = () => {
    setEditingId(null);
    setSelectedCategoryId('');
    setAmount('');
    setAlertThreshold(80);
    setError('');
  };

  const onCreateBudget = async () => {
    setError('');
    const numericAmount = Number(amount);

    if (!token || !selectedCategoryId || !amount) {
      setError('Category and amount are required');
      return;
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('Amount must be a valid number greater than 0');
      return;
    }

    try {
      await createBudget(token, {
        categoryId: selectedCategoryId,
        amount: numericAmount,
        alertThreshold,
      });
      setShowModal(false);
      resetForm();
      await reloadProgress();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create budget');
    }
  };

  const onEditBudget = (item: BudgetProgress) => {
    setEditingId(item._id);
    setSelectedCategoryId(item.categoryId?._id || '');
    setAmount(String(item.amount));
    setAlertThreshold(item.alertThreshold);
    setError('');
    setShowModal(true);
  };

  const onSaveBudget = async () => {
    if (!editingId) {
      await onCreateBudget();
      return;
    }

    setError('');
    const numericAmount = Number(amount);

    if (!token || !selectedCategoryId || !amount) {
      setError('Category and amount are required');
      return;
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('Amount must be a valid number greater than 0');
      return;
    }

    try {
      await updateBudget(token, editingId, {
        categoryId: selectedCategoryId,
        amount: numericAmount,
        alertThreshold,
      });
      setShowModal(false);
      resetForm();
      await reloadProgress();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update budget');
    }
  };

  const onDeleteBudget = async (budgetId: string) => {
    if (!token) return;
    const confirmed = window.confirm('Delete this budget?');
    if (!confirmed) return;

    try {
      setBusyBudgetId(budgetId);
      await deleteBudget(token, budgetId);
      await reloadProgress();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete budget');
    } finally {
      setBusyBudgetId(null);
    }
  };

  const budgets = useMemo(() => {
    return progress.map((item) => ({
      id: item._id,
      category: item.categoryId?.icon || '📦',
      name: item.categoryId?.name || 'Category',
      budget: item.amount,
      spent: item.spent,
      alert: item.alertThreshold,
    }));
  }, [progress]);

  const totalBudget = budgets.reduce((sum, b) => sum + b.budget, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const percentageUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const now = new Date();
  const monthLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = Math.max(0, daysInMonth - now.getDate());

  const overallData = [
    { name: 'Spent', value: totalSpent, color: '#10B981' },
    { name: 'Remaining', value: totalBudget - totalSpent, color: '#1A2540' },
  ];

  return (
    <div className="min-h-screen">
      <Header title="Budgets" />
      
      <div className="p-4 sm:p-8 max-w-[1280px]">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-[rgba(255,255,255,0.05)] rounded-lg">
              <ChevronLeft className="w-5 h-5 text-[#94A3B8]" />
            </button>
            <h2 className="text-xl font-semibold text-[#E2E8F0]" style={{ fontFamily: "'Sora', sans-serif" }}>
              {monthLabel}
            </h2>
            <button className="p-2 hover:bg-[rgba(255,255,255,0.05)] rounded-lg">
              <ChevronRight className="w-5 h-5 text-[#94A3B8]" />
            </button>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#10B981] to-[#059669] text-white rounded-[10px] font-medium hover:shadow-lg hover:shadow-[#10B981]/20 transition-all"
          >
            <Plus className="w-5 h-5" />
            Set Budget
          </button>
        </div>

        {/* Summary Strip */}
        <div className="flex items-center gap-6 mb-8">
          <div className="px-4 py-2 bg-[#111827] border border-[rgba(255,255,255,0.07)] rounded-lg">
            <span className="text-xs text-[#94A3B8]" style={{ fontFamily: "'Sora', sans-serif" }}>Total Budgeted:</span>
            <span className="ml-2 text-sm text-[#E2E8F0]" style={{ fontFamily: "'DM Mono', monospace" }}>₹{totalBudget.toLocaleString()}</span>
          </div>
          <div className="px-4 py-2 bg-[#111827] border border-[rgba(255,255,255,0.07)] rounded-lg">
            <span className="text-xs text-[#94A3B8]" style={{ fontFamily: "'Sora', sans-serif" }}>Total Spent:</span>
            <span className="ml-2 text-sm text-[#E2E8F0]" style={{ fontFamily: "'DM Mono', monospace" }}>₹{totalSpent.toLocaleString()}</span>
          </div>
          <div className="px-4 py-2 bg-[#111827] border border-[rgba(255,255,255,0.07)] rounded-lg">
            <span className="text-xs text-[#94A3B8]" style={{ fontFamily: "'Sora', sans-serif" }}>Safe:</span>
            <span className="ml-2 text-sm text-[#10B981]" style={{ fontFamily: "'DM Mono', monospace" }}>₹{(totalBudget - totalSpent).toLocaleString()}</span>
          </div>
        </div>

        {/* Overall Budget Summary Card */}
        <div className="bg-[#111827] border border-[rgba(255,255,255,0.07)] rounded-[18px] p-6 mb-8">
          <h3 className="text-lg font-semibold text-[#E2E8F0] mb-6" style={{ fontFamily: "'Sora', sans-serif" }}>
            Overall Budget Summary
          </h3>
          <div className="flex items-center gap-8">
            {/* Donut Chart */}
            <div className="relative" style={{ width: 200, height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={overallData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {overallData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-3xl font-medium text-[#E2E8F0]" style={{ fontFamily: "'DM Mono', monospace" }}>
                  {Math.round(percentageUsed)}%
                </div>
                <div className="text-xs text-[#64748B]">Used</div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-sm text-[#94A3B8] mb-2" style={{ fontFamily: "'Sora', sans-serif" }}>Total Budget</div>
                <div className="text-2xl font-medium text-[#E2E8F0]" style={{ fontFamily: "'DM Mono', monospace" }}>
                  ₹{totalBudget.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#94A3B8] mb-2" style={{ fontFamily: "'Sora', sans-serif" }}>Total Spent</div>
                <div className="text-2xl font-medium text-[#E2E8F0]" style={{ fontFamily: "'DM Mono', monospace" }}>
                  ₹{totalSpent.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#94A3B8] mb-2" style={{ fontFamily: "'Sora', sans-serif" }}>Days Left</div>
                <div className="text-2xl font-medium text-[#E2E8F0]" style={{ fontFamily: "'DM Mono', monospace" }}>
                  {daysLeft}
                </div>
                <div className="text-xs text-[#64748B]">in {now.toLocaleString('default', { month: 'long' })}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Budget Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {budgets.map((budget) => {
            const percentage = (budget.spent / budget.budget) * 100;
            const isOverspent = percentage > 100;
            
            return (
              <div 
                key={budget.id}
                className={`bg-[#111827] border border-[rgba(255,255,255,0.07)] rounded-[18px] p-6 hover:border-[rgba(255,255,255,0.15)] transition-all ${
                  isOverspent ? 'ring-2 ring-[#F43F5E]/20' : ''
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{budget.category}</div>
                    <div>
                      <div className="text-lg font-semibold text-[#E2E8F0]" style={{ fontFamily: "'Sora', sans-serif" }}>
                        {budget.name}
                      </div>
                      <div className="text-xs text-[#64748B]" style={{ fontFamily: "'Sora', sans-serif" }}>
                        / month
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const selected = progress.find((p) => p._id === budget.id);
                        if (!selected) return;
                        onEditBudget(selected);
                      }}
                      className="p-1.5 hover:bg-[rgba(255,255,255,0.05)] rounded"
                    >
                      <Pencil className="w-4 h-4 text-[#22D3EE]" />
                    </button>
                    <button onClick={() => onDeleteBudget(budget.id)} disabled={busyBudgetId === budget.id} className="p-1.5 hover:bg-[rgba(255,255,255,0.05)] rounded disabled:opacity-50">
                      <Trash2 className="w-4 h-4 text-[#F43F5E]" />
                    </button>
                  </div>
                </div>

                {/* Amounts */}
                <div className="mb-4">
                  <div className="text-2xl font-medium text-[#E2E8F0]" style={{ fontFamily: "'DM Mono', monospace" }}>
                    ₹{budget.budget.toLocaleString()}
                  </div>
                  <div className="text-sm text-[#94A3B8] mt-1" style={{ fontFamily: "'Sora', sans-serif" }}>
                    Spent: <span style={{ fontFamily: "'DM Mono', monospace" }}>₹{budget.spent.toLocaleString()}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`text-sm font-medium ${
                      isOverspent ? 'text-[#F43F5E]' : 
                      percentage >= 80 ? 'text-[#F59E0B]' : 
                      'text-[#10B981]'
                    }`} style={{ fontFamily: "'DM Mono', monospace" }}>
                      {Math.round(percentage)}%
                    </div>
                    {isOverspent && (
                      <span className="px-2 py-0.5 bg-[#F43F5E]/10 text-[#F43F5E] rounded-full text-xs font-medium">
                        Overspent
                      </span>
                    )}
                  </div>
                  <div className={`w-full h-3 rounded-full overflow-hidden ${getProgressBgColor(percentage)}`}>
                    <div 
                      className={`h-full bg-gradient-to-r ${getProgressColor(percentage)} transition-all duration-500 ${
                        isOverspent ? 'animate-pulse' : ''
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Alert Threshold */}
                <div className="flex items-center justify-between">
                  <span className="px-2 py-1 bg-[#64748B]/10 text-[#94A3B8] rounded-full text-xs">
                    Alert at {budget.alert}%
                  </span>
                  {percentage >= budget.alert && (
                    <span className="text-xs text-[#F59E0B]">⚠️ Alert threshold reached</span>
                  )}
                </div>
              </div>
            );
          })}
          {!budgets.length && (
            <div className="col-span-2 text-sm text-[#94A3B8]">No budgets set yet. Create a budget to monitor spending progress.</div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#111827] border border-[rgba(255,255,255,0.07)] rounded-[18px] p-8 w-full max-w-lg mx-4">
            <h2 className="text-2xl font-semibold text-[#E2E8F0] mb-6" style={{ fontFamily: "'Sora', sans-serif" }}>
              {editingId ? 'Update Budget' : 'Set Budget'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#94A3B8] mb-2">Category</label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0B1120] border border-[rgba(255,255,255,0.07)] rounded-lg text-[#E2E8F0]"
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-[#94A3B8] mb-2">Amount</label>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="5000"
                  className="w-full px-4 py-3 bg-[#0B1120] border border-[rgba(255,255,255,0.07)] rounded-lg text-[#E2E8F0]"
                />
              </div>

              <div>
                <label className="block text-sm text-[#94A3B8] mb-2">Alert Threshold (%)</label>
                <input
                  type="number"
                  min={50}
                  max={100}
                  value={alertThreshold}
                  onChange={(e) => setAlertThreshold(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-[#0B1120] border border-[rgba(255,255,255,0.07)] rounded-lg text-[#E2E8F0]"
                />
              </div>

              {error && <div className="text-sm text-[#F43F5E]">{error}</div>}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="flex-1 px-4 py-3 bg-transparent border border-[rgba(255,255,255,0.07)] text-[#E2E8F0] rounded-[10px]"
              >
                Cancel
              </button>
              <button
                onClick={onSaveBudget}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-[#10B981] to-[#059669] text-white rounded-[10px]"
              >
                {editingId ? 'Update Budget' : 'Save Budget'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
