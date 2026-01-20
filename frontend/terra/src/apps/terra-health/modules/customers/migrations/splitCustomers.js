/**
 * Customer Data Migration Script
 * 
 * Bu script mevcut customer verilerini split eder:
 * - Base alanlar → useClientStore (shared)
 * - Health-specific alanlar → usePatientDetailsStore (terra-health)
 * 
 * Kullanım:
 * import { migrateCustomersToHybrid } from './migrations/splitCustomers';
 * migrateCustomersToHybrid();
 */

import { useClientStore } from '@shared/modules/clients';
import { usePatientDetailsStore } from '../hooks/usePatientDetailsStore';

// Import deprecated store for migration only
// eslint-disable-next-line no-restricted-imports
import { useCustomerStore } from '../hooks/useCustomerStore';

export const migrateCustomersToHybrid = () => {
    const customers = useCustomerStore.getState().customers;
    const { addClient, setIndustryType } = useClientStore.getState();
    const { addPatientDetails } = usePatientDetailsStore.getState();

    let migratedCount = 0;
    let errorCount = 0;

    customers.forEach(customer => {
        try {
            // 1. Base client bilgilerini extract et
            const baseClient = {
                id: customer.id,
                name: customer.name,
                phone: customer.phone,
                email: customer.email || '',
                country: customer.country || 'TR',
                source: customer.source || 'manual',
                registrationDate: customer.registrationDate || new Date().toISOString().split('T')[0],
                industryType: 'HEALTH', // Health modülünden geldiği için
                assignedTo: customer.consultantId || null,
                createdAt: customer.registrationDate || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // 2. Base client'ı ekle
            addClient(baseClient);
            setIndustryType(customer.id, 'HEALTH');

            // 3. Health-specific detayları extract et
            const patientDetails = {
                services: customer.services || [],
                tags: customer.tags || [],
                status: customer.status || 'new',
                consultantId: customer.consultantId || null,
                category: customer.category || '',
                notes: customer.notes || [],
                files: customer.files || [],
                payments: customer.payments || [],
                medicalHistory: customer.medicalHistory || '',
                operationType: customer.operationType || '',
                passportNumber: customer.passportNumber || '',
                city: customer.city || '',
                job: customer.job || ''
            };

            // 4. Patient details'ı ekle
            addPatientDetails(customer.id, patientDetails);

            migratedCount++;
        } catch (error) {
            console.error(`Migration error for customer ${customer.id}:`, error);
            errorCount++;
        }
    });

    console.log(`Migration completed: ${migratedCount} migrated, ${errorCount} errors`);
    return { migratedCount, errorCount };
};
