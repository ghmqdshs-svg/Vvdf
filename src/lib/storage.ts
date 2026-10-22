import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Uploads an image file to Firebase Storage with automatic fallback to Data URL.
 * Ensures the returned URL is permanent, accessible across all devices and networks,
 * and never relies on local machine paths (like C:\... or file://).
 */
export async function uploadProductImage(file: File): Promise<string> {
  // Validate file
  if (!file || !file.type.startsWith('image/')) {
    throw new Error('الملف المختار ليس صورة صالحة.');
  }

  // 1. Try Firebase Storage
  try {
    const timestamp = Date.now();
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storageRef = ref(storage, `products/${timestamp}_${cleanName}`);

    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
      cacheControl: 'public, max-age=31536000',
    });

    const downloadUrl = await getDownloadURL(snapshot.ref);
    if (downloadUrl && downloadUrl.startsWith('http')) {
      return downloadUrl;
    }
  } catch (err) {
    console.warn('Firebase Storage upload failed, falling back to embedded Data URL:', err);
  }

  // 2. High-reliability fallback: Read as Base64 Data URL
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        resolve(result);
      } else {
        reject(new Error('تعذر قراءة الصورة'));
      }
    };
    reader.onerror = () => reject(new Error('فشلت قراءة ملف الصورة'));
    reader.readAsDataURL(file);
  });
}
