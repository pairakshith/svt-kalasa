import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'kn' | 'en';

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  translate: (id: string, fallbackText: string) => string;
  transliterate: (text: string, sourceScript?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export interface LanguageProviderProps {
  children: ReactNode;
  defaultLang?: Language;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({
  children,
  defaultLang = 'kn'
}) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('svt_kalasa_lang');
      if (stored === 'en' || stored === 'kn') return stored;
    }
    return defaultLang;
  });

  const [dictionary, setDictionary] = useState<Record<string, any>>({});

  useEffect(() => {
    // Sync with external LocaleEngine if available
    if (typeof window !== 'undefined' && (window as any).LocaleEngine) {
      (window as any).LocaleEngine.onLanguageChange((lang: Language) => {
        setLanguageState(lang);
      });
    }

    // Load en.json
    fetch('/locales/en.json')
      .then(res => res.json())
      .then(data => setDictionary(data))
      .catch(() => {});
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('svt_kalasa_lang', lang);
      } catch (e) {}
      if ((window as any).LocaleEngine) {
        (window as any).LocaleEngine.setLanguage(lang);
      }
    }
  };

  const translate = (id: string, fallbackText: string): string => {
    if (language === 'kn' || !id) return fallbackText;
    const parts = id.split('.');
    let cur: any = dictionary;
    for (const p of parts) {
      if (cur && typeof cur === 'object' && p in cur) {
        cur = cur[p];
      } else {
        return fallbackText;
      }
    }
    return typeof cur === 'string' ? cur : fallbackText;
  };

  const transliterate = (text: string, sourceScript = 'kannada'): string => {
    if (language === 'kn' || !text) return text;
    if (typeof window !== 'undefined' && (window as any).Sanscript) {
      try {
        return (window as any).Sanscript.t(text, sourceScript, 'iast');
      } catch (e) {
        return text;
      }
    }
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, translate, transliterate }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const HeaderLanguageDropdown: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="top-language-bar notranslate" translate="no">
      <div className="lang-bar-container">
        <div className="lang-brand">
          <span className="temple-om">ॐ</span>
          <span className="lang-brand-text">ಶ್ರೀ ವೆಂಕಟರಮಣ ದೇವಸ್ಥಾನ, ಕಳಸ</span>
        </div>
        <div className="lang-control">
          <label htmlFor="react-lang-select" className="lang-label">
            <span className="lang-label-text">Language / ಭಾಷೆ:</span>
          </label>
          <select
            id="react-lang-select"
            className="lang-selector-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            aria-label="Select Language"
          >
            <option value="kn">ಕನ್ನಡ (Kannada)</option>
            <option value="en">English (IAST)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
