"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { Activity, Zap } from 'lucide-react';

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
    <div className="space-y-6">
      {/* RPM Chart */}
      <div className="hud-panel p-4">
        <div className="flex items-center space-x-2 mb-4">
          <Zap className="w-3 h-3 text-crypto-primary" />
          <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">ENGINE_RPM_PROFILE</h2>
        </div>
        
        <div className="h-[220px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSpeed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
              <XAxis 
                dataKey="timeLabel" 
                stroke="rgba(0,242,255,0.2)" 
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'rgba(0,242,255,0.5)' }}
              />
              <YAxis 
                stroke="rgba(0,242,255,0.2)" 
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'rgba(0,242,255,0.5)' }}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(17, 24, 39, 0.8)', 
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '8px',
                  backdropFilter: 'blur(8px)'
                }}
                itemStyle={{ color: '#fff' }}
                formatter={(value: any) => [`${Math.round(value)} RPM`, '']}
              />
              <Area 
                type="monotone" 
                dataKey="rpm" 
                stroke="var(--color-crypto-primary)" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorSpeed)" 
                activeDot={{ r: 4, fill: 'var(--color-crypto-primary)', stroke: '#fff', strokeWidth: 1 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Acceleration Magnitude Chart */}
      <div className="bg-black/20 p-4 border border-white/5">
        <div className="flex items-center space-x-2 mb-4">
          <Activity className="w-3 h-3 text-crypto-accent" />
          <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">G-FORCE_MAG</h2>
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
