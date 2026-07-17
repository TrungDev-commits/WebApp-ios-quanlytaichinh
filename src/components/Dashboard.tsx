import React from "react";
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  ArrowDownLeft, 
  ArrowUpRight, 
  AlertCircle,
  Activity,
  ChevronRight,
  ShieldAlert,
  CheckCircle2
} from "lucide-react";
import { Transaction, Debt, Category } from "../types";

interface DashboardProps {
  transactions: Transaction[];
  debts: Debt[];
  categories: Category[];
  onNavigateToTab: (tab: number) => void;
  username?: string;
}

export default function Dashboard({
  transactions,
  debts,
  categories,
  onNavigateToTab,
  username = "bạn"
}: DashboardProps) {

  // Helper to format currency in Vietnamese format (divided by 1000, 1000 = 1)
  const formatVND = (num: number) => {
    const valueInK = Math.round(num / 1000);
    return new Intl.NumberFormat("vi-VN").format(valueInK) + "k";
  };

  // Calculations
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  // Receivables (nợ thu hồi - other people owe us)
  const totalReceivables = debts
    .filter((d) => d.type === "receivable")
    .reduce((sum, d) => sum + (d.amount - d.paid), 0);

  // Payables (nợ phải trả - we owe other people)
  const totalPayables = debts
    .filter((d) => d.type === "payable")
    .reduce((sum, d) => sum + (d.amount - d.paid), 0);

  // Dòng tiền khả dụng thực tế (Available cashflow) = (Total Receivables + Total Income) - (Total Payables + Total Expense)
  const availableCashflow = (totalReceivables + totalIncome) - (totalPayables + totalExpense);

  // Net Debt calculation (Dư nợ ròng)
  const netDebt = totalPayables - totalReceivables;

  // Monthly trend indicator (income vs expense)
  const isPositiveTrend = totalIncome >= totalExpense;
  const trendPercentage = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;

  // Category expense grouping for Donut Chart
  const categorySpentMap: { [key: string]: number } = {};
  categories.forEach(c => { categorySpentMap[c.name] = 0; });
  categorySpentMap["Khác"] = 0;

  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      const cat = t.category;
      if (categorySpentMap[cat] !== undefined) {
        categorySpentMap[cat] += t.amount;
      } else {
        categorySpentMap["Khác"] += t.amount;
      }
    });

  const colorHexMap: Record<string, string> = {
    red: '#FED7D7',
    amber: '#FEEBC8',
    blue: '#EBF8FF',
    teal: '#E6FFFA',
    emerald: '#D1FAE5',
    slate: '#EDF2F7',
    indigo: '#E0E7FF',
    rose: '#FFE4E6',
    purple: '#F3E8FF',
    orange: '#FFEDD5',
  };

  const getColor = (name: string) => {
    const cat = categories.find(c => c.name === name);
    if (cat) return colorHexMap[cat.color] || '#EDF2F7';
    return '#EDF2F7';
  };

  const categoriesData = Object.keys(categorySpentMap).map((key) => ({
    name: key,
    value: categorySpentMap[key],
    color: getColor(key),
  }));

  const totalExpenseComputed = categoriesData.reduce((sum, c) => sum + c.value, 0);

  // Clean donut chart helper parameters
  let cumulativePercent = 0;
  const donutSlices = categoriesData
    .filter(c => c.value > 0)
    .map((c) => {
      const percent = (c.value / (totalExpenseComputed || 1)) * 100;
      const startPercent = cumulativePercent;
      cumulativePercent += percent;
      
      // Calculate SVG coordinates
      const getCoordinatesForPercent = (percentValue: number) => {
        const x = Math.cos(2 * Math.PI * percentValue);
        const y = Math.sin(2 * Math.PI * percentValue);
        return [x, y];
      };

      const [startX, startY] = getCoordinatesForPercent(startPercent / 100);
      const [endX, endY] = getCoordinatesForPercent(cumulativePercent / 100);
      
      const largeArcFlag = percent > 50 ? 1 : 0;
      
      // Arc path
      const pathData = [
        `M ${startX} ${startY}`, // Move to starting coordinates
        `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`, // Draw arc
        `L 0 0` // Line back to center
      ].join(' ');

      return {
        name: c.name,
        color: c.color,
        pathData,
        value: c.value,
        percent: Math.round(percent)
      };
    });

  // Urgency list of debts
  const urgentDebts = debts
    .filter(d => (d.amount - d.paid) > 0)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  return (
    <div className="space-y-6 pb-40">
      {/* HEADER SECTION */}
      <div id="header-section" className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">TÀI KHOẢN CỦA TÔI</span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">Chào {username}!</h1>
        </div>
      </div>

      {/* TARGETED AVAILABLE CASH BALANCE CARD */}
      <div 
        id="net-balance-card" 
        className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-[28px] p-5 shadow-[0_12px_36px_rgba(0,0,0,0.04)]"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="p-2 rounded-2xl bg-slate-100 text-slate-700">
              <Wallet className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">Khả Dụng</span>
          </div>
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${
            isPositiveTrend 
              ? "bg-emerald-50 text-emerald-600" 
              : "bg-rose-50 text-rose-600"
          }`}>
            {isPositiveTrend ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{isPositiveTrend ? `+${trendPercentage}%` : `-${trendPercentage}%`}</span>
          </div>
        </div>

        <div className="mt-3">
          <h2 className={`text-2xl font-extrabold tracking-tight ${availableCashflow >= 0 ? "text-slate-900" : "text-rose-600"}`}>
            {formatVND(availableCashflow)}
          </h2>
          <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tight">
            Đã đồng bộ công nợ & thu chi
          </p>
        </div>

        {/* Breakdown Subtotals */}
        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1">
              <ArrowDownLeft className="w-3 h-3 text-emerald-500" />
              Nợ thu (+)
            </span>
            <span className="text-xs font-extrabold text-emerald-600 block mt-0.5">{formatVND(totalReceivables)}</span>
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3 text-rose-500" />
              Nợ trả (-)
            </span>
            <span className="text-xs font-extrabold text-rose-500 block mt-0.5">{formatVND(totalPayables)}</span>
          </div>
        </div>
      </div>

      {/* QUICK TRANSACTION BUTTONS SUMMARY */}
      <div id="quick-cashflow-split" className="grid grid-cols-2 gap-3">
        {/* Income Card */}
        <div className="bg-white/80 backdrop-blur-md border border-white/40 rounded-[24px] p-3 flex items-center gap-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.02)]">
          <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600 shrink-0">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight block truncate">Thu nhập</span>
            <span className="text-xs font-extrabold text-emerald-700 block mt-0.5 truncate">{formatVND(totalIncome)}</span>
          </div>
        </div>

        {/* Expense Card */}
        <div className="bg-white/80 backdrop-blur-md border border-white/40 rounded-[24px] p-3 flex items-center gap-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.02)]">
          <div className="p-2 rounded-xl bg-rose-100 text-rose-600 shrink-0">
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight block truncate">Chi tiêu</span>
            <span className="text-xs font-extrabold text-rose-700 block mt-0.5 truncate">{formatVND(totalExpense)}</span>
          </div>
        </div>
      </div>

      {/* HEALTH STATUS ALERT / DIAGNOSTIC CHECK */}
      <div id="health-diagnostics-bar">
        {netDebt <= 0 ? (
          <div className="bg-emerald-50 border border-emerald-100 rounded-[24px] p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-emerald-800">Dòng tiền an toàn</h3>
              <p className="text-xs text-emerald-600/90 mt-0.5">
                Các khoản nợ phải trả nhỏ hơn nợ thu hồi. Sức khỏe tài chính đang ở trạng thái an toàn tuyệt vời. Hãy duy trì tích lũy!
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-100 rounded-[24px] p-4 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-amber-800">Cảnh báo dư nợ ròng dương</h3>
              <p className="text-xs text-amber-600/90 mt-0.5">
                Bạn đang nợ nhiều hơn số tiền có thể thu hồi ({formatVND(netDebt)} ròng). Hãy cân nhắc sử dụng tính năng **Cố vấn AI Gemini** để nhận giải pháp cơ cấu nợ.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* DONUT CHART EXPENSE BREAKDOWN */}
      <div className="bg-white/80 backdrop-blur-md border border-white/40 rounded-[28px] p-6 shadow-[0_12px_36px_rgba(0,0,0,0.03)]">
        <h3 className="text-sm font-bold text-slate-800 tracking-tight">Cơ Cấu Chi Tiêu Tháng Này</h3>
        
        <div className="flex flex-col items-center gap-6 mt-6">
          {/* SVG Donut Chart */}
          <div className="relative w-36 h-36 shrink-0">
            {totalExpenseComputed === 0 ? (
              <div className="w-full h-full rounded-full border-4 border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-xs text-center p-4">
                Chưa có dữ liệu chi tiêu
              </div>
            ) : (
              <svg className="w-full h-full transform -rotate-90" viewBox="-1.2 -1.2 2.4 2.4">
                {donutSlices.map((slice, index) => (
                  <path
                    key={index}
                    d={slice.pathData}
                    fill={slice.color}
                    className="hover:opacity-90 transition-opacity cursor-pointer"
                  />
                ))}
                {/* Center hole for donut effect */}
                <circle cx="0" cy="0" r="0.65" fill="#ffffff" />
              </svg>
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng chi</span>
              <span className="text-sm font-black text-slate-800 mt-0.5">
                {formatVND(totalExpenseComputed)}
              </span>
            </div>
          </div>

          {/* Ranking Legend Grid */}
          <div className="flex-1 w-full space-y-3">
            {categoriesData
              .sort((a, b) => b.value - a.value)
              .map((cat, idx) => {
                const pct = totalExpenseComputed > 0 ? Math.round((cat.value / totalExpenseComputed) * 100) : 0;
                return (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-3 h-3 rounded-full border border-white/60" 
                        style={{ backgroundColor: cat.color }} 
                      />
                      <span className="font-semibold text-slate-600">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 font-medium">{formatVND(cat.value)}</span>
                      <span className="font-bold text-slate-700 bg-slate-50 px-1.5 py-0.5 rounded-md min-w-[32px] text-center">
                        {pct}%
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* URGENT DEBT EMERGENCY PORTFOLIO */}
      {urgentDebts.length > 0 && (
        <div className="bg-white/80 backdrop-blur-md border border-white/40 rounded-[28px] p-6 shadow-[0_12px_36px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              Hồ Sơ Nợ Khẩn Cấp
            </h3>
            <button 
              onClick={() => onNavigateToTab(4)}
              className="text-xs font-bold text-slate-500 flex items-center hover:text-slate-800 transition-colors cursor-pointer"
            >
              Xem tất cả <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {urgentDebts.slice(0, 2).map((debt) => {
              const remaining = debt.amount - debt.paid;
              const percentPaid = Math.round((debt.paid / debt.amount) * 100);
              const isPayable = debt.type === "payable";

              return (
                <div 
                  key={debt.id} 
                  className="bg-white/40 border border-white/60 rounded-2xl p-4 flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isPayable ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                      }`}>
                        {isPayable ? "Đi vay" : "Cho vay"}
                      </span>
                      <span className="text-xs font-bold text-slate-800">{debt.partner}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      Hạn trả: {new Date(debt.dueDate).toLocaleDateString("vi-VN")}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-800 block">{formatVND(remaining)}</span>
                    <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                      Đã trả {percentPaid}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
