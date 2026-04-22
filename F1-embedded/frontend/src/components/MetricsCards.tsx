"use client";

import { motion } from 'framer-motion';
import { Activity, Thermometer, Droplets, Zap } from 'lucide-react';

interface MetricsCardsProps {
  latestData: {
    rpm: number;
    temperature: number;
    humidity: number;
    acc_mag: number;
    ax: number;
    ay: number;
  } | null;
}

export default function MetricsCards({ latestData }: MetricsCardsProps) {
  if (!latestData) return null;

  const cards = [
    {
      title: "CORE TEMP",
      value: latestData.temperature.toFixed(1),
      unit: "°C",
      icon: <Thermometer className="w-4 h-4 text-rose-500" />,
      color: "text-rose-500"
    },
    {
      title: "HUMIDITY",
      value: latestData.humidity.toFixed(1),
      unit: "%",
      icon: <Droplets className="w-4 h-4 text-blue-500" />,
      color: "text-blue-500"
    },
    {
      title: "G-MAG",
      value: latestData.acc_mag?.toFixed(2) || "0.00",
      unit: "G",
      icon: <Zap className="w-4 h-4 text-yellow-500" />,
      color: "text-yellow-500"
    },
    {
      title: "LAT-G (ay)",
      value: latestData.ay?.toFixed(3) || "0.000",
      unit: "G",
      icon: <Activity className="w-4 h-4 text-purple-400" />,
      color: "text-purple-400"
    },
    {
      title: "LON-G (ax)",
      value: latestData.ax?.toFixed(3) || "0.000",
      unit: "G",
      icon: <Activity className="w-4 h-4 text-orange-400" />,
      color: "text-orange-400"
    }
  ];

  return (
    <div className="flex flex-wrap gap-4">
      {cards.map((card, idx) => (
        <motion.div 
          key={idx} 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="hud-panel p-4 flex-1 min-w-[150px] group transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[10px] font-bold tracking-widest ${card.color}`}>{card.title}</span>
            <div className="opacity-70">{card.icon}</div>
          </div>
          
          <div className="flex items-baseline space-x-1">
            <h3 className="text-2xl font-black text-white glow-cyan">
              {card.value}
            </h3>
            <span className={`text-[10px] font-bold opacity-50 ${card.color}`}>
              {card.unit}
            </span>
          </div>

          {/* Decorative scanner line */}
          <div className="mt-2 h-[2px] w-full bg-white/5 relative overflow-hidden">
            <motion.div 
              animate={{ x: ["-100%", "100%"] }}
              transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
              className="absolute inset-0 w-1/2 bg-crypto-primary/30 blur-[2px]"
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
