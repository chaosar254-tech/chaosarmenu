"use client";

import { useState, useEffect } from "react";

interface CategoryImageProps {
  path: string | null;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}

export function CategoryImage({ 
  path, 
  alt, 
  className,
  style
}: CategoryImageProps) {
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
            console.error('[CategoryImage] No URL in response:', data);
            setError(true);
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('[CategoryImage] Failed to fetch signed URL:', {
            path,
            status: response.status,
            error: errorData.error || response.statusText,
          });
          setError(true);
        }
      } catch (error) {
        console.error('[CategoryImage] Error fetching signed URL:', error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchSignedUrl();
  }, [path]);

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

  if (!imageUrl || error) {
    return null; // No placeholder for category images
  }

  return (
    <div className={className}>
      <img
        src={imageUrl}
        alt={alt}
        className="w-full h-full object-cover"
        style={style}
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    </div>
  );
}
