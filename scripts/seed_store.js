import fs from 'fs';
import path from 'path';

const STORE_PATH = path.resolve(process.cwd(), 'data/store.json');

const newProducts = [
  {
    id: "prod_img_nail_polish",
    name: "طلاء أظافر أحمر لافيرا",
    description: "طلاء أظافر أحمر كلاسيكي بلون غني وثابت يدوم طويلاً مع لمعان فائق يجف سريعاً لحماية وتجميل الأظافر.",
    price: 5,
    stock: 50,
    category: "nails",
    categories: ["nails", "womens-care"],
    image: "/assets/aistudio/IMG_3109_a3251c29.jpeg",
    ingredients: "مكونات نباتية مقوية للأظافر، صبغات لونية نقية غنية، خالي من المواد الضارة",
    createdAt: "2026-10-22T10:10:00.000Z"
  },
  {
    id: "prod_img_lumin_skincare",
    name: "كريم لومن للعناية بالبشرة لافيرا",
    description: "مجموعة كريمات لومن المتطورة للعناية ببشرة الرجل تشمل كريم الترطيب اليومي ومضاد الهالات وغسول الفحم المنقي لترطيب وتجديد نضارة الوجه.",
    price: 5,
    stock: 40,
    category: "skincare",
    categories: ["skincare", "mens-care"],
    image: "/assets/aistudio/IMG_3108_77319c81.jpeg",
    ingredients: "فحم نشط منقي، زبدة الشيا، نياسيناميد B3، خلاصة الشاي الأخضر",
    createdAt: "2026-10-22T10:11:00.000Z"
  },
  {
    id: "prod_img_royale_noir",
    name: "عطر رويال نوار لافيرا",
    description: "مجموعة عطور رويال نوار الفاخرة بتركيز إكستريت دو بارفان بنفحات شرقية وخشبية فواحة وثبات استثنائي يعكس الفخامة والجاذبية للرجال.",
    price: 5,
    stock: 35,
    category: "perfumes",
    categories: ["perfumes", "mens-care"],
    image: "/assets/aistudio/IMG_3107_77992dae.jpeg",
    ingredients: "عود ملكي، نجيل الهند، جلود إيطالية فاخرة، عنبر، بهارات حارة دافئة",
    createdAt: "2026-10-22T10:12:00.000Z"
  },
  {
    id: "prod_img_spanish_tobacco",
    name: "عطر توباكو إسباني لافيرا",
    description: "عطر توباكو إسباني فاخر مستخلص بتركيز إكستريت دو بارفان بحجم 100 مل، توليفة ملكية من التبغ الإسباني الدافئ مع لمسات العنبر والفانيليا الفاخرة للجنسين.",
    price: 5,
    stock: 30,
    category: "perfumes",
    categories: ["perfumes", "mens-care", "womens-care"],
    image: "/assets/aistudio/IMG_3106_4c93b732.jpeg",
    ingredients: "أوراق التبغ الإسباني المعتق، عنبر ملكي، حبوب التونكا، خشب الأرز، فانيليا طبيعية",
    createdAt: "2026-10-22T10:13:00.000Z"
  },
  {
    id: "prod_img_bolde_skincare",
    name: "كريم بولد للعناية بالبشرة للرجال لافيرا",
    description: "مجموعة كريمات بولد النهارية والليلية مع غسول الوجه لتوفير ترطيب عميق وحماية البشرة ومقاومة علامات الإجهاد اليومي للرجال.",
    price: 5,
    stock: 45,
    category: "skincare",
    categories: ["skincare", "mens-care"],
    image: "/assets/aistudio/IMG_3105_32daf5b2.jpeg",
    ingredients: "أحماض ألفا وبيتا هيدروكسي AHA و BHA، حمض الهيالورونيك، خلاصة الصبار، فيتامين E",
    createdAt: "2026-10-22T10:14:00.000Z"
  },
  {
    id: "prod_img_zousz_oud",
    name: "شامبو العناية بالشعر زوز لافيرا",
    description: "شامبو ومجموعة العود الأسود زوز الفاخرة للعناية الفائقة بالشعر واللحية بخلاصة الزيوت المغذية ورائحة العود الآسرة لإطلالة رجالية جذابة.",
    price: 5,
    stock: 35,
    category: "haircare",
    categories: ["haircare", "mens-care"],
    image: "/assets/aistudio/IMG_3104_a47c3876.jpeg",
    ingredients: "زيت العود الأسود الطبيعي، زيت الأركان المغربي، كيراتين طبيعي، زيت اللوز الحلو",
    createdAt: "2026-10-22T10:15:00.000Z"
  },
  {
    id: "prod_img_face_mask",
    name: "ماسك الوجه لافيرا",
    description: "ماسك ورقي طبيعي مرطب للوجه مستخلص من الفواكه المنعشة والألوفيرا لترطيب البشرة واستعادة نضارتها وحيويتها وإشراقتها الفورية.",
    price: 5,
    stock: 60,
    category: "masks",
    categories: ["masks", "womens-care"],
    image: "/assets/aistudio/IMG_3103_fe5ea3d0.jpeg",
    ingredients: "خلاصة الألوفيرا الطبيعية، مستخلص الرمان، الأفوكادو، حمض الهيالورونيك، فيتامين C",
    createdAt: "2026-10-22T10:16:00.000Z"
  }
];

const categories = [
  { id: "cat_1", name: "قسم الرجال", slug: "mens-care" },
  { id: "cat_2", name: "قسم النساء", slug: "womens-care" },
  { id: "cat_3", name: "الكريمات والعناية بالبشرة", slug: "skincare" },
  { id: "cat_4", name: "الشعر والشامبو", slug: "haircare" },
  { id: "cat_5", name: "قسم الماسكات", slug: "masks" },
  { id: "cat_6", name: "قسم الأظافر", slug: "nails" },
  { id: "cat_7", name: "قسم العطور", slug: "perfumes" },
  { id: "cat_8", name: "عناية بالجسم", slug: "bodycare" },
  { id: "cat_9", name: "مجموعات هدايا", slug: "sets" }
];

async function main() {
  console.log('Seeding store via HTTP API...');

  // 1. Post new products
  for (const prod of newProducts) {
    try {
      const res = await fetch('http://localhost:3000/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prod)
      });
      const data = await res.json();
      console.log('Added product:', data.product?.name, 'Price:', data.product?.price);
    } catch (e) {
      console.error('Failed to post product:', prod.name, e);
    }
  }

  // 2. Ensure categories
  for (const cat of categories) {
    try {
      await fetch('http://localhost:3000/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cat)
      });
    } catch {}
  }

  // 3. Verify total products
  const res = await fetch('http://localhost:3000/api/products');
  const result = await res.json();
  console.log(`Total products now in API: ${result.products.length}`);
}

main();
