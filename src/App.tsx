import React, { useState, useEffect } from "react";
import { Lock, Smartphone, ShieldCheck, HelpCircle, Loader2, LogOut, User } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import Ledger from "./components/Ledger";
import QuickAddModal from "./components/QuickAddModal";
import FinanceBudget from "./components/FinanceBudget";
import AICovisor from "./components/AICovisor";
import FaceIDVerification from "./components/FaceIDVerification";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import { useTransactions } from "./hooks/useTransactions";
import { useBudgets } from "./hooks/useBudgets";
import { useDebts } from "./hooks/useDebts";
import { useSavings } from "./hooks/useSavings";
import { Transaction, Budget, Debt, SavingsGoal } from "./types";

function AppContent() {
  const { isAuthenticated, loading: authLoading, username, logout } = useAuth();

  const [currentTab, setCurrentTab] = useState<number>(1);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState<boolean>(false);

  const { transactions, loading: txLoading, addTransaction, deleteTransaction } = useTransactions();
  const { budgets, loading: budgetLoading, updateBudgetLimit } = useBudgets();
  const { debts, loading: debtLoading, addDebt, deleteDebt, payDebtInstallment } = useDebts();
  const { savings, loading: saveLoading, updateSavings } = useSavings();

  const isInitialLoading = txLoading || budgetLoading || debtLoading || saveLoading;

  const [faceIdEnabled, setFaceIdEnabled] = useState<boolean>(false);
  const [isFaceIdScanning, setIsFaceIdScanning] = useState<boolean>(false);
  const [appLocked, setAppLocked] = useState<boolean>(false);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && faceIdEnabled) {
        setAppLocked(true);
        setIsFaceIdScanning(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [faceIdEnabled]);

  const triggerFaceIdToggleScan = () => setIsFaceIdScanning(true);

  const handleFaceIdSuccess = () => {
    setIsFaceIdScanning(false);
    setAppLocked(false);
    if (!faceIdEnabled) setFaceIdEnabled(true);
  };

  const handleAddTransaction = async (newTx: Omit<Transaction, "id">) => {
    try { await addTransaction(newTx); }
    catch (err: any) { alert("Lỗi khi thêm giao dịch: " + err.message); }
  };

  const handleDeleteTransaction = async (id: string) => {
    try { await deleteTransaction(id); }
    catch (err: any) { alert("Lỗi khi xóa giao dịch: " + err.message); }
  };

  const handleUpdateSavings = async (amount: number) => {
    try { await updateSavings(amount); }
    catch (err: any) { alert("Lỗi cập nhật quỹ tiết kiệm: " + err.message); }
  };

  const handleUpdateBudgetLimit = async (category: string, newLimit: number) => {
    try { await updateBudgetLimit(category, newLimit); }
    catch (err: any) { alert("Lỗi cập nhật ngân sách: " + err.message); }
  };

  const handlePayDebtInstallment = async (debtId: string, installmentIndex: number) => {
    try { await payDebtInstallment(debtId, installmentIndex); }
    catch (err: any) { alert("Lỗi thanh toán: " + err.message); }
  };

  const handleAddDebt = async (newDebt: Omit<Debt, "id">) => {
    try { await addDebt(newDebt); }
    catch (err: any) { alert("Lỗi thêm công nợ: " + err.message); }
  };

  const handleDeleteDebt = async (id: string) => {
    try { await deleteDebt(id); }
    catch (err: any) { alert("Lỗi xóa công nợ: " + err.message); }
  };

  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('.no-swipe') || 
      target.closest('[drag]') || 
      target.closest('button') || 
      target.closest('input') || 
      target.closest('select') || 
      target.closest('textarea') ||
      target.closest('a')
    ) { return; }
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchStartY(e.targetTouches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null) return;
    const diffX = touchStartX - e.changedTouches[0].clientX;
    const diffY = touchStartY - e.changedTouches[0].clientY;
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 60) {
      const tabSequence = [1, 2, 4, 5];
      const currentIndex = tabSequence.indexOf(currentTab);
      if (diffX > 0 && currentIndex < tabSequence.length - 1) setCurrentTab(tabSequence[currentIndex + 1]);
      else if (diffX < 0 && currentIndex > 0) setCurrentTab(tabSequence[currentIndex - 1]);
    }
    setTouchStartX(null);
    setTouchStartY(null);
  };

  // Auth loading
  if (authLoading) {
    return (
      <div className="h-screen bg-[#F2F2F7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  // Not authenticated — check if any user exists
  if (!isAuthenticated) {
    return <AuthRouter />;
  }

  return (
    <div className="h-screen bg-[#F2F2F7] flex flex-col justify-between select-none overflow-hidden">
      {/* iOS Status Bar — thêm nút logout */}
      <div className="w-full max-w-md mx-auto bg-white/70 backdrop-blur-md border-b border-slate-200/30 px-6 py-3 flex items-center justify-between text-xs font-bold text-slate-500 shrink-0 z-10">
        <div className="flex items-center gap-1.5">
          <Smartphone className="w-3.5 h-3.5" />
          <span>iOS 26.4</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
            <User className="w-3 h-3" />
            <span>{username}</span>
          </div>
          {faceIdEnabled && (
            <button 
              onClick={() => { setAppLocked(true); setIsFaceIdScanning(true); }}
              className="flex items-center gap-1 text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md hover:bg-slate-200 transition-colors text-[10px] font-black cursor-pointer"
              title="Khóa thủ công"
            >
              <Lock className="w-3 h-3 text-slate-900" />
              <span>Khóa</span>
            </button>
          )}
          <button
            onClick={logout}
            className="flex items-center gap-1 text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md hover:bg-rose-100 transition-colors text-[10px] font-black cursor-pointer"
            title="Đăng xuất"
          >
            <LogOut className="w-3 h-3" />
            <span>Thoát</span>
          </button>
          <span className="text-slate-400 font-extrabold">2026-07-15</span>
        </div>
      </div>

      <main 
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="flex-1 w-full max-w-md mx-auto px-5 pt-4 pb-28 overflow-y-auto relative"
      >
        {appLocked ? (
          <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-4">
            <div className="p-4 bg-slate-100 rounded-full animate-pulse text-slate-400">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Ứng dụng đang được khóa bảo mật</h3>
            <p className="text-xs text-slate-400 max-w-xs">Vui lòng sử dụng FaceID để xác thực lại.</p>
            <button
              onClick={() => setIsFaceIdScanning(true)}
              className="mt-2 bg-slate-900 text-white font-bold text-xs px-5 py-2.5 rounded-full shadow-sm hover:bg-slate-800 cursor-pointer"
            >
              Xác thực FaceID
            </button>
          </div>
        ) : isInitialLoading ? (
          <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-4">
            <Loader2 className="w-10 h-10 text-slate-400 animate-spin" />
            <p className="text-sm font-semibold text-slate-500">Đang tải dữ liệu...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTab}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="h-full"
            >
              {currentTab === 1 && (
                <Dashboard
                  transactions={transactions}
                  debts={debts}
                  faceIdEnabled={faceIdEnabled}
                  toggleFaceId={triggerFaceIdToggleScan}
                  triggerFaceIdScan={triggerFaceIdToggleScan}
                  onNavigateToTab={setCurrentTab}
                />
              )}
              {currentTab === 2 && (
                <Ledger
                  transactions={transactions}
                  onDeleteTransaction={handleDeleteTransaction}
                />
              )}
              {currentTab === 4 && (
                <FinanceBudget
                  budgets={budgets}
                  debts={debts}
                  savings={savings}
                  onUpdateSavings={handleUpdateSavings}
                  onUpdateBudgetLimit={handleUpdateBudgetLimit}
                  onPayDebtInstallment={handlePayDebtInstallment}
                  onAddDebt={handleAddDebt}
                  onDeleteDebt={handleDeleteDebt}
                />
              )}
              {currentTab === 5 && (
                <AICovisor
                  transactions={transactions}
                  budgets={budgets}
                  debts={debts}
                  savings={savings}
                />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {!appLocked && (
        <Navbar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          onOpenQuickAdd={() => setIsQuickAddOpen(true)}
        />
      )}

      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onAddTransaction={handleAddTransaction}
      />

      <FaceIDVerification
        isOpen={isFaceIdScanning}
        onSuccess={handleFaceIdSuccess}
        onCancel={() => setIsFaceIdScanning(false)}
        isSettingsActivation={!faceIdEnabled}
      />
    </div>
  );
}

function AuthRouter() {
  const [hasUser, setHasUser] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/.netlify/functions/auth')
      .then(r => r.json())
      .then(data => setHasUser(data.hasUser))
      .catch(() => setHasUser(false));
  }, []);

  if (hasUser === null) {
    return (
      <div className="h-screen bg-[#F2F2F7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  return hasUser ? <LoginPage /> : <RegisterPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
