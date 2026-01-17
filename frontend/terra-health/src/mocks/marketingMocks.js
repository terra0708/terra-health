// Full Daily Stats for Trends
export const MOCK_DAILY_STATS_FULL = [
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

export const MOCK_ATTRIBUTION_DATA_FULL = [
    { id: '1', name: 'Michael Kraus', platform: 'meta', campaignId: 'CMP-001', status: 'sale', value: 4500, date: '2024-01-28', country: 'Germany', service: 'hair' },
    { id: '2', name: 'Sarah Wilson', platform: 'google', campaignId: 'CMP-002', status: 'pending', value: 0, date: '2024-01-29', country: 'UK', service: 'dental' },
    { id: '3', name: 'Ahmed Hassan', platform: 'meta', campaignId: 'CMP-001', status: 'sale', value: 3800, date: '2024-01-27', country: 'Egypt', service: 'hair' },
    { id: '4', name: 'Elena Petrova', platform: 'whatsapp', campaignId: 'CMP-003', status: 'cancelled', value: 0, date: '2024-01-26', country: 'Russia', service: 'plastic' },
    { id: '5', name: 'John Doe', platform: 'google', campaignId: 'Hair TR', status: 'pending', value: 0, date: '2024-01-25', country: 'Turkey', service: 'hair' },
    { id: '6', name: 'Lisa M.', platform: 'meta', campaignId: 'CMP-005', status: 'sale', value: 5200, date: '2024-01-24', country: 'Germany', service: 'dental' },
    { id: '7', name: 'Klaus S.', platform: 'manual', campaignId: 'CMP-004', status: 'sale', value: 6000, date: '2024-01-23', country: 'Germany', service: 'hair' },
    { id: '8', name: 'Marta F.', platform: 'meta', campaignId: 'CMP-001', status: 'cancelled', value: 0, date: '2024-01-22', country: 'Italy', service: 'hair' },
    { id: '9', name: 'David B.', platform: 'google', campaignId: 'CMP-002', status: 'sale', value: 4100, date: '2024-01-21', country: 'UK', service: 'dental' },
    { id: '10', name: 'Yuki O.', platform: 'meta', campaignId: 'CMP-001', status: 'pending', value: 0, date: '2024-01-20', country: 'Japan', service: 'hair' },
    { id: '11', name: 'Hakan Yilmaz', platform: 'meta', campaignId: 'CMP-001', status: 'sale', value: 3500, date: '2024-01-19', country: 'Turkey', service: 'hair' },
    { id: '12', name: 'Emma Watson', platform: 'google', campaignId: 'CMP-002', status: 'sale', value: 4800, date: '2024-01-18', country: 'UK', service: 'dental' },
    { id: '13', name: 'Jean Pierre', platform: 'meta', campaignId: 'CMP-005', status: 'pending', value: 0, date: '2024-01-17', country: 'France', service: 'plastic' },
    { id: '14', name: 'Buse Akar', platform: 'whatsapp', campaignId: 'CMP-003', status: 'sale', value: 2500, date: '2024-01-16', country: 'Turkey', service: 'hair' },
    { id: '15', name: 'Markus Weber', platform: 'manual', campaignId: 'CMP-004', status: 'pending', value: 0, date: '2024-01-15', country: 'Germany', service: 'hair' },
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
    { id: 'CMP-001', name: 'Hair Transplant DE - Jan', platform: 'meta', status: 'active', budget: 5000, spend: 4250, leads: 340, sales: 42, roi: 8.4 },
    { id: 'CMP-002', name: 'Dental Aesthetics UK', platform: 'google', status: 'active', budget: 3000, spend: 2800, leads: 180, sales: 24, roi: 6.2 },
    { id: 'CMP-003', name: 'WhatsApp Direct DE', platform: 'whatsapp', status: 'active', budget: 1000, spend: 850, leads: 120, sales: 18, roi: 12.5 },
    { id: 'CMP-004', name: 'Manual Outreach (Offline)', platform: 'manual', status: 'paused', budget: 500, spend: 450, leads: 35, sales: 5, roi: 4.8 },
    { id: 'CMP-005', name: 'Plastic Surgery EU', platform: 'meta', status: 'active', budget: 4000, spend: 3200, leads: 167, sales: 27, roi: 9.1 }
];

export const MOCK_DAILY_STATS = MOCK_DAILY_STATS_FULL;
export const MOCK_ATTRIBUTION_DATA = MOCK_ATTRIBUTION_DATA_FULL;
