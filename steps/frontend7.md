features/advertising/ modülünü oluştur:

PAGES:
1. AdvertisingPage: Kampanya dashboard
2. CampaignDetailPage: Kampanya detayları

COMPONENTS:
1. CampaignList: Kampanya tablosu
   - Platform (Google/Meta), Ad, Bütçe, Durum
2. CampaignDetail: Detay görünümü
   - Metrikler, grafikler, lead listesi
3. ROIChart: ROI çizgi grafiği (Recharts)
   - X: Tarih, Y: ROI %
4. MetricsCard: KPI kartları
   - Impressions, Clicks, Conversions, Cost, ROI
5. PlatformSelector: Google/Meta toggle
6. LeadSourceChart: Pie chart (Hangi kaynaktan kaç lead)
7. ConversionFunnel: Funnel grafiği

HOOKS:
1. useCampaigns: Kampanya listesi
2. useAdMetrics: Metrik verileri
3. useROICalculation: ROI hesaplama

SERVICES:
- getCampaigns(platform, status)
- getCampaignById(id)
- getCampaignMetrics(id, dateRange)
- getROIReport(dateRange)

METRICS:
- Impressions (Gösterim)
- Clicks (Tıklama)
- CTR (Click-through rate)
- Conversions (Dönüşüm)
- Cost (Maliyet)
- CPC (Cost per click)
- CPL (Cost per lead)
- ROI (Return on investment)

CHARTS (Recharts):
1. LineChart: ROI trend (zaman bazlı)
2. BarChart: Kampanya karşılaştırma
3. PieChart: Lead source distribution
4. AreaChart: Cost vs Revenue

CURRENCY:
Para birimlerini göster (USD, EUR, TRY)
Filtre ile tek bir currency'e çevir

DATE RANGE PICKER:
Son 7 gün, Son 30 gün, Son 3 ay, Custom

Önce MetricsCard ve ROIChart oluştur.