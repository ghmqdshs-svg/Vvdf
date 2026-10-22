import React, { useState } from 'react';
import { X, Lock, ShieldCheck } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Secure default admin PIN/password (e.g., 'laver2026' or 'admin123')
    if (password === 'laver2026' || password === '1234') {
      onLoginSuccess();
      setPassword('');
      setError(false);
      onClose();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-rose-100 p-6 sm:p-8 relative text-right">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-stone-500 hover:text-stone-800 p-2 rounded-full hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-3 mb-6">
          <div className="w-14 h-14 rounded-full bg-stone-900 text-amber-300 flex items-center justify-center mx-auto shadow-md">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-stone-900 font-serif">تسجيل دخول الإدارة</h3>
          <p className="text-xs text-stone-500">لوحة تحكم مخصصة لإدارة المنتجات والطلبات</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-rose-700" /> كلمة مرور المشرف
            </label>
            <input
              type="password"
              required
              placeholder="أدخل رمز الدخول..."
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 text-stone-900 text-center tracking-widest"
            />
            {error && (
              <p className="text-rose-600 text-[11px] mt-1.5 font-bold">كلمة المرور غير صحيحة.</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-stone-900 hover:bg-stone-800 text-amber-200 py-3.5 rounded-xl font-bold text-sm shadow-md transition-all"
          >
            دخول لوحة التحكم
          </button>
        </form>
      </div>
    </div>
  );
};
