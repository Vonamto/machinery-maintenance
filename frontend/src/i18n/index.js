// frontend/src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files (we will create these in the next step)
import enTranslation from '../locales/en/translation.json';
import arTranslation from '../locales/ar/translation.json';

// Define the translation resources
const resources = {
  en: {
    translation: enTranslation,
  },
  ar: {
    translation: arTranslation,
  },
};

// Configuration options for i18next
const i18nOptions = {
  resources,
  fallbackLng: 'en', // Default language if detection fails
  detection: {
    order: ['localStorage', 'navigator'], // Order of language detection
    caches: ['localStorage'], // Cache the selected language in localStorage
  },
  interpolation: {
    escapeValue: false, // React already escapes values, so we don't need i18next to do it again
  },
  // KeySeparator: false, // Disable key nesting if needed (optional)
  // nsSeparator: false, // Disable namespace separator if needed (optional)
};

// Initialize i18next with the configuration
i18n.use(LanguageDetector).use(initReactI18next).init(i18nOptions);

export default i18n;
