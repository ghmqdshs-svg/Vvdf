import React from 'react';
import { CartItem } from '../types';
import { X, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
}) => {
  if (!isOpen) return null;

  const totalAmount = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shippingFee = totalAmount >= 299 || totalAmount === 0 ? 0 : 25;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-900/60 backdrop-blur-xs">
      <div className="absolute inset-0" onClick={onClose}></div>

      <div className="absolute inset-y-0 left-0 max-w-full flex pr-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className="p-6 border-b border-stone-200 flex items-center justify-between bg-stone-50">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-rose-800" />
              <h2 className="font-bold text-lg text-stone-900 font-serif">سلة التسوق ({cart.length})</h2>
            </div>
            <button
              onClick={onClose}
              className="text-stone-500 hover:text-stone-800 p-2 rounded-full hover:bg-stone-200/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-300 flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <p className="text-stone-600 font-medium text-sm">سلة التسوق فارغة حالياً</p>
                <button
                  onClick={onClose}
                  className="bg-rose-900 text-amber-50 px-6 py-2.5 rounded-full text-xs font-bold"
                >
                  ابدئي التسوق الآن
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.product.id} className="flex gap-4 p-4 rounded-2xl bg-stone-50 border border-stone-200/60 items-center">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-20 h-20 rounded-xl object-cover border border-stone-200"
                  />
                  <div className="flex-1 text-right">
                    <h4 className="font-bold text-stone-900 text-sm line-clamp-1">{item.product.name}</h4>
                    <p className="text-xs font-bold text-rose-900 mt-0.5">{item.product.price.toFixed(2)} ر.س</p>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-stone-300 rounded-lg overflow-hidden bg-white">
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                          className="px-2.5 py-1 text-stone-600 hover:bg-stone-100 font-bold text-xs"
                        >
                          -
                        </button>
                        <span className="px-3 py-1 text-xs font-bold text-stone-900">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                          className="px-2.5 py-1 text-stone-600 hover:bg-stone-100 font-bold text-xs"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => onRemoveItem(item.product.id)}
                        className="text-rose-600 hover:text-rose-800 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                        title="حذف المنتج"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Summary & Checkout */}
          {cart.length > 0 && (
            <div className="p-6 border-t border-stone-200 bg-stone-50 space-y-4">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>مجموع المنتجات:</span>
                  <span className="font-bold text-stone-900">{totalAmount.toFixed(2)} ر.س</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>رسوم الشحن:</span>
                  <span className="font-bold text-stone-900">
                    {shippingFee === 0 ? <span className="text-emerald-600 font-bold">مجاني</span> : `${shippingFee.toFixed(2)} ر.س`}
                  </span>
                </div>
                <div className="pt-2 border-t border-stone-200 flex justify-between text-sm font-black text-stone-900">
                  <span>المجموع الإجمالي:</span>
                  <span className="text-rose-900">{(totalAmount + shippingFee).toFixed(2)} ر.س</span>
                </div>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onProceedToCheckout();
                }}
                className="w-full bg-rose-900 hover:bg-rose-800 text-amber-50 py-3.5 rounded-xl text-sm font-bold shadow-lg flex items-center justify-center gap-2 transition-all"
              >
                <span>إتمام الطلب الآن</span>
                <ArrowRight className="w-4 h-4 rotate-180" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
