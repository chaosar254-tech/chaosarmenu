"use client";

import React from "react";
import { PhoneMock } from "@chaosar/ui";
import { Button, Card } from "@chaosar/ui";

export const HeroRightVisual: React.FC = () => {
  return (
    <div className="relative isolate flex items-center justify-center overflow-visible min-h-[500px] md:min-h-[600px]">
      {/* Phone Wrapper - Contains all layers */}
      <div className="relative z-20 w-full max-w-[290px] md:max-w-[320px] lg:max-w-[340px]">
        
        {/* Layer 1: Navy Depth Glow (z-0) */}
        <div className="absolute -inset-24 flex items-center justify-center pointer-events-none z-0">
          <div className="w-[760px] h-[540px] bg-[#0F172A] rounded-full blur-[140px] opacity-[0.18]" />
        </div>

        {/* Layer 2: Light Blue Mist Glow (z-0) */}
        <div className="absolute -inset-24 flex items-center justify-center pointer-events-none z-0">
          <div 
            className="w-[650px] h-[650px] rounded-full blur-[90px] translate-x-16 opacity-[0.22]"
            style={{
              background: 'radial-gradient(circle, rgba(0,180,216,0.35) 0%, rgba(0,180,216,0.20) 30%, transparent 70%)',
            }}
          />
        </div>

        {/* Layer 3: Veggie Silhouettes (z-10) */}
        {/* Large Lettuce Leaf - Lower Right */}
        <div className="absolute -inset-24 flex items-center justify-center pointer-events-none z-10">
          <svg
            className="w-[450px] h-[350px] translate-x-12 translate-y-16"
            viewBox="0 0 300 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M30 100 Q70 50 110 80 Q150 110 190 80 Q230 50 270 80 Q290 100 280 70 L280 130 Q270 150 230 130 Q190 110 150 130 Q110 150 70 130 Q50 110 30 130 Z"
              fill="rgba(255,255,255,0.08)"
            />
          </svg>
        </div>

        {/* Tomato/Organic Blob - Upper Right */}
        <div className="absolute -inset-24 flex items-center justify-center pointer-events-none z-10">
          <svg
            className="w-[200px] h-[200px] translate-x-20 -translate-y-20"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="100" cy="100" r="75" fill="rgba(255,255,255,0.06)" />
            <ellipse cx="100" cy="100" rx="55" ry="65" fill="rgba(255,255,255,0.04)" />
          </svg>
        </div>

        {/* Layer 4: Bubble Circles (z-10) */}
        <div className="absolute -inset-24 pointer-events-none z-10">
          {/* Bubble 1 - Upper Right */}
          <div className="absolute right-[-40px] top-[10%] w-12 h-12 bg-white/10 rounded-full blur-sm" />
          {/* Bubble 2 */}
          <div className="absolute right-[-20px] top-[15%] w-8 h-8 bg-white/10 rounded-full blur-sm" />
          {/* Bubble 3 */}
          <div className="absolute right-[-60px] top-[25%] w-16 h-16 bg-white/10 rounded-full blur-sm" />
          {/* Bubble 4 */}
          <div className="absolute right-[-30px] top-[30%] w-10 h-10 bg-white/10 rounded-full blur-sm" />
          {/* Bubble 5 */}
          <div className="absolute right-[-50px] top-[35%] w-14 h-14 bg-white/10 rounded-full blur-sm" />
          {/* Bubble 6 */}
          <div className="absolute right-[-25px] top-[20%] w-6 h-6 bg-white/10 rounded-full blur-sm" />
          {/* Bubble 7 */}
          <div className="absolute right-[-45px] top-[40%] w-12 h-12 bg-white/10 rounded-full blur-sm" />
          {/* Bubble 8 */}
          <div className="absolute right-[-15px] top-[28%] w-9 h-9 bg-white/10 rounded-full blur-sm" />
          {/* Bubble 9 - Larger */}
          <div className="absolute right-[-35px] top-[18%] w-20 h-20 bg-white/10 rounded-full blur-sm" />
          {/* Bubble 10 */}
          <div className="absolute right-[-55px] top-[32%] w-11 h-11 bg-white/10 rounded-full blur-sm" />
          {/* Bubble 11 */}
          <div className="absolute right-[-25px] top-[45%] w-7 h-7 bg-white/10 rounded-full blur-sm" />
          {/* Bubble 12 */}
          <div className="absolute right-[-40px] top-[22%] w-13 h-13 bg-white/10 rounded-full blur-sm" />
        </div>

        {/* Layer 5: Phone Mockup (z-30) */}
        <div className="relative z-30">
          <PhoneMock>
            <div className="w-full h-full bg-white overflow-y-auto">
              <div className="p-4 bg-gray-50 border-b">
                <h3 className="font-semibold text-sm">Demo Burger</h3>
                <p className="text-xs text-gray-500">by ChaosAR</p>
              </div>
              <div className="p-4 space-y-3">
                <Card className="p-4">
                  <div className="h-32 bg-gray-200 rounded mb-2" />
                  <h4 className="font-semibold">Classic Burger</h4>
                  <p className="text-sm text-gray-600 mb-2">₺145</p>
                  <Button variant="ghost" size="sm" className="w-full" disabled>
                    AR'de Gör
                  </Button>
                </Card>
                <Card className="p-4">
                  <div className="h-32 bg-gray-200 rounded mb-2" />
                  <h4 className="font-semibold">Pepperoni Pizza</h4>
                  <p className="text-sm text-gray-600 mb-2">₺165</p>
                  <Button variant="ghost" size="sm" className="w-full" disabled>
                    AR'de Gör
                  </Button>
                </Card>
              </div>
            </div>
          </PhoneMock>
        </div>
      </div>
    </div>
  );
};

