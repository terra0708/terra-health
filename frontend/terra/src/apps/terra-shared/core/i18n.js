import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Ortak çeviriler (terra-shared)
import sharedTr from '@assets/locales/terra-shared/tr.json';
import sharedEn from '@assets/locales/terra-shared/en.json';

// Terra-Health çevirileri
import terraHealthTr from '@assets/locales/terra-health/tr.json';
import terraHealthEn from '@assets/locales/terra-health/en.json';

// Terra-Ads çevirileri
import terraAdsTr from '@assets/locales/terra-ads/tr.json';
import terraAdsEn from '@assets/locales/terra-ads/en.json';

const resources = {
    tr: {
        translation: sharedTr,        // Default namespace (terra-shared)
        'terra-health': terraHealthTr,   // Terra-Health namespace
        'terra-ads': terraAdsTr,    // Terra-Ads namespace
    },
    en: {
        translation: sharedEn,
        'terra-health': terraHealthEn,
        'terra-ads': terraAdsEn,
    },
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: 'tr', // default language
        fallbackLng: 'en',
        defaultNS: 'translation',     // Default namespace = terra-shared
        ns: ['translation', 'terra-health', 'terra-ads'],
        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;
