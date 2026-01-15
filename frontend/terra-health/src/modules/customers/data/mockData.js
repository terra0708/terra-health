// Mock data for customers
export const mockCustomers = [
    {
        id: 1,
        registrationDate: '2024-01-15',
        country: 'TR',
        name: 'Mehmet Demir',
        phone: '+90 532 123 4567',
        source: 'google_ads',
        status: 'active',
        services: ['Saç Ekimi'],
        tags: ['VIP']
    },
    {
        id: 2,
        registrationDate: '2024-01-18',
        country: 'DE',
        name: 'Hans Mueller',
        phone: '+49 151 234 5678',
        source: 'manual',
        status: 'pending',
        services: ['Diş Tedavisi'],
        tags: ['Tekrar Eden Müşteri']
    },
    {
        id: 3,
        registrationDate: '2024-01-20',
        country: 'SA',
        name: 'محمد العلي',
        phone: '+966 50 123 4567',
        source: 'facebook_ads',
        status: 'active',
        services: ['Rinoplasti'],
        tags: ['VIP']
    },
    {
        id: 4,
        registrationDate: '2024-01-22',
        country: 'GB',
        name: 'John Smith',
        phone: '+44 7700 900123',
        source: 'referral',
        status: 'completed',
        services: ['Saç Ekimi'],
        tags: ['Eski Müşteri']
    },
    {
        id: 5,
        registrationDate: '2024-01-25',
        country: 'FR',
        name: 'Marie Dubois',
        phone: '+33 6 12 34 56 78',
        source: 'instagram_ads',
        status: 'active',
        services: ['Liposuction'],
        tags: ['VIP']
    },
    {
        id: 6,
        registrationDate: '2024-01-28',
        country: 'IQ',
        name: 'أحمد حسين',
        phone: '+964 770 123 4567',
        source: 'manual',
        status: 'cancelled',
        services: ['Diş Tedavisi'],
        tags: ['Sıkıntılı Kayıt']
    },
    {
        id: 7,
        registrationDate: '2024-02-01',
        country: 'NL',
        name: 'Jan van der Berg',
        phone: '+31 6 12345678',
        source: 'google_ads',
        status: 'active',
        services: ['Diş Tedavisi'],
        tags: ['Tekrar Eden Müşteri']
    },
    {
        id: 8,
        registrationDate: '2024-02-03',
        country: 'AE',
        name: 'عبدالله المنصouri',
        phone: '+971 50 123 4567',
        source: 'tiktok_ads',
        status: 'pending',
        services: ['Saç Ekimi'],
        tags: ['VIP']
    }
];

// Country code to flag emoji mapping
export const countryFlags = {
    'TR': '🇹🇷', 'DE': '🇩🇪', 'SA': '🇸🇦', 'GB': '🇬🇧', 'FR': '🇫🇷',
    'IQ': '🇮🇶', 'NL': '🇳🇱', 'AE': '🇦🇪', 'US': '🇺🇸', 'IT': '🇮🇹', 'ES': '🇪🇸'
};
