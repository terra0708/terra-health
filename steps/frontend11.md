app/routes.jsx oluştur:

REACT ROUTER SETUP:
- createBrowserRouter kullan
- Lazy loading (React.lazy)
- Suspense ile loading fallback

ROUTES:
/login → LoginPage
/ → DashboardPage (Protected)
/customers → CustomersPage (Protected)
/customers/:id → CustomerDetailPage (Protected)
/customers/new → CreateCustomerPage (Protected)
/pipeline → PipelinePage (Protected)
/appointments → AppointmentsPage (Protected)
/advertising → AdvertisingPage (Protected)
/inbox → InboxPage (Protected)
/analytics → DashboardPage (Protected)
/reports → ReportsPage (Protected)

NAVIGATION (shared/components/layout/Sidebar.jsx):
Menü items:
1. Dashboard (ana sayfa ikonu)
2. Müşteriler (kişi ikonu)
3. Satış Hunisi (kanban ikonu)
4. Randevular (takvim ikonu)
5. Reklamlar (megafon ikonu)
6. Mesajlar (chat ikonu)
7. Raporlar (grafik ikonu)

Aktif route'u highlight et (NavLink kullan)

PROTECTED ROUTE:
JWT yoksa /login'e yönlendir
Token expire olmuşsa refresh dene
Permission kontrolü (role bazlı)

404 PAGE:
Bulunamayan route'lar için NotFoundPage

Önce routes.jsx ve Sidebar navigation oluştur.