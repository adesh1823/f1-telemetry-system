"use client";

import { Brain, AlertOctagon, TrendingUp, Thermometer } from 'lucide-react';
import { motion } from 'framer-motion';

interface InsightsBoardProps {
  insights: {
    driver_behavior: string;
    anomaly_status: string;
  } | null;
  prediction: {
    predicted_speed: number;
  } | null;
  currentData: {
    temperature: number;
  } | null;
}

export default function InsightsBoard({ insights, prediction }: InsightsBoardProps) {
  const behavior = insights?.driver_behavior || "CALIBRATING";
  const anomaly = insights?.anomaly_status || "STABLE";
  const nextSpeed = prediction?.predicted_speed || 0;

  const behaviorColors: Record<string, string> = {
    "Smooth": "text-metric-green",
    "Aggressive": "text-metric-yellow",
    "Braking": "text-metric-red",
    "CALIBRATING": "text-crypto-primary/60"
  };
  
  const bColor = behaviorColors[behavior] || "text-crypto-primary";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
      {/* Classification Readout */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="hud-panel p-6 border-l-4 border-l-crypto-accent"
      >
        <div className="text-[10px] text-crypto-accent mb-4 tracking-[0.3em] font-bold">NEURAL_CLASSIFICATION // STR_01</div>
        <div className="space-y-6">
          <div>
            <div className="text-[9px] text-crypto-accent/60 mb-1">BEHAVIOR_PROFILE</div>
            <div className={`text-2xl font-black uppercase tracking-tighter ${bColor}`}>
              {behavior}
            </div>
          </div>
          <div className="h-1 w-full bg-white/5 overflow-hidden">
            <motion.div 
              animate={{ x: ["-100%", "100%"] }}
              transition={{ repeat: Infinity, duration: 2, ease: "anticipate" }}
              className="h-full w-1/4 bg-crypto-accent"
            />
          </div>
        </div>
      </motion.div>

      {/* Predictive Core */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="hud-panel p-6 border-l-4 border-l-crypto-primary"
      >
        <div className="text-[10px] text-crypto-primary mb-4 tracking-[0.3em] font-bold">PREDICTIVE_LOGIC // TRJ_04</div>
        <div className="flex flex-col items-center justify-center h-full -mt-2">
           <div className="text-[9px] text-crypto-primary/60">FORECAST_RPM_T+1</div>
           <div className="text-4xl font-black text-white glow-cyan tracking-tighter">
             {Math.round(nextSpeed)}
           </div>
           <div className="w-full mt-2 flex justify-between gap-1">
             {[1,2,3,4,5,6,7,8].map(i => (
               <div key={i} className={`h-1 flex-1 ${i < 5 ? 'bg-crypto-primary opacity-50' : 'bg-white/5'}`}></div>
             ))}
           </div>
        </div>
      </motion.div>

      {/* Anomaly Watchdog */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className={`hud-panel p-6 border-l-4 ${anomaly === 'Critical' ? 'border-l-metric-red bg-metric-red/5' : 'border-l-metric-green/40'}`}
      >
        <div className="text-[10px] text-metric-green mb-4 tracking-[0.3em] font-bold">INTEGRITY_WATCHDOG // ERR_00</div>
        <div className="flex justify-between items-center mb-6">
          <span className="text-[9px] text-metric-green/60">ANOMALY_STATUS</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${anomaly === 'Critical' ? 'bg-metric-red text-white' : 'bg-metric-green/10 text-metric-green'}`}>
            {anomaly.toUpperCase()}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[8px] text-metric-green/50 italic">
            <span>BIT_STREAM_7</span>
            <span className="text-metric-green">OK</span>
          </div>
          <div className="flex items-center justify-between text-[8px] text-metric-green/50 italic">
            <span>ML_SYNC_LOCK</span>
            <span className="text-metric-green">TRUE</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
