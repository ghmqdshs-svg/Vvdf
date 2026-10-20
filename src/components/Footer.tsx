import React from 'react';
import { Sparkles, Heart, Shield, Truck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-stone-950 text-stone-300 pt-16 pb-12 border-t border-rose-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-stone-800 text-right">
          
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-200/20 flex items-center justify-center border border-rose-800/40">
                <span className="text-lg font-bold text-amber-200 font-serif">لا</span>
              </div>
              <h3 className="text-xl font-bold text-amber-100 font-serif">لاڤير للعناية</h3>
            </div>
            <p className="text-stone-400 text-xs leading-relaxed">
              وجهتك الأولى للعناية الشخصية والجمال الطبيعي. نقدم أجود المنتجات الأصلية المصممة بعناية فائقة لتبرز جمالك الطبيعي.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-bold text-amber-200 mb-4 font-serif">روابط سريعة</h4>
            <ul className="space-y-2 text-xs text-stone-400">
              <li><a href="#home" className="hover:text-amber-100 transition-colors">الرئيسية</a></li>
              <li><a href="#products" className="hover:text-amber-100 transition-colors">جميع المنتجات</a></li>
              <li><a href="#tracking" className="hover:text-amber-100 transition-colors">تتبع الطلب</a></li>
              <li><a href="#admin" className="hover:text-amber-100 transition-colors">دخول الإدارة</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-amber-200 mb-4 font-serif">تصنيفات العناية</h4>
            <ul className="space-y-2 text-xs text-stone-400">
              <li>العناية بالبشرة والنضارة</li>
              <li>زيوت ومنتجات الشعر</li>
              <li>العناية بالجسم والاسترخاء</li>
              <li>العطور ومستحضرات التجميل</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-amber-200 mb-4 font-serif">خدمة العملاء</h4>
            <ul className="space-y-2 text-xs text-stone-400 space-y-2">
              <li className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-300" />
                <span>توصيل سريع لكافة مناطق المملكة</span>
              </li>
              <li className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-300" />
                <span>منتجات أصلية ومضمونة 100%</span>
              </li>
              <li className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-400" />
                <span>خدمة عملاء طوال أيام الأسبوع</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500">
          <p>© {new Date().getFullYear()} متجر لاڤير للعناية الشخصية. جميع الحقوق محفوظة.</p>
          <p className="flex items-center gap-1 mt-2 sm:mt-0">
            صُمم بكل إتقان <Sparkles className="w-3.5 h-3.5 text-amber-300" /> لجمالك وعنايتك
          </p>
        </div>
      </div>
    </footer>
  );
};
