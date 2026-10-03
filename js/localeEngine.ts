/**
 * localeEngine.ts (Source Reference & Type Definitions)
 * 
 * Client-side Multilingual Translation and Transliteration Engine for svt-kalasa.
 * Provides dictionary lookup translation with Kannada fallback and
 * IAST transliteration for Kannada script (Sanskrit Slokas / Mantras / Stotrams)
 * using Sanscript (kannada -> iast).
 */

export type SupportedLang = 'kn' | 'en';
export type SourceScript = 'kannada' | 'devanagari' | 'iast';

export interface TranslationDictionary {
  [key: string]: any;
}

export interface LocaleEngineOptions {
  defaultLang?: SupportedLang;
  storageKey?: string;
}

declare global {
  interface Window {
    Sanscript?: {
      t: (text: string, from: string, to: string, options?: any) => string;
    };
  }
}

/**
 * Nested key lookup helper: 'nav.home' -> dict['nav']['home']
 */
export function getNestedTranslation(dictionary: TranslationDictionary, key: string): string | null {
  if (!dictionary || !key) return null;
  const parts = key.split('.');
  let current: any = dictionary;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return null;
    }
  }
  return typeof current === 'string' ? current : null;
}

/**
 * Translates given key ID into target language using provided dictionary.
 * Falls back to original source text (Kannada) if key is missing or target is 'kn'.
 *
 * @param id Translation key identifier (e.g. "about.book_info")
 * @param fallbackText Original source text (Kannada)
 * @param targetLang Target language ('kn' or 'en')
 * @param dictionary Optional dictionary object (en.json contents)
 */
export function translateText(
  id: string,
  fallbackText: string,
  targetLang: SupportedLang = 'kn',
  dictionary: TranslationDictionary = {}
): string {
  if (targetLang === 'kn' || !id) {
    return fallbackText;
  }
  const translated = getNestedTranslation(dictionary, id);
  return translated !== null && translated !== undefined ? translated : fallbackText;
}

/**
 * Transliterates text from sourceScript (e.g. 'kannada') to IAST when targetLang is 'en'.
 * Uses window.Sanscript or bundled sanscript engine mapping 'kannada' -> 'iast'.
 * If targetLang is 'kn' or target is the same script, returns original text.
 *
 * @param text The source script text (e.g. Sanskrit verse in Kannada script)
 * @param sourceScript Source script name (default 'kannada')
 * @param targetLang Target display language ('kn' | 'en')
 */
export function transliterateText(
  text: string,
  sourceScript: string = 'kannada',
  targetLang: SupportedLang = 'kn'
): string {
  if (!text) return '';
  if (targetLang === 'kn') {
    return text;
  }

  // Transliterate to IAST for English reading
  if (typeof window !== 'undefined' && window.Sanscript && typeof window.Sanscript.t === 'function') {
    try {
      return window.Sanscript.t(text, sourceScript.toLowerCase(), 'iast');
    } catch (err) {
      console.warn('Sanscript transliteration error:', err);
      return text;
    }
  }

  return text;
}
