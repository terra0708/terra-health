app/store.js oluştur:

REDUX TOOLKIT SETUP:
configureStore ile store oluştur

SLICES:
1. authSlice: user, token, isAuthenticated
2. customerSlice: customers, selectedCustomer, filters
3. pipelineSlice: stages, draggedCard
4. appointmentSlice: appointments, selectedDate
5. advertisingSlice: campaigns, metrics
6. communicationSlice: conversations, messages
7. analyticsSlice: dashboardData, reports
8. notificationSlice: notifications, unreadCount

ASYNC THUNKS:
- createAsyncThunk kullan
- Loading, success, error state'leri otomatik

SELECTORS:
Her slice için selector'lar:
- selectAllCustomers
- selectCustomerById
- selectCustomersByStage
- selectUnreadMessagesCount

MIDDLEWARE:
- Redux DevTools
- Thunk middleware

PERSISTENCE:
authSlice → localStorage'da sakla (redux-persist)

Önce authSlice ve customerSlice örneğini oluştur.