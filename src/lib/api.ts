import { Product, Category, Order, OrderStatus } from '../types';
import { db } from './firebase';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  getDocs,
  query,
  where
} from 'firebase/firestore';

// Detect base URL dynamically so it works in localhost, preview domains, local network IPs, or production
const getApiBase = () => {
  return '';
};

// --- Real-time Sync Hub ---
type ListenerCallback = (type: 'products' | 'categories' | 'orders') => void;
const listeners: Set<ListenerCallback> = new Set();

let eventSource: EventSource | null = null;
let pollInterval: any = null;

export function subscribeToStoreUpdates(callback: ListenerCallback) {
  listeners.add(callback);

  // Initialize SSE if in browser and not already listening
  if (typeof window !== 'undefined' && !eventSource) {
    try {
      eventSource = new EventSource(`${getApiBase()}/api/events`);
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'products' || data.type === 'categories' || data.type === 'orders') {
            listeners.forEach((cb) => cb(data.type));
          } else if (data.type === 'all') {
            listeners.forEach((cb) => {
              cb('products');
              cb('categories');
              cb('orders');
            });
          }
        } catch (e) {
          console.warn('SSE parse error:', e);
        }
      };

      eventSource.onerror = () => {
        // SSE disconnected, fallback to periodic polling every 4 seconds to guarantee sync
        if (!pollInterval) {
          pollInterval = setInterval(() => {
            listeners.forEach((cb) => {
              cb('products');
              cb('categories');
              cb('orders');
            });
          }, 4000);
        }
      };

      eventSource.onopen = () => {
        if (pollInterval) {
          clearInterval(pollInterval);
          pollInterval = null;
        }
      };
    } catch {
      // If SSE unsupported, use gentle polling
      if (!pollInterval) {
        pollInterval = setInterval(() => {
          listeners.forEach((cb) => {
            cb('products');
            cb('categories');
            cb('orders');
          });
        }, 5000);
      }
    }
  }

  return () => {
    listeners.delete(callback);
  };
}

// --- PRODUCTS API ---
export async function fetchProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${getApiBase()}/api/products`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.products)) {
        return data.products;
      }
    }
  } catch (err) {
    console.warn('Server fetchProducts failed, checking fallback:', err);
  }

  // Fallback to Firestore if server is unreachable
  try {
    const snap = await getDocs(collection(db, 'products'));
    const list: Product[] = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Product));
    if (list.length > 0) return list;
  } catch {
    // Ignore fallback error
  }

  // Fallback to local storage
  try {
    const saved = localStorage.getItem('laver_products');
    if (saved) return JSON.parse(saved);
  } catch {}

  return [];
}

export async function saveProductApi(product: Partial<Product>): Promise<Product> {
  // If product has ID, PUT; otherwise POST
  const isUpdate = !!product.id;
  const url = isUpdate ? `${getApiBase()}/api/products/${product.id}` : `${getApiBase()}/api/products`;
  const method = isUpdate ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.product) {
        // Also mirror to Firestore in background if possible
        mirrorProductToFirestore(data.product);
        return data.product;
      }
    }
  } catch (err) {
    console.warn('API saveProduct failed, fallback to direct Firestore:', err);
  }

  // Fallback Firestore write
  const targetId = product.id || `prod_${Date.now()}`;
  const completeProduct: Product = {
    id: targetId,
    name: product.name || '',
    description: product.description || '',
    price: Number(product.price || 0),
    stock: Number(product.stock || 0),
    category: product.category || 'skincare',
    image: product.image || '',
    ingredients: product.ingredients || '',
    createdAt: product.createdAt || new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'products', targetId), completeProduct);
  } catch {}

  return completeProduct;
}

export async function deleteProductApi(productId: string): Promise<boolean> {
  try {
    const res = await fetch(`${getApiBase()}/api/products/${productId}`, { method: 'DELETE' });
    if (res.ok) {
      mirrorProductDeleteFromFirestore(productId);
      return true;
    }
  } catch (err) {
    console.warn('API deleteProduct failed:', err);
  }

  try {
    await deleteDoc(doc(db, 'products', productId));
    return true;
  } catch {
    return false;
  }
}

export async function deleteAllProductsApi(): Promise<boolean> {
  try {
    const res = await fetch(`${getApiBase()}/api/products`, { method: 'DELETE' });
    if (res.ok) {
      // Also clean up Firestore products collection in background
      cleanFirestoreProducts();
      return true;
    }
  } catch (err) {
    console.warn('API deleteAllProducts failed:', err);
  }

  return cleanFirestoreProducts();
}

export async function restoreDefaultProductsApi(): Promise<Product[]> {
  try {
    const res = await fetch(`${getApiBase()}/api/products/restore-defaults`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      return data.products || [];
    }
  } catch (err) {
    console.warn('API restoreDefaultProducts failed:', err);
  }
  return [];
}

// --- CATEGORIES API ---
export async function fetchCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${getApiBase()}/api/categories`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.categories) && data.categories.length > 0) {
        return data.categories;
      }
    }
  } catch (err) {
    console.warn('API fetchCategories failed:', err);
  }

  try {
    const snap = await getDocs(collection(db, 'categories'));
    const list: Category[] = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Category));
    if (list.length > 0) return list;
  } catch {}

  return [];
}

