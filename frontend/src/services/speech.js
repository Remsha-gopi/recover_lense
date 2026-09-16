/**
 * Speech Recognition and Synthesis Service
 * Handles Web Speech API with feature detection, locale matching, and graceful fallbacks.
 */

export const speechService = {
  // Feature detection
  isSpeechRecognitionSupported: () => {
    return typeof window !== "undefined" && Boolean(
      window.SpeechRecognition || window.webkitSpeechRecognition
    );
  },

  isSpeechSynthesisSupported: () => {
    return typeof window !== "undefined" && Boolean(window.speechSynthesis);
  },

  // Language to locale code mapping
  getLocaleCode: (lang) => {
    switch (lang) {
      case "ta":
        return "ta-IN";
      case "hi":
        return "hi-IN";
      default:
        return "en-US";
    }
  },

  // Text-To-Speech
  speak: (text, lang = "en", onEnd = null) => {
    if (!speechService.isSpeechSynthesisSupported()) {
      console.warn("Speech synthesis not supported in this browser.");
      return null;
    }

    window.speechSynthesis.cancel(); // Cancel any ongoing speech

    const utterance = new SpeechSynthesisUtterance(text);
    const targetLocale = speechService.getLocaleCode(lang);
    utterance.lang = targetLocale;
    utterance.rate = 0.95; // Clear and slightly measured cadence
    utterance.pitch = 1.0;

    // Try to pick a matched voice
    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find((v) => v.lang.startsWith(targetLocale.split("-")[0]));
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    if (onEnd) {
      utterance.onend = onEnd;
      utterance.onerror = onEnd;
    }

    window.speechSynthesis.speak(utterance);
    return utterance;
  },

  stopSpeaking: () => {
    if (speechService.isSpeechSynthesisSupported()) {
      window.speechSynthesis.cancel();
    }
  },

  // Speech-To-Text (Recognition)
  createRecognizer: (lang = "en", onResult, onError, onEnd) => {
    if (!speechService.isSpeechRecognitionSupported()) {
      return null;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = speechService.getLocaleCode(lang);
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (onResult) {
        onResult({
          finalText: finalTranscript.trim(),
          interimText: interimTranscript.trim(),
          isFinal: Boolean(finalTranscript),
        });
      }
    };

    recognition.onerror = (event) => {
      console.warn("Speech recognition error:", event.error);
      if (onError) onError(event.error);
    };

    recognition.onend = () => {
      if (onEnd) onEnd();
    };

    return recognition;
  },
};
