import { useTranslation } from 'react-i18next';
import { useCustomerSettingsStore } from '@modules/customers/hooks/useCustomerSettingsStore';
import { useTheme } from '@mui/material';

export const useLookup = () => {
    const { i18n } = useTranslation();
    const settings = useCustomerSettingsStore();
    const theme = useTheme();
    const lang = i18n.language;

    const getLocalized = (item, type = 'default') => {
        if (!item) return '-';

        // Service items use name_tr/name_en, others use label_tr/label_en
        if (type === 'service') {
            return lang === 'tr' ? item.name_tr : (item.name_en || item.name_tr);
        }

        return lang === 'tr' ? item.label_tr : (item.label_en || item.label_tr);
    };

    const getStatus = (value) => {
        const status = settings.statuses.find(s => s.value === value);
        return {
            label: getLocalized(status),
            color: status?.color || theme.palette.text.secondary,
            original: status
        };
    };

    const getSource = (value) => {
        const source = settings.sources.find(s => s.value === value);
        return {
            label: getLocalized(source),
            color: source?.color || theme.palette.text.secondary,
            original: source
        };
    };

    const getService = (valueOrName) => {
        const service = settings.services.find(s =>
            s.value === valueOrName ||
            s.name_tr === valueOrName ||
            s.name_en === valueOrName
        );
        return {
            label: getLocalized(service, 'service'),
            color: service?.color || theme.palette.primary.main,
            original: service
        };
    };

    const getTag = (valueOrLabel) => {
        const tag = settings.tags.find(t =>
            t.value === valueOrLabel ||
            t.label_tr === valueOrLabel ||
            t.label_en === valueOrLabel
        );
        return {
            label: getLocalized(tag),
            color: tag?.color || theme.palette.text.secondary,
            original: tag
        };
    };

    const getFileCategory = (label) => {
        const cat = settings.fileCategories.find(c =>
            c.label_tr === label ||
            c.label_en === label
        );
        return {
            label: getLocalized(cat),
            color: cat?.color || theme.palette.text.secondary,
            original: cat
        };
    };

    return {
        getLocalized,
        getStatus,
        getSource,
        getService,
        getTag,
        getFileCategory,
        lang
    };
};
