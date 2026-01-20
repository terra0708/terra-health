// Full Daily Stats for Trends - Son 30 günlük gerçekçi veri
export const MOCK_DAILY_STATS_FULL = [
    // Ocak ayı son haftası
    { date: '01 Jan', spend: 520, sales: 5800, leads: 14, platform: 'meta', service: 'hair' },
    { date: '02 Jan', spend: 480, sales: 5400, leads: 13, platform: 'meta', service: 'hair' },
    { date: '03 Jan', spend: 610, sales: 6800, leads: 16, platform: 'meta', service: 'dental' },
    { date: '04 Jan', spend: 390, sales: 4200, leads: 10, platform: 'google', service: 'hair' },
    { date: '05 Jan', spend: 550, sales: 6200, leads: 15, platform: 'meta', service: 'plastic' },
    { date: '06 Jan', spend: 320, sales: 3500, leads: 8, platform: 'google', service: 'dental' },
    { date: '07 Jan', spend: 450, sales: 5100, leads: 12, platform: 'meta', service: 'hair' },
    { date: '08 Jan', spend: 580, sales: 6500, leads: 16, platform: 'meta', service: 'hair' },
    { date: '09 Jan', spend: 420, sales: 4700, leads: 11, platform: 'google', service: 'hair' },
    { date: '10 Jan', spend: 510, sales: 5700, leads: 14, platform: 'meta', service: 'dental' },
    { date: '11 Jan', spend: 380, sales: 4100, leads: 9, platform: 'whatsapp', service: 'hair' },
    { date: '12 Jan', spend: 490, sales: 5500, leads: 13, platform: 'meta', service: 'plastic' },
    { date: '13 Jan', spend: 340, sales: 3800, leads: 8, platform: 'google', service: 'hair' },
    { date: '14 Jan', spend: 560, sales: 6300, leads: 15, platform: 'meta', service: 'hair' },
    { date: '15 Jan', spend: 410, sales: 4600, leads: 10, platform: 'manual', service: 'hair' },
    { date: '16 Jan', spend: 470, sales: 5300, leads: 12, platform: 'meta', service: 'dental' },
    { date: '17 Jan', spend: 530, sales: 6000, leads: 14, platform: 'meta', service: 'hair' },
    { date: '18 Jan', spend: 360, sales: 4000, leads: 9, platform: 'google', service: 'plastic' },
    { date: '19 Jan', spend: 440, sales: 5000, leads: 11, platform: 'meta', service: 'hair' },
    { date: '20 Jan', spend: 500, sales: 5600, leads: 13, platform: 'meta', service: 'hair' },
    { date: '21 Jan', spend: 450, sales: 5200, leads: 12, platform: 'meta', service: 'hair' },
    { date: '22 Jan', spend: 320, sales: 3100, leads: 8, platform: 'google', service: 'dental' },
    { date: '23 Jan', spend: 580, sales: 6400, leads: 15, platform: 'meta', service: 'hair' },
    { date: '24 Jan', spend: 210, sales: 2500, leads: 5, platform: 'whatsapp', service: 'plastic' },
    { date: '25 Jan', spend: 440, sales: 4800, leads: 10, platform: 'google', service: 'hair' },
    { date: '26 Jan', spend: 620, sales: 7200, leads: 18, platform: 'meta', service: 'dental' },
    { date: '27 Jan', spend: 390, sales: 4100, leads: 9, platform: 'manual', service: 'hair' },
    { date: '28 Jan', spend: 510, sales: 5900, leads: 14, platform: 'meta', service: 'plastic' },
    { date: '29 Jan', spend: 280, sales: 3300, leads: 7, platform: 'google', service: 'hair' },
    { date: '30 Jan', spend: 490, sales: 5500, leads: 11, platform: 'meta', service: 'hair' },
];

// Lead Attribution Data - Gerçekçi lead verileri
const generateLead = (id, name, platform, campaignId, status, value, date, country, service) => ({
    id: String(id),
    name,
    platform,
    campaignId,
    status,
    value,
    date,
    country,
    service
});

