"use client";

import { getProductImageUrl } from "@/lib/image-utils";

interface ProductImageProps {
  legacyUrl?: string | null;
  imagePath?: string | null;
  alt: string;
  className?: string;
}

export function ProductImage({ legacyUrl, imagePath, alt, className = "" }: ProductImageProps) {
  // Construct Supabase Storage URL for product images (from 'images' bucket)
  const imageUrl = getProductImageUrl(legacyUrl, imagePath);

  if (!imageUrl) {
    return (
      <div className={`${className} rounded-xl flex items-center justify-center aspect-square`} style={{ width: '112px', height: '112px', backgroundColor: 'rgba(0, 0, 0, 0.1)', border: '1px solid rgba(0, 0, 0, 0.1)' }}>
        <span className="text-gray-400 text-xs font-montserrat opacity-60">No Image</span>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className="object-cover rounded-xl"
      style={{ width: '112px', height: '112px', aspectRatio: '1 / 1' }}
      onError={(e) => {
        // Hide broken image and show placeholder
        e.currentTarget.style.display = 'none';
      }}
    />
  );
}
