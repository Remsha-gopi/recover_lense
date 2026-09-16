import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from "recharts";
import { useLanguage } from "../../context/LanguageContext";

export default function TrajectoryChart({ data, currentDay, height = 340, compact = false }) {
  const { t } = useLanguage();

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
        No trajectory data available.
      </div>
    );
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const pt = payload[0].payload;
      return (
        <div className="bg-slate-900/95 border border-slate-700/80 p-3.5 rounded-xl shadow-2xl backdrop-blur-xl text-xs space-y-1.5 min-w-[200px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="font-bold text-white">Day {label}</span>
            {label === currentDay && (
              <span className="px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 text-[10px] font-semibold">
                Today
              </span>
            )}
          </div>

          <div className="flex justify-between items-center text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
              Expected Score:
            </span>
            <span className="font-mono font-bold text-teal-300">
              {pt.expected_score?.toFixed(1)} / 100
            </span>
          </div>

          {pt.actual_score !== null && pt.actual_score !== undefined && (
            <div className="flex justify-between items-center text-slate-200">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-400" />
                Actual Check-in:
              </span>
              <span className="font-mono font-bold text-brand-300 text-sm">
                {pt.actual_score?.toFixed(1)} / 100
              </span>
            </div>
          )}

          {/* Granular readings if present */}
          {pt.pain !== undefined && pt.pain !== null && (
            <div className="pt-1.5 mt-1.5 border-t border-slate-800/80 grid grid-cols-2 gap-1 text-[11px] text-slate-400">
              <div>Pain: <strong className="text-slate-200 font-mono">{pt.pain}/10</strong></div>
              {pt.mobility !== undefined && <div>Mobility: <strong className="text-slate-200 font-mono">{pt.mobility}/10</strong></div>}
              {pt.fatigue !== undefined && <div>Fatigue: <strong className="text-slate-200 font-mono">{pt.fatigue}/10</strong></div>}
              {pt.sleep !== undefined && <div>Sleep: <strong className="text-slate-200 font-mono">{pt.sleep}/10</strong></div>}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="toleranceBand" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="actualGlow" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#2dd4bf" />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          
          <XAxis
            dataKey="day"
            stroke="#64748b"
            tick={{ fill: "#64748b", fontSize: 11 }}
            tickLine={false}
            tickFormatter={(val) => `Day ${val}`}
          />
          <YAxis
            domain={[10, 100]}
            stroke="#64748b"
            tick={{ fill: "#64748b", fontSize: 11 }}
            tickLine={false}
            tickFormatter={(val) => `${val}`}
          />

          <Tooltip content={<CustomTooltip />} />

          {!compact && (
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: "12px", fontSize: "12px" }}
              formatter={(value) => {
                if (value === "expected_score") return t("progress.expectedCurve");
                if (value === "actual_score") return t("progress.actualScore");
                if (value === "upper_bound") return t("progress.toleranceBand");
                return value;
              }}
            />
          )}

          {/* Current Day Reference Line */}
          {currentDay && (
            <ReferenceLine
              x={currentDay}
              stroke="#0ea5e9"
              strokeDasharray="4 4"
              label={{
                value: "Today",
                position: "insideTopLeft",
                fill: "#38bdf8",
                fontSize: 11,
              }}
            />
          )}

          {/* Tolerance Band Area */}
          <Area
            type="monotone"
            dataKey="upper_bound"
            stroke="transparent"
            fill="url(#toleranceBand)"
            name="upper_bound"
            legendType="none"
          />

          {/* Expected Baseline Line */}
          <Line
            type="monotone"
            dataKey="expected_score"
            stroke="#14b8a6"
            strokeWidth={2.5}
            dot={false}
            strokeDasharray="5 5"
            name="expected_score"
          />

          {/* Actual Check-In Line */}
          <Line
            type="monotone"
            dataKey="actual_score"
            stroke="#38bdf8"
            strokeWidth={3}
            connectNulls={true}
            dot={{
              r: 5,
              fill: "#0369a1",
              stroke: "#38bdf8",
              strokeWidth: 2,
            }}
            activeDot={{
              r: 8,
              fill: "#2dd4bf",
              stroke: "#ffffff",
              strokeWidth: 2,
            }}
            name="actual_score"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
