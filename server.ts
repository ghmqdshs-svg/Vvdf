import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const STORE_PATH = path.resolve(__dirname, 'data/store.json');

// Ensure data directory exists
const dataDir = path.dirname(STORE_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Data Store in-memory cache backed by JSON file
interface StoreData {
  categories: any[];
  products: any[];
  orders: any[];
}

function loadStore(): StoreData {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading store.json:', err);
  }
  return {
    categories: [],
    products: [],
    orders: [],
  };
}

let store: StoreData = loadStore();

function saveStore() {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing store.json:', err);
  }
}

// SSE (Server-Sent Events) clients for instant cross-device sync across any network
type SSEClient = { id: number; res: Response };
let sseClients: SSEClient[] = [];
let nextClientId = 1;

function notifyClients(type: 'products' | 'categories' | 'orders' | 'all') {
  const payload = JSON.stringify({ type, timestamp: Date.now() });
  sseClients.forEach((client) => {
    try {
      client.res.write(`data: ${payload}\n\n`);
    } catch {
      // Ignore write errors to closed sockets
    }
  });
}

// Middleware
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// CORS headers to allow cross-origin requests from any network, phone, or test tool
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Explicitly serve public assets (images, icons)
app.use(express.static(path.resolve(__dirname, 'public')));

// Real-time SSE endpoint for all devices and networks
app.get('/api/events', (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  const clientId = nextClientId++;
  sseClients.push({ id: clientId, res });

  // Send initial handshake
  res.write(`data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`);

  // Keep connection alive with heartbeat ping
  const interval = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch {
      clearInterval(interval);
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(interval);
    sseClients = sseClients.filter((c) => c.id !== clientId);
  });
});

// --- PRODUCTS API ---
app.get('/api/products', (_req: Request, res: Response) => {
  res.json({ success: true, products: store.products });
});

app.post('/api/products', (req: Request, res: Response) => {
  const body = req.body;
  if (!body.name || body.price === undefined) {
    return res.status(400).json({ success: false, error: 'Product name and price are required' });
  }

  const newProduct = {
    id: body.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: body.name,
    description: body.description || '',
    price: Number(body.price),
    stock: Number(body.stock || 0),
    category: body.category || 'skincare',
    categories: Array.isArray(body.categories) ? body.categories : [body.category || 'skincare'],
    image: body.image || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=600&auto=format&fit=crop',
    ingredients: body.ingredients || '',
    createdAt: body.createdAt || new Date().toISOString(),
  };

  store.products.unshift(newProduct);
  saveStore();
  notifyClients('products');
  res.status(201).json({ success: true, product: newProduct });
});

app.put('/api/products/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = store.products.findIndex((p) => p.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }

  const current = store.products[idx];
  const updated = {
    ...current,
    ...req.body,
    id, // Keep immutable ID
    price: req.body.price !== undefined ? Number(req.body.price) : current.price,
    stock: req.body.stock !== undefined ? Number(req.body.stock) : current.stock,
  };

  store.products[idx] = updated;
  saveStore();
  notifyClients('products');
  res.json({ success: true, product: updated });
});

app.delete('/api/products/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const initialLen = store.products.length;
  store.products = store.products.filter((p) => p.id !== id);
  if (store.products.length === initialLen) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }
  saveStore();
  notifyClients('products');
  res.json({ success: true, message: 'Product deleted' });
});

// Bulk delete all products without touching categories or orders!
app.delete('/api/products', (_req: Request, res: Response) => {
  const deletedCount = store.products.length;
  store.products = [];
  saveStore();
  notifyClients('products');
  res.json({
    success: true,
    message: 'All products permanently deleted',
    deletedCount,
  });
});

// Restore default sample catalog
app.post('/api/products/restore-defaults', (_req: Request, res: Response) => {
  const defaultStore = loadStore();
  if (defaultStore.products && defaultStore.products.length > 0) {
    store.products = defaultStore.products;
  } else {
    store.products = [
      {
        id: 'prod_1',
        name: 'عطر لاڤير رويال الفاخر (Laver Royal)',
        description: 'عطر أرستقراطي يجمع بين نفحات العود الملكي المعتّق والمسك الأبيض مع لمسات زهرية ساحرة تدوم طوال اليوم.',
        price: 289,
        stock: 25,
        category: 'perfumes',
        image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=600&auto=format&fit=crop',
        ingredients: 'عود معتق، مسك أبيض، عنبر، زهور البرتقال، برغموت إيطالي',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'prod_2',
        name: 'سيروم الهيالورونيك وفيتامين C المركز',
        description: 'سيروم فائق الفعالية لترطيب البشرة بعمق، توحيد لونها ومحاربة علامات التقدم بالسن بفضل مضادات الأكسدة المركزة.',
        price: 149,
        stock: 35,
        category: 'skincare',
        image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600&auto=format&fit=crop',
        ingredients: 'حمض الهيالورونيك النقي، فيتامين سي المستقر، خلاصة الصبار العضوي، فيتامين E',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'prod_3',
        name: 'كريم لاڤير الملكي لترطيب وتجديد الخلايا',
        description: 'تركيبة مخملية فاخرة تغذي حاجز البشرة وترطبها لمدة تصل إلى 48 ساعة دون أي ملمس دهني.',
        price: 119,
        stock: 40,
        category: 'skincare',
        image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?q=80&w=600&auto=format&fit=crop',
        ingredients: 'زبدة الشيا العضوية، زيت الجوجوبا الذهبي، سيراميد نباتي، نياسيناميد',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'prod_4',
        name: 'زيت لاڤير المعالج والمقوي للشعر',
        description: 'مزيج طبيعي معزز بخلاصة إكليل الجبل وزيت الأرجان المغربي لتحفيز نمو الشعر ومنع التساقط وإعطائه لمعاناً حريرياً.',
        price: 135,
        stock: 20,
        category: 'haircare',
        image: 'https://images.unsplash.com/photo-1608248597359-99464303b688?q=80&w=600&auto=format&fit=crop',
        ingredients: 'زيت إكليل الجبل المركز، زيت الأرجان النقي، زيت اللوز الحلو، زيت الخروع العضوي',
        createdAt: new Date().toISOString(),
      },
    ];
  }
  saveStore();
  notifyClients('products');
  res.json({ success: true, products: store.products });
});

