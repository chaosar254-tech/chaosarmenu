import React from "react";

export const HeroVeggieDecor: React.FC = () => {
  return (
    <>
      {/* Large Lettuce Leaf Silhouette - Lower Right, Behind Phone */}
      <svg
        className="pointer-events-none absolute right-[-80px] top-[60%] -translate-y-1/2 w-[400px] h-[300px] opacity-[0.08] blur-[1px] z-10"
        viewBox="0 0 300 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M30 100 Q70 50 110 80 Q150 110 190 80 Q230 50 270 80 Q290 100 280 70 L280 130 Q270 150 230 130 Q190 110 150 130 Q110 150 70 130 Q50 110 30 130 Z"
          fill="#ffffff"
        />
      </svg>

      {/* Tomato Slice / Organic Blob - Upper Right */}
      <svg
        className="pointer-events-none absolute right-[-40px] top-[20%] w-[180px] h-[180px] opacity-[0.07] blur-[0.5px] z-10"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="100" cy="100" r="70" fill="#ffffff" />
        <ellipse cx="100" cy="100" rx="50" ry="60" fill="#ffffff" opacity="0.5" />
      </svg>

      {/* Bubble Circles - Scattered, Upper Right Area */}
      <svg
        className="pointer-events-none absolute right-[-30px] top-[15%] w-[250px] h-[200px] opacity-[0.08] z-10"
        viewBox="0 0 250 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="40" cy="30" r="12" fill="#ffffff" />
        <circle cx="120" cy="50" r="10" fill="#ffffff" />
        <circle cx="180" cy="80" r="14" fill="#ffffff" />
        <circle cx="80" cy="100" r="11" fill="#ffffff" />
        <circle cx="200" cy="120" r="9" fill="#ffffff" />
        <circle cx="60" cy="140" r="13" fill="#ffffff" />
        <circle cx="150" cy="160" r="8" fill="#ffffff" />
        <circle cx="220" cy="40" r="10" fill="#ffffff" />
      </svg>

      {/* Additional Small Bubbles - Lower Right */}
      <svg
        className="pointer-events-none absolute right-[-20px] top-[70%] w-[180px] h-[150px] opacity-[0.06] z-10"
        viewBox="0 0 180 150"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="50" cy="40" r="9" fill="#ffffff" />
        <circle cx="120" cy="70" r="11" fill="#ffffff" />
        <circle cx="80" cy="100" r="8" fill="#ffffff" />
      </svg>
    </>
  );
};

