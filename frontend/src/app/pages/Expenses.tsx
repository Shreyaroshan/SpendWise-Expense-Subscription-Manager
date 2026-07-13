import { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import { Plus, Search, ChevronDown, Pencil, Trash2, Paperclip, ExternalLink } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import {
  createExpense,
  deleteExpense,
  getExpenses,
  updateExpense,
  uploadExpenseReceipt,
  type Expense,
} from '../../imports/expenseApi';
import { getCategories, type Category } from '../../imports/categoryApi';

const PAYMENT_METHODS = [
  { label: 'Card', value: 'card' },
  { label: 'UPI', value: 'upi' },
  { label: 'Cash', value: 'cash' },
  { label: 'Net Banking', value: 'netbanking' },
  { label: 'Other', value: 'other' },
] as const;

type Method = (typeof PAYMENT_METHODS)[number]['value'];

export default function Expenses() {
  const { token } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [items, setItems] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const [amount, setAmount] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<Method>('card');
  const [receiptFileName, setReceiptFileName] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

  const resetForm = () => {
    setEditingExpenseId(null);
    setAmount('');
    setSelectedCategoryId('');
    setExpenseDate(new Date().toISOString().slice(0, 10));
    setDescription('');
    setPaymentMethod('card');
    setReceiptFileName('');
    setReceiptUrl('');
    setReceiptPreviewUrl(null);
    setUploadProgress(0);
    setFormError('');
    setFormSuccess('');
  };

  const loadExpenses = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const res = await getExpenses(token, {
        page,
        limit: 10,
        categoryId: categoryFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      setItems(res.data || []);
      setPages(res.pagination?.pages || 1);
    } catch (error) {
      console.error('Failed to load expenses:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    if (!token) return;

    try {
      const data = await getCategories(token);
      setCategories(data.filter((item) => item.type === 'expense' || item.type === 'both'));
    } catch (error) {
      console.error('Failed to load categories:', error);
      setCategories([]);
    }
  };

  useEffect(() => {
    loadCategories();
  }, [token]);

  useEffect(() => {
    loadExpenses();
  }, [token, page, categoryFilter, startDate, endDate]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const text = `${item.description || ''} ${item.categoryId?.name || ''}`.toLowerCase();
      const searchMatch = !search || text.includes(search.toLowerCase());
      const paymentMatch = !paymentFilter || item.paymentMethod === paymentFilter;
      return searchMatch && paymentMatch;
    });
  }, [items, paymentFilter, search]);

  const totals = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return filteredItems.reduce(
      (acc, item) => {
        const ts = new Date(item.date).getTime();
        if (ts >= startOfMonth) acc.month += item.amount;
        if (ts >= startOfWeek.getTime()) acc.week += item.amount;
        if (ts >= startOfToday) acc.today += item.amount;
        return acc;
      },
      { month: 0, week: 0, today: 0 }
    );
  }, [filteredItems]);

  const onSaveExpense = async () => {
    setFormError('');
    setFormSuccess('');

    if (!token || !selectedCategoryId || !amount) {
      setFormError('Amount and category are required');
      return;
    }

    if (uploadingReceipt) {
      setFormError('Please wait for receipt upload to finish');
      return;
    }

    try {
      if (editingExpenseId) {
        await updateExpense(token, editingExpenseId, {
          amount: Number(amount),
          categoryId: selectedCategoryId,
          date: expenseDate,
          description,
          receiptUrl: receiptUrl || undefined,
          paymentMethod,
        });
      } else {
        await createExpense(token, {
          amount: Number(amount),
          categoryId: selectedCategoryId,
          date: expenseDate,
          description,
          receiptUrl: receiptUrl || undefined,
          paymentMethod,
        });
      }

      setShowModal(false);
      resetForm();
      setFormSuccess(editingExpenseId ? 'Expense updated successfully' : 'Expense saved successfully');
      await loadExpenses();
    } catch (error) {
      console.error('Failed to save expense:', error);
      setFormError(error instanceof Error ? error.message : 'Failed to save expense');
    }
  };

  const onEditExpense = (expense: Expense) => {
    setEditingExpenseId(expense._id);
    setAmount(String(expense.amount));
    setSelectedCategoryId(expense.categoryId?._id || '');
    setExpenseDate(new Date(expense.date).toISOString().slice(0, 10));
    setDescription(expense.description || '');
    setPaymentMethod(expense.paymentMethod || 'card');
    setReceiptUrl(expense.receiptUrl || '');
    setReceiptFileName(expense.receiptUrl ? 'Existing receipt' : '');
    setReceiptPreviewUrl(expense.receiptUrl || null);
    setUploadProgress(expense.receiptUrl ? 100 : 0);
    setFormError('');
    setFormSuccess('');
    setShowModal(true);
  };

  const onReceiptSelected = async (file: File | null) => {
    if (!file || !token) return;

    setUploadingReceipt(true);
    setUploadProgress(0);
    setReceiptFileName(file.name);
    setReceiptPreviewUrl(URL.createObjectURL(file));
    setFormError('');
    setFormSuccess('');

    try {
      const result = await uploadExpenseReceipt(token, file, setUploadProgress);
      setReceiptUrl(result.receiptUrl);
      setUploadProgress(100);
      setFormSuccess('Receipt uploaded');
    } catch (error) {
      console.error('Failed to upload receipt:', error);
      setReceiptFileName('');
      setReceiptUrl('');
      setUploadProgress(0);
      setFormError(error instanceof Error ? error.message : 'Failed to upload receipt');
    } finally {
      setUploadingReceipt(false);
    }
  };

  const onDeleteExpense = async (id: string) => {
    if (!token) return;
    try {
      await deleteExpense(token, id);
      await loadExpenses();
    } catch (error) {
      console.error('Failed to delete expense:', error);
    }
  };

  return (
    <div className="min-h-screen">
      <Header title="Expenses" />
      
      <div className="p-4 sm:p-8 max-w-[1280px]">
        {/* Top Bar */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="px-3 py-2 sm:px-4 bg-[#111827] border border-[rgba(255,255,255,0.07)] rounded-lg">
              <span className="text-xs text-[#94A3B8]" style={{ fontFamily: "'Sora', sans-serif" }}>This Month:</span>
              <span className="ml-2 text-sm text-[#E2E8F0]" style={{ fontFamily: "'DM Mono', monospace" }}>
                ₹{Math.round(totals.month).toLocaleString()}
              </span>
            </div>
            <div className="px-3 py-2 sm:px-4 bg-[#111827] border border-[rgba(255,255,255,0.07)] rounded-lg">
              <span className="text-xs text-[#94A3B8]" style={{ fontFamily: "'Sora', sans-serif" }}>This Week:</span>
              <span className="ml-2 text-sm text-[#E2E8F0]" style={{ fontFamily: "'DM Mono', monospace" }}>
                ₹{Math.round(totals.week).toLocaleString()}
              </span>
            </div>
            <div className="px-3 py-2 sm:px-4 bg-[#111827] border border-[rgba(255,255,255,0.07)] rounded-lg">
              <span className="text-xs text-[#94A3B8]" style={{ fontFamily: "'Sora', sans-serif" }}>Today:</span>
              <span className="ml-2 text-sm text-[#E2E8F0]" style={{ fontFamily: "'DM Mono', monospace" }}>
                ₹{Math.round(totals.today).toLocaleString()}
              </span>
            </div>
          </div>
          <button 
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#10B981] to-[#059669] text-white rounded-[10px] font-medium hover:shadow-lg hover:shadow-[#10B981]/20 transition-all"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            <Plus className="w-5 h-5" />
            Add Expense
          </button>
        </div>

        {/* Filter Bar */}
        <div className="bg-[#111827] border border-[rgba(255,255,255,0.07)] rounded-[18px] p-4 mb-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
              <input
                type="text"
                placeholder="Search expenses..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#0B1120] border border-[rgba(255,255,255,0.07)] rounded-lg text-[#E2E8F0] placeholder:text-[#64748B] focus:outline-none focus:border-[#10B981]/50"
                style={{ fontFamily: "'Sora', sans-serif" }}
              />
            </div>
            <div className="relative w-full sm:w-auto">
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
                className="appearance-none px-4 py-2 pr-8 bg-[#0B1120] border border-[rgba(255,255,255,0.07)] rounded-lg text-[#E2E8F0]"
              >
                <option value="">Category</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" />
            </div>
            <div className="relative w-full sm:w-auto">
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="appearance-none px-4 py-2 pr-8 bg-[#0B1120] border border-[rgba(255,255,255,0.07)] rounded-lg text-[#E2E8F0]"
              >
                <option value="">Payment Method</option>
                {PAYMENT_METHODS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" />
            </div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-auto px-3 py-2 bg-[#0B1120] border border-[rgba(255,255,255,0.07)] rounded-lg text-[#E2E8F0]"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-auto px-3 py-2 bg-[#0B1120] border border-[rgba(255,255,255,0.07)] rounded-lg text-[#E2E8F0]"
            />
            <button
              onClick={() => {
                setCategoryFilter('');
                setPaymentFilter('');
                setSearch('');
                setStartDate('');
                setEndDate('');
                setPage(1);
              }}
              className="text-sm text-[#10B981] hover:text-[#059669]"
            >
              Clear filters
            </button>
          </div>
        </div>

        {/* Expense Table */}
        <div className="bg-[#111827] border border-[rgba(255,255,255,0.07)] rounded-[18px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.07)]">
                  <th className="text-left py-4 px-4 text-xs text-[#64748B] font-medium" style={{ fontFamily: "'Sora', sans-serif" }}>#</th>
                  <th className="text-left py-4 px-4 text-xs text-[#64748B] font-medium" style={{ fontFamily: "'Sora', sans-serif" }}>Category</th>
                  <th className="text-left py-4 px-4 text-xs text-[#64748B] font-medium" style={{ fontFamily: "'Sora', sans-serif" }}>Description</th>
                  <th className="text-left py-4 px-4 text-xs text-[#64748B] font-medium" style={{ fontFamily: "'Sora', sans-serif" }}>Date</th>
                  <th className="text-right py-4 px-4 text-xs text-[#64748B] font-medium" style={{ fontFamily: "'Sora', sans-serif" }}>Amount</th>
                  <th className="text-left py-4 px-4 text-xs text-[#64748B] font-medium" style={{ fontFamily: "'Sora', sans-serif" }}>Method</th>
                  <th className="text-center py-4 px-4 text-xs text-[#64748B] font-medium" style={{ fontFamily: "'Sora', sans-serif" }}>Receipt</th>
                  <th className="text-left py-4 px-4 text-xs text-[#64748B] font-medium" style={{ fontFamily: "'Sora', sans-serif" }}>Type</th>
                  <th className="text-center py-4 px-4 text-xs text-[#64748B] font-medium" style={{ fontFamily: "'Sora', sans-serif" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(loading ? [] : filteredItems).map((expense, index) => (
                  <tr key={expense._id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.02)] group">
                    <td className="py-4 px-4 text-sm text-[#94A3B8]" style={{ fontFamily: "'DM Mono', monospace" }}>{index + 1}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{expense.categoryId?.icon || '📦'}</span>
                        <span className="text-sm text-[#E2E8F0]" style={{ fontFamily: "'Sora', sans-serif" }}>
                          {expense.categoryId?.name || 'Category'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-[#E2E8F0]" style={{ fontFamily: "'Sora', sans-serif" }}>{expense.description}</td>
                    <td className="py-4 px-4 text-sm text-[#94A3B8]" style={{ fontFamily: "'Sora', sans-serif" }}>
                      {new Date(expense.date).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 text-right text-sm text-[#F43F5E]" style={{ fontFamily: "'DM Mono', monospace" }}>
                      ₹{expense.amount.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-sm text-[#94A3B8]" style={{ fontFamily: "'Sora', sans-serif" }}>
                      {PAYMENT_METHODS.find((m) => m.value === expense.paymentMethod)?.label || expense.paymentMethod}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {expense.receiptUrl ? (
                        <a
                          href={expense.receiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[#10B981] hover:text-[#22D3EE]"
                          title="Open receipt"
                        >
                          <Paperclip className="w-4 h-4" />
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-[#64748B]">—</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        expense.isRecurring
                          ? 'bg-[#8B5CF6]/10 text-[#8B5CF6]' 
                          : 'bg-[#64748B]/10 text-[#94A3B8]'
                      }`}>
                        {expense.isRecurring ? 'Recurring' : 'One-time'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onEditExpense(expense)} className="p-1.5 hover:bg-[rgba(255,255,255,0.05)] rounded">
                          <Pencil className="w-4 h-4 text-[#22D3EE]" />
                        </button>
                        <button onClick={() => onDeleteExpense(expense._id)} className="p-1.5 hover:bg-[rgba(255,255,255,0.05)] rounded">
                          <Trash2 className="w-4 h-4 text-[#F43F5E]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 border-t border-[rgba(255,255,255,0.07)]">
            <div className="text-sm text-[#94A3B8]" style={{ fontFamily: "'Sora', sans-serif" }}>
              Showing {filteredItems.length} expenses (page {page} of {pages})
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 bg-[#0B1120] border border-[rgba(255,255,255,0.07)] rounded-lg text-[#E2E8F0] hover:bg-[rgba(255,255,255,0.05)] text-sm disabled:opacity-40"
              >
                Previous
              </button>
              <button className="px-3 py-1.5 bg-[#10B981] border border-[#10B981] rounded-lg text-white text-sm">{page}</button>
              <button
                disabled={page >= pages}
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                className="px-3 py-1.5 bg-[#0B1120] border border-[rgba(255,255,255,0.07)] rounded-lg text-[#E2E8F0] hover:bg-[rgba(255,255,255,0.05)] text-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#111827] border border-[rgba(255,255,255,0.07)] rounded-[18px] p-8 w-full max-w-2xl mx-4">
            <h2 className="text-2xl font-semibold text-[#E2E8F0] mb-6" style={{ fontFamily: "'Sora', sans-serif" }}>
              {editingExpenseId ? 'Edit Expense' : 'Add Expense'}
            </h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm text-[#94A3B8] mb-2">Amount</label>
                <input 
                  type="text" 
                  placeholder="₹ 0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0B1120] border border-[rgba(255,255,255,0.07)] rounded-lg text-2xl text-[#E2E8F0] focus:outline-none focus:border-[#10B981]/50"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#94A3B8] mb-2">Category</label>
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0B1120] border border-[rgba(255,255,255,0.07)] rounded-lg text-[#E2E8F0] focus:outline-none focus:border-[#10B981]/50"
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[#94A3B8] mb-2">Date</label>
                  <input 
                    type="date" 
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0B1120] border border-[rgba(255,255,255,0.07)] rounded-lg text-[#E2E8F0] focus:outline-none focus:border-[#10B981]/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-[#94A3B8] mb-2">Description</label>
                <input 
                  type="text" 
                  placeholder="Add a description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0B1120] border border-[rgba(255,255,255,0.07)] rounded-lg text-[#E2E8F0] focus:outline-none focus:border-[#10B981]/50"
                />
              </div>

              <div>
                <label className="block text-sm text-[#94A3B8] mb-2">Payment Method</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PAYMENT_METHODS.map((method) => (
                    <button
                      key={method.value}
                      onClick={() => setPaymentMethod(method.value)}
                      className={`px-4 py-2 border rounded-lg text-sm ${
                        paymentMethod === method.value
                          ? 'bg-[#10B981]/10 border-[#10B981]/50 text-[#10B981]'
                          : 'bg-[#0B1120] border-[rgba(255,255,255,0.07)] text-[#E2E8F0] hover:border-[#10B981]/50'
                      }`}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-[#94A3B8] mb-2">Receipt (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onReceiptSelected(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 bg-[#0B1120] border border-[rgba(255,255,255,0.07)] rounded-lg text-[#E2E8F0]"
                />
                <div className="mt-2 text-xs text-[#94A3B8]">
                  {uploadingReceipt
                    ? `Uploading receipt... ${uploadProgress}%`
                    : receiptUrl
                    ? `Uploaded: ${receiptFileName}`
                    : 'Accepted formats: image files up to 5MB'}
                </div>
                {(uploadingReceipt || uploadProgress > 0) && (
                  <div className="mt-2 h-1.5 w-full rounded bg-[#1F2937] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#10B981] to-[#22D3EE] transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
                {receiptPreviewUrl && (
                  <div className="mt-3">
                    <img src={receiptPreviewUrl} alt="Receipt preview" className="max-h-40 rounded border border-[rgba(255,255,255,0.12)]" />
                  </div>
                )}
              </div>
            </div>

            {formError && <div className="text-sm text-[#F43F5E]">{formError}</div>}
            {formSuccess && <div className="text-sm text-[#10B981]">{formSuccess}</div>}

            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="flex-1 px-4 py-3 bg-transparent border border-[rgba(255,255,255,0.07)] text-[#E2E8F0] rounded-[10px] hover:bg-[rgba(255,255,255,0.05)]"
              >
                Cancel
              </button>
              <button
                onClick={onSaveExpense}
                disabled={uploadingReceipt}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-[#10B981] to-[#059669] text-white rounded-[10px] hover:shadow-lg hover:shadow-[#10B981]/20"
              >
                {editingExpenseId ? 'Update Expense' : 'Save Expense'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
