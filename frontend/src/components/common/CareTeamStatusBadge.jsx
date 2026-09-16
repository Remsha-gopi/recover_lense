import React from "react";
import { CheckCheck, Clock, Eye, MessageSquare } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export default function CareTeamStatusBadge({ status, size = "md" }) {
  const { t } = useLanguage();

  const configs = {
    reviewed: {
      label: t("careTeamStatus.reviewed"),
      bg: "bg-teal-500/15 border-teal-500/30 text-teal-300",
      icon: CheckCheck,
      pulse: false,
    },
    update_pending: {
      label: t("careTeamStatus.update_pending"),
      bg: "bg-amber-500/15 border-amber-500/40 text-amber-300",
      icon: Clock,
      pulse: true,
    },
    monitoring: {
      label: t("careTeamStatus.monitoring"),
      bg: "bg-blue-500/15 border-blue-500/30 text-blue-300",
      icon: Eye,
      pulse: false,
    },
    no_recent_update: {
      label: t("careTeamStatus.no_recent_update"),
      bg: "bg-slate-700/30 border-slate-600/30 text-slate-400",
      icon: MessageSquare,
      pulse: false,
    },
  };

  const config = configs[status] || configs["reviewed"];
  const Icon = config.icon;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs gap-1.5",
    md: "px-2.5 py-1 text-xs gap-2 font-medium",
  };

  return (
    <span
      className={`inline-flex items-center rounded-lg border ${config.bg} ${sizeClasses[size]} ${
        config.pulse ? "animate-pulse" : ""
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{config.label}</span>
    </span>
  );
}
