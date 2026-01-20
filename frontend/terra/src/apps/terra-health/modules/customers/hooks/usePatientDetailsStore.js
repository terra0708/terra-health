import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Health-Specific Patient Details Store
 * 
 * Bu store sadece health modülüne özgü detayları tutar.
 * Base client bilgileri useClientStore'da tutulur.
 * 
 * Schema:
 * {
 *   clientId, // FK to shared.clients
 *   services: [],
 *   tags: [],
 *   status: 'new' | 'process' | ...,
 *   consultantId: userId | null,
 *   category: string,
 *   notes: [],
 *   files: [],
 *   payments: [],
 *   medicalHistory: '',
 *   operationType: '',
 *   passportNumber: '',
 *   city: string,
 *   job: string
 * }
 */
export const usePatientDetailsStore = create(
    persist(
        (set, get) => ({
            patientDetails: [], // [{ clientId, ...healthSpecificFields }]

            addPatientDetails: (clientId, details) => {
                const existing = get().patientDetails.find(p => p.clientId === clientId);
                if (existing) {
                    // Update existing
                    set((state) => ({
                        patientDetails: state.patientDetails.map(p =>
                            p.clientId === clientId
                                ? { ...p, ...details, updatedAt: new Date().toISOString() }
                                : p
                        )
                    }));
                } else {
                    // Add new
                    set((state) => ({
                        patientDetails: [
                            ...state.patientDetails,
                            {
                                clientId,
                                services: [],
                                tags: [],
                                status: 'new',
                                consultantId: null,
                                category: '',
                                notes: [],
                                files: [],
                                payments: [],
                                medicalHistory: '',
                                operationType: '',
                                passportNumber: '',
                                city: '',
                                job: '',
                                ...details,
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString()
                            }
                        ]
                    }));
                }
            },

            updatePatientDetails: (clientId, updates) => {
                set((state) => ({
                    patientDetails: state.patientDetails.map(p =>
                        p.clientId === clientId
                            ? { ...p, ...updates, updatedAt: new Date().toISOString() }
                            : p
                    )
                }));
            },

            deletePatientDetails: (clientId) => {
                set((state) => ({
                    patientDetails: state.patientDetails.filter(p => p.clientId !== clientId)
                }));
            },

            getPatientDetailsByClientId: (clientId) => {
                return get().patientDetails.find(p => p.clientId === clientId) || null;
            },

            // Get all patient details
            getAllPatientDetails: () => {
                return get().patientDetails;
            },

            // Sync with existing customer data (for migration)
            syncFromCustomers: (customers) => {
                const newDetails = customers.map(customer => ({
                    clientId: customer.id,
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
                    job: customer.job || '',
                    createdAt: customer.createdAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }));

                set({ patientDetails: newDetails });
            }
        }),
        {
            name: 'terra-patient-details-storage-v1',
        }
    )
);
