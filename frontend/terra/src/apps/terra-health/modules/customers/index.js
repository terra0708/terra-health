// Health-specific components
export * from './components/CustomerDrawer';
export * from './components/CustomerDetailsDialog';
// Generic components moved to @shared/modules/clients
export * from './data/mockData';
export * from './hooks/useCustomers';
export * from './hooks/useCustomerStore'; // @deprecated - Use useClientStore + usePatientDetailsStore
export * from './hooks/usePatientDetailsStore';
export * from './hooks/useCustomerSettingsStore';
export * from './hooks/useMigrateCustomers';
export { default as HealthNotificationManager } from './components/HealthNotificationManager';
