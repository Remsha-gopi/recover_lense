import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import {
  Activity,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Stethoscope,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Mail,
  Loader2,
} from "lucide-react";

export default function LandingPage() {
  const { demoLogin, login, loading } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleManualLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      await login(email, password);
    } catch (err) {
      setErrorMsg(err.message || "Invalid credentials");
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center px-4 py-12 max-w-6xl mx-auto space-y-12 animate-fade-in">
      {/* Hero Section */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          <span>v2 Blueprint · Voice, Multilingual & Adaptive Closed-Loop</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">
          Your recovery, understood —{" "}
          <span className="bg-gradient-to-r from-brand-400 via-teal-300 to-sky-400 bg-clip-text text-transparent">
            every step of the way.
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
          RecoverLens connects patients and clinicians between consultations. Adaptive 3-question check-ins with voice input, persistence-gated deviation modeling, and true closed-loop care-team feedback.
        </p>
      </div>

      {/* Demo Persona Cards */}
      <div className="space-y-3">
        <div className="text-center">
          <h2 className="text-xs font-bold uppercase tracking-widest text-brand-400">
            One-Click Judging & Demonstration Personas
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Pre-seeded with real longitudinal trajectories and genuine clinical scenarios
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Arjun */}
          <div
            onClick={() => demoLogin("patient", "arjun")}
            className="glass-card rounded-2xl p-5 border border-rose-500/30 bg-rose-950/10 hover:border-rose-400 hover:scale-[1.02] cursor-pointer transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-ping" />
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
                  Recommended Demo
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-3">Arjun Varma</h3>
              <p className="text-xs text-rose-300 font-medium">Illness Recovery · Day 12</p>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Rising fatigue & dropped activity over 3 check-ins. Status: <strong>Significant Deviation 🔴</strong> with <strong>Update Pending</strong>.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-rose-900/40 flex items-center justify-between text-xs font-bold text-rose-300">
              <span>Test Voice & Check-in</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Dr. Sharma */}
          <div
            onClick={() => demoLogin("care_team")}
            className="glass-card rounded-2xl p-5 border border-teal-500/30 bg-teal-950/15 hover:border-teal-400 hover:scale-[1.02] cursor-pointer transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold">
                  Care Team
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-3">Dr. Alok Sharma, MD</h3>
              <p className="text-xs text-teal-300 font-medium">Orthopedic & Rehab Lead</p>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Review Arjun's Priority Alert, triage queue by urgency, send supportive updates, and manage goals.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-teal-900/40 flex items-center justify-between text-xs font-bold text-teal-300">
              <span>Open Clinical Console</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Meera */}
          <div
            onClick={() => demoLogin("patient", "meera")}
            className="glass-card rounded-2xl p-5 border border-emerald-500/30 bg-emerald-950/10 hover:border-emerald-400 hover:scale-[1.02] cursor-pointer transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                  On Track
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-3">Meera Patel</h3>
              <p className="text-xs text-emerald-300 font-medium">Knee Replacement · Day 24</p>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Smooth postoperative curve with 6 logged entries. Pain dropping and mobility advancing as expected.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-emerald-900/40 flex items-center justify-between text-xs font-bold text-emerald-300">
              <span>View On-Track State</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Priya */}
          <div
            onClick={() => demoLogin("patient", "priya")}
            className="glass-card rounded-2xl p-5 border border-sky-500/30 bg-sky-950/10 hover:border-sky-400 hover:scale-[1.02] cursor-pointer transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold">
                  Accelerated
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-3">Priya Nair</h3>
              <p className="text-xs text-sky-300 font-medium">Rotator Cuff Rehab · Day 18</p>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Status: <strong>Recovering Faster 🔵</strong>. Timeline narrowed from 6–8 to 4–5 weeks with explainability trail.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-sky-900/40 flex items-center justify-between text-xs font-bold text-sky-300">
              <span>Inspect Prediction Trail</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Manual Login Card */}
      <div className="max-w-md mx-auto w-full glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 text-center">
          Or Sign In with Email Credentials
        </h3>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-xs text-rose-300">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleManualLogin} className="space-y-3">
          <div className="space-y-1">
            <label className="text-[11px] text-slate-400 font-medium">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. arjun@recoverlens.demo"
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500/60"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-slate-400 font-medium">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (demo accounts use 'demo')"
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500/60"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
