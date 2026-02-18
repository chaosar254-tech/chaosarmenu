import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  hover = false,
}) => {
  const hoverStyles = hover
    ? "transition-shadow hover:shadow-lg"
    : "";
  
  return (
    <div
      className={`bg-white rounded-lg border border-[#E5E7EB] p-6 ${hoverStyles} ${className}`}
    >
      {children}
    </div>
  );
};

