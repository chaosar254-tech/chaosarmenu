/**
 * Image URL utilities for Supabase Storage
 * Constructs public URLs for images stored in Supabase Storage buckets
 */

/**
 * Robust helper to get image source URL for Supabase Storage
 * Handles legacy CDN domains, duplicate folder prefixes, and constructs correct URLs
 * @param path - The image path (can be full URL, relative path, or null)
 * @param bucket - The storage bucket name (e.g., 'images', 'menu_logos', 'menu_category_images')
 * @returns Full public URL to the image, or null if path is invalid
 */
export function getImageSrc(path: string | null | undefined, bucket: string): string | null {
  // Return null for empty paths
  if (!path || path.trim() === '') {
    return null;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    console.warn('NEXT_PUBLIC_SUPABASE_URL is not set');
    return null;
  }

  // Fix 1: Replace old CDN domain with Supabase URL
  // Check for cdn.chaosarmenu.com (case insensitive, handle http/https)
  if (path.toLowerCase().includes('cdn.chaosarmenu.com')) {
    try {
      // Ensure we have a full URL for parsing
      const fullUrl = path.startsWith('http') ? path : `https://${path}`;
      const urlObj = new URL(fullUrl);
      let extractedPath = urlObj.pathname; // e.g., "/menu_logos/logos/filename.jpg" or "/logos/filename.jpg"
      
      // Remove leading slash
      extractedPath = extractedPath.startsWith('/') ? extractedPath.slice(1) : extractedPath;
      
      // Aggressively remove ALL duplicate prefixes
      // Remove bucket prefix if present (e.g., "menu_logos/logos/filename" -> "logos/filename")
      if (extractedPath.startsWith(`${bucket}/`)) {
        extractedPath = extractedPath.substring(bucket.length + 1);
      }
      
      // Remove duplicate folder prefixes specific to bucket
      // For menu_logos: remove "logos/" prefix
      if (bucket === 'menu_logos' && extractedPath.startsWith('logos/')) {
        extractedPath = extractedPath.substring(6); // Remove "logos/"
      }
      // For images: remove "images/" prefix
      if (bucket === 'images' && extractedPath.startsWith('images/')) {
        extractedPath = extractedPath.substring(7); // Remove "images/"
      }
      // For menu_category_images: remove "category_images/" prefix
      if (bucket === 'menu_category_images' && extractedPath.startsWith('category_images/')) {
        extractedPath = extractedPath.substring(16); // Remove "category_images/"
      }
      
      // Construct final URL
      const finalUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${extractedPath}`;
      return finalUrl;
    } catch (error) {
      console.warn('Failed to parse URL with old CDN domain:', path, error);
      // Fall through to treat as relative path
    }
  }

  // Fix 2: If it's a full URL (and NOT old CDN), return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    // Double-check it's not the old CDN (in case check above missed it)
    if (path.toLowerCase().includes('cdn.chaosarmenu.com')) {
      // Recursively call with just the pathname
      try {
        const urlObj = new URL(path);
        return getImageSrc(urlObj.pathname, bucket);
      } catch {
        return null;
      }
    }
    // Check if it's already a Supabase URL
    if (path.includes('supabase.co')) {
      return path;
    }
    // Other external URLs (like Unsplash) - return as is
    return path;
  }

  // Fix 3: Clean relative path - remove duplicate folder prefixes
  let cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // Remove bucket prefix if present (e.g., "menu_logos/logos/filename" -> "logos/filename")
  if (cleanPath.startsWith(`${bucket}/`)) {
    cleanPath = cleanPath.substring(bucket.length + 1);
  }
  
  // Remove duplicate folder prefixes specific to bucket
  if (bucket === 'menu_logos' && cleanPath.startsWith('logos/')) {
    cleanPath = cleanPath.substring(6); // Remove "logos/"
  }
  if (bucket === 'menu_logos' && cleanPath.startsWith('covers/')) {
    // Keep covers/ prefix for cover images (it's intentional)
    // cleanPath stays as "covers/{restaurantId}/{uuid}.{ext}"
  }
  if (bucket === 'images' && cleanPath.startsWith('images/')) {
    cleanPath = cleanPath.substring(7); // Remove "images/"
  }
  if (bucket === 'menu_category_images' && cleanPath.startsWith('category_images/')) {
    cleanPath = cleanPath.substring(16); // Remove "category_images/"
  }

  // Final construction
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${cleanPath}`;
}

/**
 * Get Supabase Storage public URL for a given bucket and path
 * @param bucket - The storage bucket name (e.g., 'images', 'menu_logos', 'menu_category_images')
 * @param path - The file path within the bucket (relative path, e.g., 'restaurant-id/items/item-id/uuid.jpg')
 * @returns Full public URL to the image
 * @deprecated Use getImageSrc instead for better handling of legacy URLs and duplicate prefixes
 */
export function getSupabaseImageUrl(bucket: string, path: string | null | undefined): string | null {
  return getImageSrc(path, bucket);
}

/**
 * Get product image URL (from 'images' bucket)
 * Uses the robust getImageSrc helper to handle legacy CDN and duplicate folder prefixes
 */
export function getProductImageUrl(imageUrl: string | null | undefined, imagePath: string | null | undefined): string | null {
  // Prefer image_path if available (new uploads use this)
  if (imagePath) {
    return getImageSrc(imagePath, 'images');
  }

  // Fallback to image_url
  if (imageUrl) {
    return getImageSrc(imageUrl, 'images');
  }

  return null;
}

/**
 * Get logo URL (from 'menu_logos' bucket)
 * Uses the robust getImageSrc helper to handle legacy CDN and duplicate folder prefixes
 */
export function getLogoUrl(logoUrl: string | null | undefined, logoPath: string | null | undefined): string | null {
  // Prefer logo_path if available (new uploads use this)
  if (logoPath) {
    return getImageSrc(logoPath, 'menu_logos');
  }

  // Fallback to logo_url
  if (logoUrl) {
    return getImageSrc(logoUrl, 'menu_logos');
  }

  return null;
}

/**
 * Get category image URL (from 'menu_category_images' bucket)
 * Uses the robust getImageSrc helper to handle legacy CDN and duplicate folder prefixes
 */
export function getCategoryImageUrl(imageUrl: string | null | undefined, imagePath: string | null | undefined): string | null {
  // Prefer image_path if available (new uploads use this)
  if (imagePath) {
    return getImageSrc(imagePath, 'menu_category_images');
  }

  // Fallback to image_url
  if (imageUrl) {
    return getImageSrc(imageUrl, 'menu_category_images');
  }

  return null;
}