export async function saveCategoryApi(category: Partial<Category>): Promise<Category> {
  const isUpdate = !!category.id;
  const url = isUpdate ? `${getApiBase()}/api/categories/${category.id}` : `${getApiBase()}/api/categories`;
  const method = isUpdate ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.category) {
        mirrorCategoryToFirestore(data.category);
        return data.category;
      }
    }
  } catch (err) {
    console.warn('API saveCategory failed:', err);
  }

  const targetId = category.id || `cat_${Date.now()}`;
  const completeCat: Category = {
    id: targetId,
    name: category.name || '',
    slug: category.slug || (category.name || '').toLowerCase().replace(/\s+/g, '-'),
  };

  try {
    await setDoc(doc(db, 'categories', targetId), completeCat);
  } catch {}

  return completeCat;
}

export async function deleteCategoryApi(categoryId: string): Promise<boolean> {
  try {
    const res = await fetch(`${getApiBase()}/api/categories/${categoryId}`, { method: 'DELETE' });
    if (res.ok) {
      mirrorCategoryDeleteFromFirestore(categoryId);
      return true;
    }
  } catch (err) {
    console.warn('API deleteCategory failed:', err);
  }

  try {
    await deleteDoc(doc(db, 'categories', categoryId));
    return true;
  } catch {
    return false;
  }
}

// --- ORDERS API ---
export async function fetchOrders(): Promise<Order[]> {
  try {
    const res = await fetch(`${getApiBase()}/api/orders`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.orders)) {
        return data.orders;
      }
    }
  } catch (err) {
    console.warn('API fetchOrders failed:', err);
  }

  try {
    const snap = await getDocs(collection(db, 'orders'));
    const list: Order[] = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Order));
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch {}

  return [];
}

export async function createOrderApi(orderData: Partial<Order>): Promise<Order> {
  try {
    const res = await fetch(`${getApiBase()}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.order) {
        mirrorOrderToFirestore(data.order);
        return data.order;
      }
    }
  } catch (err) {
    console.warn('API createOrder failed:', err);
  }

  const orderId = orderData.id || `ord_${Date.now()}`;
  const fullOrder: Order = {
    id: orderId,
    orderNumber: orderData.orderNumber || `LVR-${Math.floor(10000 + Math.random() * 90000)}`,
    customerName: orderData.customerName || '',
    phone: orderData.phone || '',
    city: orderData.city || '',
    address: orderData.address || '',
    notes: orderData.notes || '',
    items: orderData.items || [],
    totalAmount: Number(orderData.totalAmount || 0),
    status: orderData.status || 'new',
    createdAt: orderData.createdAt || new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'orders', orderId), fullOrder);
  } catch {}

  return fullOrder;
}

export async function updateOrderStatusApi(orderId: string, status: OrderStatus): Promise<boolean> {
  try {
    const res = await fetch(`${getApiBase()}/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      mirrorOrderStatusToFirestore(orderId, status);
      return true;
    }
  } catch (err) {
    console.warn('API updateOrderStatus failed:', err);
  }

  try {
    await updateDoc(doc(db, 'orders', orderId), {
      status,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch {
    return false;
  }
}

export async function trackOrderApi(orderNumber: string, phone: string): Promise<Order | null> {
  const cleanNum = orderNumber.trim().toUpperCase();
  const cleanPhone = phone.trim();

  try {
    const res = await fetch(
      `${getApiBase()}/api/orders/track?orderNumber=${encodeURIComponent(cleanNum)}&phone=${encodeURIComponent(cleanPhone)}`
    );
    if (res.ok) {
      const data = await res.json();
      if (data.order) return data.order;
    }
  } catch (err) {
    console.warn('API trackOrder failed:', err);
  }

  // Fallback to Firestore lookup
  try {
    const q = query(collection(db, 'orders'), where('orderNumber', '==', cleanNum));
    const snap = await getDocs(q);
    let matched: Order | null = null;
    snap.forEach((d) => {
      const ord = { id: d.id, ...d.data() } as Order;
      if (ord.phone.trim() === cleanPhone) {
        matched = ord;
      }
    });
    if (matched) return matched;
  } catch {}

  return null;
}

// Background helpers that silently attempt Firestore sync without blocking
async function mirrorProductToFirestore(prod: Product) {
  try {
    await setDoc(doc(db, 'products', prod.id), prod);
  } catch {}
}

async function mirrorProductDeleteFromFirestore(prodId: string) {
  try {
    await deleteDoc(doc(db, 'products', prodId));
  } catch {}
}

async function cleanFirestoreProducts(): Promise<boolean> {
  try {
    const snap = await getDocs(collection(db, 'products'));
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
    return true;
  } catch {
    return false;
  }
}

async function mirrorCategoryToFirestore(cat: Category) {
  try {
    await setDoc(doc(db, 'categories', cat.id), cat);
  } catch {}
}

async function mirrorCategoryDeleteFromFirestore(catId: string) {
  try {
    await deleteDoc(doc(db, 'categories', catId));
  } catch {}
}

async function mirrorOrderToFirestore(ord: Order) {
  try {
    await setDoc(doc(db, 'orders', ord.id), ord);
  } catch {}
}

async function mirrorOrderStatusToFirestore(ordId: string, status: OrderStatus) {
  try {
    await updateDoc(doc(db, 'orders', ordId), {
      status,
      updatedAt: new Date().toISOString(),
    });
  } catch {}
}

export async function setAllPricesToFiveApi(): Promise<Product[]> {
  try {
    const res = await fetch(`${getApiBase()}/api/products/set-all-price-5`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.products)) return data.products;
    }
  } catch {}
  return [];
}

