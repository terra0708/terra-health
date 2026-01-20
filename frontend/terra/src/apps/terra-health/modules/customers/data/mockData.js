export const mockCustomers = [
    {
        id: 1,
        name: 'Ahmet Yılmaz',
        phone: '+90 555 123 45 67',
        country: 'TR',
        city: 'İstanbul',
        job: 'Mühendis',
        email: 'ahmet.yilmaz@example.com',
        registrationDate: '2023-11-15',
        consultantId: 1,
        status: 'new',
        source: 'instagram_ads',
        services: ['sac_ekimi'],
        tags: ['vip', 'oncelikli'],
        avatar: '',
        notes: 'Saç ekimi için 3000 greft planlandı.',

        // YENİ STANDART HATIRLATICI YAPISI
        reminder: {
            active: true,
            notes: [
                {
                    id: 'rem_1',
                    title: 'Ön Görüşme Yapılacak',
                    note: 'Müşteri ile operasyon detayları netleştirilecek.',
                    date: '2025-01-20',
                    time: '14:30',
                    statusId: 'pending',
                    categoryId: 'customer',
                    subCategoryId: '',
                    isCompleted: false,
                    type: 'customer'
                },
                {
                    id: 'rem_2',
                    title: 'Depozito Kontrolü',
                    note: 'Muhasebeden ödeme onayı alınacak.',
                    date: '2025-01-18',
                    time: '09:00',
                    statusId: 'completed',
                    categoryId: 'customer', // Müşteri kategorisi
                    subCategoryId: '',
                    isCompleted: true,
                    type: 'customer'
                }
            ]
        }
    },
    {
        id: 2,
        name: 'Sarah Smith',
        phone: '+44 7700 900077',
        country: 'GB',
        city: 'London',
        job: 'Designer',
        email: 'sarah.smith@example.com',
        registrationDate: '2023-12-01',
        consultantId: 2,
        status: 'process',
        source: 'google_ads',
        services: ['dis_beyazlatma', 'gulus_tasarimi'],
        tags: ['ingilizce'],
        avatar: '',
        notes: 'Interested in hollywood smile.',

        reminder: {
            active: true,
            notes: [
                {
                    id: 'rem_3',
                    title: 'Flight Ticket Confirmation',
                    note: 'Check arrival time using PN P8X99.',
                    date: '2025-01-25',
                    time: '10:00',
                    statusId: 'pending',
                    categoryId: 'customer',
                    subCategoryId: '',
                    isCompleted: false,
                    type: 'customer'
                }
            ]
        }
    },
    {
        id: 3,
        name: 'Mohammed Al-Fayed',
        phone: '+971 50 123 4567',
        country: 'AE',
        city: 'Dubai',
        job: 'Businessman',
        email: 'mohammed.al@example.com',
        registrationDate: '2024-01-10',
        consultantId: 1,
        status: 'contacted',
        source: 'referral',
        services: ['sac_ekimi'],
        tags: ['vip', 'arapca'],
        avatar: '',
        // Hatırlatıcı yok
        reminder: {
            active: false,
            notes: []
        }
    },
    {
        id: 4,
        name: 'Elena Ivanova',
        phone: '+7 900 123 45 67',
        country: 'RU',
        city: 'Moscow',
        email: 'elena.ivanova@example.com',
        registrationDate: '2024-01-05',
        consultantId: 3,
        status: 'appointment',
        source: 'facebook_ads',
        services: ['estetik_cerrahi', 'burun_estetigi'],
        tags: ['rusca'],
        avatar: '',
        reminder: {
            active: true,
            notes: [
                {
                    id: 'rem_4',
                    title: 'Doctor Consultation',
                    note: 'Online meeting with Dr. Kaya.',
                    date: '2025-01-16',
                    time: '16:00',
                    statusId: 'cancelled',
                    categoryId: 'customer',
                    subCategoryId: '',
                    isCompleted: true,
                    type: 'customer'
                }
            ]
        }
    },
    {
        id: 5,
        name: 'Hans Müller',
        phone: '+49 151 12345678',
        country: 'DE',
        city: 'Berlin',
        email: 'hans.mueller@example.com',
        registrationDate: '2023-11-20',
        consultantId: 2,
        status: 'post_op',
        source: 'manual',
        services: ['sac_ekimi'],
        tags: ['almanca'],
        avatar: '',
        reminder: {
            active: true,
            notes: []
        }
    }
];
