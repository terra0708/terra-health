export const ALL_COUNTRIES = [
    { code: 'TR', name: 'Turkey', flag: '🇹🇷', phone: '+90' },
    { code: 'DE', name: 'Germany', flag: '🇩🇪', phone: '+49' },
    { code: 'US', name: 'United States', flag: '🇺🇸', phone: '+1' },
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', phone: '+44' },
    { code: 'FR', name: 'France', flag: '🇫🇷', phone: '+33' },
    { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', phone: '+966' },
    { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', phone: '+971' },
    { code: 'IQ', name: 'Iraq', flag: '🇮🇶', phone: '+964' },
    { code: 'AZ', name: 'Azerbaijan', flag: '🇦🇿', phone: '+994' },
    { code: 'RU', name: 'Russia', flag: '🇷🇺', phone: '+7' },
    { code: 'IT', name: 'Italy', flag: '🇮🇹', phone: '+39' },
    { code: 'ES', name: 'Spain', flag: '🇪🇸', phone: '+34' },
    { code: 'NL', name: 'Netherlands', flag: '🇳🇱', phone: '+31' },
    { code: 'QA', name: 'Qatar', flag: '🇶🇦', phone: '+974' },
    { code: 'KW', name: 'Kuwait', flag: '🇰🇼', phone: '+965' },
    { code: 'CH', name: 'Switzerland', flag: '🇨🇭', phone: '+41' },
    { code: 'BE', name: 'Belgium', flag: '🇧🇪', phone: '+32' },
    { code: 'AT', name: 'Austria', flag: '🇦🇹', phone: '+43' },
    { code: 'SE', name: 'Sweden', flag: '🇸🇪', phone: '+46' },
    { code: 'NO', name: 'Norway', flag: '47', phone: '+47' }
    // Gerçek bir API'den veya kütüphaneden (world-countries gibi) çekilebilir, 
    // ama MVP için en çok kullanılanları genişlettim.
];

export const formatLocaleDate = (dateString, locale = 'tr') => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Zaten formatlanmışsa

    return new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(date);
};
