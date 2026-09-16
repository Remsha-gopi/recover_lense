import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, Sparkles, ShieldAlert, Loader2 } from "lucide-react";
import { api } from "../../services/api";
import { useLanguage } from "../../context/LanguageContext";

export default function RecoveryCoachModal({ patientId }) {
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hello! I am your RecoverLens Recovery Coach. I can help explain your recovery metrics, answer questions about what is expected at this stage, or review your doctor's latest notes. How can I help today?",
      disclaimer: "Decision support only. Never replaces medical consultation.",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const quickPrompts = [
    "Is my current recovery trajectory normal?",
    "How is my pain score trending?",
    "What does my care team recommend right now?",
  ];

  const handleSend = async (questionText = null) => {
    const q = questionText || inputValue.trim();
    if (!q || loading) return;

    // Add user message
    const newMsgList = [...messages, { role: "user", text: q }];
    setMessages(newMsgList);
    setInputValue("");
    setLoading(true);

    try {
      const resp = await api.askRecoveryCoach(patientId, q, language);
      setMessages([
        ...newMsgList,
        {
          role: "assistant",
          text: resp.answer,
          disclaimer: resp.safety_disclaimer,
          sources: resp.data_sources_used,
        },
      ]);
    } catch (err) {
      setMessages([
        ...newMsgList,
        {
          role: "assistant",
          text: "I am unable to retrieve your recovery profile right now. Please verify your connection or consult your clinic directly.",
          disclaimer: "System notification.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 p-3.5 rounded-2xl bg-gradient-to-tr from-brand-600 to-teal-500 text-white shadow-xl shadow-brand-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 font-semibold text-sm border border-teal-400/40"
        title="Open Recovery Coach"
      >
        <Sparkles className="w-5 h-5 animate-pulse" />
        <span className="hidden sm:inline">Ask Recovery Coach</span>
      </button>

      {/* Slide-over / Modal Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 w-[94vw] sm:w-[420px] max-h-[620px] h-[80vh] z-50 glass-card rounded-2xl border border-slate-700/80 shadow-2xl flex flex-col overflow-hidden backdrop-blur-2xl animate-fade-in">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-500/20 border border-brand-400/30 flex items-center justify-center text-brand-300">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white leading-tight flex items-center gap-1.5">
                  <span>{t("coach.title")}</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300">
                    Clinical AI
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">{t("coach.subtitle")}</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Safety Notice Banner */}
          <div className="px-3.5 py-2 bg-brand-950/40 border-b border-brand-500/20 flex items-center gap-2 text-[11px] text-slate-300">
            <ShieldAlert className="w-3.5 h-3.5 text-brand-400 shrink-0" />
            <span>{t("coach.safetyNote")}</span>
          </div>

          {/* Messages Thread */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${
                  m.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    m.role === "user"
                      ? "bg-brand-600 text-white rounded-br-none shadow-md"
                      : "bg-slate-900/90 border border-slate-800 text-slate-200 rounded-bl-none shadow-sm"
                  }`}
                >
                  <p>{m.text}</p>

                  {/* Sources tag for clinical grounding */}
                  {m.sources && m.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-400 space-y-0.5">
                      <span className="font-semibold text-slate-300">Grounding Data:</span>
                      {m.sources.slice(0, 2).map((s, i) => (
                        <div key={i} className="truncate">• {s}</div>
                      ))}
                    </div>
                  )}
                </div>

                {m.disclaimer && (
                  <span className="text-[9px] text-slate-500 mt-1 px-1">
                    {m.disclaimer}
                  </span>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/50 p-2.5 rounded-xl w-fit">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-400" />
                <span>Reviewing your recovery profile...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          <div className="px-3 py-2 border-t border-slate-800/80 bg-slate-950/40 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {quickPrompts.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(p)}
                className="whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] bg-slate-900 border border-slate-800 hover:border-brand-500/40 hover:text-brand-300 text-slate-400 transition"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 border-t border-slate-800 bg-slate-900/90 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={t("coach.askPlaceholder")}
              className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500/60"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || loading}
              className="p-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white disabled:opacity-40 disabled:hover:bg-brand-600 transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
