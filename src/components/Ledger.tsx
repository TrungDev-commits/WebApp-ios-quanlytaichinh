import React, { useState } from "react";
import { 
  Search, 
  SlidersHorizontal, 
  PlusCircle, 
  MinusCircle, 
  Utensils, 
  Car, 
  ShoppingBag, 
  Zap, 
  Banknote, 
  Tag, 
  Trash2,
  Calendar,
  Wallet
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Transaction } from "../types";

interface LedgerProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
}

export default function Ledger({ transactions, onDeleteTransaction }: LedgerProps) {
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [swipedId, setSwipedId] = useState<string | null>(null);

  // Helper to format currency in Vietnamese format (divided by 1000, 1000 = 1)
  const formatVND = (num: number) => {
    const valueInK = Math.round(num / 1000);
    return new Intl.NumberFormat("vi-VN").format(valueInK) + "k";
  };

  // Maps category name to lucide icon and pastel colors
  const getCategoryMeta = (category: string) => {
    switch (category) {
      case "Ăn uống":
        return { icon: Utensils, bg: "bg-red-100/80", text: "text-red-700" };
      case "Di chuyển":
        return { icon: Car, bg: "bg-amber-100/80", text: "text-amber-700" };
      case "Mua sắm":
        return { icon: ShoppingBag, bg: "bg-blue-100/80", text: "text-blue-700" };
      case "Hóa đơn":
        return { icon: Zap, bg: "bg-teal-100/80", text: "text-teal-700" };
      case "Lương":
        return { icon: Banknote, bg: "bg-emerald-100/80", text: "text-emerald-700" };
      default:
        return { icon: Tag, bg: "bg-slate-100/80", text: "text-slate-700" };
    }
  };

  // Filter & Search Logic
  const filteredTransactions = transactions
    .filter((t) => {
      if (filter === "income") return t.type === "income";
      if (filter === "expense") return t.type === "expense";
      return true;
    })
    .filter((t) => 
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Handle simple toggle-swipe to reveal delete on desktop/click
  const handleItemClick = (id: string) => {
    if (swipedId === id) {
      setSwipedId(null);
    } else {
      setSwipedId(id);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* HEADER & SEARCH BAR */}
      <div id="ledger-header" className="space-y-4">
        <div>
          <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">LỊCH SỬ GIAO DỊCH</span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">Sổ Cái Nhật Ký</h1>
        </div>

        {/* Real-time search bar */}
        <div id="ledger-search-box" className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm mô tả, danh mục..."
            className="w-full pl-11 pr-4 py-3.5 bg-white/80 backdrop-blur-sm border border-slate-100 rounded-[22px] text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 placeholder-slate-400 font-medium transition-all shadow-[0_4px_16px_rgba(0,0,0,0.01)]"
          />
        </div>

        {/* Filter Chips (bo góc mềm bấm được) */}
        <div id="filter-chips-row" className="flex items-center gap-2 overflow-x-auto pb-1 select-none">
          {/* Chip All */}
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2.5 rounded-[20px] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              filter === "all"
                ? "bg-slate-900 text-white shadow-[0_6px_16px_rgba(15,23,42,0.15)]"
                : "bg-white border border-slate-100 text-slate-500 hover:bg-slate-50"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Tất cả</span>
          </button>

          {/* Chip Income */}
          <button
            onClick={() => setFilter("income")}
            className={`px-4 py-2.5 rounded-[20px] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              filter === "income"
                ? "bg-slate-900 text-white shadow-[0_6px_16px_rgba(15,23,42,0.15)]"
                : "bg-white border border-slate-100 text-slate-500 hover:bg-slate-50"
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-500" />
            <span>Khoản thu</span>
          </button>

          {/* Chip Expense */}
          <button
            onClick={() => setFilter("expense")}
            className={`px-4 py-2.5 rounded-[20px] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              filter === "expense"
                ? "bg-slate-900 text-white shadow-[0_6px_16px_rgba(15,23,42,0.15)]"
                : "bg-white border border-slate-100 text-slate-500 hover:bg-slate-50"
            }`}
          >
            <MinusCircle className="w-3.5 h-3.5 text-rose-500" />
            <span>Khoản chi</span>
          </button>
        </div>
      </div>

      {/* TRANSACTION LIST WITH LIST ITEM WRAPPERS */}
      <div id="transactions-list-container" className="space-y-3">
        <AnimatePresence initial={false}>
          {filteredTransactions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white/60 border border-slate-100 rounded-[28px] p-8 text-center text-slate-400"
            >
              <Tag className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold">Không tìm thấy giao dịch nào</p>
            </motion.div>
          ) : (
            filteredTransactions.map((transaction) => {
              const { icon: CatIcon, bg, text } = getCategoryMeta(transaction.category);
              const isIncome = transaction.type === "income";
              const isSwiped = swipedId === transaction.id;

              return (
                <div 
                  key={transaction.id}
                  className="relative overflow-hidden rounded-[24px] bg-white border border-slate-100 shadow-[0_4px_16px_rgba(0,0,0,0.01)] transition-all"
                >
                  {/* Underlay delete button that shows on swipe */}
                  <div className="absolute inset-y-0 right-0 w-20 bg-rose-500 flex items-center justify-center">
                    <button
                      id={`btn-delete-tx-${transaction.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteTransaction(transaction.id);
                        setSwipedId(null);
                      }}
                      className="w-full h-full text-white flex flex-col items-center justify-center gap-1 hover:bg-rose-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-5 h-5 animate-pulse" />
                      <span className="text-[10px] font-bold">Xóa</span>
                    </button>
                  </div>

                  {/* Swipeable transaction item card */}
                  <motion.div
                    drag="x"
                    dragConstraints={{ left: -80, right: 0 }}
                    dragElastic={0.1}
                    onDragEnd={(event, info) => {
                      if (info.offset.x < -40) {
                        setSwipedId(transaction.id);
                      } else if (info.offset.x > 30) {
                        setSwipedId(null);
                      }
                    }}
                    animate={{ x: isSwiped ? -80 : 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    onClick={() => handleItemClick(transaction.id)}
                    className="bg-white p-4 flex items-center justify-between cursor-grab active:cursor-grabbing relative z-10"
                  >
                    <div className="flex items-center gap-3.5">
                      {/* Pastel category icon wrapper */}
                      <div className={`w-11 h-11 rounded-full ${bg} ${text} flex items-center justify-center shrink-0`}>
                        <CatIcon className="w-5 h-5" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-slate-800">{transaction.description}</h4>
                          {transaction.isRecurring && (
                            <span className="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.2 rounded-full font-bold">Định kỳ</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                          <span className="flex items-center gap-0.5">
                            <Calendar className="w-3 h-3" />
                            {new Date(transaction.date).toLocaleDateString("vi-VN", { month: "short", day: "numeric" })}
                          </span>
                          <span className="w-1 h-1 bg-slate-200 rounded-full" />
                          <span className="flex items-center gap-0.5">
                            <Wallet className="w-3 h-3" />
                            {transaction.wallet}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-xs font-extrabold ${isIncome ? "text-emerald-600" : "text-rose-500"}`}>
                        {isIncome ? "+" : "-"}{formatVND(transaction.amount)}
                      </span>
                      <span className="block text-[9px] text-slate-400 font-medium mt-0.5">
                        {transaction.category}
                      </span>
                    </div>
                  </motion.div>
                </div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Swipe tip overlay */}
      <div className="text-center text-[10px] text-slate-400 font-semibold italic">
        * Nhấp hoặc vuốt trái giao dịch để xóa nhanh (Swipe-to-delete)
      </div>
    </div>
  );
}
