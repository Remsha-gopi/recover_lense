import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { api } from "../../services/api";
import { Calendar, Clock, CheckCircle, FileText, Loader2 } from "lucide-react";

export default function PatientHistory() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      if (!user?.patient_id) return;
      try {
        const data = await api.getPatientHistory(user.patient_id);
        setHistory(data);
      } catch (err) {
        console.error("Error loading history:", err);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, [user?.patient_id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
        <p className="text-xs text-slate-400">Loading check-in timeline...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Check-in History & Timeline</h1>
        <p className="text-xs text-slate-400">
          Complete chronological record of all submitted physiological biomarkers and notes.
        </p>
      </div>

      <div className="space-y-4">
        {history.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center text-slate-500 text-xs">
            No check-ins recorded yet.
          </div>
        ) : (
          history.map((c) => (
            <div
              key={c.id}
              className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-300 font-bold font-mono text-sm flex items-center justify-center">
                    D{c.day_number}
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-white">Day {c.day_number} Entry</h3>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {new Date(c.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">Composite Score</span>
                  <span className="font-mono font-extrabold text-brand-300 text-sm">
                    {c.composite_score?.toFixed(1)} / 100
                  </span>
                </div>
              </div>

              {/* Individual Measurements */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {Object.entries(c.measurements || {}).map(([k, v]) => (
                  <div
                    key={k}
                    className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-2.5"
                  >
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block truncate">
                      {k.replace("_", " ")}
                    </span>
                    <span className="text-xs font-mono font-bold text-white">
                      {v} <span className="text-[10px] text-slate-500 font-normal">/10</span>
                    </span>
                  </div>
                ))}
              </div>

              {/* Free Note */}
              {c.free_note && (
                <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-300 flex items-start gap-2 italic">
                  <FileText className="w-3.5 h-3.5 text-brand-400 shrink-0 mt-0.5" />
                  <span>"{c.free_note}"</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
