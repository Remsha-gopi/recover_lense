import React from "react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from "recharts";

export default function RecoveryFingerprint({ data, height = 280 }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="w-full flex items-center justify-center">
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#334155" />
          <PolarAngleAxis
            dataKey="subject"
            stroke="#94a3b8"
            tick={{ fill: "#cbd5e1", fontSize: 11, fontWeight: 500 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            stroke="#475569"
            tick={{ fill: "#64748b", fontSize: 9 }}
          />
          <Radar
            name="Patient Baseline"
            dataKey="value"
            stroke="#14b8a6"
            fill="#0d9488"
            fillOpacity={0.45}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-lg shadow-xl text-xs">
                    <span className="font-semibold text-white block">
                      {payload[0].payload.subject}
                    </span>
                    <span className="text-teal-400 font-mono font-bold">
                      {payload[0].value} / 100
                    </span>
                  </div>
                );
              }
              return null;
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
