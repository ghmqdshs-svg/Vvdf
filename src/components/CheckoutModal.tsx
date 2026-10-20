import React, { useState } from 'react';
import { CartItem } from '../types';
import { X, CheckCircle2, ShieldCheck, Truck, User, Phone, MapPin, Building } from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onSubmitOrder: (orderDetails: {
    customerName: string;
    phone: string;
    city: string;
    address: string;
    notes: string;
  }) => Promise<string>;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cart,
  onSubmitOrder,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('الرياض');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successOrderNumber, setSuccessOrderNumber] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalAmount = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shippingFee = totalAmount >= 299 ? 0 : 25;
  const finalTotal = totalAmount + shippingFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !phone || !city || !address) {
      alert('يرجى تعبئة جميع الحقول الإجبارية (الاسم، الجوال، المدينة، العنوان)');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderNum = await onSubmitOrder({
        customerName,
        phone,
        city,
        address,
        notes,
      });
      setSuccessOrderNumber(orderNum);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-rose-100 max-h-[90vh] flex flex-col relative">
        
        {/* Header */}
        <div className="p-6 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <h2 className="font-bold text-lg text-stone-900 font-serif">إتمام الطلب (الدفع عند الاستلام)</h2>
          <button
            onClick={onClose}
            className="text-stone-500 hover:text-stone-800 p-2 rounded-full hover:bg-stone-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successOrderNumber ? (
          <div className="p-8 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-stone-900 font-serif">تم استلام طلبك بنجاح!</h3>
              <p className="text-stone-600 text-sm">شكراً لتسوقك من متجر لاڤير للعناية. تم إنشاء طلبك بنجاح.</p>
            </div>

            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 inline-block w-full">
              <span className="text-xs text-stone-500 block mb-1">رقم تتبع الطلب الخاص بك:</span>
              <span className="text-xl font-black text-rose-900 tracking-wider">{successOrderNumber}</span>
              <p className="text-[11px] text-stone-400 mt-1">احتفظ بهذا الرقم لتتبع حالة طلبك في أي وقت.</p>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-rose-900 hover:bg-rose-800 text-amber-50 py-3.5 rounded-xl text-sm font-bold shadow-md"
            >
              العودة إلى المتجر
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-right">
            
            {/* Order Summary Box */}
            <div className="bg-rose-50/60 p-4 rounded-2xl border border-rose-100 space-y-2">
              <div className="flex justify-between text-xs font-bold text-stone-800">
                <span>عدد المنتجات: {cart.reduce((s, i) => s + i.quantity, 0)} منتجات</span>
                <span className="text-rose-900">{finalTotal.toFixed(2)} ر.س (شامل الشامل)</span>
              </div>
              <p className="text-[11px] text-stone-500">الدفع نقدًا عند الاستلام • التوصيل خلال 2-4 أيام عمل</p>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-rose-700" /> الاسم الكريم ثلاثي *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: سارة أحمد العتيبي"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-rose-300 text-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-rose-700" /> رقم الجوال (للتواصل وتأكيد الشحن) *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="05xxxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-rose-300 text-stone-900 text-left dir-ltr"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-rose-700" /> المدينة *
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-rose-300 text-stone-900"
                  >
                    <option value="الرياض">الرياض</option>
                    <option value="جدة">جدة</option>
                    <option value="مكة المكرمة">مكة المكرمة</option>
                    <option value="المدينة المنورة">المدينة المنورة</option>
                    <option value="الدمام">الدمام</option>
                    <option value="الخبر">الخبر</option>
                    <option value="تبوك">تبوك</option>
                    <option value="أبها">أبها</option>
                    <option value="خميس مشيط">خميس مشيط</option>
                    <option value="بريدة">بريدة</option>
                    <option value="حائل">حائل</option>
                    <option value="جازان">جازان</option>
                    <option value="نجران">نجران</option>
                    <option value="أخرى">مدينة أخرى</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-700" /> الحي والعنوان التفصيلي *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="اسم الحي، الشارع، رقم المنزل"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-rose-300 text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">ملاحظات إضافية للتوصيل (اختياري)</label>
                <textarea
                  rows={2}
                  placeholder="أي تعليمات خاصة لمندوب التوصيل..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-rose-300 text-stone-900"
                ></textarea>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-rose-900 hover:bg-rose-800 text-amber-50 py-4 rounded-xl text-sm font-bold shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'جاري إرسال الطلب...' : `تأكيد الطلب (${finalTotal.toFixed(2)} ر.س)`}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
