import React, { useState } from 'react';
import { Product } from '../types';
import { X, ShoppingBag, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  onClose,
  onAddToCart,
}) => {
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-rose-100 flex flex-col md:flex-row relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-10 bg-white/90 hover:bg-white text-stone-700 p-2 rounded-full shadow-md transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Product Image */}
        <div className="md:w-1/2 bg-stone-100 relative min-h-[280px] md:min-h-full">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Product Details */}
        <div className="md:w-1/2 p-6 md:p-8 flex flex-col justify-between text-right">
          <div className="space-y-4">
            <span className="inline-block bg-rose-100 text-rose-800 text-xs font-bold px-3 py-1 rounded-full">
              {product.category}
            </span>

            <h2 className="text-2xl font-black text-stone-900 font-serif">{product.name}</h2>
            
            <div className="text-xl font-black text-rose-900">
              {product.price.toFixed(2)} <span className="text-sm font-normal text-stone-500">ر.س</span>
            </div>

            <p className="text-stone-600 text-sm leading-relaxed">{product.description}</p>

            {product.ingredients && (
              <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/60 space-y-1">
                <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-rose-600" /> أبرز المكونات الفعالة:
                </span>
                <p className="text-xs text-stone-600">{product.ingredients}</p>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-emerald-700 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>متوفر في المخزون (الكمية المتاحة: {product.stock})</span>
            </div>
          </div>

          {/* Quantity & Add to Cart */}
          <div className="pt-6 border-t border-stone-100 space-y-4 mt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-700">الكمية:</span>
              <div className="flex items-center border border-stone-200 rounded-xl overflow-hidden bg-stone-50">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1.5 text-stone-600 hover:bg-stone-200 transition-colors font-bold"
                >
                  -
                </button>
                <span className="px-4 py-1.5 text-xs font-bold text-stone-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="px-3 py-1.5 text-stone-600 hover:bg-stone-200 transition-colors font-bold"
                >
                  +
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                onAddToCart(product, quantity);
                onClose();
              }}
              disabled={product.stock <= 0}
              className={`w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
                product.stock > 0
                  ? 'bg-rose-900 hover:bg-rose-800 text-amber-50 active:scale-98'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>إضافة إلى السلة ({ (product.price * quantity).toFixed(2) } ر.س)</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
