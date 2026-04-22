"use client";

import { motion } from 'framer-motion';

interface RPMGaugeProps {
  value: number;
  speed: number;
  min?: number;
  max?: number;
}

export default function RPMGauge({ value, speed, min = 0, max = 8000 }: RPMGaugeProps) {
  const percentage = Math.min(Math.max((value - min) / (max - min), 0), 1);
  const radius = 80;
  const strokeWidth = 12;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - percentage * circumference;

  // Color mapping
  const getColor = () => {
    if (percentage > 0.9) return "var(--color-metric-red)";
    if (percentage > 0.7) return "var(--color-metric-yellow)";
    return "var(--color-crypto-primary)";
  };

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg
        height={radius * 2}
        width={radius * 2}
        className="transform -rotate-90"
      >
        {/* Background Track */}
        <circle
          stroke="rgba(255, 255, 255, 0.05)"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        {/* Progress Arc */}
        <motion.circle
          stroke={getColor()}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference + ' ' + circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ type: "spring", stiffness: 50, damping: 20 }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="glow-cyan"
        />
      </svg>
      
      {/* Central Readout */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span 
          key={Math.round(value)}
          initial={{ scale: 0.8, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-4xl font-black text-white tracking-tighter"
        >
          {Math.round(value)}
        </motion.span>
        <span className="text-[10px] font-bold text-crypto-primary uppercase tracking-[0.2em] -mt-1">
          RPM
        </span>
        
        {/* Speed Sub-readout */}
        <div className="mt-4 flex flex-col items-center">
          <motion.span 
            key={speed.toFixed(1)}
            initial={{ y: 5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-xl font-black text-metric-yellow"
          >
            {speed.toFixed(1)}
          </motion.span>
          <span className="text-[8px] font-bold text-metric-yellow/50 uppercase tracking-widest">
            KM/H
          </span>
        </div>
      </div>

      {/* Technical Accents */}
      <div className="absolute -bottom-4 w-full flex justify-between px-2 text-[8px] font-mono text-crypto-primary/40">
        <span>0</span>
        <span>IDLE</span>
        <span>MAX</span>
      </div>
    </div>
  );
}
