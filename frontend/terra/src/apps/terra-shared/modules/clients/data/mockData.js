// Base client mock data - Generic, modül bağımsız
export const mockBaseClients = [
    {
        id: 1,
        name: 'Ahmet Yılmaz',
        phone: '+90 555 123 45 67',
        email: 'ahmet.yilmaz@example.com',
        country: 'TR',
        source: 'instagram_ads',
        registrationDate: '2023-11-15',
        industryType: 'HEALTH',
        assignedTo: 1,
        createdAt: '2023-11-15T10:00:00Z',
        updatedAt: '2023-11-15T10:00:00Z'
    },
    {
        id: 2,
        name: 'Sarah Smith',
        phone: '+44 7700 900077',
        email: 'sarah.smith@example.com',
        country: 'GB',
        source: 'google_ads',
        registrationDate: '2023-12-01',
        industryType: 'HEALTH',
        assignedTo: 2,
        createdAt: '2023-12-01T14:30:00Z',
        updatedAt: '2023-12-01T14:30:00Z'
    },
    {
        id: 3,
        name: 'Mohammed Ali',
        phone: '+971 50 123 4567',
        email: 'mohammed.ali@example.com',
        country: 'AE',
        source: 'meta_ads',
        registrationDate: '2024-01-10',
        industryType: null, // Generic lead, henüz modüle atanmamış
        assignedTo: null,
        createdAt: '2024-01-10T09:15:00Z',
        updatedAt: '2024-01-10T09:15:00Z'
    }
];
