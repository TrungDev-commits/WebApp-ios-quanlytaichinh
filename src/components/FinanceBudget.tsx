import React, { useState } from "react";
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
  Trash2
} from "lucide-react";
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
  const [interest, setInterest] = useState("0");
  const [dueDate, setDueDate] = useState("2026-08-15");
  const [installments, setInstallments] = useState(1);
  const [swipedDebtId, setSwipedDebtId] = useState<string | null>(null);
  const [interestExplanationVisible, setInterestExplanationVisible] = useState(false);

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
    const rawAmt = parseInt(amountInput.replace(/\D/g, "")) || 0;
    if (rawAmt <= 0) return;

    const interestVal = parseFloat(interest) || 0;

    // Auto-generate timelines based on installments
    const timelineItems = [];
    const baseInstallmentAmt = Math.round(rawAmt / installments);
    const currentDate = new Date("2026-07-15"); // Live app state base date

    for (let i = 0; i < installments; i++) {
      // Calculate installment date (increment months)
      const instDate = new Date(currentDate);
      instDate.setMonth(currentDate.getMonth() + i);
      
      timelineItems.push({
        date: instDate.toISOString().split("T")[0],
        amount: baseInstallmentAmt,
        completed: false
      });
    }

    onAddDebt({
      type: debtType,
      partner,
      amount: rawAmt,
      paid: 0,
      interestRate: interestVal,
      dueDate,
      timeline: timelineItems
    });

    // Reset fields and close form
    setPartner("");
    setAmountInput("");
    setInterest("0");
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
    <div className="space-y-6 pb-24">
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

            {/* Amount and Installments */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight block mb-1">
                  Số tiền (VND)
                </label>
                <input
                  type="text"
                  required
                  value={amountInput}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="VD: 15.000.000"
                  className="w-full bg-slate-50 border border-slate-100 text-xs font-bold text-slate-800 rounded-xl px-3 py-2.5 outline-none focus:bg-white focus:border-slate-300 transition-all"
                />
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
                  <option value={3}>Chia 3 đợt (3 tháng)</option>
                  <option value={6}>Chia 6 đợt (6 tháng)</option>
                  <option value={12}>Chia 12 đợt (12 tháng)</option>
                </select>
              </div>
            </div>

            {/* Interest Rate & Due Date */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight block mb-1">
                  Lãi suất (%/tháng)
                </label>
                <motion.input
                  type="number"
                  step="0.1"
                  min="0"
                  value={interest}
                  onChange={(e) => setInterest(e.target.value)}
                  onFocus={() => setInterestExplanationVisible(true)}
                  onBlur={() => setTimeout(() => setInterestExplanationVisible(false), 200)}
                  whileFocus={{ scale: 1.03 }}
                  className="w-full bg-slate-50 border border-slate-100 text-xs font-bold text-slate-800 rounded-xl px-3 py-2.5 outline-none focus:bg-white focus:border-slate-900 transition-all"
                />
                
                {/* Custom click popup message for interest explanation */}
                <AnimatePresence>
                  {interestExplanationVisible && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 5, scale: 0.9 }}
                      className="absolute left-0 right-0 -top-24 z-50 bg-slate-950 text-white p-3 rounded-2xl shadow-xl text-[10px] leading-relaxed border border-white/10"
                    >
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 w-2.5 h-2.5 bg-slate-950 rotate-45" />
                      <span className="font-extrabold text-amber-400 block mb-0.5">💡 Gợi ý lãi suất:</span>
                      Đặt <b className="text-white">0%</b> nếu là nợ thân quen. Đặt <b className="text-white">0.5% - 1.5%</b> để mô phỏng chính xác dư nợ giảm dần có tính lãi.
                    </motion.div>
                  )}
                </AnimatePresence>
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
              onClick={() => {
                const title = prompt("Tên mục tiêu:", "Mua xe máy mới");
                if (!title) return;
                const goalAmt = prompt("Số tiền mục tiêu (VND):", "50000000");
                if (!goalAmt) return;
                const months = prompt("Số tháng muốn đạt mục tiêu:", "6");
                if (!months) return;
                const monthsNum = parseInt(months);
                const targetDate = new Date();
                targetDate.setMonth(targetDate.getMonth() + monthsNum);
                const firstDeposit = Math.round(parseInt(goalAmt) / monthsNum);
                onUpdateSavings(firstDeposit);
                setTimeout(() => window.location.reload(), 500);
              }}
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
                onClick={() => {
                  const amtStr = prompt("Nhập số tiền muốn nạp vào quỹ tiết kiệm:");
                  if (amtStr) {
                    const amt = parseFloat(amtStr);
                    if (!isNaN(amt) && amt > 0) {
                      onUpdateSavings(amt);
                    }
                  }
                }}
                className="bg-slate-900 text-white font-bold text-xs py-3 rounded-xl shadow-sm hover:bg-slate-800 cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Nạp quỹ</span>
              </button>

              {/* - Withdraw (Rút quỹ) */}
              <button
                id="btn-savings-withdraw"
                onClick={() => {
                  const amtStr = prompt("Nhập số tiền muốn rút từ quỹ tiết kiệm:");
                  if (amtStr) {
                    const amt = parseFloat(amtStr);
                    if (!isNaN(amt) && amt > 0) {
                      onUpdateSavings(-amt);
                    }
                  }
                }}
                className="bg-white border border-slate-100 text-slate-600 font-bold text-xs py-3 rounded-xl shadow-sm hover:bg-slate-50 cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                <Minus className="w-4 h-4" />
                <span>Rút quỹ</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
