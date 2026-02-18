"use client";

import React from "react";
import Image from "next/image";

interface IPhoneMenuMockProps {
  className?: string;
}

export const IPhoneMenuMock: React.FC<IPhoneMenuMockProps> = ({
  className = "",
}) => {
  return (
    <div className={`relative mx-auto ${className}`}>
      {/* iPhone Frame */}
      <div className="relative w-full aspect-[9/19] bg-gradient-to-b from-gray-800 to-gray-900 rounded-[2.5rem] p-[6px] shadow-[0_30px_80px_rgba(15,23,42,0.35)]">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gradient-to-b from-gray-800 to-gray-900 rounded-b-2xl z-10" />
        
        {/* Screen */}
        <div className="w-full h-full bg-white rounded-[2rem] overflow-hidden relative">
          {/* Header */}
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <h3 className="font-semibold text-sm text-gray-900">Demo Burger</h3>
            <p className="text-xs text-gray-500">by ChaosAR</p>
          </div>
          
          {/* Menu Content */}
          <div className="p-3 sm:p-4 space-y-2 sm:space-y-3 bg-white overflow-y-auto h-full">
            {/* Classic Burger Card */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="relative w-full h-20 sm:h-24">
                <Image
                  src="/burger.jpg"
                  alt="Classic Burger"
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 96px"
                  priority
                />
              </div>
              <div className="p-3 sm:p-3">
                <h4 className="font-semibold text-sm text-gray-900">Classic Burger</h4>
                <p className="text-sm text-[#0F172A] font-semibold">₺145</p>
                <button className="w-full py-2 px-3 text-xs font-semibold text-white bg-[#0F172A] rounded-lg flex items-center justify-center gap-2">
  AR'de Gör

  {/* AR Cube SVG */}
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-4 h-4"
  >
    <path d="M12 2 21 7 12 12 3 7 12 2Z" />
    <path d="M21 7v10l-9 5" />
    <path d="M3 7v10l9 5" />
    <path d="M12 12v10" />
  </svg>

</button>
              </div>
            </div>

            {/* Pepperoni Pizza Card */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="relative w-full h-20 sm:h-24">
                <Image
                  src="/pizza.jpg"
                  alt="Pepperoni Pizza"
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 96px"
                  priority
                />
              </div>
              <div className="p-3 sm:p-3">
                <h4 className="font-semibold text-sm text-gray-900">Pepperoni Pizza</h4>
                <p className="text-sm text-[#0F172A] font-semibold">₺165</p>
                <button
  className="
    w-full
    py-2 px-3
    text-xs
    font-semibold text-white bg-[#0F172A] rounded-lg flex items-center justify-center gap-2">
  <span className="leading-none">AR'de Gör</span>

  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-4 h-4 shrink-0"
  >
    <path d="M12 2 21 7 12 12 3 7 12 2Z" />
    <path d="M21 7v10l-9 5" />
    <path d="M3 7v10l9 5" />
    <path d="M12 12v10" />
  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

