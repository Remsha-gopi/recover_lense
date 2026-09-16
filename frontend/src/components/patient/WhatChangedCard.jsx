import React from "react";
import { ArrowUpRight, ArrowDownRight, GitCompare, Minus } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export default function WhatChangedCard({ whatChanged }) {
  const { t } = useLanguage();
  if (!whatChanged) return null;

  return (
    <div className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500/15 border border-teal-500/25 flex items-center justify-center text-teal-400">
              <GitCompare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t("home.whatChanged")}
              </h3>
              <p className="text-xs text-slate-300 font-medium">{whatChanged.title}</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-300 mt-3 leading-relaxed">
          {whatChanged.summary}
        </p>
      </div>

      {/* Grid of changed metrics */}
      {whatChanged.metrics && whatChanged.metrics.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2">
          {whatChanged.metrics.slice(0, 4).map((m) => {
            const hasChange = Math.abs(m.diff) > 0.01;
            return (
              <div
                key={m.name}
                className="bg-slate-900/60 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between"
              >
                <div>
                  <span className="text-[11px] text-slate-400 block truncate">
                    {m.label}
                  </span>
                  <span className="text-xs font-mono font-bold text-white">
                    {m.current}
                    <span className="text-[10px] text-slate-500 font-normal"> /10</span>
                  </span>
                </div>

                {hasChange ? (
                  <span
                    className={`inline-flex items-center text-[11px] font-bold ${
                      m.improved ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {m.improved ? (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5" />
                    )}
                    {m.diff > 0 ? `+${m.diff}` : m.diff}
                  </span>
                ) : (
                  <span className="text-slate-500 text-[11px] flex items-center">
                    <Minus className="w-3 h-3" />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
