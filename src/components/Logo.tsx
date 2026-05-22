import React from 'react';
import { motion } from 'motion/react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  white?: boolean; // If true, logo is adapted for blue background (white seal with blue check). If false, it's blue seal with white check for light backgrounds.
  nameColor?: string;
  hideText?: boolean;
  animated?: boolean;
}

export default function Logo({ size = 'md', white = true, nameColor = 'text-white', hideText = false, animated = false }: LogoProps) {
  const sizes = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-14 w-14'
  };

  const textSizes = {
    sm: 'text-lg font-bold tracking-tight',
    md: 'text-2xl font-extrabold tracking-tight',
    lg: 'text-4xl font-extrabold tracking-tight'
  };

  return (
    <div className="flex items-center gap-1.5 flex-nowrap">
      <motion.div 
        initial={animated ? { scale: 0.5, opacity: 0, rotate: -45 } : { scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={animated ? { type: 'spring', damping: 15, stiffness: 100, delay: 0.1 } : undefined}
        whileHover={{ scale: 1.05 }}
        className={`${sizes[size]} flex items-center justify-center shrink-0`}
      >
        <svg 
          viewBox="0 0 100 100" 
          className="w-full h-full drop-shadow-md select-none" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Beautiful scalloped outer verified seal (12 round wavy parts) */}
          <path 
            d="M50 8
               C44.5 8 40.5 13 36 15
               C31.5 17 26 16.5 22.5 20
               C19 23.5 19.5 29 17.5 33.5
               C15.5 38 10.5 42 10.5 47.5
               C10.5 53 15.5 57 17.5 61.5
               C19.5 66 19 71.5 22.5 75
               C26 78.5 31.5 78 36 80
               C40.5 82 44.5 87 50 87
               C55.5 87 59.5 82 64 80
               C68.5 78 74 78.5 77.5 75
               C81 71.5 80.5 66 82.5 61.5
               C84.5 57 89.5 53 89.5 47.5
               C89.5 42 84.5 38 82.5 33.5
               C80.5 29 81 23.5 77.5 20
               C74 16.5 68.5 17 64 15
               C59.5 13 55.5 8 50 8 Z"
            className={`${white ? "fill-white" : "fill-blue-600"} transition-colors duration-200`}
          />

          {/* Bold centered checkmark - enlarged and thickened for better visualization */}
          <motion.path 
            initial={animated ? { pathLength: 0 } : undefined}
            animate={{ pathLength: 1 }}
            transition={animated ? { duration: 0.5, delay: 0.4, ease: "easeInOut" } : undefined}
            d="M30 48 L44 62 L70 32" 
            className={`${white ? "stroke-blue-600 animate-pulse" : "stroke-white"} transition-colors duration-200`} 
            strokeWidth="11" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        </svg>
      </motion.div>
      {!hideText && (
        <span className={`font-rounded ${textSizes[size]} ${nameColor} transition-all duration-200 whitespace-nowrap flex items-center`}>
          {animated ? (
            "Avalia-me".split("").map((char, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, y: 3, filter: "blur(2px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{
                  duration: 0.22,
                  delay: 0.5 + index * 0.05, // Starts typing right after the checkmark finishes drawing
                  ease: [0.215, 0.610, 0.355, 1.000], 
                }}
              >
                {char}
              </motion.span>
            ))
          ) : (
            "Avalia-me"
          )}
        </span>
      )}
    </div>
  );
}

