import React from 'react';
import { Sparkles, Heart, Shield, Award, ArrowRight } from 'lucide-react';

interface HeroProps {
  onExplore: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onExplore }) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-rose-50/80 via-stone-50 to-amber-50/50 py-16 lg:py-24 border-b border-rose-100">
      {/* Decorative blobs */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-rose-200/30 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-100/40 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Text Content */}
          <div className="lg:col-span-7 space-y-6 text-right">
            <div className="inline-flex items-center gap-2 bg-rose-100/80 text-rose-900 px-4 py-1.5 rounded-full text-xs font-bold border border-rose-200 shadow-xs">
              <Sparkles className="w-4 h-4 text-rose-600" />
              <span>إشراقة طبيعية تليق بجمالك</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-stone-900 leading-tight font-serif">
              سر جمالك وعنايتك <br />
              <span className="text-rose-800 relative inline-block">
                الطبيعية الفاخرة
                <span className="absolute bottom-1 right-0 w-full h-2.5 bg-rose-200/60 -z-10 rounded-sm"></span>
              </span>
            </h1>

            <p className="text-stone-600 text-base sm:text-lg max-w-2xl leading-relaxed">
              اكتشفي تشكيلة "لاڤير" الحصرية من منتجات العناية بالبشرة، الشعر، والجسم المستوحاة من أجود المكونات الطبيعية النقية. امنحي بشرتك العناية الفائقة التي تستحقها.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={onExplore}
                className="bg-stone-900 hover:bg-stone-800 text-amber-100 px-8 py-4 rounded-full font-bold text-sm transition-all shadow-lg hover:shadow-xl flex items-center gap-3 group"
              >
                <span>تسوقي المنتجات الآن</span>
                <ArrowRight className="w-4 h-4 group-hover:-translate-x-1 transition-transform rotate-180" />
              </button>
            </div>

            {/* Highlights */}
            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-stone-200/60 mt-8">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-800">
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-stone-900">مكونات طبيعية</h4>
                  <p className="text-[11px] text-stone-500">آمنة ومغذية 100%</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-800">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-stone-900">جودة أصلية</h4>
                  <p className="text-[11px] text-stone-500">مضمونة ومجربة</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-800">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-stone-900">نتائج مضمونة</h4>
                  <p className="text-[11px] text-stone-500">عناية احترافية</p>
                </div>
              </div>
            </div>

          </div>

          {/* Hero Image / Card Gallery */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-gradient-to-tr from-rose-200 to-amber-100">
                <img
                  src="https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=800&auto=format&fit=crop"
                  alt="Laver Care Cosmetics"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>

              {/* Floating Badge */}
              <div className="absolute -bottom-6 -right-6 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-rose-100 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-700">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">خصم حصري لفترة محدودة</p>
                  <p className="text-sm font-bold text-stone-900">شحن مجاني للطلبات الكبرى</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
