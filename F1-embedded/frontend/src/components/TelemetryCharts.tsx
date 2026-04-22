"use client";

import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  Line,
  LineChart,
  Legend
} from 'recharts';
import { Activity, Zap, Gauge } from 'lucide-react';

interface TelemetryChartsProps {
  data: any[];
}

export default function TelemetryCharts({ data }: TelemetryChartsProps) {
  // Format data for charts
  const chartData = data.map((d) => {
    const timestamp = new Date(d.timestamp);
    return {
      ...d,
      timeLabel: `${timestamp.getHours()}:${timestamp.getMinutes().toString().padStart(2, '0')}:${timestamp.getSeconds().toString().padStart(2, '0')}`
    };
  });

  return (
    <div className="space-y-4">
      {/* RPM + Speed Combined Chart */}
      <div className="hud-panel p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Zap className="w-3 h-3 text-crypto-primary" />
            <h2 className="text-[10px] font-bold text-crypto-primary uppercase tracking-widest">ENGINE_RPM_PROFILE</h2>
          </div>
          <div className="flex items-center gap-4 text-[9px]">
            <span className="flex items-center gap-1"><span className="w-3 h-[2px] bg-crypto-primary inline-block"></span> RPM</span>
            <span className="flex items-center gap-1 text-metric-yellow"><span className="w-3 h-[2px] bg-metric-yellow inline-block"></span> km/h</span>
          </div>
        </div>
        
        <div className="h-[220px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 40, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRpm" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00f2ff" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#00f2ff" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorSpeedKmh" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ffcc00" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#ffcc00" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="timeLabel" 
                stroke="rgba(0,242,255,0.2)" 
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'rgba(0,242,255,0.5)' }}
              />
              {/* Left Y-axis: RPM */}
              <YAxis 
                yAxisId="rpm"
                stroke="rgba(0,242,255,0.2)" 
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'rgba(0,242,255,0.5)' }}
              />
              {/* Right Y-axis: km/h */}
              <YAxis 
                yAxisId="speed"
                orientation="right"
                stroke="rgba(255,204,0,0.2)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'rgba(255,204,0,0.5)' }}
                tickFormatter={(v) => `${v}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(5, 8, 15, 0.95)', 
                  border: '1px solid rgba(0, 242, 255, 0.2)',
                  borderRadius: '4px',
                  fontSize: '10px'
                }}
                itemStyle={{ color: '#fff' }}
                formatter={(value: any, name: unknown) => [
                  name === 'rpm' ? `${Math.round(value)} RPM` : `${Number(value).toFixed(1)} km/h`,
                  name === 'rpm' ? 'RPM' : 'Speed'
                ]}
              />
              <Area 
                yAxisId="rpm"
                type="monotone" 
                dataKey="rpm" 
                stroke="var(--color-crypto-primary)" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorRpm)" 
                dot={false}
                activeDot={{ r: 3, fill: 'var(--color-crypto-primary)' }}
              />
              <Area 
                yAxisId="speed"
                type="monotone" 
                dataKey="speed_kmh" 
                stroke="var(--color-metric-yellow)" 
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorSpeedKmh)"
                dot={false}
                activeDot={{ r: 3, fill: 'var(--color-metric-yellow)' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Acceleration Magnitude Chart */}
      <div className="bg-black/20 p-4 border border-white/5">
        <div className="flex items-center space-x-2 mb-4">
          <Activity className="w-3 h-3 text-crypto-accent" />
          <h2 className="text-[10px] font-bold text-crypto-accent uppercase tracking-widest">G-FORCE_MAG</h2>
        </div>
        
        <div className="h-[120px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="timeLabel" hide />
              <YAxis hide domain={[0, 4]} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(10, 15, 25, 0.9)', 
                  border: '1px solid rgba(0, 242, 255, 0.2)',
                  fontSize: '10px'
                }}
              />
              <Line 
                type="stepAfter" 
                dataKey="acc_mag" 
                stroke="var(--color-crypto-accent)" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
