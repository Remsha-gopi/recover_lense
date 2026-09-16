import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import StatusBadge from "../../components/common/StatusBadge";
import CareTeamStatusBadge from "../../components/common/CareTeamStatusBadge";
import {
  X,
  CheckCheck,
  Send,
  FileText,
  Target,
  Award,
  ShieldAlert,
  Loader2,
  Clock,
  Activity,
} from "lucide-react";

export default function PatientDetailModal({ patientId, onClose, onRefreshQueue }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updateMessage, setUpdateMessage] = useState("");
  const [noteText, setNoteText] = useState("");
  const [goalTitle, setGoalTitle] = useState("");
  const [completionMessage, setCompletionMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState("overview");

  const loadPatient = async () => {
    try {
      const data = await api.getCareTeamPatientDetail(patientId);
      setDetail(data);
    } catch (err) {
      console.error("Error loading patient detail:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatient();
  }, [patientId]);

  const handleReviewAlert = async (alertId, supportiveMsg = "") => {
    setSubmitting(true);
    try {
      await api.reviewAlert(patientId, alertId, "reviewed", supportiveMsg);
      await loadPatient();
      onRefreshQueue();
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendUpdate = async (e) => {
    e.preventDefault();
    if (!updateMessage.trim()) return;
    setSubmitting(true);
    try {
      await api.sendCareTeamUpdate(patientId, updateMessage);
      setUpdateMessage("");
      await loadPatient();
      onRefreshQueue();
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setSubmitting(true);
    try {
      await api.addProfessionalNote(patientId, noteText, true);
      setNoteText("");
      await loadPatient();
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;
    setSubmitting(true);
    try {
      await api.addRecoveryGoal(patientId, goalTitle);
      setGoalTitle("");
      await loadPatient();
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteMonitoring = async () => {
    const msg = completionMessage.trim() || "Recovery milestones successfully achieved. Regular clinical follow-up completed.";
    setSubmitting(true);
    try {
      await api.completeMonitoring(patientId, msg);
      await loadPatient();
      onRefreshQueue();
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div className="glass-card p-8 rounded-2xl flex items-center gap-3">
          <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
          <span className="text-xs text-slate-300">Loading clinical patient record...</span>
        </div>
      </div>
    );
  }

  if (!detail) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="glass-card w-full max-w-4xl max-h-[90vh] rounded-3xl border border-slate-700/80 shadow-2xl flex flex-col overflow-hidden bg-slate-900/95 animate-fade-in">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 text-xs font-semibold uppercase font-mono">
                {detail.recovery_type}
              </span>
              <StatusBadge status={detail.status} size="sm" />
              <CareTeamStatusBadge status={detail.care_team_status} size="sm" />
            </div>

            <h2 className="text-xl font-extrabold text-white">
              {detail.full_name}
            </h2>
            <p className="text-xs text-slate-400">
              {detail.condition_name} · Day {detail.current_day} of {detail.expected_duration_days}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-tabs Navigation */}
        <div className="px-6 border-b border-slate-800 flex items-center gap-2 overflow-x-auto text-xs">
          {[
            { key: "overview", label: "Overview & Actions" },
            { key: "alerts", label: `Alerts (${detail.alerts.length})` },
            { key: "history", label: `Check-in Logs (${detail.checkin_history.length})` },
            { key: "notes", label: "Clinical Notes & Goals" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveSubTab(tab.key)}
              className={`py-3 px-3 font-semibold border-b-2 whitespace-nowrap transition-colors ${
                activeSubTab === tab.key
                  ? "border-teal-400 text-teal-300"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeSubTab === "overview" && (
            <div className="space-y-6">
              {/* Prediction Summary */}
              {detail.latest_prediction && (
                <div className="p-4 rounded-2xl bg-teal-950/30 border border-teal-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider block">
                      Active Trajectory Projection
                    </span>
                    <span className="text-lg font-bold font-mono text-white">
                      {detail.latest_prediction.projected_range}
                    </span>
                    <p className="text-xs text-slate-300 mt-1">
                      {detail.latest_prediction.reason}
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-teal-300 self-end sm:self-auto">
                    Confidence: {detail.latest_prediction.confidence}%
                  </span>
                </div>
              )}

              {/* Action 1: Send Guidance / Update to Patient */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-teal-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Send Supportive Clinical Update (Clears "Update Pending")
                  </h3>
                </div>
                <form onSubmit={handleSendUpdate} className="space-y-2.5">
                  <textarea
                    rows={2}
                    value={updateMessage}
                    onChange={(e) => setUpdateMessage(e.target.value)}
                    placeholder="E.g. Great progress on mobility. Continue ice packs 2x daily and proceed to phase-2 knee flexes."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500/60"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!updateMessage.trim() || submitting}
                      className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-40"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send to Patient</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Action 2: Close Monitoring */}
              {!detail.monitoring_completed && (
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Award className="w-4 h-4 text-brand-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider">
                      Complete Recovery Monitoring
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400">
                    Mark patient's recovery monitoring finished. Moves patient to completed archive and displays final summary on patient dashboard.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={completionMessage}
                      onChange={(e) => setCompletionMessage(e.target.value)}
                      placeholder="Optional closing congratulatory message..."
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200"
                    />
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleCompleteMonitoring}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition whitespace-nowrap"
                    >
                      Complete Monitoring
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeSubTab === "alerts" && (
            <div className="space-y-4">
              {detail.alerts.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">
                  No alerts logged for this patient.
                </p>
              ) : (
                detail.alerts.map((a) => (
                  <div
                    key={a.id}
                    className={`p-4 rounded-2xl border space-y-3 ${
                      a.status === "open"
                        ? "bg-rose-950/20 border-rose-500/40"
                        : "bg-slate-900/60 border-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldAlert
                          className={`w-4 h-4 ${
                            a.status === "open" ? "text-rose-400" : "text-slate-500"
                          }`}
                        />
                        <span className="text-xs font-bold text-white">{a.title}</span>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          Tier: {a.tier}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        Persistence Count: {a.persistence_count}x
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {a.reason}
                    </p>

                    {a.status === "open" && (
                      <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() =>
                            handleReviewAlert(
                              a.id,
                              "Dr. Sharma reviewed your recent logs. Continuing active observation."
                            )
                          }
                          className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition flex items-center gap-1.5"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>Mark Reviewed & Send Note</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeSubTab === "history" && (
            <div className="space-y-3">
              {detail.checkin_history.map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white">Day {c.day} Entry</span>
                    <span className="font-mono text-teal-400 font-bold">
                      Composite: {c.score}/100
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-400">
                    {Object.entries(c.measurements || {}).map(([k, v]) => (
                      <div key={k}>
                        {k}: <strong className="text-slate-200">{v}/10</strong>
                      </div>
                    ))}
                  </div>
                  {c.note && (
                    <div className="text-slate-300 italic pt-1 border-t border-slate-800">
                      Patient note: "{c.note}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeSubTab === "notes" && (
            <div className="space-y-6">
              {/* Add Note */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-teal-400" />
                  <span>Add Clinical Progress Note</span>
                </h3>
                <form onSubmit={handleAddNote} className="space-y-2">
                  <textarea
                    rows={2}
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Enter clinical assessment for the patient's record..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!noteText.trim() || submitting}
                      className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
                    >
                      Save Note
                    </button>
                  </div>
                </form>
              </div>

              {/* Add Goal */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-sky-400" />
                  <span>Set Recovery Milestone</span>
                </h3>
                <form onSubmit={handleAddGoal} className="flex gap-2">
                  <input
                    type="text"
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                    placeholder="E.g. Unassisted 20-min stair climb..."
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200"
                  />
                  <button
                    type="submit"
                    disabled={!goalTitle.trim() || submitting}
                    className="px-4 py-1.5 rounded-lg bg-sky-700 hover:bg-sky-600 text-white text-xs font-bold"
                  >
                    Add Milestone
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
