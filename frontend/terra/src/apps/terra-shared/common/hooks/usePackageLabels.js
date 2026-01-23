import { useTranslation } from 'react-i18next';
import { getClientLabel, getClientListLabel, PACKAGE_CONFIG } from '@core/config';

/**
 * Package Labels Hook
 * 
 * Package type'a göre dinamik label'lar sağlar.
 * Contextual naming için kullanılır.
 */
const usePackageLabels = () => {
    const { t } = useTranslation();
    const packageType = PACKAGE_CONFIG.type;

    return {
        // Client labels
        clientLabel: getClientLabel(t),
        clientListLabel: getClientListLabel(t),
        clientSingular: packageType === 'ADS_ONLY' 
            ? t('clients.lead', 'Form')
            : packageType === 'HEALTH'
            ? t('clients.patient', 'Hasta')
            : t('clients.client', 'Müşteri'),
        
        // Navigation labels
        clientsNavLabel: packageType === 'ADS_ONLY'
            ? t('nav.leads', 'Gelen Formlar')
            : packageType === 'HEALTH'
            ? t('nav.patients', 'Hastalar')
            : t('nav.clients', 'Müşteriler'),
        
        // Action labels
        addClientLabel: packageType === 'ADS_ONLY'
            ? t('clients.add_lead', 'Yeni Form Ekle')
            : packageType === 'HEALTH'
            ? t('clients.add_patient', 'Yeni Hasta Ekle')
            : t('clients.add_client', 'Yeni Müşteri Ekle'),
        
        // Package info
        packageType,
        isHealthModule: PACKAGE_CONFIG.modules.health,
        isAdsModule: PACKAGE_CONFIG.modules.ads,
        isTourismModule: PACKAGE_CONFIG.modules.tourism
    };
};

export default usePackageLabels;
export { usePackageLabels };
