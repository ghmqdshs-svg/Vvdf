import React, { useState } from 'react';
import { Order } from '../types';
import { Search, Package, Clock, Truck, CheckCircle2, XCircle, AlertCircle, Phone, Hash } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

export const OrderTracking: React.FC = () => {
  const [orderNumberInput, setOrderNumberInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumberInput.trim() || !phoneInput.trim()) {
      alert('يرجى إدخال رقم الطلب ورقم الجوال');
      return;
    }

    setIsLoading(true);
    setNotFound(false);
    setSearchedOrder(null);

    try {
      const q = query(
        collection(db, 'orders'),
        where('orderNumber', '==', orderNumberInput.trim().toUpperCase())
      );
      const snapshot = await getDocs(q);
      
      let found: Order | null = null;
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Order;
        if (data.phone.trim() === phoneInput.trim()) {
          found = { ...data, id: docSnap.id };
        }
      });

      if (found) {
        setSearchedOrder(found);
      } else {
        setNotFound(true);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    } finally {
      setIsLoading(false);
    }
  };

  const statusInfo: Record<string, { label: string; color: string; icon: any; step: number }> = {
    new: { label: 'طلب جديد (قيد المراجعة)', color: 'bg-amber-50 text-amber-800 border-amber-200', icon: Clock, step: 1 },
    processing: { label: 'قيد التجهيز والتغليف', color: 'bg-blue-50 text-blue-800 border-blue-200', icon: Package, step: 2 },
    shipped: { label: 'تم الشحن (مع مندوب التوصيل)', color: 'bg-purple-50 text-purple-800 border-purple-200', icon: Truck, step: 3 },
    completed: { label: 'مكتمل (تم التسليم)', color: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: CheckCircle2, step: 4 },
    cancelled: { label: 'ملغي', color: 'bg-rose-50 text-rose-800 border-rose-200', icon: XCircle, step: 0 },
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-right">
      <div className="text-center space-y-3 mb-10">
        <h2 className="text-3xl font-black text-stone-900 font-serif">تتبع حالة طلبك</h2>
        <p className="text-stone-600 text-sm max-w-md mx-auto">
          أدخل رقم الطلب ورقم الجوال المسجل في الطلب لمعرفة أحدث مستجدات التجهيز والشحن بكل سهولة.
        </p>
      </div>

      {/* Search Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-rose-100 max-w-xl mx-auto mb-10">
        <form onSubmit={handleTrack} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
              <Hash className="w-4 h-4 text-rose-700" /> رقم الطلب (مثال: LVR-12345)
            </label>
            <input
              type="text"
              required
              placeholder="LVR-XXXXX"
              value={orderNumberInput}
              onChange={(e) => setOrderNumberInput(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm font-bold uppercase focus:outline-none focus:ring-2 focus:ring-rose-300 text-stone-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-rose-700" /> رقم الجوال المسجل
            </label>
            <input
              type="tel"
              required
              placeholder="05xxxxxxxx"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-rose-300 text-stone-900 text-left dir-ltr"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-rose-900 hover:bg-rose-800 text-amber-50 py-3.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>{isLoading ? 'جاري البحث...' : 'بحث وتتبع الطلب'}</span>
          </button>
        </form>
      </div>

      {/* Not Found Alert */}
      {notFound && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center max-w-xl mx-auto space-y-2">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
          <h4 className="font-bold text-stone-900 text-base">لم يتم العثور على الطلب</h4>
          <p className="text-xs text-stone-600">تأكد من صحة رقم الطلب ورقم الجوال المدخل ومحاولة مرة أخرى.</p>
        </div>
      )}

      {/* Searched Order Result */}
      {searchedOrder && (
        <div className="bg-white rounded-3xl shadow-xl border border-stone-200 overflow-hidden max-w-2xl mx-auto space-y-6 p-6 sm:p-8">
          
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-stone-100">
            <div>
              <span className="text-xs text-stone-400">رقم الطلب</span>
              <h3 className="text-xl font-black text-rose-900 font-serif">{searchedOrder.orderNumber}</h3>
            </div>
            <div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusInfo[searchedOrder.status]?.color}`}>
                {React.createElement(statusInfo[searchedOrder.status]?.icon || Clock, { className: 'w-4 h-4' })}
                <span>{statusInfo[searchedOrder.status]?.label || searchedOrder.status}</span>
              </span>
            </div>
          </div>

          {/* Customer & Shipping info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-stone-50 p-4 rounded-2xl text-xs text-stone-700">
            <div>
              <span className="text-stone-400 block mb-0.5">اسم العميل:</span>
              <span className="font-bold text-stone-900">{searchedOrder.customerName}</span>
            </div>
            <div>
              <span className="text-stone-400 block mb-0.5">رقم الجوال:</span>
              <span className="font-bold text-stone-900 dir-ltr text-right">{searchedOrder.phone}</span>
            </div>
            <div>
              <span className="text-stone-400 block mb-0.5">المدينة والعنوان:</span>
              <span className="font-bold text-stone-900">{searchedOrder.city} - {searchedOrder.address}</span>
            </div>
            <div>
              <span className="text-stone-400 block mb-0.5">تاريخ الطلب:</span>
              <span className="font-bold text-stone-900">
                {searchedOrder.createdAt ? new Date(searchedOrder.createdAt).toLocaleDateString('ar-SA') : 'حديث'}
              </span>
            </div>
          </div>

          {/* Items list */}
          <div className="space-y-3">
            <h4 className="font-bold text-stone-900 text-sm">المنتجات المطلوبة:</h4>
            <div className="space-y-2">
              {searchedOrder.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between bg-stone-50/60 p-3 rounded-xl border border-stone-100 text-xs">
                  <div className="flex items-center gap-3">
                    <img src={item.image} alt={item.productName} className="w-12 h-12 rounded-lg object-cover" />
                    <div>
                      <p className="font-bold text-stone-900">{item.productName}</p>
                      <p className="text-stone-500">الكمية: {item.quantity}</p>
                    </div>
                  </div>
                  <span className="font-bold text-rose-900">{(item.price * item.quantity).toFixed(2)} ر.س</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-stone-100 flex justify-between font-bold text-sm text-stone-900">
              <span>المجموع الإجمالي:</span>
              <span className="text-rose-900 text-base">{searchedOrder.totalAmount.toFixed(2)} ر.س</span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
