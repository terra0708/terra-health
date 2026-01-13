features/analytics/ modülünü oluştur:

PAGES:
1. DashboardPage: Ana dashboard (KPI'lar)
2. ReportsPage: Detaylı raporlar

COMPONENTS:
1. DashboardWidgets: KPI kartları (grid layout)
   - Toplam müşteri
   - Aktif kampanya sayısı
   - Bu ay dönüşüm oranı
   - Ortalama yanıt süresi
   - Toplam gelir
   - ROI
2. RevenueChart: Gelir grafiği (Zaman bazlı)
3. FunnelAnalysis: Funnel visualization
   - Her stage'deki müşteri sayısı
   - Dönüşüm oranları
4. LostReasonsChart: Kayıp nedenleri (Pie chart)
   - Fiyat: %40
   - Güven: %25
   - Doktor: %20
   - Tarih: %15
5. ResponseTimeMetrics: Ortalama yanıt süresi
6. DoctorPerformance: Doktor performans tablosu
7. ExportButton: Raporu PDF/Excel olarak indir

HOOKS:
1. useAnalytics: Dashboard verileri
2. useChartData: Grafik verilerini formatla
3. useMetrics: KPI hesaplamaları

SERVICES:
- getDashboardMetrics()
- getFunnelAnalytics()
- getROIReport(dateRange)
- getCLVReport()
- getConversionRate(dateRange)
- exportReport(type, dateRange)

METRICS:
1. Total Leads: Toplam lead sayısı
2. Conversion Rate: Lead → Surgery %'si
3. Avg Response Time: İlk cevap süresi
4. Revenue: Toplam gelir
5. ROI: Reklam yatırımı geri dönüşü
6. CLV: Customer Lifetime Value
7. Stage Duration: Her stage'de ortalama kalış süresi

FUNNEL:
LEAD (100) → CONTACT (60) → PROPOSAL (40) → 
SCHEDULED (25) → SURGERY (20) → FOLLOW_UP (18)

Her geçişte % göster: LEAD→CONTACT: %60

DATE FILTERS:
- Bugün
- Bu hafta
- Bu ay
- Son 3 ay
- Custom range

EXPORT:
PDF: Grafikler + tablolar
Excel: Raw data

Önce DashboardWidgets ve FunnelAnalysis oluştur.