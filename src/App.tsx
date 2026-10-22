import React, { useState, useEffect } from 'react';
import { Product, Order, CartItem, Category } from './types';
import { db, handleFirestoreError, OperationType } from './lib/firebase';
import { collection, onSnapshot, addDoc, doc, getDocs, deleteDoc, updateDoc } from 'firebase/firestore';

import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderTracking } from './components/OrderTracking';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminDashboard } from './components/AdminDashboard';
import { Footer } from './components/Footer';

import { Sparkles, Filter, ArrowRight, ShieldCheck, Truck, AlertTriangle } from 'lucide-react';

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'c1', name: 'عناية الرجال', slug: 'mens-care' },
  { id: 'c2', name: 'عناية النساء', slug: 'womens-care' },
  { id: 'c3', name: 'عناية بالبشرة', slug: 'skincare' },
  { id: 'c4', name: 'عناية بالشعر', slug: 'haircare' },
  { id: 'c5', name: 'عناية بالجسم', slug: 'bodycare' },
  { id: 'c6', name: 'عطور ومستحضرات', slug: 'perfumes' },
  { id: 'c7', name: 'مجموعات هدايا', slug: 'sets' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'products' | 'tracking'>('home');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('laver_products');
    return saved ? JSON.parse(saved) : [];
  });
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('laver_categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('laver_orders');
    return saved ? JSON.parse(saved) : [];
  });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [quotaExceeded, setQuotaExceeded] = useState<boolean>(false);

  // Modals
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState<boolean>(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState<boolean>(false);

  // Save to localStorage as backup/fallback cache
  useEffect(() => {
    localStorage.setItem('laver_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('laver_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('laver_orders', JSON.stringify(orders));
  }, [orders]);

  // Firestore real-time sync with fallback
  useEffect(() => {
    let unsubProducts: (() => void) | undefined;
    let unsubCategories: (() => void) | undefined;
    let unsubOrders: (() => void) | undefined;

    try {
      unsubProducts = onSnapshot(
        collection(db, 'products'),
        (snapshot) => {
          const list: Product[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...docSnap.data() } as Product);
          });
          if (list.length > 0) setProducts(list);
        },
        (error) => {
          if (error.message.includes('Quota') || error.message.includes('quota')) {
            setQuotaExceeded(true);
          }
          handleFirestoreError(error, OperationType.LIST, 'products');
        }
      );

      unsubCategories = onSnapshot(
        collection(db, 'categories'),
        (snapshot) => {
          const list: Category[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...docSnap.data() } as Category);
          });
          if (list.length > 0) setCategories(list);
        },
        (error) => {
          if (error.message.includes('Quota') || error.message.includes('quota')) {
            setQuotaExceeded(true);
          }
          handleFirestoreError(error, OperationType.LIST, 'categories');
        }
      );

      unsubOrders = onSnapshot(
        collection(db, 'orders'),
        (snapshot) => {
          const list: Order[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...docSnap.data() } as Order);
          });
          if (list.length > 0) {
            setOrders(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
          }
        },
        (error) => {
          if (error.message.includes('Quota') || error.message.includes('quota')) {
            setQuotaExceeded(true);
          }
          handleFirestoreError(error, OperationType.LIST, 'orders');
        }
      );
    } catch (err) {
      setQuotaExceeded(true);
    }

    return () => {
      if (unsubProducts) unsubProducts();
      if (unsubCategories) unsubCategories();
      if (unsubOrders) unsubOrders();
    };
  }, []);

  // Cart actions
  const handleAddToCart = (product: Product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: Math.min(product.stock, item.quantity + quantity) }
            : item
        );
      } else {
        return [...prev, { product, quantity }];
      }
    });
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveCartItem(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Submit Order with Firestore & local fallback
  const handleSubmitOrder = async (orderDetails: {
    customerName: string;
    phone: string;
    city: string;
    address: string;
    notes: string;
  }) => {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const orderNumber = `LVR-${randomNum}`;
    const totalAmount = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const shippingFee = totalAmount >= 299 ? 0 : 25;

    const newOrderData = {
      orderNumber,
      customerName: orderDetails.customerName,
      phone: orderDetails.phone,
      city: orderDetails.city,
      address: orderDetails.address,
      notes: orderDetails.notes || '',
      items: cart.map((i) => ({
        productId: i.product.id,
        productName: i.product.name,
        price: i.product.price,
        quantity: i.quantity,
        image: i.product.image,
      })),
      totalAmount: totalAmount + shippingFee,
      status: 'new' as const,
      createdAt: new Date().toISOString(),
    };

    try {
      await addDoc(collection(db, 'orders'), newOrderData);
    } catch (err) {
      // Fallback local order
      const localOrder: Order = {
        id: 'local_' + Date.now(),
        ...newOrderData,
      };
      setOrders(prev => [localOrder, ...prev]);
    }

    setCart([]);
    return orderNumber;
  };

  // 6-hour expiration window for products
  const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
  const activeProducts = products.filter((p) => {
    if (!p.createdAt) return true;
    const age = Date.now() - new Date(p.createdAt).getTime();
    return age <= SIX_HOURS_MS;
  });

  // Filtered products list
  const filteredProducts = activeProducts.filter((p) => {
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans selection:bg-rose-200 selection:text-rose-900">
      
      {/* Quota Exceeded Banner */}
      {quotaExceeded && (
        <div className="bg-amber-500 text-stone-950 px-4 py-2 text-center text-xs font-bold flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>تنبيه: تم استنفاد الحد اليومي المجاني لقاعدة البيانات (Firestore Quota). يعمل المتجر حالياً بوضع التخزين المؤقت المحلي.</span>
        </div>
      )}

      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartCount={cart.reduce((sum, i) => sum + i.quantity, 0)}
        setIsCartOpen={setIsCartOpen}
        setIsAdminOpen={() => setIsAdminLoginOpen(true)}
        isAdminLoggedIn={isAdminLoggedIn}
        setIsAdminDashboardOpen={setIsAdminDashboardOpen}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Main Views */}
      <main className="flex-1">
        
        {/* HOME TAB */}
        {activeTab === 'home' && (
          <div>
            <Hero onExplore={() => setActiveTab('products')} />

            {/* Featured Categories (Text Cards) */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
              <div className="text-center space-y-3 mb-12">
                <span className="text-xs font-bold text-rose-800 bg-rose-100 px-3.5 py-1 rounded-full">تشكيلة لاڤير</span>
                <h2 className="text-3xl font-black text-stone-900 font-serif">تسوقي حسب التصنيف</h2>
              </div>

              {categories.length === 0 ? (
                <div className="text-center text-stone-400 text-xs py-8">جاري تحميل الأقسام...</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
                  {categories.map((cat) => (
                    <div
                      key={cat.id || cat.slug}
                      onClick={() => {
                        setSelectedCategory(cat.slug);
                        setActiveTab('products');
                      }}
                      className="bg-white rounded-2xl overflow-hidden shadow-xs hover:shadow-lg transition-all border border-stone-200/80 cursor-pointer group text-center p-6 space-y-2 hover:border-rose-400 hover:bg-rose-50/30"
                    >
                      <h3 className="font-bold text-stone-900 text-sm group-hover:text-rose-900 transition-colors">{cat.name}</h3>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Featured Products Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-stone-200/60">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black text-stone-900 font-serif">أبرز المنتجات المتاحة</h2>
                  <p className="text-stone-500 text-xs mt-1">احدث منتجات العناية والجمال في المتجر</p>
                </div>
                <button
                  onClick={() => setActiveTab('products')}
                  className="text-rose-800 hover:text-rose-900 text-xs font-bold flex items-center gap-1 group"
                >
                  <span>عرض كل المنتجات</span>
                  <ArrowRight className="w-4 h-4 group-hover:-translate-x-1 transition-transform rotate-180" />
                </button>
              </div>

              {products.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center space-y-3 border border-stone-200">
                  <p className="text-stone-600 font-bold text-sm">لا توجد منتجات مضافة حالياً في المتجر.</p>
                  <p className="text-stone-400 text-xs">يمكنك إضافة المنتجات الجديدة عبر لوحة تحكم الإدارة.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {products.slice(0, 4).map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={(p) => handleAddToCart(p, 1)}
                      onViewDetails={(p) => setSelectedProduct(p)}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Why Laver Section */}
            <section className="bg-rose-900 text-amber-50 py-16 mt-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-10">
                <div className="space-y-3">
                  <span className="text-xs font-bold bg-rose-800 text-amber-200 px-3.5 py-1 rounded-full">لماذا تختارين لاڤير؟</span>
                  <h2 className="text-3xl font-black font-serif">معايير جودة لا تفاوض عليها</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-right">
                  <div className="bg-rose-950/60 p-6 rounded-2xl border border-rose-800/60 space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-200 text-rose-950 flex items-center justify-center font-bold text-lg">01</div>
                    <h3 className="font-bold text-base font-serif">مكونات طبيعية 100%</h3>
                    <p className="text-xs text-rose-200/80 leading-relaxed">نختار أجود المستخلصات الطبيعية والعضوية لتغذية بشرتك وشعرك بأمان تام بدون أي مواد ضارة.</p>
                  </div>

                  <div className="bg-rose-950/60 p-6 rounded-2xl border border-rose-800/60 space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-200 text-rose-950 flex items-center justify-center font-bold text-lg">02</div>
                    <h3 className="font-bold text-base font-serif">توصيل سريع وآمن</h3>
                    <p className="text-xs text-rose-200/80 leading-relaxed">نضمن وصول طلبك بحالة مثالية وسريعة لكافة مناطق ومدن المملكة مع خدمة الدفع عند الاستلام.</p>
                  </div>

                  <div className="bg-rose-950/60 p-6 rounded-2xl border border-rose-800/60 space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-200 text-rose-950 flex items-center justify-center font-bold text-lg">03</div>
                    <h3 className="font-bold text-base font-serif">ضمان الجودة والرضا</h3>
                    <p className="text-xs text-rose-200/80 leading-relaxed">جميع منتجاتنا أصلية ومجربة ومصرحة لضمان حصولك على أفضل النتائج الجمالية المضمونة.</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 pb-6 border-b border-stone-200">
              <div>
                <h2 className="text-3xl font-black text-stone-900 font-serif">منتجات العناية والجمال</h2>
                <p className="text-stone-500 text-xs mt-1">تصفحي تشكيلة منتجاتنا الأصلية واختاري ما يناسب روتينك</p>
              </div>

              {/* Category Pills Filter */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                    selectedCategory === 'all' ? 'bg-rose-900 text-amber-50 shadow-md' : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
                  }`}
                >
                  الكل
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id || cat.slug}
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                      selectedCategory === cat.slug
                        ? 'bg-rose-900 text-amber-50 shadow-md'
                        : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-3xl p-16 text-center space-y-4 border border-stone-200">
                <p className="font-bold text-lg text-stone-800">لا توجد منتجات مضافة في هذا القسم حالياً</p>
                <p className="text-xs text-stone-500">يمكنك إضافة منتجات جديدة لهذا القسم عبر لوحة تحكم الإدارة.</p>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                  }}
                  className="bg-rose-900 text-amber-50 px-6 py-2.5 rounded-full text-xs font-bold"
                >
                  عرض جميع المنتجات
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={(p) => handleAddToCart(p, 1)}
                    onViewDetails={(p) => setSelectedProduct(p)}
                  />
                ))}
              </div>
            )}

          </div>
        )}

        {/* TRACKING TAB */}
        {activeTab === 'tracking' && <OrderTracking />}

      </main>

      {/* Footer */}
      <Footer />

      {/* Modals & Drawers */}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveCartItem}
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        onSubmitOrder={handleSubmitOrder}
      />

      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLoginSuccess={() => {
          setIsAdminLoggedIn(true);
          setIsAdminDashboardOpen(true);
        }}
      />

      <AdminDashboard
        isOpen={isAdminDashboardOpen}
        onClose={() => setIsAdminDashboardOpen(false)}
        products={products}
        categories={categories}
        orders={orders}
      />

    </div>
  );
}
