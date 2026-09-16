import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { api } from "../../services/api";
import TrajectoryChart from "../../components/patient/TrajectoryChart";
import RecoveryFingerprint from "../../components/patient/RecoveryFingerprint";
import StatusBadge from "../../components/common/StatusBadge";
import {
  TrendingUp,
  History,
  Activity,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  HelpCircle,
  Clock,
  Loader2,
} from "lucide-react";

export default function PatientProgress() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [trajectory, setTrajectory] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user?.patient_id) return;
      try {
        const [trajData, explData, predHistory] = await Promise.all([
          api.getPatientTrajectory(user.patient_id),
          api.getPatientExplanation(user.patient_id),
          api.getPatientPredictionHistory(user.patient_id),
        ]);
        setTrajectory(trajData);
        setExplanation(explData);
        setPredictions(predHistory);
      } catch (err) {
        console.error("Failed to load progress data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user?.patient_id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
        <p className="text-xs text-slate-400">Loading comprehensive trajectory analysis...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand-400">
            <Activity className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">
              {trajectory?.condition_name}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            {t("progress.title")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">{t("progress.subtitle")}</p>
        </div>

        {trajectory && <StatusBadge status={trajectory.status} size="lg" />}
      </div>

      {/* Main Trajectory Chart Container */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Expected vs. Actual Healing Curve
            </h2>
            <p className="text-xs text-slate-400">
              Shaded zone indicates ±10% clinical biological variation tolerance.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-3 h-0.5 bg-teal-400 border border-teal-400" />
              Expected Baseline
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
              Actual Check-in Points
            </span>
          </div>
        </div>

        <div className="h-80 sm:h-96">
          <TrajectoryChart
            data={trajectory?.points}
            currentDay={trajectory?.current_day}
            height={360}
          />
        </div>
      </div>

      {/* 2-Column: Recovery Fingerprint Radar & Attribution Factors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Fingerprint */}
        <div className="glass-card rounded-3xl p-6 border border-slate-800 flex flex-col justify-between">
          <div className="pb-3 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-400" />
              <span>{t("progress.fingerprintTitle")}</span>
            </h2>
            <p className="text-xs text-slate-400">{t("progress.fingerprintSubtitle")}</p>
          </div>

          <div className="my-4">
            <RecoveryFingerprint data={explanation?.fingerprint} height={260} />
          </div>

          <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
            Multi-axial analysis balances comfort (low pain), mobility, daytime vitality, sleep restoration, and exercise compliance.
          </div>
        </div>

        {/* Attribution Factors */}
        <div className="glass-card rounded-3xl p-6 border border-slate-800 flex flex-col justify-between space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-400" />
              <span>{t("progress.factorsTitle")}</span>
            </h2>
            <p className="text-xs text-slate-400">{t("progress.factorsSubtitle")}</p>
          </div>

          <div className="space-y-2.5 flex-1">
            {explanation?.attribution?.key_factors?.map((f, i) => {
              const isPos = f.impact === "positive";
              return (
                <div
                  key={i}
                  className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3 flex items-start justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      {isPos ? (
                        <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-rose-400" />
                      )}
                      <span>{f.factor}</span>
                    </span>
                    <p className="text-[11px] text-slate-300">{f.detail}</p>
                  </div>
                  <span
                    className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                      isPos
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                    }`}
                  >
                    {f.score}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 italic">
            {explanation?.attribution?.summary}
          </div>
        </div>
      </div>

      {/* Prediction History & "Why Did My Prediction Change?" */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-5">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-800">
          <History className="w-4 h-4 text-brand-400" />
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              {t("progress.predictionCardTitle")}
            </h2>
            <p className="text-xs text-slate-400">
              Audit trail of statistical projections with explicit logged rationale.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {predictions.map((p) => (
            <div
              key={p.id}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-brand-500/15 text-brand-300 border border-brand-500/30">
                    Version {p.version}
                  </span>
                  <StatusBadge status={p.status_state} size="sm" />
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" />
                    {new Date(p.generated_at).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-xs text-slate-200 mt-2 font-medium">
                  <strong>{t("progress.whyChanged")}:</strong> {p.reason}
                </p>

                {p.previous_range && (
                  <p className="text-[11px] text-slate-400">
                    Prior Window: <span className="line-through">{p.previous_range}</span>
                  </p>
                )}
              </div>

              <div className="text-right shrink-0">
                <span className="text-lg font-extrabold text-white font-mono block">
                  {p.projected_range_str}
                </span>
                <span className="text-[11px] text-teal-400 font-semibold">
                  Confidence: {p.confidence_score}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
