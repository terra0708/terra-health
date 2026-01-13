Test altyapısı kur:

JEST CONFIG:
- React Testing Library kullan
- Coverage threshold: %80

TEST EXAMPLES:
1. Component Tests:
   - Button renders correctly
   - Form validation works
   - Modal opens/closes

2. Hook Tests:
   - useAuth login/logout
   - useCustomers data fetching

3. Integration Tests:
   - Login flow
   - Customer creation flow

4. E2E Tests (Cypress):
   - User journey: Login → Create customer → Schedule appointment

MOCK:
- API calls (MSW kullan)
- LocalStorage
- WebSocket

Önce Button component için test örneği yaz.