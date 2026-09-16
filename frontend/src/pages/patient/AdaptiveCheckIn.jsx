import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { api } from "../../services/api";
import VoiceControls from "../../components/common/VoiceControls";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Loader2,
  FileText,
} from "lucide-react";

export default function AdaptiveCheckIn({ setActiveTab }) {
  const { user } = useAuth();
  const { language, t } = useLanguage();

  const [currentQuestionData, setCurrentQuestionData] = useState(null);
  const [answeredKeys, setAnsweredKeys] = useState([]);
  const [measurements, setMeasurements] = useState({});
  const [currentVal, setCurrentVal] = useState(5.0);
  const [freeNote, setFreeNote] = useState("");
  const [isDone, setIsDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingQuestion, setLoadingQuestion] = useState(true);
  const [submissionResult, setSubmissionResult] = useState(null);

  const fetchNext = async (keysList = answeredKeys) => {
    setLoadingQuestion(true);
    try {
      const res = await api.getCheckinNextQuestion(
        user.patient_id,
        keysList,
        language
      );
      if (res.is_done) {
        setIsDone(true);
      } else {
        setCurrentQuestionData(res);
        // Default slider value based on direction
        const defaultVal =
          res.question.direction_better === "lower" ? 3.0 : 7.0;
        setCurrentVal(defaultVal);
      }
    } catch (err) {
      console.error("Error getting question:", err);
    } finally {
      setLoadingQuestion(false);
    }
  };

  useEffect(() => {
    if (user?.patient_id) {
      fetchNext([]);
    }
  }, [user?.patient_id, language]);

  const handleNextQuestion = () => {
    if (!currentQuestionData?.question) return;

    const key = currentQuestionData.question.indicator_key;
    const newMeasurements = { ...measurements, [key]: currentVal };
    setMeasurements(newMeasurements);

    const newAnswered = [...answeredKeys, key];
    setAnsweredKeys(newAnswered);

    fetchNext(newAnswered);
  };

  const handleVoiceAnswer = (numericVal, rawTranscript) => {
    if (numericVal !== null && numericVal !== undefined) {
      setCurrentVal(Math.min(Math.max(numericVal, 0), 10));
    } else if (rawTranscript) {
      // Append text to free note if not a pure number
      setFreeNote((prev) => (prev ? `${prev} | ${rawTranscript}` : rawTranscript));
    }
  };

  const handleSubmitCheckin = async () => {
    setSubmitting(true);
    try {
      const res = await api.submitCheckin(
        user.patient_id,
        measurements,
        freeNote,
        language
      );
      setSubmissionResult(res);
    } catch (err) {
      console.error("Submission failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (submissionResult) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center animate-fade-in">
        <div className="glass-card rounded-3xl p-8 border border-teal-500/40 bg-teal-950/20 space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-teal-500/20 border border-teal-400/40 text-teal-300 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-white">
              Check-in Successfully Analyzed!
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Your biomarkers have been processed by the adaptive trajectory engine.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-left text-xs space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Composite Score:</span>
              <span className="text-teal-400 font-mono font-bold text-sm">
                {submissionResult.composite_score}/100
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Evaluated Status:</span>
              <span className="font-semibold text-white uppercase tracking-wider">
                {submissionResult.status_state.replace("_", " ")}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-amber-300">
              <span>Care Team Status:</span>
              <span className="font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Update Pending Review
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-400">
            Your human care team has received this log. Status will change to "Reviewed" once your clinician evaluates this submission.
          </p>

          <button
            onClick={() => setActiveTab("home")}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 to-teal-500 hover:from-brand-500 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg transition"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-brand-400">
          <Sparkles className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">
            Layer 0 Adaptive Engine
          </span>
        </div>
        <h1 className="text-2xl font-extrabold text-white mt-1">
          {t("checkin.title")}
        </h1>
        <p className="text-xs text-slate-400">{t("checkin.subtitle")}</p>
      </div>

      {loadingQuestion ? (
        <div className="glass-card rounded-2xl p-12 border border-slate-800 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
          <p className="text-xs text-slate-400">Selecting high-impact question...</p>
        </div>
      ) : !isDone && currentQuestionData?.question ? (
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6 animate-fade-in">
          {/* Question Stepper Indicator */}
          <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-800">
            <span className="text-brand-400 font-bold">
              {t("checkin.questionNum", {
                current: currentQuestionData.question_number,
                total: currentQuestionData.total_questions,
              })}
            </span>
            <span className="text-[11px] text-slate-500 uppercase font-mono">
              Key: {currentQuestionData.question.indicator_key}
            </span>
          </div>

          {/* Question Prompt */}
          <div className="space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-white leading-relaxed">
              {currentQuestionData.question.question_text}
            </h2>

            {/* Voice Controls: TTS Listen + STT Voice Answer */}
            <VoiceControls
              ttsText={currentQuestionData.question.tts_text}
              onVoiceAnswer={handleVoiceAnswer}
              currentValue={currentVal}
              unit={currentQuestionData.question.unit}
            />
          </div>

          {/* Interactive Value Slider */}
          <div className="space-y-3 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400 font-medium">
                Current Level:
              </span>
              <span className="text-2xl font-black font-mono text-brand-300">
                {currentVal}
                <span className="text-xs text-slate-500 font-normal"> /10</span>
              </span>
            </div>

            <input
              type="range"
              min={currentQuestionData.question.min_val}
              max={currentQuestionData.question.max_val}
              step={currentQuestionData.question.step}
              value={currentVal}
              onChange={(e) => setCurrentVal(parseFloat(e.target.value))}
              className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-400 focus:outline-none"
            />

            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>0 (Lowest)</span>
              <span>5 (Moderate)</span>
              <span>10 (Maximum)</span>
            </div>
          </div>

          {/* Quick Option Buttons */}
          {currentQuestionData.question.suggested_options && (
            <div className="pt-2">
              <span className="text-[11px] text-slate-400 block mb-2 font-medium">
                Quick Select:
              </span>
              <div className="flex flex-wrap gap-2">
                {currentQuestionData.question.suggested_options.map((opt, i) => {
                  const val = parseFloat(opt.split(" - ")[0]);
                  const isSelected = currentVal === val;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCurrentVal(val)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                        isSelected
                          ? "bg-brand-500/25 border-brand-400 text-brand-300"
                          : "bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Next Button */}
          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={handleNextQuestion}
              className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center gap-2 transition"
            >
              <span>{t("checkin.next")}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Summary & Optional Free Note Step */
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6 animate-fade-in">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <FileText className="w-4 h-4 text-teal-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Check-in Summary & Clinician Note
            </h2>
          </div>

          {/* Answered Metrics Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {Object.entries(measurements).map(([k, v]) => (
              <div
                key={k}
                className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex justify-between items-center"
              >
                <span className="text-xs text-slate-400 capitalize">
                  {k.replace("_", " ")}
                </span>
                <span className="text-xs font-mono font-bold text-brand-300">
                  {v} / 10
                </span>
              </div>
            ))}
          </div>

          {/* Free Note Input */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
              <span>{t("checkin.freeNotePrompt")}</span>
              <span className="text-[10px] text-slate-500 font-normal">
                Voice notes will append here
              </span>
            </label>
            <textarea
              rows={3}
              value={freeNote}
              onChange={(e) => setFreeNote(e.target.value)}
              placeholder={t("checkin.freeNotePlaceholder")}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500/60"
            />
          </div>

          {/* Submit CTA */}
          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmitCheckin}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-teal-500 hover:from-brand-500 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-xl shadow-brand-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t("checkin.analyzing")}</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{t("checkin.submit")}</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
