import React from "react";
import { CheckCircle2, TrendingUp, AlertTriangle, AlertCircle } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export default function StatusBadge({ status, size = "md", showIcon = true }) {
  const { t } = useLanguage();

  const configs = {
    on_track: {
      label: t("status.on_track"),
      bg: "bg-emerald-500/15 border-emerald-500/40 text-emerald-400",
      glow: "glow-emerald",
      icon: CheckCircle2,
      dotColor: "bg-emerald-400",
    },
    recovering_faster: {
      label: t("status.recovering_faster"),
      bg: "bg-sky-500/15 border-sky-500/40 text-sky-400",
      glow: "glow-cyan",
      icon: TrendingUp,
      dotColor: "bg-sky-400",
    },
    slightly_behind: {
      label: t("status.slightly_behind"),
      bg: "bg-amber-500/15 border-amber-500/40 text-amber-400",
      glow: "glow-amber",
      icon: AlertCircle,
      dotColor: "bg-amber-400",
    },
    significant_deviation: {
      label: t("status.significant_deviation"),
      bg: "bg-rose-500/15 border-rose-500/40 text-rose-400",
      glow: "glow-rose",
      icon: AlertTriangle,
      dotColor: "bg-rose-400",
    },
  };

  const config = configs[status] || configs["on_track"];
  const Icon = config.icon;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs gap-1.5",
    md: "px-3 py-1 text-xs gap-2 font-medium",
    lg: "px-4 py-1.5 text-sm gap-2.5 font-semibold",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border ${config.bg} ${sizeClasses[size]} transition-all duration-300`}
    >
      <span className={`w-2 h-2 rounded-full ${config.dotColor} animate-pulse`} />
      {showIcon && <Icon className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />}
      <span>{config.label}</span>
    </span>
  );
}
