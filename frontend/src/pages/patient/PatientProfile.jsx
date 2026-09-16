import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { api } from "../../services/api";
import {
  User,
  Globe,
  Stethoscope,
  Shield,
  Printer,
  Download,
  Activity,
  Calendar,
  CheckCircle,
  FileCheck,
} from "lucide-react";

export default function PatientProfile() {
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user?.patient_id) return;
      try {
        const home = await api.getPatientHome(user.patient_id);
        setPatientData(home);
      } catch (err) {
        console.error("Failed to load profile data:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user?.patient_id]);

  const handlePrint = () => {
    window.print();
  };

  const languages = [
    { code: "en", label: "English" },
    { code: "ta", label: "தமிழ் (Tamil)" },
    { code: "hi", label: "हिन्दी (Hindi)" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Patient Profile & Clinical Settings</h1>
          <p className="text-xs text-slate-400">
            Telemetry configuration, language localization, and care team records.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-2 transition w-fit"
        >
          <Printer className="w-4 h-4 text-brand-400" />
          <span>Print Clinical Summary</span>
        </button>
      </div>

      {/* Account & Baseline Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-800">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-teal-400 flex items-center justify-center text-slate-950 font-bold text-xl">
            {user?.full_name?.charAt(0) || "P"}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{user?.full_name}</h2>
            <p className="text-xs text-slate-400 font-mono">Patient Telemetry ID: #{user?.patient_id}</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-brand-500/15 text-brand-300 text-[11px] font-semibold">
              {patientData?.condition_name || "Active Recovery Plan"}
            </span>
          </div>
        </div>

        {/* Clinical Baseline Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
            <span className="text-[11px] text-slate-400 block uppercase tracking-wider">
              Recovery Type
            </span>
            <span className="text-xs font-bold font-mono text-white capitalize mt-1 block">
              {patientData?.recovery_type?.replace("_", " ") || "Post Surgery"}
            </span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
            <span className="text-[11px] text-slate-400 block uppercase tracking-wider">
              Timeline Calibration
            </span>
            <span className="text-xs font-bold font-mono text-teal-300 mt-1 block">
              Day {patientData?.current_day} of {patientData?.expected_duration_days} Days
            </span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
            <span className="text-[11px] text-slate-400 block uppercase tracking-wider">
              Monitoring Status
            </span>
            <span className="text-xs font-bold font-mono text-white mt-1 block capitalize">
              {patientData?.monitoring_completed ? "Completed" : "Active Continuous Observation"}
            </span>
          </div>
        </div>
      </div>

      {/* Language Preference Selector */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <Globe className="w-4 h-4 text-brand-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Language & Voice Localization Preference
          </h2>
        </div>

        <p className="text-xs text-slate-400">
          Sets your native language for adaptive check-in questions, voice read-aloud (TTS), voice speech-to-text, and AI Recovery Coach conversations.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {languages.map((l) => {
            const isSelected = language === l.code;
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => setLanguage(l.code, user?.patient_id)}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? "bg-brand-500/20 border-brand-400 text-white shadow-lg shadow-brand-500/10"
                    : "bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">{l.label}</span>
                  {isSelected && <CheckCircle className="w-4 h-4 text-brand-400" />}
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Locale: {l.code === "ta" ? "ta-IN" : l.code === "hi" ? "hi-IN" : "en-US"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Assigned Care Team */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <Stethoscope className="w-4 h-4 text-teal-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Assigned Clinical Care Team
          </h2>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-300 font-bold shrink-0">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">Dr. Alok Sharma, MD</h3>
            <p className="text-xs text-teal-300 font-medium">
              Orthopedic Surgery & Continuous Rehabilitation Lead
            </p>
            <p className="text-xs text-slate-400">
              Apex Specialty Health Institute · Connected via Closed-Loop Telemetry
            </p>
          </div>
        </div>
      </div>

      {/* Printable Clinical Sheet Summary Section (hidden on regular view, shown on print) */}
      <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-[11px] text-slate-500 flex items-center gap-2">
        <Shield className="w-4 h-4 text-brand-400 shrink-0" />
        <span>
          Data Governance: Synthetic patient profile strictly used for medical decision support demonstration.
        </span>
      </div>
    </div>
  );
}
