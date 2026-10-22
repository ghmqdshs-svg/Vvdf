import React from 'react';
import { ShoppingBag, Search, ShieldCheck, Truck, Sparkles, UserCheck } from 'lucide-react';

interface NavbarProps {
  activeTab: 'home' | 'products' | 'tracking';
  setActiveTab: (tab: 'home' | 'products' | 'tracking') => void;
  cartCount: number;
  setIsCartOpen: (open: boolean) => void;
  setIsAdminOpen: (open: boolean) => void;
  isAdminLoggedIn: boolean;
  setIsAdminDashboardOpen: (open: boolean) => void;
  newOrdersCount?: number;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  cartCount,
  setIsCartOpen,
  setIsAdminOpen,
  isAdminLoggedIn,
  setIsAdminDashboardOpen,
  newOrdersCount = 0,
  searchQuery,
  setSearchQuery,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-xs border-b border-rose-100">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-rose-950 to-stone-900 text-amber-100 text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-4">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" /> توصيل سريع لكافة مناطق المملكة
        </span>
        <span className="hidden md:inline">•</span>
        <span className="hidden md:flex items-center gap-1">
          <Truck className="w-3.5 h-3.5 text-amber-300" /> شحن مجاني للطلبات فوق 299 ر.س
        </span>
        <span className="hidden md:inline">•</span>
        <span className="hidden md:flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-300" /> منتجات أصلية 100%
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setActiveTab('home')}
          >
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-rose-200 via-pink-100 to-amber-100 flex items-center justify-center shadow-inner border border-rose-200 group-hover:scale-105 transition-transform">
              <span className="text-xl font-bold text-rose-900 font-serif">لا</span>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-wide text-stone-900 font-serif">لاڤير</h1>
              <p className="text-[10px] tracking-widest text-rose-700 font-semibold uppercase">للعناية الشخصية والجمال</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => setActiveTab('home')}
              className={`text-sm font-medium transition-colors pb-1 border-b-2 ${
                activeTab === 'home'
                  ? 'text-rose-800 border-rose-600 font-bold'
                  : 'text-stone-600 border-transparent hover:text-rose-700'
              }`}
            >
              الرئيسية
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`text-sm font-medium transition-colors pb-1 border-b-2 ${
                activeTab === 'products'
                  ? 'text-rose-800 border-rose-600 font-bold'
                  : 'text-stone-600 border-transparent hover:text-rose-700'
              }`}
            >
              جميع المنتجات
            </button>
            <button
              onClick={() => setActiveTab('tracking')}
              className={`text-sm font-medium transition-colors pb-1 border-b-2 ${
                activeTab === 'tracking'
                  ? 'text-rose-800 border-rose-600 font-bold'
                  : 'text-stone-600 border-transparent hover:text-rose-700'
              }`}
            >
              تتبع الطلب
            </button>
          </nav>

          {/* Actions & Cart */}
          <div className="flex items-center gap-3">
            {/* Search Input (Desktop) */}
            <div className="hidden lg:flex items-center relative">
              <input
                type="text"
                placeholder="ابحثي عن منتج..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 xl:w-64 bg-stone-50 border border-stone-200 rounded-full py-2 pr-9 pl-4 text-xs focus:outline-none focus:ring-2 focus:ring-rose-300 focus:bg-white transition-all text-stone-800"
              />
              <Search className="w-4 h-4 text-stone-400 absolute right-3 pointer-events-none" />
            </div>

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative bg-rose-50 hover:bg-rose-100 text-rose-900 p-2.5 rounded-full transition-colors flex items-center justify-center border border-rose-200"
              title="سلة التسوق"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Admin Access */}
            {isAdminLoggedIn ? (
              <button
                onClick={() => setIsAdminDashboardOpen(true)}
                className="relative bg-stone-900 hover:bg-stone-800 text-amber-200 px-3.5 py-2 rounded-full text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                title="لوحة تحكم الإدارة"
              >
                <UserCheck className="w-4 h-4 text-amber-300" />
                <span className="hidden sm:inline">لوحة الإدارة</span>
                {newOrdersCount > 0 && (
                  <span className="bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full shadow-md animate-pulse">
                    {newOrdersCount} جديد
                  </span>
                )}
              </button>
            ) : (
              <button
                onClick={() => setIsAdminOpen(true)}
                className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-3 py-2 rounded-full text-xs font-medium transition-colors border border-stone-200"
                title="دخول الإدارة"
              >
                دخول الإدارة
              </button>
            )}
          </div>
        </div>

        {/* Mobile Search & Sub-nav */}
        <div className="py-2.5 border-t border-stone-100 flex items-center justify-between md:hidden">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('home')}
              className={`text-xs font-medium ${activeTab === 'home' ? 'text-rose-800 font-bold' : 'text-stone-600'}`}
            >
              الرئيسية
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`text-xs font-medium ${activeTab === 'products' ? 'text-rose-800 font-bold' : 'text-stone-600'}`}
            >
              المنتجات
            </button>
            <button
              onClick={() => setActiveTab('tracking')}
              className={`text-xs font-medium ${activeTab === 'tracking' ? 'text-rose-800 font-bold' : 'text-stone-600'}`}
            >
              تتبع الطلب
            </button>
          </div>
          <div className="relative flex-1 max-w-xs mr-4">
            <input
              type="text"
              placeholder="ابحثي..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-full py-1.5 pr-8 pl-3 text-xs focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
            <Search className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-2 pointer-events-none" />
          </div>
        </div>
      </div>
    </header>
  );
};
