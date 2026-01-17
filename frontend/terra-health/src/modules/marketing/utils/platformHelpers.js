import React from 'react';
import { Smartphone, Globe, MessageCircle, UserCircle } from 'lucide-react';

export const getPlatformIcon = (platform) => {
    switch (platform) {
        case 'meta': return Smartphone;
        case 'google': return Globe;
        case 'whatsapp': return MessageCircle;
        case 'manual': return UserCircle;
        default: return Globe;
    }
};

export const getPlatformColor = (platform, theme) => {
    switch (platform) {
        case 'meta': return '#1877F2';
        case 'google': return '#DB4437';
        case 'whatsapp': return '#25D366';
        case 'manual': return '#7367f0';
        default: return theme?.palette?.grey?.[500] || '#999';
    }
};
