import React from "react";
import { TrendingUp, TrendingDown, Minus, Zap } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export default function MomentumCard({ momentum }) {
  const { t } = useLanguage();
  if (!momentum) return null;

  const isImproving = momentum.direction === "improving";
  const isDeclining = momentum.direction === "declining";

  const Icon = isImproving ? TrendingUp : isDeclining ? TrendingDown : Minus;
  const colorClass = isImproving
    ? "text-emerald-400 border-emerald-500/30 bg-emerald-950/30"
    : isDeclining
    ? "text-rose-400 border-rose-500/30 bg-rose-950/30"
    : "text-sky-400 border-sky-500/30 bg-sky-950/30";

  return (
    <div className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-500/15 border border-brand-500/25 flex items-center justify-center text-brand-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t("home.momentum")}
            </h3>
            <p className="text-sm font-bold text-white mt-0.5">{momentum.label}</p>
          </div>
        </div>

        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-semibold ${colorClass}`}>
          <Icon className="w-3.5 h-3.5" />
          <span>{momentum.rate_of_change > 0 ? `+${momentum.rate_of_change}` : momentum.rate_of_change} pts</span>
        </span>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80">
        <p className="text-xs text-slate-300 leading-relaxed">
          {momentum.plain_reason}
        </p>
      </div>
    </div>
  );
}
