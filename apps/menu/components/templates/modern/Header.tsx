"use client";

import { useState, useEffect } from "react";
import { Search, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface HeaderProps {
  logoUrl: string | null;
  restaurantName: string;
  branchName: string;
  tableNumber: string | null;
  onSearchClick: () => void;
  locale: 'tr' | 'en';
  onLocaleChange: (locale: 'tr' | 'en') => void;
}

const translations = {
  tr: {
    search: "Ara",
    table: "Masa",
  },
  en: {
    search: "Search",
    table: "Table",
  },
};

export function Header({
  logoUrl,
  restaurantName,
  branchName,
  tableNumber,
  onSearchClick,
  locale,
  onLocaleChange,
}: HeaderProps) {
  const t = translations[locale];
  const [showLocaleMenu, setShowLocaleMenu] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className="sticky top-0 left-0 w-full z-50 backdrop-blur-2xl transition-all duration-300 border-b" 
      style={{ 
        backgroundColor: 'rgba(10, 25, 47, 0.4)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderColor: 'rgba(255, 255, 255, 0.05)',
        borderBottomWidth: '1px',
        margin: 0,
        padding: 0,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className={`flex items-center justify-between transition-all duration-300 ${isScrolled ? 'h-24' : 'h-60'}`}>
          {/* Left side - Branch info */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="min-w-0 hidden sm:block">
              <p className={`truncate font-montserrat transition-all duration-300 ${isScrolled ? 'text-xs' : 'text-sm'}`} style={{ color: '#E6E6E6', opacity: 0.8 }}>
                {branchName} {tableNumber && `• ${t.table} ${tableNumber}`}
              </p>
            </div>
          </div>

          {/* Central Logo - Absolutely centered */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex justify-center items-center pointer-events-none z-10">
            {logoUrl && typeof logoUrl === 'string' && logoUrl.startsWith('http') ? (
              <div className={`relative transition-all duration-300 ${isScrolled ? 'h-20' : 'h-28'}`} style={{ width: 'auto', maxWidth: '300px' }}>
                <img
                  src={logoUrl}
                  alt={restaurantName}
                  className={`object-contain transition-all duration-300 ${isScrolled ? 'h-20' : 'h-28'}`}
                  style={{ 
                    width: 'auto',
                    height: '100%',
                    filter: 'drop-shadow(0 0 15px rgba(212, 175, 55, 0.4))',
                  }}
                />
              </div>
            ) : (
              <div className={`flex flex-col items-center transition-all duration-300 ${isScrolled ? 'gap-1' : 'gap-2'}`}>
                <h1 className={`font-bold font-montserrat transition-all duration-300 ${isScrolled ? 'text-xl sm:text-2xl' : 'text-3xl sm:text-4xl'}`} style={{ color: '#D4AF37', letterSpacing: '0.1em' }}>
                  {restaurantName}
                </h1>
                <p className={`font-montserrat transition-all duration-300 ${isScrolled ? 'text-xs' : 'text-sm'}`} style={{ color: '#D4AF37', opacity: 0.9, letterSpacing: '0.2em' }}>
                  ISTANBUL • LONDON
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-1 justify-end">
            {/* Search Button */}
            <button
              onClick={onSearchClick}
              className={`rounded-lg transition-colors ${isScrolled ? 'p-2' : 'p-3'}`}
              style={{
                backgroundColor: '#FDFDFD',
                color: '#0A192F',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#F5F5F5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#FDFDFD';
              }}
              aria-label={t.search}
            >
              <Search className={`transition-all duration-300 ${isScrolled ? 'w-5 h-5' : 'w-6 h-6'}`} style={{ color: '#0A192F' }} />
            </button>

            {/* Locale Toggle */}
            <div className="relative">
              <button
                onClick={() => setShowLocaleMenu(!showLocaleMenu)}
                className={`rounded-lg transition-colors ${isScrolled ? 'p-2' : 'p-3'}`}
                style={{
                  backgroundColor: '#FDFDFD',
                  color: '#0A192F',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F5F5F5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#FDFDFD';
                }}
                aria-label="Change language"
              >
                <Globe className={`transition-all duration-300 ${isScrolled ? 'w-5 h-5' : 'w-6 h-6'}`} style={{ color: '#0A192F' }} />
              </button>
              <AnimatePresence>
                {showLocaleMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-32 rounded-lg shadow-lg overflow-hidden"
                    style={{ backgroundColor: 'rgba(10, 25, 47, 0.9)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
                  >
                    <button
                      onClick={() => {
                        onLocaleChange('tr');
                        setShowLocaleMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 transition-colors font-montserrat ${
                        locale === 'tr' ? 'font-bold' : ''
                      }`}
                      style={{
                        color: locale === 'tr' ? '#D4AF37' : '#E6E6E6',
                        backgroundColor: locale === 'tr' ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
                      }}
                      onMouseEnter={(e) => {
                        if (locale !== 'tr') {
                          e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.05)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (locale !== 'tr') {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      Türkçe
                    </button>
                    <button
                      onClick={() => {
                        onLocaleChange('en');
                        setShowLocaleMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 transition-colors font-montserrat ${
                        locale === 'en' ? 'font-bold' : ''
                      }`}
                      style={{
                        color: locale === 'en' ? '#D4AF37' : '#E6E6E6',
                        backgroundColor: locale === 'en' ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
                      }}
                      onMouseEnter={(e) => {
                        if (locale !== 'en') {
                          e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.05)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (locale !== 'en') {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      English
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
