export const APPOINTMENT_TYPES = [
    { id: 'exam', label_tr: 'Muayene', label_en: 'Examination', color: '#3b82f6' },
    { id: 'control', label_tr: 'Kontrol', label_en: 'Control', color: '#10b981' },
    { id: 'operation', label_tr: 'Operasyon', label_en: 'Operation', color: '#ef4444' },
    { id: 'consultation', label_tr: 'Konsültasyon', label_en: 'Consultation', color: '#8b5cf6' },
    { id: 'estethic', label_tr: 'Estetik', label_en: 'Esthetics', color: '#f59e0b' }
];

export const APPOINTMENT_STATUSES = [
    { id: 'scheduled', label_tr: 'Planlandı', label_en: 'Scheduled', color: '#3b82f6' },
    { id: 'confirmed', label_tr: 'Onaylandı', label_en: 'Confirmed', color: '#10b981' },
    { id: 'completed', label_tr: 'Tamamlandı', label_en: 'Completed', color: '#6b7280' },
    { id: 'cancelled', label_tr: 'İptal', label_en: 'Cancelled', color: '#ef4444' },
    { id: 'noshow', label_tr: 'Gelmedi', label_en: 'No Show', color: '#f97316' }
];

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);

export const MOCK_APPOINTMENTS = [
    {
        id: 1,
        doctorId: 2, // Zeynep Kaya (from Users mock)
        patientId: 101, // Mock patient ID
        patientName: 'Ayşe Yılmaz',
        start: new Date(today.setHours(10, 0, 0, 0)).toISOString(),
        end: new Date(today.setHours(10, 45, 0, 0)).toISOString(),
        type: 'exam',
        status: 'confirmed',
        notes: 'Genel kontrol şikayeti ile geldi.'
    },
    {
        id: 2,
        doctorId: 2,
        patientId: 102,
        patientName: 'John Doe',
        start: new Date(today.setHours(14, 0, 0, 0)).toISOString(),
        end: new Date(today.setHours(15, 0, 0, 0)).toISOString(),
        type: 'operation',
        status: 'scheduled',
        notes: 'Burun estetiği görüşmesi.'
    },
    {
        id: 3,
        doctorId: 5, // Can Özkan
        patientId: 103,
        patientName: 'Fatma Demir',
        start: new Date(tomorrow.setHours(11, 30, 0, 0)).toISOString(),
        end: new Date(tomorrow.setHours(12, 15, 0, 0)).toISOString(),
        type: 'control',
        status: 'confirmed',
        notes: 'Post-op kontrol.'
    }
];
