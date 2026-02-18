/**
 * Client-side image optimization utility
 * Resizes images to max 1600px, converts to WebP/JPEG, and compresses to target size
 */

export interface OptimizeImageResult {
  blob: Blob;
  format: string;
  originalSize: number;
  optimizedSize: number;
  width: number;
  height: number;
}

export interface OptimizeImageOptions {
  maxDimension?: number; // Max width or height (default: 1600)
  targetSizeBytes?: number; // Target size in bytes (default: 1.5MB)
  quality?: number; // Initial quality (default: 0.75)
  minQuality?: number; // Minimum quality to try (default: 0.65)
  preferWebP?: boolean; // Prefer WebP if supported (default: true)
}

const DEFAULT_OPTIONS: Required<OptimizeImageOptions> = {
  maxDimension: 1600,
  targetSizeBytes: 1.5 * 1024 * 1024, // 1.5MB
  quality: 0.75,
  minQuality: 0.65,
  preferWebP: true,
};

/**
 * Check if browser supports WebP
 */
function supportsWebP(): boolean {
  if (typeof window === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
}

/**
 * Resize image to fit within max dimension while maintaining aspect ratio
 */
function resizeImage(
  img: HTMLImageElement,
  maxDimension: number
): { width: number; height: number } {
  let { width, height } = img;

  if (width <= maxDimension && height <= maxDimension) {
    return { width, height };
  }

  if (width > height) {
    height = (height / width) * maxDimension;
    width = maxDimension;
  } else {
    width = (width / height) * maxDimension;
    height = maxDimension;
  }

  return { width: Math.round(width), height: Math.round(height) };
}

/**
 * Compress image to target size by adjusting quality
 */
async function compressToTargetSize(
  canvas: HTMLCanvasElement,
  format: string,
  targetSize: number,
  initialQuality: number,
  minQuality: number
): Promise<Blob> {
  let quality = initialQuality;
  let blob: Blob;

  do {
    blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) {
            resolve(result);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        format,
        quality
      );
    });

    if (blob.size <= targetSize || quality <= minQuality) {
      break;
    }

    // Reduce quality by 0.05 each iteration
    quality = Math.max(minQuality, quality - 0.05);
  } while (blob.size > targetSize && quality > minQuality);

  return blob;
}

/**
 * Optimize image: resize, convert format, and compress
 */
export async function optimizeImage(
  file: File,
  options: OptimizeImageOptions = {}
): Promise<OptimizeImageResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Sadece JPG/PNG/WebP formatları destekleniyor.');
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      if (!e.target?.result) {
        reject(new Error('Dosya okunamadı'));
        return;
      }

      img.onload = async () => {
        try {
          // Resize image
          const { width, height } = resizeImage(img, opts.maxDimension);

          // Create canvas
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          // Draw resized image
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context alınamadı'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Determine output format
          const supportsWebPFormat = opts.preferWebP && supportsWebP();
          const format = supportsWebPFormat ? 'image/webp' : 'image/jpeg';

          // Compress to target size
          const blob = await compressToTargetSize(
            canvas,
            format,
            opts.targetSizeBytes,
            opts.quality,
            opts.minQuality
          );

          // Check final size (should be under 5MB for Supabase)
          const maxSize = 5 * 1024 * 1024; // 5MB
          if (blob.size > maxSize) {
            reject(new Error('Görsel çok büyük, farklı bir görsel deneyin.'));
            return;
          }

          resolve({
            blob,
            format,
            originalSize: file.size,
            optimizedSize: blob.size,
            width,
            height,
          });
        } catch (error: any) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Görsel yüklenemedi'));
      };

      img.src = e.target.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Dosya okunamadı'));
    };

    reader.readAsDataURL(file);
  });
}

