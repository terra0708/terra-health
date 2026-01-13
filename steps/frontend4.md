features/customers/ modülünü oluştur:

PAGES:
1. CustomersPage: Müşteri listesi (pagination, filtering)
2. CustomerDetailPage: Müşteri detay görünümü
3. CreateCustomerPage: Yeni müşteri formu

COMPONENTS:
1. CustomerList: Tablo görünümü
   - Sütunlar: Ad, Email, Telefon, Ülke, Lead Score, Pipeline Stage, Kaynak
   - Satır tıklanınca detay sayfasına git
2. CustomerDetail: Müşteri bilgileri (tabs kullan)
   - Genel Bilgiler tab
   - Tıbbi Bilgiler tab
   - Aktiviteler tab
   - Dokümanlar tab
3. CustomerForm: Create/Update formu
   - Validation: Email, telefon formatı
4. CustomerCard: Grid görünümü için kart
5. LeadScoreBadge: Puan göstergesi (Cold/Warm/Hot)
6. MedicalInfoSection: Tıbbi bilgiler formu

HOOKS:
1. useCustomers: Liste çekme, filtering, pagination
2. useCustomerDetail: Tek müşteri detayı
3. useCustomerActivities: Aktivite geçmişi

SERVICES:
- getCustomers(page, filters)
- getCustomerById(id)
- createCustomer(data)
- updateCustomer(id, data)
- deleteCustomer(id)
- getCustomerActivities(id)

REDUX STORE:
State: { customers: [], selectedCustomer: null, loading, error, pagination }

ENUMS:
- PipelineStage: LEAD, CONTACT, PROPOSAL, SCHEDULED, etc.
- LeadSource: GOOGLE_ADS, META_ADS, MANUAL
- LeadScore: COLD, WARM, HOT

Filtering: Pipeline stage, lead source, lead score, ülke
Searching: İsim, email, telefon

Önce CustomerList componentini oluştur.