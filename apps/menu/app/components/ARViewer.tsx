"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X, Box } from "lucide-react";

interface ARViewerProps {
  open: boolean;
  onClose: () => void;
  glbSrc?: string;
  usdzSrc?: string;
  posterSrc?: string;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": any;
    }
  }
}

export const ARViewer: React.FC<ARViewerProps> = ({
  open,
  onClose,
  glbSrc,
  usdzSrc,
  posterSrc,
}) => {
  const modelViewerRef = useRef<any>(null);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [arError, setArError] = useState<string | null>(null);
  const [isArActivating, setIsArActivating] = useState(false);
  const [arSupported, setArSupported] = useState<boolean | null>(null);
  const [showARPrompt, setShowARPrompt] = useState(true);

  // Check AR support - wrapped in useCallback to fix dependency warnings
  const checkARSupport = useCallback(() => {
    if (!modelViewerRef.current) {
      // If model-viewer not ready, assume supported on iOS/Android
      setArSupported(isIOS || isAndroid);
      return;
    }
    
    const mv = modelViewerRef.current as any;
    if (mv.canActivateAR) {
      mv.canActivateAR().then((supported: boolean) => {
        setArSupported(supported);
      }).catch(() => {
        // Fallback: assume supported if check fails
        setArSupported(isIOS || isAndroid);
      });
    } else {
      // Fallback: assume supported on iOS/Android
      setArSupported(isIOS || isAndroid);
    }
  }, [isIOS, isAndroid]);

  // Check if script is already loaded on mount and detect device (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Detect device type
    const userAgent = navigator.userAgent;
    setIsAndroid(/Android/.test(userAgent));
    setIsIOS(/iPad|iPhone|iPod/.test(userAgent) || 
             (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
    
    // Check if model-viewer custom element is already defined
    if ((window as any).customElements?.get('model-viewer')) {
      setIsScriptLoaded(true);
      // Delay checkARSupport to ensure model-viewer is mounted
      setTimeout(checkARSupport, 100);
      return;
    }

    // Check if script tag already exists in DOM
    const existingScript = document.querySelector('script[src*="model-viewer"]');
    if (existingScript) {
      // Script exists but custom element not yet registered - wait for it
      const checkInterval = setInterval(() => {
        if ((window as any).customElements?.get('model-viewer')) {
          setIsScriptLoaded(true);
          setTimeout(checkARSupport, 100);
          clearInterval(checkInterval);
        }
      }, 100);
      
      // Timeout after 5 seconds
      const timeout = setTimeout(() => {
        clearInterval(checkInterval);
      }, 5000);
      
      return () => {
        clearInterval(checkInterval);
        clearTimeout(timeout);
      };
    }
  }, [checkARSupport]);

  // Handle AR activation on button click (user gesture required)
  const handleActivateAR = async () => {
    if (!modelViewerRef.current || !isScriptLoaded) return;

    setIsArActivating(true);
    setArError(null);
    setShowARPrompt(false);

    try {
      const mv = modelViewerRef.current as any;
      
      if (mv.activateAR) {
        await mv.activateAR();
      } else {
        throw new Error("AR aktivasyon metodu bulunamadı");
      }
    } catch (error: any) {
      console.error("AR aktivasyon hatası:", error);
      const errorMessage = isAndroid 
        ? "AR açılamadı. Google Play Services for AR (ARCore) yüklü olmalı."
        : isIOS
        ? "AR açılamadı. iOS AR Quick Look desteklenmiyor olabilir."
        : "AR özelliği bu cihazda desteklenmiyor.";
      setArError(errorMessage);
      setShowARPrompt(true); // Show prompt again on error
    } finally {
      setIsArActivating(false);
    }
  };

  // Load model-viewer script dynamically when AR viewer is opened (client-side only)
  useEffect(() => {
    if (!open || isScriptLoaded || typeof window === 'undefined') return;

    // Double-check if already loaded (in case it was loaded between mount and open)
    if ((window as any).customElements?.get('model-viewer')) {
      setIsScriptLoaded(true);
      return;
    }

    // Check if script is already being loaded (avoid duplicate loads)
    const existingScript = document.querySelector('script[src*="model-viewer"]');
    if (existingScript) {
      // Script exists, wait for custom element to be defined
      const checkInterval = setInterval(() => {
        if ((window as any).customElements?.get('model-viewer')) {
          setIsScriptLoaded(true);
          clearInterval(checkInterval);
        }
      }, 100);
      
      const timeout = setTimeout(() => {
        clearInterval(checkInterval);
      }, 5000);
      
      return () => {
        clearInterval(checkInterval);
        clearTimeout(timeout);
      };
    }

    // Create and load script as ES module (client-side only)
    // Use unpkg CDN which serves proper ES modules
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://unpkg.com/@google/model-viewer@3.3.0/dist/model-viewer.min.js';
    script.async = true;
    
    script.onload = () => {
      // Wait for custom element to register after script loads
      const checkInterval = setInterval(() => {
        if ((window as any).customElements?.get('model-viewer')) {
          setIsScriptLoaded(true);
          setTimeout(checkARSupport, 100);
          clearInterval(checkInterval);
        }
      }, 50);
      
      // Timeout after 3 seconds
      const timeout = setTimeout(() => {
        clearInterval(checkInterval);
        if (!(window as any).customElements?.get('model-viewer')) {
          console.warn('model-viewer script loaded but custom element not registered after timeout');
        }
      }, 3000);
      
      // Cleanup function would be handled by the useEffect return, but we keep the interval cleanup
    };
    
    script.onerror = () => {
      console.error('Failed to load model-viewer script from unpkg, trying fallback CDN');
      // Fallback to jsdelivr CDN which also serves proper ES modules
      const fallbackScript = document.createElement('script');
      fallbackScript.type = 'module';
      fallbackScript.src = 'https://cdn.jsdelivr.net/npm/@google/model-viewer@3.3.0/dist/model-viewer.min.js';
      fallbackScript.async = true;
      fallbackScript.onload = () => {
        const checkInterval = setInterval(() => {
          if ((window as any).customElements?.get('model-viewer')) {
            setIsScriptLoaded(true);
            setTimeout(checkARSupport, 100);
            clearInterval(checkInterval);
          }
        }, 50);
        setTimeout(() => clearInterval(checkInterval), 3000);
      };
      fallbackScript.onerror = () => {
        console.error('Failed to load model-viewer script from all CDNs');
      };
      document.head.appendChild(fallbackScript);
    };

    document.head.appendChild(script);

    return () => {
      // Don't remove script on unmount to avoid reloading - it's cached by browser
    };
  }, [open, isScriptLoaded, checkARSupport]);

  // Reset state when modal opens and check AR support after model-viewer is ready
  useEffect(() => {
    if (open) {
      setShowARPrompt(true);
      setArError(null);
      setIsArActivating(false);
      
      // Check AR support after a short delay to ensure model-viewer is mounted
      if (isScriptLoaded && modelViewerRef.current) {
        setTimeout(checkARSupport, 200);
      }
    }
  }, [open, isScriptLoaded, checkARSupport]);

  if (!open) return null;

  // Show error if no model source
  if (!glbSrc && !usdzSrc) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
        <div className="text-center p-6 max-w-md">
          <Box className="w-16 h-16 text-white/50 mx-auto mb-4" />
          <p className="text-white text-lg mb-2">3D Model Bulunamadı</p>
          <p className="text-white/70 text-sm mb-6">
            Bu ürün için AR görüntüleme mevcut değil.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    );
  }

  // Wait for script to load before rendering model-viewer
  if (!isScriptLoaded) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
        <div className="text-center p-6">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white mb-4">3D görüntüleyici yükleniyor...</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
          >
            İptal
          </button>
        </div>
      </div>
    );
  }

  // Create absolute URL if relative (REQUIRED for Scene Viewer on Android)
  const glbUrl = glbSrc && (typeof window !== 'undefined' && (glbSrc.startsWith('http://') || glbSrc.startsWith('https://'))
    ? glbSrc 
    : typeof window !== 'undefined'
    ? `${window.location.origin}${glbSrc.startsWith('/') ? '' : '/'}${glbSrc}`
    : glbSrc);

  const usdzUrl = usdzSrc && (typeof window !== 'undefined' && (usdzSrc.startsWith('http://') || usdzSrc.startsWith('https://'))
    ? usdzSrc 
    : typeof window !== 'undefined'
    ? `${window.location.origin}${usdzSrc.startsWith('/') ? '' : '/'}${usdzSrc}`
    : usdzSrc);

  // Check if AR is supported (show fallback if not)
  const canUseAR = arSupported !== false && (glbUrl || usdzUrl);

  return (
    <div className="fixed inset-0 z-[100] bg-black">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-[101] p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
        aria-label="Kapat"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* 3D Model Viewer - Always visible */}
      <model-viewer
        ref={modelViewerRef}
        src={glbUrl || undefined}
        {...(usdzUrl ? { 'ios-src': usdzUrl } : {})}
        poster={posterSrc || undefined}
        ar
        ar-modes="quick-look scene-viewer"
        ar-scale="fixed"
        camera-controls
        auto-rotate
        interaction-policy="allow-when-focused"
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "#000",
        }}
      />

      {/* AR Prompt Overlay - Shown initially */}
      {showARPrompt && isScriptLoaded && (
        <div className="absolute inset-0 z-[102] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
            <Box className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              3D Modeli AR'da Açmak İster misiniz?
            </h3>
            <p className="text-gray-600 text-sm mb-6">
              Ürünü gerçek dünyada görmek için AR özelliğini kullanabilirsiniz.
            </p>
            
            {canUseAR ? (
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleActivateAR}
                  disabled={isArActivating}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isArActivating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>AR Başlatılıyor...</span>
                    </>
                  ) : (
                    <>
                      <Box className="w-5 h-5" />
                      <span>AR'da Aç</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowARPrompt(false)}
                  className="w-full px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Sadece 3D Görüntüle
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    AR özelliği bu cihazda desteklenmiyor.
                  </p>
                </div>
                <button
                  onClick={() => setShowARPrompt(false)}
                  className="w-full px-6 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  3D Modeli Görüntüle
                </button>
              </div>
            )}

            {arError && (
              <div className="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{arError}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AR Error Display - When AR fails after activation */}
      {arError && !showARPrompt && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[102] px-4 py-3 bg-red-500/90 text-white rounded-lg text-sm max-w-xs text-center shadow-lg">
          {arError}
        </div>
      )}
    </div>
  );
};
