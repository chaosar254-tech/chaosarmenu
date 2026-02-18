"use client";

import React from "react";

export function SkeletonCard() {
  return (
    <div className="rounded-xl border p-4 animate-pulse flex flex-row gap-4" style={{ borderColor: 'rgba(255, 255, 255, 0.1)', backgroundColor: 'rgba(10, 25, 47, 0.7)' }}>
      {/* Left Side: Image */}
      <div className="flex-shrink-0">
        <div className="w-28 h-28 rounded-xl skeleton aspect-square" style={{ backgroundColor: '#0A192F', width: '112px', height: '112px' }} />
      </div>
      {/* Right Side: Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <div className="h-6 rounded-lg mb-2 skeleton w-3/4" style={{ backgroundColor: '#0A192F' }} />
          <div className="h-4 rounded skeleton w-full mb-1" style={{ backgroundColor: '#0A192F' }} />
          <div className="h-4 rounded skeleton w-2/3 mb-2" style={{ backgroundColor: '#0A192F' }} />
        </div>
        <div className="h-6 rounded-lg skeleton w-1/4" style={{ backgroundColor: '#0A192F' }} />
      </div>
    </div>
  );
}
