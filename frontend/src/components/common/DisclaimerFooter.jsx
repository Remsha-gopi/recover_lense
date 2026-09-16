import React from "react";
import { useLanguage } from "../../context/LanguageContext";
import { ShieldAlert, Info } from "lucide-react";

export default function DisclaimerFooter() {
  const { t } = useLanguage();

  return (
    <footer className="mt-auto border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md py-4 px-4 text-center text-xs text-slate-400">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-300">
          <ShieldAlert className="w-4 h-4 text-brand-400 shrink-0" />
          <span className="font-medium text-left">
            {t("disclaimer")}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-500 text-[11px] whitespace-nowrap">
          <Info className="w-3.5 h-3.5" />
          <span>Synthetic Patient Demonstration Data</span>
        </div>
      </div>
    </footer>
  );
}
