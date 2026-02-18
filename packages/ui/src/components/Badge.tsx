import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "outline" | "highlight";
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  className = "",
}) => {
  const baseStyles = "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium";
  
  const variantStyles = {
    default: "bg-gray-100 text-[#1F2937]",
    outline: "border border-[#E5E7EB] text-[#1F2937] bg-transparent",
    highlight: "bg-[#0F172A] text-white",
  };
  
  return (
    <span className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
};

