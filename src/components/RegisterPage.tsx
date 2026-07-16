import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { UserPlus, Loader2 } from "lucide-react";
import AppLogo from "./AppLogo";

export default function RegisterPage() {
  const { register } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (username.length < 3) {
      setError("Username phải có ít nhất 3 ký tự");
      return;
    }
    if (password.length < 6) {
      setError("Password phải có ít nhất 6 ký tự");
      return;
    }
    if (password !== confirm) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading(true);
    try {
      await register(username, password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-[#F2F2F7] flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-3">
          <div className="mx-auto flex items-center justify-center">
            <AppLogo size={64} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Tài Chính Cá Nhân
          </h1>
          <p className="text-sm text-slate-500">Thiết lập tài khoản lần đầu</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-[28px] p-6 space-y-4 shadow-lg"
        >
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Tên đăng nhập
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập username"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-[16px] text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Mật khẩu
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ít nhất 6 ký tự"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-[16px] text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Xác nhận mật khẩu
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Nhập lại mật khẩu"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-[16px] text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            />
          </div>

          {error && (
            <p className="text-xs font-semibold text-rose-500 text-center">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white font-bold text-sm py-3.5 rounded-[20px] hover:bg-slate-800 disabled:opacity-50 cursor-pointer transition-all flex items-center justify-center gap-2 shadow-md"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            <span>{loading ? "Đang xử lý..." : "Đăng ký & Bắt đầu"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
