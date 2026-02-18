"use client";

import { useState, useEffect } from "react";

interface ProductImageProps {
  path: string | null;
  legacyUrl?: string | null;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}

export function ProductImage({ 
  path, 
  legacyUrl, 
  alt, 
  className,
  style
}: ProductImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [cardColor, setCardColor] = useState('#15151B');
  const [primaryColor, setPrimaryColor] = useState('#D4AF37');

  // Get theme colors from CSS variables after mount to prevent hydration mismatch
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const card = getComputedStyle(document.documentElement).getPropertyValue('--theme-card').trim() || '#15151B';
      const primary = getComputedStyle(document.documentElement).getPropertyValue('--theme-primary').trim() || '#D4AF37';
      setCardColor(card);
      setPrimaryColor(primary);
    }
  }, []);

  useEffect(() => {
    // If legacy URL exists and no path, use legacy URL directly
    if (!path && legacyUrl) {
      setImageUrl(legacyUrl);
      setLoading(false);
      return;
    }

    // If no path, show placeholder
    if (!path) {
      setLoading(false);
      return;
    }

    // Fetch signed URL from API
    const fetchSignedUrl = async () => {
      try {
        const encodedPath = encodeURIComponent(path);
        const response = await fetch(`/api/image?path=${encodedPath}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.url) {
            setImageUrl(data.url);
            setError(false);
          } else {
            console.error('[ProductImage] No URL in response:', data);
            setError(true);
            // Fallback to legacy URL if available
            if (legacyUrl) {
              setImageUrl(legacyUrl);
            }
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('[ProductImage] Failed to fetch signed URL:', {
            path,
            status: response.status,
            error: errorData.error || response.statusText,
          });
          setError(true);
          // Fallback to legacy URL if available
          if (legacyUrl) {
            setImageUrl(legacyUrl);
          }
        }
      } catch (error) {
        console.error('[ProductImage] Error fetching signed URL:', error);
        setError(true);
        // Fallback to legacy URL if available
        if (legacyUrl) {
          setImageUrl(legacyUrl);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSignedUrl();
  }, [path, legacyUrl]);

  if (loading) {
    return (
      <div className={className}>
        <div 
          className="w-full h-full flex items-center justify-center"
          style={{ backgroundColor: cardColor }}
        >
          <span className="text-xs" style={{ color: primaryColor, opacity: 0.3 }}>Loading...</span>
        </div>
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className={className}>
        <div 
          className="w-full h-full flex items-center justify-center"
          style={{ backgroundColor: cardColor }}
        >
          <span className="text-sm" style={{ color: primaryColor, opacity: 0.5 }}>No Image</span>
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={style}>
      <img
        src={imageUrl}
        alt={alt}
        className="w-full h-full object-cover"
        onError={(e) => {
          // Fallback to placeholder on error
          e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23252528" width="200" height="200"/%3E%3Ctext fill="%23F5D37A" font-family="Arial" font-size="14" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
        }}
      />
    </div>
  );
}