export const MOCK_ATTRIBUTION_DATA_FULL = [
    // CMP-001 (Hair Transplant DE - Meta) Leads
    ...Array.from({ length: 45 }, (_, i) => {
        const statuses = ['sale', 'sale', 'sale', 'pending', 'pending', 'cancelled'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const value = status === 'sale' ? Math.floor(Math.random() * 3000) + 3000 : 0;
        const names = ['Michael', 'Klaus', 'Hans', 'Thomas', 'Stefan', 'Andreas', 'Martin', 'Peter', 'Wolfgang', 'Dieter'];
        const surnames = ['Kraus', 'Schmidt', 'Müller', 'Weber', 'Fischer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann', 'Koch'];
        const name = `${names[Math.floor(Math.random() * names.length)]} ${surnames[Math.floor(Math.random() * surnames.length)]}`;
        return generateLead(
            `CMP001-${i + 1}`,
            name,
            'meta',
            'CMP-001',
            status,
            value,
            `2024-01-${String(Math.floor(Math.random() * 30) + 1).padStart(2, '0')}`,
            'Germany',
            'hair'
        );
    }),
    
    // CMP-002 (Dental Aesthetics UK - Google) Leads
    ...Array.from({ length: 28 }, (_, i) => {
        const statuses = ['sale', 'sale', 'pending', 'pending', 'cancelled'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const value = status === 'sale' ? Math.floor(Math.random() * 2500) + 3500 : 0;
        const names = ['Sarah', 'Emma', 'Olivia', 'Sophia', 'Isabella', 'Charlotte', 'Amelia', 'Mia', 'Harper', 'Evelyn'];
        const surnames = ['Wilson', 'Smith', 'Jones', 'Taylor', 'Brown', 'Williams', 'Davies', 'Evans', 'Thomas', 'Roberts'];
        const name = `${names[Math.floor(Math.random() * names.length)]} ${surnames[Math.floor(Math.random() * surnames.length)]}`;
        return generateLead(
            `CMP002-${i + 1}`,
            name,
            'google',
            'CMP-002',
            status,
            value,
            `2024-01-${String(Math.floor(Math.random() * 30) + 1).padStart(2, '0')}`,
            'UK',
            'dental'
        );
    }),
    
    // CMP-003 (WhatsApp Direct DE) Leads
    ...Array.from({ length: 22 }, (_, i) => {
        const statuses = ['sale', 'sale', 'sale', 'pending', 'cancelled'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const value = status === 'sale' ? Math.floor(Math.random() * 2000) + 2000 : 0;
        const names = ['Buse', 'Ayşe', 'Zeynep', 'Elif', 'Merve', 'Selin', 'Deniz', 'Ceren', 'Dilara', 'Melis'];
        const surnames = ['Akar', 'Yılmaz', 'Demir', 'Şahin', 'Çelik', 'Yıldız', 'Arslan', 'Öztürk', 'Kaya', 'Aydın'];
        const name = `${names[Math.floor(Math.random() * names.length)]} ${surnames[Math.floor(Math.random() * surnames.length)]}`;
        return generateLead(
            `CMP003-${i + 1}`,
            name,
            'whatsapp',
            'CMP-003',
            status,
            value,
            `2024-01-${String(Math.floor(Math.random() * 30) + 1).padStart(2, '0')}`,
            Math.random() > 0.5 ? 'Germany' : 'Turkey',
            'hair'
        );
    }),
    
    // CMP-004 (Manual Outreach) Leads
    ...Array.from({ length: 8 }, (_, i) => {
        const statuses = ['sale', 'pending', 'pending', 'cancelled'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const value = status === 'sale' ? Math.floor(Math.random() * 3000) + 4000 : 0;
        const names = ['Markus', 'Johannes', 'Sebastian', 'Alexander', 'Daniel', 'Christian', 'Florian', 'Matthias'];
        const surnames = ['Weber', 'Müller', 'Schneider', 'Fischer', 'Meyer', 'Wagner', 'Becker', 'Schulz'];
        const name = `${names[Math.floor(Math.random() * names.length)]} ${surnames[Math.floor(Math.random() * surnames.length)]}`;
        return generateLead(
            `CMP004-${i + 1}`,
            name,
            'manual',
            'CMP-004',
            status,
            value,
            `2024-01-${String(Math.floor(Math.random() * 30) + 1).padStart(2, '0')}`,
            'Germany',
            'hair'
        );
    }),
    
    // CMP-005 (Plastic Surgery EU - Meta) Leads
    ...Array.from({ length: 32 }, (_, i) => {
        const statuses = ['sale', 'sale', 'pending', 'pending', 'cancelled'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const value = status === 'sale' ? Math.floor(Math.random() * 4000) + 4000 : 0;
        const names = ['Elena', 'Sophia', 'Maria', 'Anna', 'Victoria', 'Isabella', 'Laura', 'Julia', 'Natalia', 'Camilla'];
        const surnames = ['Petrova', 'Ivanova', 'Kozlova', 'Novikova', 'Morozova', 'Volkova', 'Alekseeva', 'Lebedeva', 'Sokolova', 'Popova'];
        const countries = ['France', 'Italy', 'Spain', 'Netherlands', 'Belgium', 'Switzerland', 'Austria'];
        const name = `${names[Math.floor(Math.random() * names.length)]} ${surnames[Math.floor(Math.random() * surnames.length)]}`;
        return generateLead(
            `CMP005-${i + 1}`,
            name,
            'meta',
            'CMP-005',
            status,
            value,
            `2024-01-${String(Math.floor(Math.random() * 30) + 1).padStart(2, '0')}`,
            countries[Math.floor(Math.random() * countries.length)],
            'plastic'
        );
    }),
];

export const MOCK_ADS_STATS = {
    totalSpend: 12450,
    totalLeads: 842,
    salesCount: 156,
    cancelCount: 84,
    netRevenue: 385400,
    currentCpl: 14.8,
    roas: 30.9
};

export const MOCK_CAMPAIGNS = [
    { 
        id: 'CMP-001', 
        name: 'Hair Transplant DE - Jan', 
        platform: 'meta', 
        status: 'active', 
        budget: 5000, 
        spend: 4250, 
        leads: 45, 
        sales: 28, 
        roi: 8.4,
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        description: 'Meta Ads campaign targeting German market for hair transplant services'
    },
    { 
        id: 'CMP-002', 
        name: 'Dental Aesthetics UK', 
        platform: 'google', 
        status: 'active', 
        budget: 3000, 
        spend: 2800, 
        leads: 28, 
        sales: 16, 
        roi: 6.2,
        startDate: '2024-01-05',
        endDate: '2024-02-05',
        description: 'Google Ads campaign for dental aesthetics in UK market'
    },
    { 
        id: 'CMP-003', 
        name: 'WhatsApp Direct DE', 
        platform: 'whatsapp', 
        status: 'active', 
        budget: 1000, 
        spend: 850, 
        leads: 22, 
        sales: 14, 
        roi: 12.5,
        startDate: '2024-01-10',
        endDate: '2024-02-10',
        description: 'Direct WhatsApp Business campaign for German and Turkish markets'
    },
    { 
        id: 'CMP-004', 
        name: 'Manual Outreach (Offline)', 
        platform: 'manual', 
        status: 'paused', 
        budget: 500, 
        spend: 450, 
        leads: 8, 
        sales: 3, 
        roi: 4.8,
        startDate: '2024-01-01',
        endDate: null,
        description: 'Offline manual lead generation and referrals'
    },
    { 
        id: 'CMP-005', 
        name: 'Plastic Surgery EU', 
        platform: 'meta', 
        status: 'active', 
        budget: 4000, 
        spend: 3200, 
        leads: 32, 
        sales: 19, 
        roi: 9.1,
        startDate: '2024-01-08',
        endDate: '2024-02-08',
        description: 'Meta Ads campaign for plastic surgery services across EU countries'
    },
    { 
        id: 'CMP-006', 
        name: 'Hair Transplant TR - Feb', 
        platform: 'meta', 
        status: 'active', 
        budget: 3500, 
        spend: 2100, 
        leads: 18, 
        sales: 8, 
        roi: 7.2,
        startDate: '2024-02-01',
        endDate: '2024-02-29',
        description: 'Meta Ads campaign targeting Turkish market for hair transplant'
    },
    { 
        id: 'CMP-007', 
        name: 'Dental Aesthetics FR', 
        platform: 'google', 
        status: 'active', 
        budget: 2500, 
        spend: 1800, 
        leads: 15, 
        sales: 9, 
        roi: 8.5,
        startDate: '2024-01-15',
        endDate: '2024-02-15',
        description: 'Google Ads campaign for dental aesthetics in France'
    },
    { 
        id: 'CMP-008', 
        name: 'Hair Transplant IT', 
        platform: 'meta', 
        status: 'paused', 
        budget: 2000, 
        spend: 1200, 
        leads: 12, 
        sales: 5, 
        roi: 5.8,
        startDate: '2024-01-20',
        endDate: '2024-02-20',
        description: 'Meta Ads campaign for Italian market - Currently paused for optimization'
    }
];

export const MOCK_DAILY_STATS = MOCK_DAILY_STATS_FULL;
export const MOCK_ATTRIBUTION_DATA = MOCK_ATTRIBUTION_DATA_FULL;
