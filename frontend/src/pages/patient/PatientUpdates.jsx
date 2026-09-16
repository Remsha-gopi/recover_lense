import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { api } from "../../services/api";
import {
  MessageSquare,
  Stethoscope,
  Target,
  Clock,
  CheckCircle2,
  Circle,
  Loader2,
} from "lucide-react";

export default function PatientUpdates() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUpdates() {
      if (!user?.patient_id) return;
      try {
        const resp = await api.getPatientUpdates(user.patient_id);
        setData(resp);
      } catch (err) {
        console.error("Error loading updates:", err);
      } finally {
        setLoading(false);
      }
    }
    loadUpdates();
  }, [user?.patient_id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
        <p className="text-xs text-slate-400">Loading care-team communications...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-white">
          {t("updatesPage.title")}
        </h1>
        <p className="text-xs text-slate-400">{t("updatesPage.subtitle")}</p>
      </div>

      {/* Doctor & Specialist Updates */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <MessageSquare className="w-4 h-4 text-teal-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            {t("updatesPage.careUpdates")}
          </h2>
        </div>

        <div className="space-y-3">
          {data?.care_team_updates?.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">
              No messages from your care team yet.
            </p>
          ) : (
            data?.care_team_updates?.map((u) => (
              <div
                key={u.id}
                className="p-4 rounded-2xl bg-teal-950/20 border border-teal-500/25 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-teal-300 flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5" />
                    {u.author_name}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(u.sent_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  "{u.message}"
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Clinical Notes */}
      {data?.professional_notes?.length > 0 && (
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Stethoscope className="w-4 h-4 text-brand-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              {t("updatesPage.clinicalNotes")}
            </h2>
          </div>

          <div className="space-y-3">
            {data.professional_notes.map((n) => (
              <div
                key={n.id}
                className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">
                    Observation Note by {n.author_name}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(n.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {n.note_text}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recovery Goals & Milestones */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <Target className="w-4 h-4 text-sky-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            {t("updatesPage.activeGoals")}
          </h2>
        </div>

        <div className="space-y-2.5">
          {data?.goals?.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">
              No milestones defined yet.
            </p>
          ) : (
            data?.goals?.map((g) => {
              const isAchieved = g.status === "achieved";
              return (
                <div
                  key={g.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                    isAchieved
                      ? "bg-emerald-950/20 border-emerald-500/30 text-slate-200"
                      : "bg-slate-900/70 border-slate-800 text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isAchieved ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                    <span className={`text-xs ${isAchieved ? "line-through text-slate-400" : "font-medium"}`}>
                      {g.title}
                    </span>
                  </div>

                  {g.target_day && (
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                      Target: Day {g.target_day}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
