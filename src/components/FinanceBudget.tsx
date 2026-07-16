import React, { useState, useEffect } from "react";
import { 
  PiggyBank, 
  CheckCircle2, 
  AlertTriangle, 
  BellRing, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Plus, 
  Minus, 
  ShieldCheck, 
  PlusCircle, 
  MinusCircle, 
  Calendar,
  AlertCircle,
  Trash2,
  X,
  DollarSign,
  Sparkles,
  Loader2
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "motion/react";
import { Budget, Debt, SavingsGoal } from "../types";

interface FinanceBudgetProps {
  budgets: Budget[];
  debts: Debt[];
  savings: SavingsGoal[];
  onUpdateSavings: (amount: number) => void;
  onUpdateBudgetLimit: (category: string, newLimit: number) => void;
  onPayDebtInstallment: (debtId: string, installmentIndex: number) => void;
  onAddDebt: (debt: Omit<Debt, "id">) => void;
  onDeleteDebt: (id: string) => void;
}

export default function FinanceBudget({
  budgets,
  debts,
  savings,
  onUpdateSavings,
  onUpdateBudgetLimit,
  onPayDebtInstallment,
  onAddDebt,
  onDeleteDebt
}: FinanceBudgetProps) {
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editLimitStr, setEditLimitStr] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [debtType, setDebtType] = useState<'payable' | 'receivable'>('payable');
  const [partner, setPartner] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [amountMode, setAmountMode] = useState<'total' | 'perPeriod'>('perPeriod');
  const [interest, setInterest] = useState("0");
  const [startDate, setStartDate] = useState("2026-07-15");
  const [dueDate, setDueDate] = useState("2026-08-15");
  const [paymentDueDay, setPaymentDueDay] = useState("5");
  const [previewTimeline, setPreviewTimeline] = useState<{ date: string; amount: number; completed: boolean }[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [installments, setInstallments] = useState(1);
  const [swipedDebtId, setSwipedDebtId] = useState<string | null>(null);
  const [interestExplanationVisible, setInterestExplanationVisible] = useState(false);

  const generateDefaultTimeline = (startStr: string, _dueStr: string, totalInst: number, amtPerInst: number, dueDayNum: number) => {
    const timeline = [];
    const start = new Date(startStr);
    const baseYear = start.getFullYear();
    const baseMonth = start.getMonth(); // 0-indexed

    for (let i = 0; i < totalInst; i++) {
      // Tính tháng/năm cho kỳ thứ i
      const targetMonth = baseMonth + i;
      const year = baseYear + Math.floor(targetMonth / 12);
      const month = targetMonth % 12;

      // Lấy ngày max của tháng đó để tránh overflow (vd: ngày 31 ở tháng 2)
      const maxDay = new Date(year, month + 1, 0).getDate();
      const day = Math.min(dueDayNum, maxDay);

      // Dùng UTC để tránh timezone shift khi toISOString
      const instDate = new Date(Date.UTC(year, month, day));

      timeline.push({
        date: instDate.toISOString().split("T")[0],
        amount: amtPerInst,
        completed: false
      });
    }
    return timeline;
  };

  useEffect(() => {
    const raw = parseInt(amountInput.replace(/\D/g, "")) || 0;
    const dueDayNum = parseInt(paymentDueDay) || 5;
    const amtPerPeriod = amountMode === 'total'
      ? (installments > 0 ? Math.round(raw / installments) : 0)
      : raw;
    if (amtPerPeriod > 0) {
      setPreviewTimeline(generateDefaultTimeline(startDate, dueDate, installments, amtPerPeriod, dueDayNum));
    } else {
      setPreviewTimeline([]);
    }
  }, [startDate, dueDate, installments, amountInput, paymentDueDay, amountMode]);

  const handleAiOptimizeTimeline = async () => {
    const raw = parseInt(amountInput.replace(/\D/g, "")) || 0;
    if (raw <= 0 || !partner.trim()) {
      toast.error("Vui lòng nhập tên đối tác và số tiền trước!");
      return;
    }

    const amtPerPeriod = amountMode === 'total'
      ? Math.round(raw / installments)
      : raw;

    if (amtPerPeriod <= 0) {
      toast.error("Số tiền mỗi kỳ phải lớn hơn 0!");
      return;
    }

    setIsAiLoading(true);
    try {
      const response = await fetch("/.netlify/functions/gemini-timeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partner,
          amtPerPeriod,
          installments,
          startDate,
          dueDate,
          paymentDueDay
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Lỗi kết nối AI");

      const parsedTimeline = data.timeline;
      if (Array.isArray(parsedTimeline) && parsedTimeline.length > 0) {
        setPreviewTimeline(parsedTimeline);
        toast.success("Đã tối ưu lộ trình bằng Cố vấn AI!");
      } else {
        throw new Error("Phản hồi AI không hợp lệ");
      }
    } catch (err: any) {
      console.error("AI timeline error:", err);
      toast.error("AI không phản hồi. Đã dùng lộ trình mặc định.");
      setPreviewTimeline(generateDefaultTimeline(startDate, dueDate, installments, amtPerPeriod, parseInt(paymentDueDay) || 5));
    } finally {
      setIsAiLoading(false);
    }
  };

  // Modal states
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalTitle, setGoalTitle] = useState("Mua xe máy mới");
  const [goalAmountStr, setGoalAmountStr] = useState("50,000,000");
  const [goalMonths, setGoalMonths] = useState("6");

  const [showFundModal, setShowFundModal] = useState(false);
  const [fundAmount, setFundAmount] = useState("");
  const [isDeposit, setIsDeposit] = useState(true);

  const handleAmountChange = (val: string) => {
    const clean = val.replace(/\D/g, "");
    if (!clean) {
      setAmountInput("");
      return;
    }
    const parsed = parseInt(clean);
    setAmountInput(new Intl.NumberFormat("vi-VN").format(parsed));
  };

  const handleCreateDebtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partner.trim()) return;
    const raw = parseInt(amountInput.replace(/\D/g, "")) || 0;
    if (raw <= 0) return;

    const totalAmt = amountMode === 'total' ? raw : raw * installments;
    const amtPerPeriod = amountMode === 'total'
      ? Math.round(raw / installments)
      : raw;
    const interestVal = 0;

    // Tái tạo timeline cuối cùng từ amtPerPeriod thực tế (phòng trường hợp AI chưa chạy)
    const dueDayNum = parseInt(paymentDueDay) || 5;
    const finalTimeline = previewTimeline.length === installments
      ? previewTimeline.map(t => ({ ...t, amount: amtPerPeriod }))
      : generateDefaultTimeline(startDate, dueDate, installments, amtPerPeriod, dueDayNum);

    onAddDebt({
      type: debtType,
      partner,
      amount: totalAmt,
      paid: 0,
      interestRate: interestVal,
      dueDate,
      timeline: finalTimeline
    });

    // Reset fields and close form
    setPartner("");
    setAmountInput("");
    setInterest("0");
    setStartDate("2026-07-15");
    setDueDate("2026-08-15");
    setInstallments(1);
    setShowAddForm(false);
  };

  const formatVND = (num: number) => {
    const valueInK = Math.round(num / 1000);
    return new Intl.NumberFormat("vi-VN").format(valueInK) + "k";
  };

  // 1. Budget Status Calculation
  const getBudgetStatus = (spent: number, limit: number) => {
    const pct = limit > 0 ? (spent / limit) * 100 : 0;
    if (pct < 85) {
      return {
        color: "bg-emerald-500",
        bg: "bg-emerald-50",
        border: "border-emerald-100",
        text: "text-emerald-700",
        icon: CheckCircle2,
        label: "An toàn (<85%)"
      };
    } else if (pct >= 85 && pct < 100) {
      return {
        color: "bg-amber-500",
        bg: "bg-amber-50",
        border: "border-amber-100",
        text: "text-amber-700",
        icon: AlertTriangle,
        label: "Cảnh báo (85% - 99%)"
      };
    } else {
      return {
        color: "bg-rose-500 animate-pulse",
        bg: "bg-rose-50",
        border: "border-rose-100",
        text: "text-rose-700 animate-pulse",
        icon: BellRing,
        label: "Vượt hạn mức!"
      };
    }
  };

  const startEditingBudget = (budget: Budget) => {
    setEditingCategory(budget.category);
    setEditLimitStr(budget.limit.toString());
  };

  const handleSaveBudgetLimit = (category: string) => {
    const num = parseFloat(editLimitStr);
    if (!isNaN(num) && num >= 0) {
      onUpdateBudgetLimit(category, num);
    }
    setEditingCategory(null);
  };

  // 2. Debt Portfolio Logic
  const totalReceivableDebt = debts
    .filter((d) => d.type === "receivable")
    .reduce((sum, d) => sum + (d.amount - d.paid), 0);

  const totalPayableDebt = debts
    .filter((d) => d.type === "payable")
    .reduce((sum, d) => sum + (d.amount - d.paid), 0);

  // 3. Savings Calculations
  const activeSavings = savings[0]; // Active saving goal
  
  const calculateSavingsNeeded = (goal: SavingsGoal) => {
    const remaining = goal.goalAmount - goal.currentAmount;
    if (remaining <= 0) return 0;
    
    // Calculate months remaining
    const current = new Date();
    const target = new Date(goal.targetDate);
    const yearDiff = target.getFullYear() - current.getFullYear();
    const monthDiff = target.getMonth() - current.getMonth();
    const months = Math.max(1, yearDiff * 12 + monthDiff);

    return Math.round(remaining / months);
  };

  const monthsRemaining = activeSavings ? (() => {
    const current = new Date();
    const target = new Date(activeSavings.targetDate);
    const yearDiff = target.getFullYear() - current.getFullYear();
    const monthDiff = target.getMonth() - current.getMonth();
    return Math.max(1, yearDiff * 12 + monthDiff);
  })() : 1;

  const savingsPct = activeSavings ? Math.round((activeSavings.currentAmount / activeSavings.goalAmount) * 100) : 0;

  return (
    <div className="space-y-6 pb-40">
      {/* SECTION 1: MONTHLY BUDGET LIMIT MONITOR */}
      <div id="finance-budgets-section" className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-slate-100 text-slate-700 rounded-lg">
            <BellRing className="w-4 h-4" />
          </div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Hạn Mức Ngân Sách</h2>
        </div>

        <div className="space-y-4">
          {budgets.length === 0 ? (
            <div className="bg-white/60 border border-slate-100 rounded-[28px] p-8 text-center text-slate-400">
              <BellRing className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold">Chưa có hạn mức ngân sách nào</p>
              <p className="text-[10px] mt-1">Mỗi lần thêm giao dịch chi tiêu, ngân sách sẽ tự động được tạo</p>
            </div>
          ) : budgets.map((budget) => {
            const spentPercent = budget.limit > 0 ? Math.round((budget.spent / budget.limit) * 100) : 0;
            const status = getBudgetStatus(budget.spent, budget.limit);
            const StatusIcon = status.icon;
            const isEditing = editingCategory === budget.category;

            return (
              <div 
                key={budget.category} 
                className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-[24px] p-5 shadow-[0_4px_16px_rgba(0,0,0,0.01)] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800">{budget.category}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <StatusIcon className={`w-3.5 h-3.5 ${status.text}`} />
                      <span className={`text-[10px] font-bold ${status.text}`}>{status.label}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-black text-slate-800">
                      {formatVND(budget.spent)}
                      <span className="text-slate-400 font-semibold text-[10px]"> / </span>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editLimitStr}
                          onChange={(e) => setEditLimitStr(e.target.value)}
                          onBlur={() => handleSaveBudgetLimit(budget.category)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveBudgetLimit(budget.category)}
                          className="w-20 px-1 border border-slate-200 rounded text-center text-xs font-bold"
                          autoFocus
                        />
                      ) : (
                        <span 
                          onClick={() => startEditingBudget(budget)}
                          className="hover:underline cursor-pointer text-slate-500 font-bold"
                          title="Click để điều chỉnh hạn mức"
                        >
                          {formatVND(budget.limit)}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Đã dùng {spentPercent}%</span>
                  </div>
                </div>

                {/* Progress bar with native light style */}
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${status.color}`}
                    style={{ width: `${Math.min(100, spentPercent)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: DEBT PORTFOLIO ENGINE (ĐỘNG CƠ CÔNG NỢ) */}
      <div id="finance-debts-section" className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-slate-100 text-slate-700 rounded-lg">
              <AlertCircle className="w-4 h-4 text-amber-500" />
            </div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Hồ Sơ Công Nợ</h2>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1 bg-slate-900 text-white font-black text-[10px] px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-all cursor-pointer shadow-sm uppercase tracking-wider"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm</span>
          </button>
        </div>

        {/* Collapsible Form */}
        {showAddForm && (
          <form 
            onSubmit={handleCreateDebtSubmit}
            className="bg-white/90 backdrop-blur-md border border-slate-200/60 rounded-[24px] p-5 shadow-[0_12px_36px_rgba(0,0,0,0.06)] space-y-4 animate-in fade-in slide-in-from-top-4 duration-200"
          >
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              Nhập thông tin công nợ mới
            </h3>

            {/* Debt Type Selector */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDebtType('payable')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  debtType === 'payable'
                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                    : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'
                }`}
              >
                Tôi đi vay (Phải trả)
              </button>
              <button
                type="button"
                onClick={() => setDebtType('receivable')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  debtType === 'receivable'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'
                }`}
              >
                Tôi cho vay (Được thu)
              </button>
            </div>

            {/* Partner Name */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight block mb-1">
                Tên đối tác / Người liên quan
              </label>
              <input
                type="text"
                required
                value={partner}
                onChange={(e) => setPartner(e.target.value)}
                placeholder="VD: Anh Nam, Vay mua Laptop..."
                className="w-full bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-800 rounded-xl px-3 py-2.5 outline-none focus:bg-white focus:border-slate-300 transition-all"
              />
            </div>

            {/* Amount Mode Toggle + Amount Input + Installments */}
            {/* Mode selector */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setAmountMode('perPeriod')}
                className={`flex-1 text-[10px] font-bold py-1.5 rounded-lg transition-all ${
                  amountMode === 'perPeriod'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                Nhập tiền mỗi kỳ
              </button>
              <button
                type="button"
                onClick={() => setAmountMode('total')}
                className={`flex-1 text-[10px] font-bold py-1.5 rounded-lg transition-all ${
                  amountMode === 'total'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                Nhập tổng nợ
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight block mb-1">
                  {amountMode === 'total' ? 'Tổng số nợ (VND)' : 'Số tiền mỗi kỳ (VND)'}
                </label>
                <input
                  type="text"
                  required
                  value={amountInput}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder={amountMode === 'total' ? 'VD: 15.000.000' : 'VD: 5.000.000'}
                  className="w-full bg-slate-50 border border-slate-100 text-xs font-bold text-slate-800 rounded-xl px-3 py-2.5 outline-none focus:bg-white focus:border-slate-300 transition-all"
                />
                {/* Helper: derived value */}
                {amountInput && installments > 1 && (() => {
                  const raw = parseInt(amountInput.replace(/\D/g, '')) || 0;
                  if (!raw) return null;
                  if (amountMode === 'total') {
                    const perPeriod = Math.round(raw / installments);
                    return (
                      <span className="text-[9px] text-slate-400 font-medium mt-0.5 block">
                        → Mỗi kỳ: <b className="text-slate-600">{new Intl.NumberFormat('vi-VN').format(perPeriod)}đ</b>
                      </span>
                    );
                  } else {
                    const total = raw * installments;
                    return (
                      <span className="text-[9px] text-slate-400 font-medium mt-0.5 block">
                        → Tổng nợ: <b className="text-slate-600">{new Intl.NumberFormat('vi-VN').format(total)}đ</b>
                      </span>
                    );
                  }
                })()}
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight block mb-1">
                  Số kỳ thanh toán
                </label>
                <select
                  value={installments}
                  onChange={(e) => setInstallments(parseInt(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-800 rounded-xl px-3 py-2.5 outline-none focus:bg-white focus:border-slate-300 transition-all"
                >
                  <option value={1}>Thanh toán 1 lần</option>
                  <option value={2}>Chia 2 đợt</option>
                  <option value={3}>Chia 3 đợt</option>
                  <option value={4}>Chia 4 đợt</option>
                  <option value={6}>Chia 6 đợt</option>
                  <option value={12}>Chia 12 đợt</option>
                </select>
              </div>
            </div>

            {/* Start Date & Due Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight block mb-1">
                  Ngày bắt đầu nợ
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-800 rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-slate-300 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight block mb-1">
                  Ngày đáo hạn
                </label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-800 rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-slate-300 transition-all"
                />
              </div>
            </div>

            {/* Payment Due Day of Month */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight block mb-1">
                Thanh toán trước ngày (Hàng tháng)
              </label>
              <input
                type="number"
                min="1"
                max="31"
                required
                value={paymentDueDay}
                onChange={(e) => {
                  const val = Math.max(1, Math.min(31, parseInt(e.target.value) || 1));
                  setPaymentDueDay(val.toString());
                }}
                className="w-full bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-800 rounded-xl px-3 py-2.5 outline-none focus:bg-white focus:border-slate-300 transition-all"
                placeholder="Ví dụ: 4"
              />
            </div>

            {/* Timeline Preview */}
            {previewTimeline.length > 0 && (
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Xem trước lộ trình ({previewTimeline.length} kỳ)
                  </span>
                  <button
                    type="button"
                    onClick={handleAiOptimizeTimeline}
                    disabled={isAiLoading}
                    className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 disabled:opacity-50 transition-colors"
                  >
                    {isAiLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                    🤖 AI tối ưu lộ trình
                  </button>
                </div>
                
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {previewTimeline.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[11px] bg-white border border-slate-100 rounded-lg p-2">
                      <span className="font-semibold text-slate-600">Đợt {idx + 1}</span>
                      <span className="font-bold text-slate-800">{formatVND(item.amount)}</span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(item.date).toLocaleDateString("vi-VN", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-600 px-3 py-2"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider px-4 py-2 rounded-xl hover:bg-slate-800 transition-all cursor-pointer shadow-md"
              >
                Lưu công nợ
              </button>
            </div>
          </form>
        )}

        {/* Debt Overall Breakdown Status Card */}
        <div className="bg-slate-50 border border-slate-100 rounded-[24px] p-4 flex items-center justify-between shadow-inner">
          <div>
            <span className="text-[10px] font-bold text-slate-400 tracking-tight block uppercase">Phải trả (-)</span>
            <span className="text-base font-black text-rose-600 block mt-0.5">{formatVND(totalPayableDebt)}</span>
          </div>
          <div className="h-8 w-[1px] bg-slate-200" />
          <div>
            <span className="text-[10px] font-bold text-slate-400 tracking-tight block uppercase">Được thu (+)</span>
            <span className="text-base font-black text-emerald-600 block mt-0.5">{formatVND(totalReceivableDebt)}</span>
          </div>
        </div>

        {/* List of Debts & Vertical Payment Timelines */}
        <div className="space-y-5">
          <AnimatePresence initial={false}>
            {debts.length === 0 ? (
              <div className="bg-white/60 border border-slate-100 rounded-[28px] p-8 text-center text-slate-400">
                <AlertCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-semibold">Chưa có hồ sơ công nợ nào</p>
              </div>
            ) : (
              debts.map((debt) => {
                const isPayable = debt.type === "payable";
                const remaining = debt.amount - debt.paid;
                const repaymentPercent = Math.round((debt.paid / debt.amount) * 100);
                const isSwiped = swipedDebtId === debt.id;

                return (
                  <div 
                    key={debt.id} 
                    className="relative overflow-hidden rounded-[28px] bg-white border border-slate-100 shadow-[0_4px_16px_rgba(0,0,0,0.01)]"
                  >
                    {/* Underlay delete button that shows on swipe */}
                    <div className="absolute inset-y-0 right-0 w-20 bg-rose-500 flex items-center justify-center">
                      <button
                        id={`btn-delete-debt-${debt.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteDebt(debt.id);
                          setSwipedDebtId(null);
                        }}
                        className="w-full h-full text-white flex flex-col items-center justify-center gap-1 hover:bg-rose-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-5 h-5 animate-pulse" />
                        <span className="text-[10px] font-bold">Xóa nợ</span>
                      </button>
                    </div>

                    {/* Swipeable transaction item card */}
                    <motion.div
                      drag="x"
                      dragConstraints={{ left: -80, right: 0 }}
                      dragElastic={0.1}
                      onDragEnd={(event, info) => {
                        if (info.offset.x < -40) {
                          setSwipedDebtId(debt.id);
                        } else if (info.offset.x > 30) {
                          setSwipedDebtId(null);
                        }
                      }}
                      animate={{ x: isSwiped ? -80 : 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      onClick={() => {
                        if (isSwiped) {
                          setSwipedDebtId(null);
                        } else {
                          setSwipedDebtId(debt.id);
                        }
                      }}
                      className="bg-white/95 p-5 cursor-grab active:cursor-grabbing relative z-10"
                    >
                      {/* Header info */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-50">
                        <div>
                          <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                            isPayable ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                          }`}>
                            {isPayable ? "Đi vay / Phải trả" : "Cho vay / Thu hồi"}
                          </span>
                          <h3 className="text-sm font-bold text-slate-800 mt-1">{debt.partner}</h3>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-800 block">{formatVND(remaining)} ròng</span>
                          <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">Tổng nợ: {formatVND(debt.amount)}</span>
                        </div>
                      </div>

                      {/* Progress track */}
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold mt-3">
                        <span>Tiến độ thanh toán</span>
                        <span>{repaymentPercent}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden mt-1.5">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${isPayable ? 'bg-rose-400' : 'bg-emerald-400'}`}
                          style={{ width: `${repaymentPercent}%` }}
                        />
                      </div>

                      {/* Vertical Timeline installments list (Đợt thanh toán) */}
                      <div className="mt-4 pt-3 border-t border-slate-50">
                        <span className="text-[10px] font-bold text-slate-400 tracking-wider block uppercase mb-3">Lộ trình trả nợ chi tiết</span>
                        
                        <div className="relative pl-4 border-l border-slate-100 space-y-4">
                          {debt.timeline.map((installment, idx) => {
                            const installmentDate = new Date(installment.date).toLocaleDateString("vi-VN", { month: "short", day: "numeric" });
                            return (
                              <div key={idx} className="relative flex items-center justify-between text-xs">
                                {/* Dot status */}
                                <div className={`absolute -left-[21px] p-0.5 rounded-full bg-white border ${
                                  installment.completed ? 'border-emerald-500 text-emerald-500' : 'border-slate-300 text-slate-400'
                                }`}>
                                  {installment.completed ? (
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  ) : (
                                    <Clock className="w-3.5 h-3.5" />
                                  )}
                                </div>

                                <div className="space-y-0.5">
                                  <span className="font-bold text-slate-700 block">Đợt {idx + 1} - {formatVND(installment.amount)}</span>
                                  <span className="text-[10px] text-slate-400 font-medium block">Ngày: {installmentDate}</span>
                                </div>

                                {/* Interactive Payment execution action button */}
                                {!installment.completed && (
                                  <button
                                    id={`btn-pay-installment-${debt.id}-${idx}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onPayDebtInstallment(debt.id, idx);
                                    }}
                                    className="bg-slate-900 text-white font-bold text-[9px] px-2.5 py-1.5 rounded-lg shadow-sm hover:bg-slate-800 cursor-pointer transition-all uppercase tracking-wider"
                                  >
                                    Đã trả tiền
                                  </button>
                                )}
                                {installment.completed && (
                                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                                    Đã xong
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                );
              })
            )}
          </AnimatePresence>
        </div>

        {/* Swipe tip overlay */}
        <div className="text-center text-[10px] text-slate-400 font-semibold italic mt-2">
          * Nhấp hoặc vuốt trái công nợ để xóa nhanh hồ sơ (Swipe-to-delete)
        </div>
      </div>

      {/* SECTION 3: SAVINGS WALLET GOAL PROGRESS (LỘ TRÌNH TÍCH LŨY) */}
      <div id="finance-savings-section" className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <PiggyBank className="w-4 h-4" />
          </div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Kế Hoạch Tiết Kiệm</h2>
        </div>

        {!activeSavings ? (
          <div className="bg-white/60 border border-slate-100 rounded-[28px] p-8 text-center text-slate-400 space-y-3">
            <PiggyBank className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-sm font-semibold">Chưa có mục tiêu tiết kiệm nào</p>
            <p className="text-[10px]">Thiết lập mục tiêu để bắt đầu tích lũy</p>
            <button
              onClick={() => setShowGoalModal(true)}
              className="bg-slate-900 text-white font-bold text-xs px-5 py-2.5 rounded-full hover:bg-slate-800 cursor-pointer"
            >
              <Plus className="w-4 h-4 inline mr-1" />
              Tạo mục tiêu
            </button>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-[28px] p-5 shadow-[0_4px_16px_rgba(0,0,0,0.01)] space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                  <PiggyBank className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800">{activeSavings.title}</h3>
                  <span className="text-[10px] text-slate-400 font-bold block mt-1">
                    Hạn chót: {new Date(activeSavings.targetDate).toLocaleDateString("vi-VN")}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-black text-slate-800 block">
                  {formatVND(activeSavings.currentAmount)}
                </span>
                <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                  Mục tiêu: {formatVND(activeSavings.goalAmount)}
                </span>
              </div>
            </div>

            {/* Savings percentage progress bar */}
            <div className="space-y-1.5">
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, savingsPct)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                <span>Tiến độ tích lũy</span>
                <span>{savingsPct}%</span>
              </div>
            </div>

            {/* Monthly saving computation card */}
            <div className="bg-slate-50/50 border border-slate-100 rounded-[20px] p-4 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Tiết kiệm hàng tháng tối thiểu</span>
                <span className="text-sm font-extrabold text-slate-800 block mt-1">
                  {formatVND(calculateSavingsNeeded(activeSavings))} / tháng
                </span>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Số tháng còn lại</span>
                <span className="text-sm font-extrabold text-indigo-600 block mt-1">
                  {monthsRemaining} tháng
                </span>
              </div>
            </div>

            {/* Dynamic Pill Buttons to shift money */}
            <div id="savings-pill-adjusters" className="grid grid-cols-2 gap-3 pt-2">
              {/* + Fund (Nạp quỹ) */}
              <button
                id="btn-savings-deposit"
                onClick={() => { setIsDeposit(true); setFundAmount(""); setShowFundModal(true); }}
                className="bg-slate-900 text-white font-bold text-xs py-3 rounded-xl shadow-sm hover:bg-slate-800 cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Nạp quỹ</span>
              </button>

              {/* - Withdraw (Rút quỹ) */}
              <button
                id="btn-savings-withdraw"
                onClick={() => { setIsDeposit(false); setFundAmount(""); setShowFundModal(true); }}
                className="bg-white border border-slate-100 text-slate-600 font-bold text-xs py-3 rounded-xl shadow-sm hover:bg-slate-50 cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                <Minus className="w-4 h-4" />
                <span>Rút quỹ</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* GOAL CREATION MODAL */}
      <AnimatePresence>
        {showGoalModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6"
            onClick={() => setShowGoalModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[28px] p-6 w-full max-w-sm shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">Tạo mục tiêu mới</h3>
                <button onClick={() => setShowGoalModal(false)} className="p-1 rounded-full hover:bg-slate-100 cursor-pointer">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tên mục tiêu</label>
                  <input type="text" value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-[14px] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900/10" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Số tiền mục tiêu (VND)</label>
                  <input type="text" value={goalAmountStr} onChange={(e) => setGoalAmountStr(e.target.value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ','))
                    } className="w-full px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-[14px] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900/10" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Số tháng muốn đạt</label>
                  <input type="number" min="1" value={goalMonths} onChange={(e) => setGoalMonths(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-[14px] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900/10" />
                </div>
              </div>
              <button
                onClick={() => {
                  if (!goalTitle.trim()) { toast.error("Nhập tên mục tiêu"); return; }
                  const amt = parseInt(goalAmountStr.replace(/,/g, ''));
                  if (!amt || amt <= 0) { toast.error("Nhập số tiền hợp lệ"); return; }
                  const months = parseInt(goalMonths);
                  if (!months || months <= 0) { toast.error("Nhập số tháng hợp lệ"); return; }
                  const targetDate = new Date();
                  targetDate.setMonth(targetDate.getMonth() + months);
                  const firstDeposit = Math.round(amt / months);
                  onUpdateSavings(firstDeposit);
                  setShowGoalModal(false);
                  toast.success("Đã tạo mục tiêu!");
                  setTimeout(() => window.location.reload(), 500);
                }}
                className="w-full bg-slate-900 text-white font-bold text-sm py-3 rounded-[20px] hover:bg-slate-800 cursor-pointer transition-all"
              >
                Tạo mục tiêu
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FUND MODAL (Nạp / Rút) */}
      <AnimatePresence>
        {showFundModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6"
            onClick={() => setShowFundModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[28px] p-6 w-full max-w-sm shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">{isDeposit ? "Nạp vào quỹ" : "Rút từ quỹ"}</h3>
                <button onClick={() => setShowFundModal(false)} className="p-1 rounded-full hover:bg-slate-100 cursor-pointer">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Số tiền (VND)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ','))}
                    placeholder="0"
                    className="w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-100 rounded-[16px] text-sm font-bold focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    autoFocus
                  />
                </div>
              </div>
              <button
                onClick={() => {
                  const amt = parseInt(fundAmount.replace(/,/g, ''));
                  if (!amt || amt <= 0) { toast.error("Nhập số tiền hợp lệ"); return; }
                  onUpdateSavings(isDeposit ? amt : -amt);
                  setShowFundModal(false);
                  toast.success(isDeposit ? "Đã nạp vào quỹ!" : "Đã rút khỏi quỹ!");
                }}
                className="w-full bg-slate-900 text-white font-bold text-sm py-3 rounded-[20px] hover:bg-slate-800 cursor-pointer transition-all"
              >
                {isDeposit ? "Nạp quỹ" : "Rút quỹ"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
