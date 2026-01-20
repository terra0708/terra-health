import { useEffect, useState } from 'react';
import { migrateCustomersToHybrid } from '../migrations/splitCustomers';
import { useCustomerStore } from './useCustomerStore';

/**
 * Migration Hook
 * 
 * Bu hook migration'ı tetikler ve durumu yönetir.
 * Sadece bir kez çalışmalıdır.
 */
export const useMigrateCustomers = () => {
    const [migrationStatus, setMigrationStatus] = useState({
        completed: false,
        inProgress: false,
        error: null,
        migratedCount: 0,
        errorCount: 0
    });

    const customers = useCustomerStore((state) => state.customers);

    useEffect(() => {
        // Check if migration already completed (stored in localStorage)
        const migrationCompleted = localStorage.getItem('terra-customers-migration-completed');
        
        if (migrationCompleted === 'true') {
            setMigrationStatus(prev => ({ ...prev, completed: true }));
            return;
        }

        // Check if there are customers to migrate
        if (customers.length === 0) {
            return;
        }

        // Perform migration
        const performMigration = async () => {
            setMigrationStatus(prev => ({ ...prev, inProgress: true }));
            
            try {
                const result = migrateCustomersToHybrid();
                localStorage.setItem('terra-customers-migration-completed', 'true');
                
                setMigrationStatus({
                    completed: true,
                    inProgress: false,
                    error: null,
                    migratedCount: result.migratedCount,
                    errorCount: result.errorCount
                });
            } catch (error) {
                console.error('Migration failed:', error);
                setMigrationStatus(prev => ({
                    ...prev,
                    inProgress: false,
                    error: error.message
                }));
            }
        };

        // Auto-migrate on mount (can be changed to manual trigger)
        performMigration();
    }, [customers.length]);

    const triggerMigration = () => {
        if (migrationStatus.inProgress || migrationStatus.completed) {
            return;
        }

        const performMigration = async () => {
            setMigrationStatus(prev => ({ ...prev, inProgress: true }));
            
            try {
                const result = migrateCustomersToHybrid();
                localStorage.setItem('terra-customers-migration-completed', 'true');
                
                setMigrationStatus({
                    completed: true,
                    inProgress: false,
                    error: null,
                    migratedCount: result.migratedCount,
                    errorCount: result.errorCount
                });
            } catch (error) {
                console.error('Migration failed:', error);
                setMigrationStatus(prev => ({
                    ...prev,
                    inProgress: false,
                    error: error.message
                }));
            }
        };

        performMigration();
    };

    return {
        ...migrationStatus,
        triggerMigration
    };
};
