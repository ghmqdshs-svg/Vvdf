import React from 'react';
import { Product } from '../types';
import { ShoppingBag, Eye, CheckCircle2, AlertCircle } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
  categoryMap?: Record<string, string>;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onViewDetails,
  categoryMap = {},
}) => {
  const defaultCategoryNames: Record<string, string> = {
    'mens-care': 'عناية الرجال',
    'womens-care': 'عناية النساء',
    skincare: 'عناية بالبشرة',
    haircare: 'عناية بالشعر',
    bodycare: 'عناية بالجسم',
    perfumes: 'عطور ومستحضرات',
    sets: 'مجموعات هدايا',
  };
  const categoryNames = { ...defaultCategoryNames, ...categoryMap };

  return (
    <div className="bg-white rounded-2xl shadow-xs hover:shadow-xl transition-all duration-300 border border-stone-200/80 overflow-hidden flex flex-col group">
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-stone-100 cursor-pointer" onClick={() => onViewDetails(product)}>
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=600&auto=format&fit=crop';
          }}
        />
        
        {/* Category Tag */}
        <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs text-stone-800 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-xs border border-stone-100">
          {categoryNames[product.category] || product.category}
        </span>

        {/* Stock Badge */}
        <div className="absolute top-3 left-3">
          {product.stock > 0 ? (
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> متوفر
            </span>
          ) : (
            <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> نفد المخزون
            </span>
          )}
        </div>

        {/* Quick View Button Overlay */}
        <div className="absolute inset-0 bg-stone-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(product);
            }}
            className="bg-white text-stone-900 p-2.5 rounded-full shadow-lg hover:bg-stone-50 transition-transform hover:scale-110"
            title="عرض التفاصيل"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 
            className="font-bold text-stone-900 text-base line-clamp-1 mb-1.5 cursor-pointer hover:text-rose-700 transition-colors"
            onClick={() => onViewDetails(product)}
          >
            {product.name}
          </h3>
          <p className="text-stone-500 text-xs line-clamp-2 mb-4 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-400 block">السعر</span>
            <span className="text-lg font-black text-rose-900">{product.price.toFixed(2)} <span className="text-xs font-normal">ر.س</span></span>
          </div>

          <button
            onClick={() => onAddToCart(product)}
            disabled={product.stock <= 0}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
              product.stock > 0
                ? 'bg-rose-900 hover:bg-rose-800 text-amber-50 active:scale-95'
                : 'bg-stone-200 text-stone-400 cursor-not-allowed'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>إضافة للسلة</span>
          </button>
        </div>
      </div>
    </div>
  );
};
