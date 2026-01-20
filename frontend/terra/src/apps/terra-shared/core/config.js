/**
 * Package Configuration
 * 
 * Bu dosya package type ve modül aktiflik durumlarını yönetir.
 * Environment variable'lar veya config dosyası ile kontrol edilir.
 */

export const PACKAGE_CONFIG = {
    // Package type: HEALTH, ADS_ONLY, TOURISM, HOTEL
    type: import.meta.env.VITE_PACKAGE_TYPE || 'HEALTH',
    
    // Modül aktiflik durumları
    modules: {
        health: import.meta.env.VITE_ENABLE_HEALTH !== 'false', // Default true
        ads: import.meta.env.VITE_ENABLE_ADS === 'true',
        tourism: import.meta.env.VITE_ENABLE_TOURISM === 'true',
        hotel: import.meta.env.VITE_ENABLE_HOTEL === 'true'
    }
};

/**
 * Get client label based on package type
 */
export const getClientLabel = (t) => {
    switch(PACKAGE_CONFIG.type) {
        case 'HEALTH':
            return t('clients.patients', 'Hastalar');
        case 'ADS_ONLY':
            return t('clients.leads', 'Gelen Formlar');
        case 'TOURISM':
            return t('clients.tourists', 'Turistler');
        case 'HOTEL':
            return t('clients.guests', 'Misafirler');
        default:
            return t('clients.clients', 'Müşteriler');
    }
};

/**
 * Get client list label based on package type
 */
export const getClientListLabel = (t) => {
    switch(PACKAGE_CONFIG.type) {
        case 'ADS_ONLY':
            return t('clients.lead_list', 'Gelen Form Listesi');
        case 'HEALTH':
            return t('clients.patient_list', 'Hasta Listesi');
        case 'TOURISM':
            return t('clients.tourist_list', 'Turist Listesi');
        default:
            return t('clients.client_list', 'Müşteri Listesi');
    }
};

/**
 * Check if a module is enabled
 */
export const isModuleEnabled = (moduleName) => {
    return PACKAGE_CONFIG.modules[moduleName] === true;
};
