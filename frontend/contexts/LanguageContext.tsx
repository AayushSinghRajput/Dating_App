import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { translations, LanguageCode } from "@/src/i18n/translations";

const STORAGE_KEY = "@app_language";

export interface SupportedLanguage {
  code: LanguageCode;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "ne", name: "Nepali", nativeName: "नेपाली" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
];

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => Promise<void>;
  t: (keyPath: string, fallback?: string) => string;
  supportedLanguages: SupportedLanguage[];
  isLanguageLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: async () => {},
  t: (key: string, fallback?: string) => fallback || key,
  supportedLanguages: SUPPORTED_LANGUAGES,
  isLanguageLoading: false,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>("en");
  const [isLanguageLoading, setIsLanguageLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored === "en" || stored === "ne" || stored === "hi") {
          setLanguageState(stored);
        }
      })
      .catch((err) => console.warn("Failed to load saved language:", err))
      .finally(() => setIsLanguageLoading(false));
  }, []);

  const setLanguage = useCallback(async (newLang: LanguageCode) => {
    setLanguageState(newLang);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, newLang);
    } catch (err) {
      console.warn("Failed to persist language choice:", err);
    }
  }, []);

  const t = useCallback(
    (keyPath: string, fallback?: string): string => {
      const keys = keyPath.split(".");

      // 1. Try currently selected language
      let currentVal: any = translations[language];
      for (const k of keys) {
        if (currentVal && typeof currentVal === "object" && k in currentVal) {
          currentVal = currentVal[k];
        } else {
          currentVal = undefined;
          break;
        }
      }

      if (typeof currentVal === "string") {
        return currentVal;
      }

      // 2. Fall back to English
      let fallbackVal: any = translations.en;
      for (const k of keys) {
        if (fallbackVal && typeof fallbackVal === "object" && k in fallbackVal) {
          fallbackVal = fallbackVal[k];
        } else {
          fallbackVal = undefined;
          break;
        }
      }

      if (typeof fallbackVal === "string") {
        return fallbackVal;
      }

      // 3. Fall back to explicit default or keyPath
      return fallback || keyPath;
    },
    [language]
  );

  const contextValue = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      supportedLanguages: SUPPORTED_LANGUAGES,
      isLanguageLoading,
    }),
    [language, setLanguage, t, isLanguageLoading]
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
