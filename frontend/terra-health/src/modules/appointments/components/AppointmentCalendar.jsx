import React, { useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import trLocale from '@fullcalendar/core/locales/tr';
import { Box, useTheme, Typography, alpha } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { APPOINTMENT_TYPES, APPOINTMENT_STATUSES } from '../data/mockData';

export const AppointmentCalendar = ({ events, onDateClick, onEventClick }) => {
    const { t, i18n } = useTranslation();
    const theme = useTheme();
    const calendarRef = useRef(null);

    // Force redraw when events change deeply
    useEffect(() => {
        if (calendarRef.current) {
            calendarRef.current.getApi().refetchEvents();
        }
    }, [events]);

    const renderEventContent = (eventInfo) => {
        const { event } = eventInfo;
        const typeId = event.extendedProps.type;
        const statusId = event.extendedProps.status;

        const typeDef = APPOINTMENT_TYPES.find(t => t.id === typeId) || APPOINTMENT_TYPES[0];
        const statusDef = APPOINTMENT_STATUSES.find(s => s.id === statusId);

        const typeLabel = i18n.language === 'tr' ? typeDef.label_tr : typeDef.label_en;

        return (
            <Box sx={{
                p: 0.5,
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                borderLeft: `3px solid ${typeDef.color || theme.palette.primary.main}`,
                bgcolor: alpha(typeDef.color || theme.palette.primary.main, 0.15),
                borderRadius: '4px',
                overflow: 'hidden'
            }}>
                <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.7rem', lineHeight: 1.1, color: 'text.primary' }}>
                    {event.extendedProps.patientName || event.title}
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: statusDef?.color || 'grey' }} />
                    {typeLabel}
                </Typography>
            </Box>
        );
    };

    return (
        <Box sx={{
            height: '100%',
            '& .fc': {
                fontFamily: 'inherit'
            },
            '& .fc-col-header-cell': {
                backgroundColor: theme.palette.background.paper, // Match background
                borderColor: theme.palette.divider
            },
            '& .fc-col-header-cell-cushion': {
                py: 2,
                color: theme.palette.text.secondary, // Explicit theme color
                fontWeight: 700,
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                textDecoration: 'none !important' // Remove any links styling
            },
            '& .fc-timegrid-slot-label-cushion': {
                color: theme.palette.text.secondary,
                fontSize: '0.75rem',
                fontWeight: 600
            },
            '& .fc-theme-standard td, & .fc-theme-standard th': {
                borderColor: theme.palette.divider,
                backgroundColor: 'transparent' // Ensure no default gray bg
            },
            '& .fc-timegrid-now-indicator-line': {
                borderColor: theme.palette.error.main,
                borderWidth: 2
            },
            '& .fc-timegrid-now-indicator-arrow': {
                borderColor: theme.palette.error.main
            },
            '& .fc-event': {
                border: 'none',
                bgcolor: 'transparent',
                boxShadow: 'none',
                '&:hover': {
                    bgcolor: 'transparent'
                }
            },
            '& .fc-button-primary': {
                bgcolor: theme.palette.background.paper,
                color: theme.palette.text.primary,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: '12px',
                textTransform: 'capitalize',
                fontWeight: 600,
                boxShadow: 'none',
                outline: 'none !important',
                '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    borderColor: theme.palette.primary.main,
                    color: theme.palette.primary.main
                },
                '&:active, &:focus': {
                    boxShadow: 'none !important',
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                }
            },
            '& .fc-button-active': {
                bgcolor: `${alpha(theme.palette.primary.main, 0.1)} !important`,
                color: `${theme.palette.primary.main} !important`,
                borderColor: `${theme.palette.primary.main} !important`,
            }
        }}>
            <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="timeGridWeek"
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                }}
                locales={[trLocale]}
                locale={i18n.language === 'tr' ? 'tr' : 'en'}
                events={events}
                dateClick={onDateClick}
                eventClick={onEventClick}
                slotMinTime="08:00:00"
                slotMaxTime="20:00:00"
                allDaySlot={false}
                height="100%"
                eventContent={renderEventContent}
                expandRows={true}
                stickyHeaderDates={true}
                nowIndicator={true}
            />
        </Box>
    );
};
