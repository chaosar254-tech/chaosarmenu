import React from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

export const ScrollHint: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 0.4, y: 0 }}
      transition={{ 
        duration: 1, 
        repeat: Infinity, 
        repeatType: "reverse",
        ease: "easeInOut"
      }}
      className="flex flex-col items-center gap-2 mt-8"
    >
      <span className="text-sm text-[#1F2937]">Aşağı kaydır</span>
      <ChevronDown className="w-5 h-5 text-[#1F2937]" />
    </motion.div>
  );
};

