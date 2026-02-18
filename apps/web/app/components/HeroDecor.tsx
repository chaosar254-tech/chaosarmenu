import React from "react";

export const HeroDecor: React.FC = () => {
  return (
    <>
      {/* Large lettuce leaf - prominent, behind phone */}
      <svg
        className="pointer-events-none absolute right-[-120px] top-[55%] -translate-y-1/2 w-[450px] h-[350px] opacity-[0.25] blur-[3px] z-10"
        viewBox="0 0 300 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M30 80 Q60 40 90 60 Q120 80 150 60 Q180 40 210 60 Q240 80 270 60 L270 120 Q240 140 210 120 Q180 100 150 120 Q120 140 90 120 Q60 100 30 120 Z"
          fill="#ffffff"
        />
      </svg>

      {/* Tomato shape - upper right */}
      <svg
        className="pointer-events-none absolute right-[-60px] top-[20%] w-[180px] h-[180px] opacity-[0.20] blur-[2px] z-10"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="100" cy="100" r="80" fill="#ffffff" />
        <ellipse cx="100" cy="100" rx="60" ry="70" fill="#ffffff" opacity="0.6" />
      </svg>

      {/* Olive shapes - scattered */}
      <svg
        className="pointer-events-none absolute right-[-40px] top-[40%] w-[150px] h-[200px] opacity-[0.18] blur-[1px] z-10"
        viewBox="0 0 150 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <ellipse cx="60" cy="50" rx="12" ry="18" fill="#ffffff" />
        <ellipse cx="100" cy="80" rx="10" ry="15" fill="#ffffff" />
        <ellipse cx="80" cy="130" rx="11" ry="16" fill="#ffffff" />
        <ellipse cx="120" cy="150" rx="9" ry="14" fill="#ffffff" />
      </svg>

      {/* Water bubbles - multiple sizes, floating */}
      <svg
        className="pointer-events-none absolute right-[-80px] top-[25%] w-[300px] h-[250px] opacity-[0.22] z-10"
        viewBox="0 0 300 250"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="50" cy="40" r="28" fill="#ffffff" />
        <circle cx="150" cy="60" r="22" fill="#ffffff" />
        <circle cx="220" cy="90" r="20" fill="#ffffff" />
        <circle cx="80" cy="120" r="24" fill="#ffffff" />
        <circle cx="200" cy="140" r="18" fill="#ffffff" />
        <circle cx="120" cy="180" r="16" fill="#ffffff" />
        <circle cx="250" cy="200" r="14" fill="#ffffff" />
        <ellipse cx="180" cy="30" rx="20" ry="16" fill="#ffffff" />
        <ellipse cx="100" cy="100" rx="18" ry="14" fill="#ffffff" />
      </svg>

      {/* More bubbles - lower area */}
      <svg
        className="pointer-events-none absolute right-[-50px] top-[65%] w-[250px] h-[200px] opacity-[0.20] z-10"
        viewBox="0 0 250 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="70" cy="50" r="19" fill="#ffffff" />
        <circle cx="150" cy="80" r="15" fill="#ffffff" />
        <circle cx="100" cy="120" r="17" fill="#ffffff" />
        <circle cx="200" cy="150" r="13" fill="#ffffff" />
        <ellipse cx="130" cy="30" rx="16" ry="12" fill="#ffffff" />
      </svg>

      {/* Additional lettuce leaves - smaller */}
      <svg
        className="pointer-events-none absolute right-[-90px] top-[45%] w-[280px] h-[180px] opacity-[0.18] blur-[2px] z-10"
        viewBox="0 0 280 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M20 70 Q45 35 70 55 Q95 75 120 55 Q145 35 170 55 Q195 75 220 55 L220 95 Q195 115 170 95 Q145 75 120 95 Q95 115 70 95 Q45 75 20 95 Z"
          fill="#ffffff"
        />
      </svg>
    </>
  );
};

