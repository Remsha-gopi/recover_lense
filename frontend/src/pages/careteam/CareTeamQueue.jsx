import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { useLanguage } from "../../context/LanguageContext";
import StatusBadge from "../../components/common/StatusBadge";
import CareTeamStatusBadge from "../../components/common/CareTeamStatusBadge";
import PatientDetailModal from "./PatientDetailModal";
import {
  Users,
  ShieldAlert,
  Clock,
  ArrowRight,
  Filter,
  CheckCircle2,
  Stethoscope,
  ChevronRight,
  Loader2,
  Activity,
} from "lucide-react";

export default function CareTeamQueue() {
  const { t } = useLanguage();
  const [queue, setQueue] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedPatientId, setSelectedPatientId] = useState(null);

  const fetchQueue = async (f = filter) => {
    try {
      setLoading(true);
      const data = await api.getCareTeamQueue(f);
      setQueue(data);
    } catch (err) {
      console.error("Error fetching queue:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue(filter);
  }, [filter]);

  const filters = [
    { key: "all", label: t("careTeam.all") },
    { key: "priority_review", label: t("careTeam.priorityReview") },
    { key: "review_suggested", label: t("careTeam.reviewSuggested") },
    { key: "monitor", label: t("careTeam.monitor") },
    { key: "on_track", label: t("careTeam.onTrack") },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-400">
            <Stethoscope className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Clinical Monitoring Console
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            {t("careTeam.queueTitle")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            {t("careTeam.queueSubtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl">
          <Users className="w-4 h-4 text-teal-400" />
          <span>Active Monitored Cohort: <strong className="text-white">{queue.length}</strong></span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3.5 py-2 rounded-xl font-semibold transition-all whitespace-nowrap ${
              filter === f.key
                ? "bg-teal-500/20 text-teal-300 border border-teal-400/40 shadow-md"
                : "bg-slate-900/80 text-slate-400 border border-slate-800 hover:text-slate-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Queue List */}
      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
          <p className="text-xs text-slate-400">Triage engine ordering active cases...</p>
        </div>
      ) : queue.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center text-slate-500 text-xs">
          No patients matching current triage criteria.
        </div>
      ) : (
        <div className="space-y-4">
          {queue.map((item) => {
            const isPriority = item.urgency_tier === "priority_review";
            const isUpdatePending = item.care_team_status === "update_pending";

            return (
              <div
                key={item.patient_id}
                onClick={() => setSelectedPatientId(item.patient_id)}
                className={`glass-card rounded-2xl p-5 border cursor-pointer transition-all hover:scale-[1.008] ${
                  isPriority
                    ? "border-rose-500/40 bg-rose-950/10 hover:border-rose-400"
                    : isUpdatePending
                    ? "border-amber-500/40 bg-amber-950/10 hover:border-amber-400"
                    : "border-slate-800 hover:border-teal-500/40"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left Patient Info */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-extrabold text-white">
                        {item.patient_name}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-semibold uppercase font-mono">
                        {item.recovery_type.replace("_", " ")}
                      </span>
                      <StatusBadge status={item.status} size="sm" />
                      <CareTeamStatusBadge status={item.care_team_status} size="sm" />
                    </div>

                    <p className="text-xs text-slate-300 font-medium">
                      {item.condition_name} · Day {item.current_day} of {item.expected_duration_days}
                    </p>

                    {item.open_alerts.length > 0 && (
                      <div className="flex items-center gap-2 pt-1 text-[11px] text-rose-300">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                        <span className="font-semibold">
                          {item.open_alerts[0].title}
                        </span>
                        <span className="text-slate-400 font-mono text-[10px]">
                          (Persisted {item.open_alerts[0].persistence_count}x)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right Telemetry & Actions */}
                  <div className="flex items-center justify-between md:justify-end gap-6 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block uppercase tracking-wider">
                        Adherence
                      </span>
                      <span className="text-xs font-mono font-bold text-teal-300">
                        {item.adherence_pct}%
                      </span>
                    </div>

                    <button
                      type="button"
                      className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-teal-600 hover:text-white border border-slate-700 text-xs font-semibold text-slate-200 transition flex items-center gap-1.5"
                    >
                      <span>Clinical Review</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Patient Detail Modal */}
      {selectedPatientId && (
        <PatientDetailModal
          patientId={selectedPatientId}
          onClose={() => setSelectedPatientId(null)}
          onRefreshQueue={() => fetchQueue(filter)}
        />
      )}
    </div>
  );
}
