import React from "react";

interface PhoneMockProps {
  children?: React.ReactNode;
  className?: string;
}

export const PhoneMock: React.FC<PhoneMockProps> = ({
  children,
  className = "",
}) => {
  return (
    <div className={`relative ${className}`}>
      {/* iPhone Frame */}
      <div className="relative mx-auto w-full max-w-[290px] md:max-w-[320px] lg:max-w-[340px] aspect-[9/19.5] bg-[#0a0e1a] rounded-[2.5rem] p-[6px] shadow-[0_30px_80px_rgba(15,23,42,0.22)]">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#0a0e1a] rounded-b-2xl z-10" />
        
        {/* Screen */}
        <div className="w-full h-full bg-white rounded-[2rem] overflow-hidden relative">
          {children || (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <div className="text-gray-400 text-sm">Demo Menu</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

