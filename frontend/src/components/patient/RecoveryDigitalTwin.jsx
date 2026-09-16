import React from "react";
import { Cpu, Dna, Activity, ShieldCheck, Zap, Gauge } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export default function RecoveryDigitalTwin({ patient }) {
  const { t } = useLanguage();
  if (!patient) return null;

  // Derive biological telemetry for digital twin
  const day = patient.current_day || 1;
  const totalDays = patient.expected_duration_days || 56;
  const progressRatio = Math.min(day / totalDays, 1.0);

  // Status adjustments
  const isFaster = patient.status === "recovering_faster";
  const isDeviation = patient.status === "significant_deviation";

  // Simulated biological parameters
  const tissueRemodelingPct = Math.round(
    isFaster ? Math.min(progressRatio * 115, 96) : isDeviation ? Math.max(progressRatio * 80, 25) : progressRatio * 100
  );
  const loadTolerancePct = Math.round(
    isFaster ? Math.min(35 + progressRatio * 60, 95) : isDeviation ? Math.max(20 + progressRatio * 45, 30) : 30 + progressRatio * 60
  );
  const systemicStrain = isDeviation ? "Elevated (7.8/10)" : isFaster ? "Minimal (2.1/10)" : "Controlled (3.4/10)";
  const telemetryFidelity = "98.4% (High Precision)";

  return (
    <div className="glass-card rounded-3xl p-6 sm:p-7 border border-slate-800 relative overflow-hidden space-y-5">
      {/* Background ambient gradient glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-500/20 to-brand-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Biological Recovery Digital Twin
              </h2>
              <span className="flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                Live In-Silico Sync
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Continuous physiological computational twin modeling tissue repair and load tolerance
            </p>
          </div>
        </div>
      </div>

      {/* Telemetry Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Tissue Healing */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 space-y-1.5">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="flex items-center gap-1.5">
              <Dna className="w-3.5 h-3.5 text-brand-400" />
              <span>Tissue Remodeling</span>
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-extrabold text-white font-mono">
              {tissueRemodelingPct}%
            </span>
            <span className="text-[10px] text-teal-400 font-medium">
              {isFaster ? "Ahead of curve" : isDeviation ? "Pace lag" : "On schedule"}
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-400 rounded-full transition-all duration-500"
              style={{ width: `${tissueRemodelingPct}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Load Capacity */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 space-y-1.5">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-teal-400" />
              <span>Load Capacity</span>
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-extrabold text-white font-mono">
              {loadTolerancePct}%
            </span>
            <span className="text-[10px] text-slate-400">tolerance</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-400 rounded-full transition-all duration-500"
              style={{ width: `${loadTolerancePct}%` }}
            />
          </div>
        </div>

        {/* Metric 3: Systemic Strain */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 space-y-1.5">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-sky-400" />
              <span>Physiological Strain</span>
            </span>
          </div>
          <div className="text-sm font-bold text-slate-200 mt-1 truncate">
            {systemicStrain}
          </div>
          <p className="text-[10px] text-slate-500">
            {isDeviation ? "Fatigue suppression active" : "Biological homeostasis stable"}
          </p>
        </div>

        {/* Metric 4: Fidelity */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 space-y-1.5">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Telemetry Confidence</span>
            </span>
          </div>
          <div className="text-sm font-bold font-mono text-emerald-300 mt-1">
            {telemetryFidelity}
          </div>
          <p className="text-[10px] text-slate-500">Continuous check-in verified</p>
        </div>
      </div>
    </div>
  );
}
