import React from "react";
import { motion } from "framer-motion";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  children,
  className = "",
  onAnimationStart: _,
  onAnimationEnd: __,
  ...props
}) => {
  const baseStyles = "font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variantStyles = {
    primary: "bg-[#0F172A] text-white hover:bg-[#1e293b] focus:ring-[#0F172A]",
    secondary: "bg-[#00B4D8] text-white hover:bg-[#0099b8] focus:ring-[#00B4D8]",
    ghost: "bg-transparent text-[#1F2937] hover:bg-gray-100 focus:ring-gray-300",
    outline: "border-2 border-[#0F172A] text-[#0F172A] hover:bg-[#0F172A] hover:text-white focus:ring-[#0F172A]",
  };
  
  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };
  
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
};

