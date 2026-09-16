import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { api } from "../../services/api";
import StatusBadge from "../../components/common/StatusBadge";
import CareTeamStatusBadge from "../../components/common/CareTeamStatusBadge";
import MomentumCard from "../../components/patient/MomentumCard";
import WhatChangedCard from "../../components/patient/WhatChangedCard";
import TrajectoryChart from "../../components/patient/TrajectoryChart";
import RecoveryCoachModal from "../../components/patient/RecoveryCoachModal";
import RecoveryDigitalTwin from "../../components/patient/RecoveryDigitalTwin";
import RecoveryJourneyGraphic from "../../components/patient/RecoveryJourneyGraphic";
import {
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Clock,
  HeartPulse,
  Award,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

export default function PatientHome({ setActiveTab }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchHomeData = async () => {
    if (!user?.patient_id) return;
    try {
      const resp = await api.getPatientHome(user.patient_id);
      setData(resp);
    } catch (err) {
      console.error("Failed to load patient home:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
  }, [user?.patient_id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <HeartPulse className="w-8 h-8 text-brand-400 animate-pulse" />
        <p className="text-xs text-slate-400">Loading personalized recovery telemetry...</p>
      </div>
    );
  }

  if (!data) return null;

  const pctProgress = Math.min(
    Math.round((data.current_day / data.expected_duration_days) * 100),
    100
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Recovery Completed Banner (if marked complete) */}
      {data.monitoring_completed && (
        <div className="glass-card rounded-2xl p-6 border border-teal-500/40 bg-teal-950/30 flex items-start gap-4 animate-fade-in">
          <div className="w-12 h-12 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300 shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              {t("home.monitoringCompleteNotice")}
            </h2>
            <p className="text-xs text-teal-200 mt-1 leading-relaxed">
              {data.completion_message ||
                "Your care team has concluded active monitoring. All historical check-ins and recovery curves remain accessible."}
            </p>
          </div>
        </div>
      )}

      {/* Alert Banner for Arjun or Priority Deviations */}
      {data.open_alerts_count > 0 && (
        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-rose-500/40 bg-rose-950/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0 mt-0.5 sm:mt-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-300">
                  {t("home.openAlerts")}
                </span>
                <span className="px-1.5 py-0.2 rounded bg-rose-500/30 text-rose-200 text-[10px] font-bold">
                  {data.open_alerts_count} Active
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                A recovery deviation was flagged and logged for care team priority triage.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab("progress")}
            className="px-3.5 py-1.5 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/40 text-rose-200 text-xs font-semibold flex items-center gap-1.5 transition self-end sm:self-auto"
          >
            <span>Inspect Trajectory</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header & Patient Overview */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold uppercase tracking-wider">
                {data.condition_name}
              </span>
              <StatusBadge status={data.status} size="md" />
              <CareTeamStatusBadge status={data.care_team_status} size="md" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-3">
              {t("home.welcome")}, {data.full_name.split(" ")[0]}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-400" />
              <span>
                {t("home.dayProgress", {
                  day: data.current_day,
                  total: data.expected_duration_days,
                })}
              </span>
            </p>

            {/* Recovery Progress Bar */}
            <div className="mt-4 max-w-md">
              <div className="flex justify-between text-[11px] text-slate-400 mb-1 font-medium">
                <span>Overall Timeline Progress</span>
                <span className="text-brand-300 font-mono font-bold">{pctProgress}%</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-brand-600 via-teal-400 to-sky-400 rounded-full transition-all duration-500"
                  style={{ width: `${pctProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="flex flex-col items-start lg:items-end gap-2.5">
            <button
              onClick={() => setActiveTab("checkin")}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 to-teal-500 hover:from-brand-500 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-xl shadow-brand-500/25 flex items-center gap-2.5 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>{t("home.startCheckin")}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-brand-400" />
              <span>Adaptive 3-minute voice-enabled check-in</span>
            </p>
          </div>
        </div>
      </div>

      {/* 2-Column: Momentum & What Changed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <MomentumCard momentum={data.momentum} />
        <WhatChangedCard whatChanged={data.what_changed} />
      </div>

      {/* Recovery Digital Twin Telemetry Modeling */}
      <RecoveryDigitalTwin patient={data} />

      {/* Clinical Phase Progression Roadmap */}
      <RecoveryJourneyGraphic
        currentDay={data.current_day}
        totalDays={data.expected_duration_days}
        conditionName={data.condition_name}
      />

      {/* Mini Trajectory Graph & Prediction Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Trajectory Snapshot (2 cols) */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-white">
                {t("home.miniGraphTitle")}
              </h2>
              <p className="text-xs text-slate-400">
                Baseline biological recovery curve with verified check-in data points
              </p>
            </div>
            <button
              onClick={() => setActiveTab("progress")}
              className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1 transition"
            >
              <span>Explore Full Analysis</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 mt-4">
            <TrajectoryChart
              data={data.mini_trajectory}
              currentDay={data.current_day}
              height={250}
              compact={true}
            />
          </div>
        </div>

        {/* Prediction & Confidence Snapshot (1 col) */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 text-teal-400">
              <TrendingUp className="w-4 h-4" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t("home.projectedFinish")}
              </h2>
            </div>

            <div className="mt-3">
              <span className="text-2xl font-extrabold text-white font-mono block">
                {data.projected_range}
              </span>
              <span className="text-[11px] text-slate-400">
                Statistical timeline range, continuously calibrated
              </span>
            </div>

            <div className="mt-5 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-400 font-medium">
                  {t("home.confidence")}
                </span>
                <span className="font-mono font-bold text-brand-300">
                  {data.confidence_score}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-500 rounded-full"
                  style={{ width: `${data.confidence_score}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-2">
                Based on continuous check-in frequency and physiological consistency.
              </p>
            </div>
          </div>

          {/* Latest Care Team Note */}
          {data.latest_care_team_update && (
            <div className="p-3.5 rounded-xl bg-teal-950/25 border border-teal-500/25">
              <span className="text-[11px] font-bold text-teal-400 block uppercase tracking-wider mb-1">
                {t("home.recentUpdate")}
              </span>
              <p className="text-xs text-slate-200 italic leading-relaxed">
                "{data.latest_care_team_update}"
              </p>
              <button
                onClick={() => setActiveTab("updates")}
                className="text-[11px] text-teal-300 font-semibold hover:underline mt-2 inline-block"
              >
                {t("home.viewAllUpdates")} →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Floating Recovery Coach Assistant */}
      <RecoveryCoachModal patientId={data.patient_id} />
    </div>
  );
}
