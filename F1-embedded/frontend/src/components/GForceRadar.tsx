"use client";

import { motion } from 'framer-motion';

interface GForceRadarProps {
  ax: number;
  ay: number;
}

export default function GForceRadar({ ax, ay }: GForceRadarProps) {
  // Normalize and scale G-Force for visual representation
  // Sensitivity: 2G limit for full scale
  const scale = 40; 
  const x = Math.min(Math.max(ay * scale, -45), 45); // Lateral
  const y = Math.min(Math.max(-ax * scale, -45), 45); // Longitudinal

  return (
    <div className="relative w-40 h-40 flex items-center justify-center border border-white/5 rounded-full bg-black/20">
      {/* Grid Lines */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10">
        <div className="w-full h-[1px] bg-white"></div>
        <div className="h-full w-[1px] bg-white"></div>
        <div className="absolute w-[70%] h-[70%] border border-white rounded-full"></div>
      </div>

      {/* Axis Labels */}
      <div className="absolute -top-2 text-[8px] font-mono text-crypto-primary/60">LON+</div>
      <div className="absolute -bottom-2 text-[8px] font-mono text-crypto-primary/60">LON-</div>
      <div className="absolute -left-2 text-[8px] font-mono text-crypto-primary/60 rotate-90">LAT-</div>
      <div className="absolute -right-2 text-[8px] font-mono text-crypto-primary/60 -rotate-90">LAT+</div>

      {/* Vector Point */}
      <motion.div
        animate={{ x, y }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        className="w-3 h-3 rounded-full bg-crypto-accent shadow-[0_0_15px_rgba(255,0,85,0.8)] z-10"
      />

      {/* Trailing Path (Synthetic) */}
      <motion.div
        animate={{ x, y }}
        className="absolute w-2 h-2 rounded-full bg-crypto-accent/20 blur-[2px]"
      />
      
      <div className="absolute bottom-2 right-2 text-[8px] font-bold text-crypto-accent">
        G-FORCE / VEC
      </div>
    </div>
  );
}
