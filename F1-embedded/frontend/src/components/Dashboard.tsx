"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import MetricsCards from './MetricsCards';
import TelemetryCharts from './TelemetryCharts';
import InsightsBoard from './InsightsBoard';
import RPMGauge from './RPMGauge';
import GForceRadar from './GForceRadar';

const API_BASE = "https://adeshjain-f1-telemetry.hf.space";
const POLL_INTERVAL = 5000;   // 5 seconds
const MAX_POINTS    = 30;     // rolling window size

export default function Dashboard() {
  const [data, setData] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(POLL_INTERVAL / 1000);
  const seenTimestamps = useRef<Set<string>>(new Set());

  const fetchDashboardData = useCallback(async () => {
    const results: any = {};
    let hasError = false;

    // Fetch all endpoints in parallel for speed
    await Promise.all(['data', 'metrics', 'ai', 'predict'].map(async (endpoint) => {
      try {
        const response = await fetch(`${API_BASE}/${endpoint}`);
        if (!response.ok) { hasError = true; return; }
        results[endpoint] = await response.json();
      } catch {
        hasError = true;
      }
    }));

    if (results.data) {
      const incoming: any[] = results.data.data || [];
      // Append only NEW points (deduplicate by timestamp)
      const newPoints = incoming.filter(
        (p: any) => p.timestamp && !seenTimestamps.current.has(p.timestamp)
      );
      newPoints.forEach((p: any) => seenTimestamps.current.add(p.timestamp));

      if (newPoints.length > 0) {
        setData(prev => {
          const merged = [...prev, ...newPoints];
          // Keep only the last MAX_POINTS for the chart
          return merged.slice(-MAX_POINTS);
        });
      } else if (data.length === 0) {
        // First load — seed with whatever came back
        const seed = incoming.slice(-MAX_POINTS);
        seed.forEach((p: any) => p.timestamp && seenTimestamps.current.add(p.timestamp));
        setData(seed);
      }
    }

    if (results.metrics) setMetrics(results.metrics);
    if (results.ai) setAiInsights(results.ai);
    if (results.predict) setPrediction(results.predict);
    if (hasError && data.length === 0) setError("Failed to connect to backend.");
    else setError(null);
    if (loading) setLoading(false);
    setCountdown(POLL_INTERVAL / 1000);
  }, [loading, data.length]);

  useEffect(() => {
    fetchDashboardData();
    const poll = setInterval(fetchDashboardData, POLL_INTERVAL);
    return () => clearInterval(poll);
  }, [fetchDashboardData]);

  // Countdown ticker
  useEffect(() => {
    const tick = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(tick);
  }, []);

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-crypto-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-crypto-primary font-black tracking-[0.5em] text-xs animate-pulse">
          LINKING NEURAL UPLINK...
        </p>
      </div>
    );
  }

  const latestData = data[data.length - 1];

  return (
    <div className="flex flex-col h-screen w-full bg-[#02040a] font-mono overflow-hidden">
      {/* HUD Header - Denser, top edge */}
      <header className="flex-none p-2 border-b border-crypto-primary/20 bg-black/50 flex justify-between items-center z-10 relative">
        <div className="flex items-center space-x-4 pl-2">
          <div className="animate-pulse w-2 h-2 rounded-full bg-metric-red"></div>
          <h1 className="text-xl font-black italic tracking-tighter text-white uppercase m-0 leading-none">
            NEXUS <span className="text-crypto-primary">SYS</span>
          </h1>
          <span className="text-[9px] text-crypto-primary/50 uppercase tracking-widest hidden sm:inline ml-4 border-l border-crypto-primary/20 pl-4 h-4 flex items-center">
            FW_VER: 4.2.0 // STATUS: NOMINAL
          </span>
        </div>
        <div className="flex gap-6 pr-2">
          <div className="flex items-center gap-2">
             <span className="text-[9px] text-crypto-primary/50 uppercase font-bold">LATENCY</span>
             <span className="text-[10px] text-crypto-primary font-bold">12ms</span>
          </div>
          <div className="flex items-center gap-2">
             <span className="text-[9px] text-crypto-primary/50 uppercase font-bold">UPLINK</span>
             <span className={latestData ? "text-[10px] text-metric-green font-bold" : "text-[10px] text-metric-red font-bold"}>
                 {latestData ? "ACTIVE" : "OFFLINE"}
             </span>
          </div>
        </div>
      </header>

      {/* Main Dense Grid */}
      <div className="flex-1 overflow-auto p-2">
        <div className="grid grid-cols-1 md:grid-cols-12 grid-rows-[auto_1fr] gap-2 h-full">

          {/* Top Row: AI Insights (Spans all columns) */}
          <div className="md:col-span-12">
            <InsightsBoard insights={aiInsights} prediction={prediction} currentData={latestData} />
          </div>

          {/* Left Column: Gauges (Span 4) */}
          <div className="md:col-span-4 hud-panel flex flex-col justify-around items-center p-4">
            <div className="w-full flex justify-between items-start mb-2">
              <span className="text-[9px] text-crypto-primary tracking-widest uppercase">SYS_GAUGE_01</span>
              <span className="text-[9px] text-metric-green font-bold">● LIVE</span>
            </div>
            <RPMGauge value={latestData?.rpm || 0} speed={latestData?.speed_kmh || 0} />
            
            <div className="w-full h-[1px] bg-white/5 my-4"></div>
            
            <GForceRadar ax={latestData?.ax || 0} ay={latestData?.ay || 0} />
          </div>

          {/* Center/Right Column: Charts & Metrics (Span 8) */}
          <div className="md:col-span-8 flex flex-col gap-2">
            
            {/* Raw Sensors */}
            <div className="w-full">
              <MetricsCards latestData={latestData} />
            </div>

            {/* Time-Series Charts */}
            <div className="flex-1 hud-panel p-2 min-h-[300px]">
               <div className="flex justify-between items-center mb-2 px-2 pb-2 border-b border-white/5">
                 <span className="text-[9px] text-crypto-primary tracking-widest uppercase">SYS_TRACE_02</span>
                 <div className="flex items-center gap-3">
                   <span className="text-[9px] text-crypto-primary/50">HISTORY_BUFFER // {data.length}pts</span>
                   <span className="text-[9px] text-metric-green font-bold tabular-nums">↻ {countdown}s</span>
                 </div>
               </div>
               <TelemetryCharts data={data} />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