// Set all product prices to 5 SAR
app.post('/api/products/set-all-price-5', (_req: Request, res: Response) => {
  store.products = store.products.map(p => ({
    ...p,
    price: 5
  }));
  saveStore();
  notifyClients('products');
  res.json({ success: true, message: 'All product prices set to 5.00 SAR', products: store.products });
});


// --- CATEGORIES API ---
app.get('/api/categories', (_req: Request, res: Response) => {
  const seen = new Set<string>();
  const unique = store.categories.filter((c) => {
    if (!c.slug || seen.has(c.slug)) return false;
    seen.add(c.slug);
    return true;
  });
  res.json({ success: true, categories: unique });
});

app.post('/api/categories', (req: Request, res: Response) => {
  const { name, slug } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, error: 'Category name is required' });
  }

  const targetSlug = slug || name.trim().toLowerCase().replace(/\s+/g, '-');
  const existingIdx = store.categories.findIndex((c) => c.slug === targetSlug || c.id === req.body.id);
  
  let resultCat;
  if (existingIdx >= 0) {
    store.categories[existingIdx] = {
      ...store.categories[existingIdx],
      name,
      slug: targetSlug,
    };
    resultCat = store.categories[existingIdx];
  } else {
    resultCat = {
      id: req.body.id || `cat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name,
      slug: targetSlug,
    };
    store.categories.push(resultCat);
  }

  saveStore();
  notifyClients('categories');
  res.status(201).json({ success: true, category: resultCat });
});

app.put('/api/categories/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = store.categories.findIndex((c) => c.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Category not found' });
  }

  store.categories[idx] = {
    ...store.categories[idx],
    ...req.body,
    id,
  };
  saveStore();
  notifyClients('categories');
  res.json({ success: true, category: store.categories[idx] });
});

app.delete('/api/categories/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  store.categories = store.categories.filter((c) => c.id !== id);
  saveStore();
  notifyClients('categories');
  res.json({ success: true, message: 'Category deleted' });
});

// --- ORDERS API ---
app.get('/api/orders', (_req: Request, res: Response) => {
  const sorted = [...store.orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  res.json({ success: true, orders: sorted });
});

app.post('/api/orders', (req: Request, res: Response) => {
  const body = req.body;
  if (!body.customerName || !body.phone || !body.items || body.items.length === 0) {
    return res.status(400).json({ success: false, error: 'Customer name, phone, and items are required' });
  }

  const randomNum = Math.floor(10000 + Math.random() * 90000);
  const newOrder = {
    id: body.id || `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    orderNumber: body.orderNumber || `LVR-${randomNum}`,
    customerName: body.customerName,
    phone: body.phone,
    city: body.city || '',
    address: body.address || '',
    notes: body.notes || '',
    items: body.items,
    totalAmount: Number(body.totalAmount || 0),
    status: body.status || 'new',
    createdAt: body.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.orders.unshift(newOrder);
  saveStore();
  notifyClients('orders');
  res.status(201).json({ success: true, order: newOrder });
});

app.patch('/api/orders/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const idx = store.orders.findIndex((o) => o.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }

  store.orders[idx].status = status;
  store.orders[idx].updatedAt = new Date().toISOString();
  saveStore();
  notifyClients('orders');
  res.json({ success: true, order: store.orders[idx] });
});

// Order tracking search endpoint
app.get('/api/orders/track', (req: Request, res: Response) => {
  const orderNumber = (req.query.orderNumber as string || '').trim().toUpperCase();
  const phone = (req.query.phone as string || '').trim();

  const found = store.orders.find(
    (o) => o.orderNumber.toUpperCase() === orderNumber && o.phone.trim() === phone
  );

  if (!found) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }
  res.json({ success: true, order: found });
});

// App status endpoint
app.get('/api/status', (_req: Request, res: Response) => {
  res.json({
    status: 'online',
    appName: 'لاڤير للعناية',
    productsCount: store.products.length,
    categoriesCount: store.categories.length,
    ordersCount: store.orders.length,
    connectedDevices: sseClients.length,
    timestamp: new Date().toISOString(),
  });
});

// Force reload store from disk
app.post('/api/store/reload', (_req: Request, res: Response) => {
  store = loadStore();
  notifyClients('all');
  res.json({
    success: true,
    message: 'Store reloaded',
    productsCount: store.products.length,
    categoriesCount: store.categories.length,
  });
});

// Mount Vite or serve static dist
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Laver Store] Server running at http://0.0.0.0:${PORT} (Ready for all devices & networks)`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
