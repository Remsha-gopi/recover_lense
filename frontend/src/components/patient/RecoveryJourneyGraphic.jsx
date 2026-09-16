import React from "react";
import { CheckCircle2, CircleDot, Clock, ShieldCheck, Flag } from "lucide-react";

export default function RecoveryJourneyGraphic({ currentDay = 24, totalDays = 56, conditionName = "Rehabilitation" }) {
  const phases = [
    {
      id: 1,
      name: "Acute Protection",
      range: "Days 1–10",
      description: "Incision protection, inflammation regulation & gentle passive motion.",
      startDay: 1,
      endDay: 10,
    },
    {
      id: 2,
      name: "Active Mobilization",
      range: "Days 11–28",
      description: "Restoring physiological joint angle & unassisted weight transitions.",
      startDay: 11,
      endDay: 28,
    },
    {
      id: 3,
      name: "Strength & Control",
      range: "Days 29–45",
      description: "Resistance conditioning, tendon remodeling & neuromuscular balance.",
      startDay: 29,
      endDay: 45,
    },
    {
      id: 4,
      name: "Functional Return",
      range: "Days 46+",
      description: "Sustained activity tolerance, sports/work re-entry & monitoring completion.",
      startDay: 46,
      endDay: totalDays,
    },
  ];

  const getPhaseStatus = (phase) => {
    if (currentDay > phase.endDay) return "completed";
    if (currentDay >= phase.startDay && currentDay <= phase.endDay) return "current";
    return "upcoming";
  };

  return (
    <div className="glass-card rounded-3xl p-6 sm:p-7 border border-slate-800 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Flag className="w-4 h-4 text-brand-400" />
            <span>Clinical Phase Progression Roadmap</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Phased biological milestones tailored to {conditionName}
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-teal-300 px-3 py-1 rounded-full bg-teal-500/15 border border-teal-500/30 w-fit">
          Current: Day {currentDay} of {totalDays}
        </span>
      </div>

      {/* Visual Roadmap Stepper */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
        {phases.map((phase, idx) => {
          const status = getPhaseStatus(phase);
          const isCurrent = status === "current";
          const isCompleted = status === "completed";

          return (
            <div
              key={phase.id}
              className={`rounded-2xl p-4 border transition-all relative ${
                isCurrent
                  ? "bg-brand-950/30 border-brand-400/50 shadow-lg shadow-brand-500/10 scale-[1.02]"
                  : isCompleted
                  ? "bg-slate-900/80 border-teal-500/30 text-slate-300"
                  : "bg-slate-950/40 border-slate-800/80 text-slate-500"
              }`}
            >
              {/* Status Header */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider">
                  Phase 0{phase.id}
                </span>

                {isCompleted ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Done</span>
                  </span>
                ) : isCurrent ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-brand-300">
                    <CircleDot className="w-3.5 h-3.5 text-brand-400 animate-spin" />
                    <span>Active Now</span>
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-500 font-mono">Upcoming</span>
                )}
              </div>

              {/* Title & Range */}
              <h3
                className={`text-sm font-bold ${
                  isCurrent ? "text-white" : isCompleted ? "text-slate-200" : "text-slate-400"
                }`}
              >
                {phase.name}
              </h3>
              <p className="text-[11px] font-mono text-teal-400 mt-0.5">{phase.range}</p>

              {/* Description */}
              <p
                className={`text-xs mt-2.5 leading-relaxed ${
                  isCurrent ? "text-slate-200" : "text-slate-400"
                }`}
              >
                {phase.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
