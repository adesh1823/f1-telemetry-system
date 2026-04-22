"use client";

import { useState, useEffect } from 'react';
import MetricsCards from './MetricsCards';
import TelemetryCharts from './TelemetryCharts';
import InsightsBoard from './InsightsBoard';
import RPMGauge from './RPMGauge';
import GForceRadar from './GForceRadar';

const API_BASE = "http://localhost:8000";

export default function Dashboard() {
  const [data, setData] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    const endpoints = ['data', 'metrics', 'ai', 'predict'];
    const results: any = {};
    let hasError = false;

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${API_BASE}/${endpoint}`);
        if (!response.ok) {
          console.error(`Endpoint ${endpoint} returned status ${response.status}`);
          hasError = true;
          continue;
        }
        results[endpoint] = await response.json();
      } catch (err) {
        console.error(`Failed to fetch ${endpoint}:`, err);
        hasError = true;
      }
    }

    if (results.data) setData(results.data.data || []);
    if (results.metrics) setMetrics(results.metrics);
    if (results.ai) setAiInsights(results.ai);
    if (results.predict) setPrediction(results.predict);

    if (hasError && !results.data) {
      setError("Failed to connect to backend telemetry service.");
    } else {
      setError(null);
    }
    
    if (loading) setLoading(false);
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 15000);
    return () => clearInterval(interval);
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
            <RPMGauge value={latestData?.rpm || 0} />
            
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
                 <span className="text-[9px] text-crypto-primary/50">HISTORY_BUFFER</span>
               </div>
               <TelemetryCharts data={data} />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
