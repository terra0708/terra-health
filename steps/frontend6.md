features/appointments/ modülünü oluştur:

PAGES:
1. AppointmentsPage: Takvim görünümü
2. CreateAppointmentPage: Randevu formu

COMPONENTS:
1. AppointmentCalendar: FullCalendar kullan
   - Haftalık görünüm (timeGrid)
   - Doktor renkli coding
   - Event tıklanınca detay modal
2. AppointmentForm: Randevu oluşturma
   - Müşteri seç (autocomplete)
   - Doktor seç
   - Tarih/saat seç (TimeSlotPicker ile)
   - Randevu tipi (Konsültasyon, Ameliyat, Kontrol)
3. AppointmentList: Liste görünümü (alternatif)
4. DoctorAvailability: Doktor müsaitlik ekranı
   - Gün bazlı saat aralıkları
   - Recurring/one-time seçimi
5. TimeSlotPicker: Müsait saatleri göster
   - 30 dakikalık slotlar
   - Dolu slotları disable et
6. ReminderSettings: Hatırlatıcı ayarları

HOOKS:
1. useAppointments: Randevuları çek
2. useCalendar: FullCalendar için data formatting
3. useDoctorAvailability: Müsait saatleri getir

SERVICES:
- getAppointments(startDate, endDate)
- createAppointment(data)
- updateAppointment(id, data)
- deleteAppointment(id)
- getDoctorAvailability(doctorId, date)

FullCalendar SETUP:
- timeGridWeek view
- slotDuration: 30 minutes
- eventColor: Doktor bazlı
- eventClick: Detay modal aç

CONFLICT DETECTION:
TimeSlotPicker'da dolu saatleri disabled göster
API'den available slots'u çek

REMINDER:
Randevu oluştururken:
- 7 gün önce email
- 3 gün önce SMS
- 1 gün önce WhatsApp
Checkbox'lar ile seçilebilir

Önce AppointmentCalendar oluştur (FullCalendar integration).