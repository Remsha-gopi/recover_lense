import React, { useState, useEffect } from "react";
import { Volume2, Mic, MicOff, Check, X, Loader2 } from "lucide-react";
import { speechService } from "../../services/speech";
import { useLanguage } from "../../context/LanguageContext";

export default function VoiceControls({
  ttsText,
  onVoiceAnswer,
  currentValue,
  unit = "",
  disabled = false,
}) {
  const { language, t } = useLanguage();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [sttSupported, setSttSupported] = useState(true);
  const [ttsSupported, setTtsSupported] = useState(true);

  useEffect(() => {
    setSttSupported(speechService.isSpeechRecognitionSupported());
    setTtsSupported(speechService.isSpeechSynthesisSupported());
  }, []);

  const handleSpeak = () => {
    if (isSpeaking) {
      speechService.stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    speechService.speak(ttsText, language, () => {
      setIsSpeaking(false);
    });
  };

  const handleListen = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognizer = speechService.createRecognizer(
      language,
      ({ finalText, interimText }) => {
        const text = finalText || interimText;
        setTranscript(text);
      },
      (error) => {
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    );

    if (recognizer) {
      setIsListening(true);
      recognizer.start();
    }
  };

  const confirmTranscript = () => {
    if (!transcript) return;

    // Try parsing number from transcript (e.g. "seven", "7", "3 out of 10")
    const match = transcript.match(/\b([0-9]|10)\b/);
    if (match) {
      const num = parseFloat(match[1]);
      onVoiceAnswer(num, transcript);
    } else {
      // Word to number mappings for common responses
      const wordMap = {
        zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5,
        six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
        பூஜ்ஜியம்: 0, ஒன்று: 1, இரண்டு: 2, மூன்று: 3, நான்கு: 4, ஐந்து: 5,
        ஆறு: 6, ஏழு: 7, எட்டு: 8, ஒன்பது: 9, பத்து: 10,
        शून्य: 0, एक: 1, दो: 2, तीन: 3, चार: 4, पाँच: 5,
        छह: 6, सात: 7, आठ: 8, नौ: 9, दस: 10
      };
      let foundNum = null;
      for (const [w, val] of Object.entries(wordMap)) {
        if (transcript.toLowerCase().includes(w)) {
          foundNum = val;
          break;
        }
      }
      if (foundNum !== null) {
        onVoiceAnswer(foundNum, transcript);
      } else {
        onVoiceAnswer(null, transcript);
      }
    }
    setTranscript("");
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {/* Listen Button (TTS) */}
        {ttsSupported && (
          <button
            type="button"
            onClick={handleSpeak}
            disabled={disabled}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              isSpeaking
                ? "bg-brand-500/20 border-brand-400 text-brand-300 animate-pulse"
                : "bg-slate-800/80 border-slate-700/80 text-slate-300 hover:border-brand-500/50 hover:text-brand-300"
            }`}
            title={t("checkin.listenPrompt")}
          >
            <Volume2 className={`w-4 h-4 ${isSpeaking ? "text-brand-400" : ""}`} />
            <span>{isSpeaking ? "Speaking..." : t("checkin.listenPrompt")}</span>
          </button>
        )}

        {/* Speak Button (STT) */}
        {sttSupported ? (
          <button
            type="button"
            onClick={handleListen}
            disabled={disabled}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              isListening
                ? "bg-rose-500/20 border-rose-400 text-rose-300 animate-pulse"
                : "bg-slate-800/80 border-slate-700/80 text-slate-300 hover:border-rose-400/50 hover:text-rose-300"
            }`}
            title={t("checkin.speakPrompt")}
          >
            <Mic className={`w-4 h-4 ${isListening ? "text-rose-400" : ""}`} />
            <span>{isListening ? t("checkin.speaking") : t("checkin.speakPrompt")}</span>
          </button>
        ) : (
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-slate-500 bg-slate-800/40 border border-slate-800 cursor-not-allowed"
            title="Speech recognition not supported in this browser; slider input active."
          >
            <MicOff className="w-3.5 h-3.5" />
            <span>Voice Fallback Active</span>
          </span>
        )}
      </div>

      {/* Voice Transcription Confirmation Modal / Chip */}
      {transcript && (
        <div className="p-3 bg-brand-950/60 border border-brand-500/40 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2 text-sm text-slate-200">
            <span className="w-2 h-2 rounded-full bg-brand-400 animate-ping shrink-0" />
            <span>
              Transcribed: <strong className="text-brand-300 font-semibold">"{transcript}"</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={confirmTranscript}
              className="px-3 py-1 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              {t("checkin.confirmVoice")}
            </button>
            <button
              type="button"
              onClick={() => setTranscript("")}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg text-xs transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
