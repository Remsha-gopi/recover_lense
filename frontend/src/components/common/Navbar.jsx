import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import {
  Activity,
  Globe,
  Users,
  LogOut,
  ChevronDown,
  RotateCcw,
  ShieldCheck,
  Stethoscope,
  Sparkles,
} from "lucide-react";
import { api } from "../../services/api";

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, isPatient, isCareTeam, demoLogin, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleDemoSwitch = async (role, code) => {
    setDemoMenuOpen(false);
    await demoLogin(role, code);
    setActiveTab("home");
  };

  const handleResetDemo = async () => {
    setIsResetting(true);
    try {
      await api.resetDemo();
      // Reload current session
      if (isCareTeam) {
        await demoLogin("care_team");
      } else {
        await demoLogin("patient", user?.full_name?.toLowerCase().includes("arjun") ? "arjun" : "meera");
      }
      window.location.reload();
    } finally {
      setIsResetting(false);
      setDemoMenuOpen(false);
    }
  };

  const languages = [
    { code: "en", label: "English" },
    { code: "ta", label: "தமிழ் (Tamil)" },
    { code: "hi", label: "हिन्दी (Hindi)" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-6">
          <div
            onClick={() => setActiveTab("home")}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-teal-400 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-brand-300 bg-clip-text text-transparent">
                  RecoverLens
                </span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  v2
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block leading-tight">
                {t("tagline")}
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          {user && (
            <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-slate-800">
              {isPatient && (
                <>
                  <button
                    onClick={() => setActiveTab("home")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      activeTab === "home"
                        ? "bg-brand-500/15 text-brand-300 border border-brand-500/30"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    {t("nav.home")}
                  </button>
                  <button
                    onClick={() => setActiveTab("checkin")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      activeTab === "checkin"
                        ? "bg-brand-500/15 text-brand-300 border border-brand-500/30"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    {t("nav.checkin")}
                  </button>
                  <button
                    onClick={() => setActiveTab("progress")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      activeTab === "progress"
                        ? "bg-brand-500/15 text-brand-300 border border-brand-500/30"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    {t("nav.progress")}
                  </button>
                  <button
                    onClick={() => setActiveTab("updates")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      activeTab === "updates"
                        ? "bg-brand-500/15 text-brand-300 border border-brand-500/30"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    {t("nav.updates")}
                  </button>
                  <button
                    onClick={() => setActiveTab("history")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      activeTab === "history"
                        ? "bg-brand-500/15 text-brand-300 border border-brand-500/30"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    {t("nav.history")}
                  </button>
                  <button
                    onClick={() => setActiveTab("profile")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      activeTab === "profile"
                        ? "bg-brand-500/15 text-brand-300 border border-brand-500/30"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    {t("nav.profile")}
                  </button>
                </>
              )}

              {isCareTeam && (
                <>
                  <button
                    onClick={() => setActiveTab("queue")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      activeTab === "queue"
                        ? "bg-teal-500/15 text-teal-300 border border-teal-500/30"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    {t("nav.queue")}
                  </button>
                </>
              )}
            </nav>
          )}
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-brand-400" />
              <span className="uppercase">{language}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {langMenuOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1.5 z-50">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLanguage(l.code, user?.patient_id);
                      setLangMenuOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs transition-colors flex items-center justify-between ${
                      language === l.code
                        ? "bg-brand-500/20 text-brand-300 font-semibold"
                        : "text-slate-300 hover:bg-slate-800/80"
                    }`}
                  >
                    <span>{l.label}</span>
                    {language === l.code && (
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Demo Switcher */}
          <div className="relative">
            <button
              onClick={() => setDemoMenuOpen(!demoMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-brand-600/20 to-teal-600/20 border border-brand-500/30 text-brand-300 hover:border-brand-400 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span className="hidden sm:inline">{t("nav.demoSwitcher")}</span>
              <span className="sm:hidden">Demo</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {demoMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 backdrop-blur-xl">
                <div className="px-3 py-2 border-b border-slate-800">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Switch Demo Persona
                  </p>
                </div>
                <div className="py-1 space-y-1">
                  <button
                    onClick={() => handleDemoSwitch("patient", "meera")}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-slate-800 transition flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-white">Meera (Post-Surgery)</p>
                      <p className="text-[11px] text-slate-400">Knee Rehab · Day 24 · On Track</p>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  </button>

                  <button
                    onClick={() => handleDemoSwitch("patient", "arjun")}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-slate-800 transition flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-white">Arjun (Illness Recovery)</p>
                      <p className="text-[11px] text-slate-400">Fatigue · Day 12 · Update Pending</p>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-pulse" />
                  </button>

                  <button
                    onClick={() => handleDemoSwitch("patient", "priya")}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-slate-800 transition flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-white">Priya (Shoulder Rehab)</p>
                      <p className="text-[11px] text-slate-400">Injury · Day 18 · Recovering Faster</p>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                  </button>

                  <button
                    onClick={() => handleDemoSwitch("care_team")}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-teal-950/40 border border-teal-500/20 transition flex items-center justify-between text-teal-300"
                  >
                    <div>
                      <p className="font-semibold">Dr. Alok Sharma, MD</p>
                      <p className="text-[11px] text-slate-400">Care Team Lead Console</p>
                    </div>
                    <Stethoscope className="w-4 h-4 text-teal-400" />
                  </button>
                </div>

                <div className="pt-2 mt-1 border-t border-slate-800">
                  <button
                    onClick={handleResetDemo}
                    disabled={isResetting}
                    className="w-full py-1.5 px-3 rounded-lg text-xs text-rose-300 hover:bg-rose-950/30 flex items-center justify-center gap-1.5 transition"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? "animate-spin" : ""}`} />
                    <span>Reset All Synthetic Data</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill / Logout */}
          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="hidden lg:block text-right">
                <p className="text-xs font-semibold text-white leading-tight">
                  {user.full_name}
                </p>
                <p className="text-[10px] text-brand-400 uppercase tracking-wider font-mono">
                  {isCareTeam ? "Care Team" : "Patient"}
                </p>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                title={t("nav.logout")}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
