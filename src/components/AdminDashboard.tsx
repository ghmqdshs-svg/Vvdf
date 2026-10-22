import React, { useState } from 'react';
import { Product, Order, Category, OrderStatus } from '../types';
import { X, Package, ShoppingBag, TrendingUp, Plus, Edit3, Trash2, CheckCircle2, Clock, Truck, XCircle, Search, Save, Sparkles, FolderTree, Upload, AlertTriangle, Loader2 } from 'lucide-react';
import { collection, addDoc, setDoc, updateDoc, deleteDoc, doc, getDocs, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

const PRESET_IMAGE_LIBRARY = [
  { name: 'سيروم وعناية البشرة', url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600&auto=format&fit=crop' },
  { name: 'كريم ترطيب', url: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?q=80&w=600&auto=format&fit=crop' },
  { name: 'زيت عضوي', url: 'https://images.unsplash.com/photo-1608248597359-99464303b688?q=80&w=600&auto=format&fit=crop' },
  { name: 'مقشر وعناية', url: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?q=80&w=600&auto=format&fit=crop' },
  { name: 'ماسك الوجه', url: 'https://images.unsplash.com/photo-1567942712661-82b935bfc7f3?q=80&w=600&auto=format&fit=crop' },
  { name: 'مجموعة هدايا', url: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?q=80&w=600&auto=format&fit=crop' },
  { name: 'عطور فاخرة', url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=600&auto=format&fit=crop' },
  { name: 'مستحضرات تجميل', url: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=600&auto=format&fit=crop' },
  { name: 'عناية بالبشرة 2', url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=600&auto=format&fit=crop' },
  { name: 'عناية بالشعر', url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=600&auto=format&fit=crop' },
];

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  categories: Category[];
  orders: Order[];
  onProductSaved?: (product: Product) => void;
  onProductDeleted?: (productId: string) => void;
  onClearAllProducts?: () => void;
  onCategorySaved?: (category: Category) => void;
  onCategoryDeleted?: (categoryId: string) => void;
  onOrderStatusUpdated?: (orderId: string, newStatus: OrderStatus) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  products,
  categories,
  orders,
  onProductSaved,
  onProductDeleted,
  onClearAllProducts,
  onCategorySaved,
  onCategoryDeleted,
  onOrderStatusUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'categories'>('orders');
  const [orderFilter, setOrderFilter] = useState<string>('all');
  const [orderSearch, setOrderSearch] = useState<string>('');

  // Product form state for add/edit
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product> | null>(null);

  // Bulk delete products confirmation state
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  // Category form state for add/edit
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Partial<Category> | null>(null);

  if (!isOpen) return null;

  // Statistics
  const totalOrdersCount = orders.length;
  const newOrdersCount = orders.filter(o => o.status === 'new').length;
  const completedOrdersCount = orders.filter(o => o.status === 'completed').length;
  const totalRevenue = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  // Filter orders
  const filteredOrders = orders.filter(o => {
    const matchesStatus = orderFilter === 'all' || o.status === orderFilter;
    const matchesSearch = 
      o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.phone.includes(orderSearch);
    return matchesStatus && matchesSearch;
  });

  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    onOrderStatusUpdated?.(orderId, newStatus);
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      alert('تم تحديث حالة الطلب بنجاح في قاعدة البيانات.');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
      alert('حدث خطأ أثناء تحديث حالة الطلب.');
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('حجم الصورة كبير جداً. يرجى اختيار صورة أصغر من 2 ميجابايت.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        setCurrentProduct(prev => ({ ...(prev || {}), image: result }));
      };
      reader.onerror = () => {
        alert('فشل قراءة ملف الصورة. يرجى المحاولة مرة أخرى.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const prodCategory = currentProduct?.category || categories[0]?.slug || 'skincare';
    if (!currentProduct?.name || currentProduct?.price === undefined || isNaN(Number(currentProduct.price))) {
      alert('يرجى إدخال اسم المنتج والسعر والتصنيف بشكل صحيح.');
      return;
    }

    try {
      if (currentProduct.id) {
        // Update
        const updatedProd: Product = {
          id: currentProduct.id,
          name: currentProduct.name,
          description: currentProduct.description || '',
          price: Number(currentProduct.price),
          stock: Number(currentProduct.stock || 0),
          category: prodCategory,
          image: currentProduct.image || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=600&auto=format&fit=crop',
          ingredients: currentProduct.ingredients || '',
          createdAt: currentProduct.createdAt || new Date().toISOString(),
        };
        onProductSaved?.(updatedProd);
        const prodRef = doc(db, 'products', currentProduct.id);
        await updateDoc(prodRef, {
          name: updatedProd.name,
          description: updatedProd.description,
          price: updatedProd.price,
          stock: updatedProd.stock,
          category: updatedProd.category,
          image: updatedProd.image,
          ingredients: updatedProd.ingredients,
        });
        alert('تم تعديل المنتج وحفظه بنجاح في قاعدة البيانات.');
      } else {
        // Create
        const newDocRef = doc(collection(db, 'products'));
        const newProd: Product = {
          id: newDocRef.id,
          name: currentProduct.name,
          description: currentProduct.description || '',
          price: Number(currentProduct.price),
          stock: Number(currentProduct.stock || 0),
          category: prodCategory,
          image: currentProduct.image || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=600&auto=format&fit=crop',
          ingredients: currentProduct.ingredients || '',
          createdAt: new Date().toISOString(),
        };
        onProductSaved?.(newProd);
        await setDoc(newDocRef, {
          name: newProd.name,
          description: newProd.description,
          price: newProd.price,
          stock: newProd.stock,
          category: newProd.category,
          image: newProd.image,
          ingredients: newProd.ingredients,
          createdAt: newProd.createdAt,
        });
        alert('تم إضافة المنتج الجديد بنجاح إلى قاعدة البيانات السحابية.');
      }
      setIsEditingProduct(false);
      setCurrentProduct(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'products');
      alert('حدث خطأ أثناء حفظ المنتج في قاعدة البيانات.');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (confirm('هل أنت متأكد من رغبتك في حذف هذا المنتج نهائياً من قاعدة البيانات؟')) {
      onProductDeleted?.(productId);
      try {
        await deleteDoc(doc(db, 'products', productId));
        alert('تم حذف المنتج بنجاح من قاعدة البيانات.');
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `products/${productId}`);
        alert('حدث خطأ أثناء محاولة حذف المنتج. يرجى المحاولة مرة أخرى.');
      }
    }
  };

  const handleDeleteAllProducts = async () => {
    setIsDeletingAll(true);
    try {
      // 1. Optimistic update to clear products instantly in the UI without page refresh
      onClearAllProducts?.();

      // 2. Fetch all products strictly from the 'products' collection
      const productsSnapshot = await getDocs(collection(db, 'products'));

      // 3. Batch delete all documents in 'products' collection
      if (!productsSnapshot.empty) {
        const batch = writeBatch(db);
        let count = 0;
        const commitPromises: Promise<void>[] = [];

        productsSnapshot.docs.forEach((docSnap) => {
          batch.delete(docSnap.ref);
          count++;
          if (count >= 400) {
            commitPromises.push(batch.commit());
            count = 0;
          }
        });

        if (count > 0) {
          commitPromises.push(batch.commit());
        }

        await Promise.all(commitPromises);
      }

      // Also ensure any product items currently in state with an id are cleaned up
      if (products.length > 0) {
        await Promise.all(
          products.map(async (p) => {
            try {
              await deleteDoc(doc(db, 'products', p.id));
            } catch {
              // Ignore already deleted
            }
          })
        );
      }

      setShowDeleteAllConfirm(false);
      alert('تم حذف جميع المنتجات بنجاح وبشكل نهائي من قاعدة البيانات وتحديث المتجر فوراً.\n\nلم يتم المساس بأي من الأقسام أو الطلبات.');
    } catch (error) {
      console.error('Error deleting all products:', error);
      handleFirestoreError(error, OperationType.DELETE, 'products');
      alert('حدث خطأ أثناء محاولة حذف جميع المنتجات من قاعدة البيانات السحابية.');
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCategory?.name) {
      alert('يرجى إدخال اسم القسم');
      return;
    }

    const slug = currentCategory.slug || currentCategory.name.trim().toLowerCase().replace(/\s+/g, '-');

    try {
      if (currentCategory.id) {
        // Update
        const updatedCat: Category = {
          id: currentCategory.id,
          name: currentCategory.name,
          slug,
        };
        onCategorySaved?.(updatedCat);
        const catRef = doc(db, 'categories', currentCategory.id);
        await updateDoc(catRef, {
          name: currentCategory.name,
          slug,
        });
        alert('تم تحديث القسم بنجاح في قاعدة البيانات.');
      } else {
        // Create
        const newCatRef = doc(collection(db, 'categories'));
        const newCat: Category = {
          id: newCatRef.id,
          name: currentCategory.name,
          slug,
        };
        onCategorySaved?.(newCat);
        await setDoc(newCatRef, {
          name: currentCategory.name,
          slug,
        });
        alert('تم إضافة القسم الجديد بنجاح إلى قاعدة البيانات السحابية.');
      }
      setIsEditingCategory(false);
      setCurrentCategory(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'categories');
      alert('حدث خطأ أثناء حفظ القسم في قاعدة البيانات.');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا القسم نهائياً من قاعدة البيانات؟')) {
      onCategoryDeleted?.(categoryId);
      try {
        await deleteDoc(doc(db, 'categories', categoryId));
        alert('تم حذف القسم بنجاح من قاعدة البيانات.');
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `categories/${categoryId}`);
        alert('حدث خطأ أثناء محاولة حذف القسم.');
      }
    }
  };

  const statusBadges: Record<string, { label: string; color: string }> = {
    new: { label: 'طلب جديد', color: 'bg-amber-100 text-amber-800' },
    processing: { label: 'قيد التجهيز', color: 'bg-blue-100 text-blue-800' },
    shipped: { label: 'تم الشحن', color: 'bg-purple-100 text-purple-800' },
    completed: { label: 'مكتمل', color: 'bg-emerald-100 text-emerald-800' },
    cancelled: { label: 'ملغي', color: 'bg-rose-100 text-rose-800' },
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-3xl max-w-6xl w-full h-[92vh] overflow-hidden shadow-2xl border border-stone-200 flex flex-col text-right">
        
        {/* Header */}
        <div className="p-6 bg-stone-950 text-amber-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-900 flex items-center justify-center text-amber-200 font-bold">
              إدارة
            </div>
            <div>
              <h2 className="text-xl font-black font-serif">لوحة تحكم متجر لاڤير</h2>
              <p className="text-xs text-amber-200/70">قاعدة بيانات سحابية مشتركة ومزامنة فورية بين جميع الأجهزة</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-2 rounded-full hover:bg-stone-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-stone-50 border-b border-stone-200">
          <div className="bg-white p-4 rounded-2xl shadow-xs border border-stone-200/60 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-stone-500 block">إجمالي الطلبات</span>
              <span className="text-xl font-black text-stone-900">{totalOrdersCount}</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-xs border border-stone-200/60 flex items-center gap-4 relative">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-stone-500 block">طلبات جديدة</span>
              <span className="text-xl font-black text-amber-700">{newOrdersCount}</span>
            </div>
            {newOrdersCount > 0 && (
              <span className="absolute top-3 left-3 w-3 h-3 rounded-full bg-rose-600 animate-ping"></span>
            )}
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-xs border border-stone-200/60 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-stone-500 block">طلبات مكتملة</span>
              <span className="text-xl font-black text-emerald-700">{completedOrdersCount}</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-xs border border-stone-200/60 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-800 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-stone-500 block">إجمالي المبيعات</span>
              <span className="text-lg font-black text-purple-900">{totalRevenue.toFixed(0)} ر.س</span>
            </div>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-stone-200 px-6 bg-white gap-4">
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-4 px-6 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'orders'
                ? 'border-rose-800 text-rose-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>إدارة الطلبات ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`py-4 px-6 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'products'
                ? 'border-rose-800 text-rose-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>إدارة المنتجات ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`py-4 px-6 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'categories'
                ? 'border-rose-800 text-rose-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            <span>إدارة الأقسام ({categories.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-stone-100/50">
          
          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              
              {/* Filter & Search Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-xs border border-stone-200">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setOrderFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${orderFilter === 'all' ? 'bg-stone-900 text-amber-100' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
                  >
                    الكل ({orders.length})
                  </button>
                  <button
                    onClick={() => setOrderFilter('new')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${orderFilter === 'new' ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
                  >
                    جديدة ({orders.filter(o => o.status === 'new').length})
                  </button>
                  <button
                    onClick={() => setOrderFilter('processing')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${orderFilter === 'processing' ? 'bg-blue-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
                  >
                    قيد التجهيز
                  </button>
                  <button
                    onClick={() => setOrderFilter('shipped')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${orderFilter === 'shipped' ? 'bg-purple-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
                  >
                    تم الشحن
                  </button>
                  <button
                    onClick={() => setOrderFilter('completed')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${orderFilter === 'completed' ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
                  >
                    مكتملة
                  </button>
                </div>

                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="ابحث برقم الطلب أو اسم العميل..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl py-2 pr-9 pl-3 text-xs focus:outline-none focus:ring-2 focus:ring-rose-300"
                  />
                  <Search className="w-4 h-4 text-stone-400 absolute right-3 top-2.5" />
                </div>
              </div>

              {/* Orders List Table */}
              {filteredOrders.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center text-stone-500 border border-stone-200">
                  <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                  <p className="font-bold text-base">لا توجد طلبات مطابقة للبحث</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((order) => (
                    <div key={order.id} className="bg-white p-6 rounded-2xl shadow-xs border border-stone-200 space-y-4">
                      
                      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-stone-100">
                        <div className="flex items-center gap-3">
                          <span className="font-black text-rose-900 text-base font-serif">{order.orderNumber}</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusBadges[order.status]?.color}`}>
                            {statusBadges[order.status]?.label || order.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-stone-400">تحديث الحالة:</span>
                          <select
                            value={order.status}
                            onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                            className="bg-stone-50 border border-stone-300 rounded-xl px-3 py-1.5 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-300"
                          >
                            <option value="new">جديد</option>
                            <option value="processing">قيد التجهيز</option>
                            <option value="shipped">تم الشحن</option>
                            <option value="completed">مكتمل</option>
                            <option value="cancelled">ملغي</option>
                          </select>
                        </div>
                      </div>

                      {/* Customer Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-stone-50 p-4 rounded-xl text-xs text-stone-700">
                        <div>
                          <span className="text-stone-400 block mb-0.5">اسم العميل:</span>
                          <span className="font-bold text-stone-900">{order.customerName}</span>
                        </div>
                        <div>
                          <span className="text-stone-400 block mb-0.5">رقم الجوال:</span>
                          <span className="font-bold text-stone-900 dir-ltr text-right">{order.phone}</span>
                        </div>
                        <div>
                          <span className="text-stone-400 block mb-0.5">العنوان والمدينة:</span>
                          <span className="font-bold text-stone-900">{order.city} - {order.address}</span>
                        </div>
                      </div>

                      {/* Items */}
                      <div>
                        <span className="text-xs font-bold text-stone-700 block mb-2">المنتجات المطلوبة:</span>
                        <div className="flex flex-wrap gap-3">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 bg-stone-50 border border-stone-200/80 px-3 py-1.5 rounded-xl text-xs">
                              <img src={item.image} alt={item.productName} className="w-8 h-8 rounded-lg object-cover" />
                              <span className="font-bold text-stone-900">{item.productName}</span>
                              <span className="text-stone-500">(الكمية: {item.quantity})</span>
                              <span className="font-bold text-rose-900 mr-2">{(item.price * item.quantity).toFixed(2)} ر.س</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-stone-100 flex justify-between items-center text-xs">
                        <span className="text-stone-500">
                          تاريخ الطلب: {order.createdAt ? new Date(order.createdAt).toLocaleString('ar-SA') : 'الآن'}
                        </span>
                        <span className="font-black text-rose-900 text-sm">
                          المجموع: {order.totalAmount.toFixed(2)} ر.س
                        </span>
                      </div>

                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* PRODUCTS TAB */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-lg text-stone-900 font-serif">إدارة منتجات المتجر</h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    العدد الإجمالي: {products.length} منتج مسجل في قاعدة البيانات
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setShowDeleteAllConfirm(true)}
                    disabled={products.length === 0 || isDeletingAll}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                    title="حذف جميع المنتجات دفعة واحدة نهائياً"
                  >
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    <span>حذف جميع المنتجات ({products.length})</span>
                  </button>

                  <button
                    onClick={() => {
                      setCurrentProduct({ category: categories[0]?.slug || 'skincare', stock: 20, price: 100 });
                      setIsEditingProduct(true);
                    }}
                    className="bg-rose-900 hover:bg-rose-800 text-amber-50 px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة منتج جديد</span>
                  </button>
                </div>
              </div>

              {/* Products Table */}
              <div className="bg-white rounded-2xl shadow-xs border border-stone-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-stone-50 text-stone-700 border-b border-stone-200 font-bold">
                      <tr>
                        <th className="p-4">المنتج</th>
                        <th className="p-4">التصنيف</th>
                        <th className="p-4">السعر</th>
                        <th className="p-4">المخزون</th>
                        <th className="p-4 text-center">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {products.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-10 text-center text-stone-400">
                            <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-3">
                              <Package className="w-6 h-6" />
                            </div>
                            <p className="font-bold text-stone-700 text-sm">لا توجد منتجات حالياً في قاعدة البيانات</p>
                            <p className="text-xs text-stone-400 mt-1">تم إفراغ جميع المنتجات، أو لم تقم بإضافة منتجات بعد. انقر على "إضافة منتج جديد" للبدء.</p>
                          </td>
                        </tr>
                      ) : (
                        products.map((product) => {
                          const catObj = categories.find(c => c.slug === product.category);
                          return (
                            <tr key={product.id} className="hover:bg-stone-50/50 transition-colors">
                              <td className="p-4 flex items-center gap-3">
                                <img src={product.image} alt={product.name} className="w-10 h-10 rounded-xl object-cover border border-stone-200" />
                                <div>
                                  <p className="font-bold text-stone-900">{product.name}</p>
                                  <p className="text-[11px] text-stone-400 line-clamp-1">{product.description}</p>
                                </div>
                              </td>
                              <td className="p-4 text-stone-600 font-medium">{catObj ? catObj.name : product.category}</td>
                              <td className="p-4 font-bold text-rose-900">{product.price.toFixed(2)} ر.س</td>
                              <td className="p-4 font-bold text-stone-800">{product.stock}</td>
                              <td className="p-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => {
                                      setCurrentProduct(product);
                                      setIsEditingProduct(true);
                                    }}
                                    className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors"
                                    title="تعديل المنتج"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(product.id)}
                                    className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors"
                                    title="حذف المنتج"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* CATEGORIES TAB */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-stone-900 font-serif">إدارة أقسام المتجر</h3>
                  <p className="text-xs text-stone-500 mt-0.5">أضف وعدّل الأقسام التي تظهر تلقائياً للزوار وفي إضافة المنتجات</p>
                </div>
                <button
                  onClick={() => {
                    setCurrentCategory({ name: '' });
                    setIsEditingCategory(true);
                  }}
                  className="bg-rose-900 hover:bg-rose-800 text-amber-50 px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة قسم جديد</span>
                </button>
              </div>

              <div className="bg-white rounded-2xl shadow-xs border border-stone-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-stone-50 text-stone-700 border-b border-stone-200 font-bold">
                      <tr>
                        <th className="p-4">اسم القسم</th>
                        <th className="p-4">الرمز (Slug)</th>
                        <th className="p-4 text-center">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {categories.map((cat) => (
                        <tr key={cat.id} className="hover:bg-stone-50/50 transition-colors">
                          <td className="p-4 font-bold text-stone-900">{cat.name}</td>
                          <td className="p-4 text-stone-500 dir-ltr text-right font-mono">{cat.slug}</td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  setCurrentCategory(cat);
                                  setIsEditingCategory(true);
                                }}
                                className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors"
                                title="تعديل القسم"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(cat.id)}
                                className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors"
                                title="حذف القسم"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* Add / Edit Product Modal */}
      {isEditingProduct && currentProduct && (
        <div className="fixed inset-0 z-60 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-stone-200 text-right relative">
            <button
              onClick={() => {
                setIsEditingProduct(false);
                setCurrentProduct(null);
              }}
              className="absolute top-4 left-4 text-stone-500 hover:text-stone-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-lg text-stone-900 font-serif">
              {currentProduct.id ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد'}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">اسم المنتج *</label>
                <input
                  type="text"
                  required
                  value={currentProduct.name || ''}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-rose-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">السعر (ر.س) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={currentProduct.price || ''}
                    onChange={(e) => setCurrentProduct({ ...currentProduct, price: parseFloat(e.target.value) })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-rose-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">المخزون *</label>
                  <input
                    type="number"
                    required
                    value={currentProduct.stock || ''}
                    onChange={(e) => setCurrentProduct({ ...currentProduct, stock: parseInt(e.target.value) })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-rose-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">التصنيف / القسم *</label>
                <select
                  value={currentProduct.category || categories[0]?.slug || 'skincare'}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, category: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-rose-300"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.slug}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">صورة المنتج (من جهازك أو مكتبة الصور) *</label>
                
                {/* Device File Picker */}
                <div className="mb-3">
                  <label className="w-full bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 rounded-xl px-4 py-3 text-xs font-bold cursor-pointer flex items-center justify-center gap-2 transition-colors shadow-xs">
                    <Upload className="w-4 h-4 text-rose-800" />
                    <span>اختر صورة من ملفات الجهاز أو ألبوم الصور</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Live Preview */}
                {currentProduct.image && (
                  <div className="mb-3 p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 flex items-center gap-4">
                    <img src={currentProduct.image} alt="معاينة" className="w-14 h-14 rounded-xl object-cover border border-emerald-300 shadow-xs" />
                    <div>
                      <span className="text-xs font-bold text-emerald-800 block">تم اختيار الصورة بنجاح وتجهيزها</span>
                      <span className="text-[11px] text-emerald-600">ستحفظ في قاعدة البيانات وتظهر لجميع الأجهزة</span>
                    </div>
                  </div>
                )}

                <span className="text-[11px] font-bold text-stone-500 block mb-1.5">أو اختر صورة سريعة من مكتبة المتجر الجاهزة:</span>
                <div className="grid grid-cols-5 gap-2 max-h-32 overflow-y-auto p-2 bg-stone-50 rounded-xl border border-stone-200">
                  {PRESET_IMAGE_LIBRARY.map((imgItem, idx) => (
                    <div
                      key={idx}
                      onClick={() => setCurrentProduct({ ...currentProduct, image: imgItem.url })}
                      className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                        currentProduct.image === imgItem.url ? 'border-rose-700 ring-2 ring-rose-300 scale-95 shadow-md' : 'border-transparent hover:border-stone-400'
                      }`}
                      title={imgItem.name}
                    >
                      <img src={imgItem.url} alt={imgItem.name} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">وصف المنتج</label>
                <textarea
                  rows={2}
                  value={currentProduct.description || ''}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, description: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-rose-300"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">المكونات الفعالة</label>
                <input
                  type="text"
                  value={currentProduct.ingredients || ''}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, ingredients: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-rose-300"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-rose-900 hover:bg-rose-800 text-amber-50 py-3 rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ المنتج</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingProduct(false);
                    setCurrentProduct(null);
                  }}
                  className="px-5 bg-stone-200 hover:bg-stone-300 text-stone-700 py-3 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {isEditingCategory && currentCategory && (
        <div className="fixed inset-0 z-60 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-stone-200 text-right relative">
            <button
              onClick={() => {
                setIsEditingCategory(false);
                setCurrentCategory(null);
              }}
              className="absolute top-4 left-4 text-stone-500 hover:text-stone-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-lg text-stone-900 font-serif">
              {currentCategory.id ? 'تعديل القسم' : 'إضافة قسم جديد'}
            </h3>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">اسم القسم *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: عناية البشرة"
                  value={currentCategory.name || ''}
                  onChange={(e) => setCurrentCategory({ ...currentCategory, name: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-rose-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">الرمز (Slug - اختياري)</label>
                <input
                  type="text"
                  placeholder="skincare"
                  value={currentCategory.slug || ''}
                  onChange={(e) => setCurrentCategory({ ...currentCategory, slug: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-rose-300 dir-ltr text-right"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-rose-900 hover:bg-rose-800 text-amber-50 py-3 rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ القسم</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingCategory(false);
                    setCurrentCategory(null);
                  }}
                  className="px-5 bg-stone-200 hover:bg-stone-300 text-stone-700 py-3 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete All Products Confirmation Modal */}
      {showDeleteAllConfirm && (
        <div className="fixed inset-0 z-60 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-200 text-right animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto mb-4 border border-rose-200">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-black text-stone-900 text-center font-serif mb-2">
              تأكيد حذف جميع المنتجات
            </h3>

            <p className="text-xs text-stone-600 text-center leading-relaxed mb-4">
              هل أنت متأكد من رغبتك في حذف <span className="font-bold text-rose-700">جميع المنتجات ({products.length} منتج)</span> دفعة واحدة ونهائياً من قاعدة البيانات السحابية والمتجر؟
            </p>

            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 mb-6 text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-950">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>ضمان أمان البيانات:</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-normal">
                لن يتم حذف أو التأثير على أي قسم من الأقسام، وستبقى جميع الطلبات السابقة والحالية وبيانات العملاء محفوظة بأمان تام في قاعدة البيانات.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleDeleteAllProducts}
                disabled={isDeletingAll}
                className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white py-3 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {isDeletingAll ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري الحذف النهائي...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>نعم، حذف الكل نهائياً</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => !isDeletingAll && setShowDeleteAllConfirm(false)}
                disabled={isDeletingAll}
                className="px-5 bg-stone-100 hover:bg-stone-200 disabled:opacity-50 text-stone-700 py-3 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                إلغاء الأمر
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
