import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import trTranslation from '../assets/locales/tr/translation.json';
import enTranslation from '../assets/locales/en/translation.json';

const resources = {
    tr: {
        translation: trTranslation,
    },
    en: {
        translation: enTranslation,
    },
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: 'tr', // default language
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;
