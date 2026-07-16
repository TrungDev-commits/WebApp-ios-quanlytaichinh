import React, { useEffect, useState } from "react";
import { ScanFace, Check, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface FaceIDVerificationProps {
  isOpen: boolean;
  onSuccess: () => void;
  onCancel: () => void;
  isSettingsActivation?: boolean;
}

export default function FaceIDVerification({
  isOpen,
  onSuccess,
  onCancel,
  isSettingsActivation = false
}: FaceIDVerificationProps) {
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'success' | 'failed'>('idle');

  useEffect(() => {
    if (isOpen) {
      setScanState('scanning');
      // Simulate real face scanning timeline
      const scanTimer = setTimeout(() => {
        setScanState('success');
        const successTimer = setTimeout(() => {
          onSuccess();
        }, 1000);
        return () => clearTimeout(successTimer);
      }, 1500);

      return () => clearTimeout(scanTimer);
    } else {
      setScanState('idle');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Deep glass blurred underlay backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xl"
        />

        {/* Squircle faceID scanner card */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.85, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 250 }}
          className="relative w-72 bg-white/90 border border-white/60 rounded-[32px] p-6 text-center shadow-[0_24px_64px_rgba(0,0,0,0.15)] flex flex-col items-center justify-center space-y-6 z-10"
        >
          <div className="space-y-1">
            <h3 className="text-sm font-black text-slate-800 tracking-tight">FaceID Verification</h3>
            <p className="text-[10px] text-slate-400 font-bold">
              {isSettingsActivation ? "Đang xác thực để cài đặt" : "Xác thực bảo mật iOS 26.4"}
            </p>
          </div>

          {/* Pulsing scanning circle graphic */}
          <div className="relative w-28 h-28 flex items-center justify-center">
            {scanState === 'scanning' && (
              <>
                <span className="absolute inset-0 rounded-full border-2 border-slate-900 animate-ping opacity-25" />
                <span className="absolute inset-2 rounded-full border border-slate-900 animate-pulse opacity-40" />
              </>
            )}

            <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 shadow-md ${
              scanState === 'success' 
                ? "bg-emerald-500 text-white" 
                : "bg-slate-50 text-slate-900 border border-slate-100"
            }`}>
              {scanState === 'success' ? (
                <Check className="w-10 h-10 animate-bounce" />
              ) : (
                <ScanFace className="w-10 h-10 animate-pulse" />
              )}
            </div>
          </div>

          <div className="text-xs font-bold text-slate-700 min-h-[20px]">
            {scanState === 'scanning' && "Đang quét khuôn mặt..."}
            {scanState === 'success' && "Xác thực thành công!"}
          </div>

          <button
            onClick={onCancel}
            className="text-[10px] text-slate-400 font-bold hover:text-slate-600 cursor-pointer uppercase tracking-wider pt-2"
          >
            Hủy xác thực
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
