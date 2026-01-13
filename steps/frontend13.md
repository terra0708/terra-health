i18n setup ve translation dosyaları oluştur:

CONFIG (config/i18n.config.js):
i18next.init({
  lng: 'tr',
  fallbackLng: 'tr',
  resources: {
    en: { translation: enTranslations },
    tr: { translation: trTranslations }
  }
})

TRANSLATION FILES (public/locales/):

en/common.json:
{
  "welcome": "Welcome",
  "logout": "Logout",
  "save": "Save",
  "cancel": "Cancel",
  "delete": "Delete",
  "edit": "Edit",
  "search": "Search",
  "filter": "Filter"
}

tr/common.json:
{
  "welcome": "Hoşgeldiniz",
  "logout": "Çıkış Yap",
  "save": "Kaydet",
  "cancel": "İptal",
  "delete": "Sil",
  "edit": "Düzenle",
  "search": "Ara",
  "filter": "Filtrele"
}

en/customers.json:
{
  "title": "Customers",
  "createNew": "Create New Customer",
  "leadScore": "Lead Score",
  "pipelineStage": "Pipeline Stage",
  "lostReason": "Lost Reason"
}

tr/customers.json:
{
  "title": "Müşteriler",
  "createNew": "Yeni Müşteri Oluştur",
  "leadScore": "Lead Puanı",
  "pipelineStage": "Satış Aşaması",
  "lostReason": "Kayıp Nedeni"
}

KULLANIM:
const { t } = useTranslation();
<h1>{t('customers:title')}</h1>

LANGUAGE SWITCHER:
Header'da TR/EN toggle button
Seçim localStorage'a kaydet
Sayfa yenilenmeden dil değişsin

Tüm modüller için translation dosyaları oluştur.