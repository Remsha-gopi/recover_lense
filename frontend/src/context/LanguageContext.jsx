import React, { createContext, useContext, useState, useEffect } from "react";
import { translations } from "../i18n/translations";
import { api } from "../services/api";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem("recoverlens_lang") || "en";
  });

  const setLanguage = (lang, patientId = null) => {
    setLanguageState(lang);
    localStorage.setItem("recoverlens_lang", lang);
    if (patientId) {
      api.updatePatientLanguage(patientId, lang).catch(() => {});
    }
  };

  // Nested translation accessor: t("home.welcome") or t("home.dayProgress", { day: 12, total: 30 })
  const t = (path, variables = {}) => {
    const keys = path.split(".");
    let current = translations[language] || translations["en"];
    
    for (const key of keys) {
      if (current && current[key] !== undefined) {
        current = current[key];
      } else {
        // Fallback to English
        let fallback = translations["en"];
        for (const fbKey of keys) {
          if (fallback && fallback[fbKey] !== undefined) {
            fallback = fallback[fbKey];
          } else {
            return path;
          }
        }
        current = fallback;
        break;
      }
    }

    if (typeof current === "string") {
      let result = current;
      for (const [varKey, varVal] of Object.entries(variables)) {
        result = result.replace(new RegExp(`\\{${varKey}\\}`, "g"), varVal);
      }
      return result;
    }

    return current || path;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
