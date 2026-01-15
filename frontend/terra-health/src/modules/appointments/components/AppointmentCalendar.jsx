import React, { useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import trLocale from '@fullcalendar/core/locales/tr';
import { Box, useTheme, Typography, alpha } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { APPOINTMENT_TYPES, APPOINTMENT_STATUSES } from '../data/mockData';

export const AppointmentCalendar = ({ events, onDateClick, onEventClick, onSelect, clearSelection }) => {
    const { t, i18n } = useTranslation();
    const theme = useTheme();
    const calendarRef = useRef(null);

    // Force redraw when events change deeply
    useEffect(() => {
        if (calendarRef.current) {
            calendarRef.current.getApi().refetchEvents();
        }
    }, [events]);

    // Handle external unselect request
    useEffect(() => {
        if (clearSelection && calendarRef.current) {
            calendarRef.current.getApi().unselect();
        }
    }, [clearSelection]);

    const handleSelect = (selectInfo) => {
        if (onSelect) {
            onSelect({
                start: selectInfo.start,
                end: selectInfo.end,
                allDay: selectInfo.allDay,
                view: selectInfo.view
            });
        }
    };

    const renderEventContent = (eventInfo) => {
        const { event, isMirror } = eventInfo;

        // --- SELECTION MIRROR (DRAGGING) ---
        if (isMirror) {
            return (
                <Box sx={{
                    width: '100%',
                    height: '100%',
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    border: `2px dashed ${theme.palette.primary.main}`,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'selection-anim 1.5s infinite ease-in-out',
                    boxShadow: `0 0 10px ${alpha(theme.palette.primary.main, 0.2)}`
                }}>
                    <Typography variant="subtitle2" sx={{
                        color: theme.palette.primary.main,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontSize: '0.75rem'
                    }}>
                        {t('common.new', 'NEW')}
                    </Typography>
                </Box>
            );
        }

        // --- NORMAL EVENTS ---
        const typeId = event.extendedProps.type;
        const statusId = event.extendedProps.status;

        const typeDef = APPOINTMENT_TYPES.find(t => t.id === typeId) || APPOINTMENT_TYPES[0];
        const statusDef = APPOINTMENT_STATUSES.find(s => s.id === statusId);

        const typeLabel = i18n.language.startsWith('tr') ? typeDef.label_tr : typeDef.label_en;

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
            '& .fc-toolbar-title': {
                fontSize: '1.25rem !important',
                fontWeight: 800,
                color: theme.palette.text.primary,
                textTransform: 'capitalize'
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
                textDecoration: 'none !important'
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
            <style>{`
                @keyframes selection-anim {
                    0% { background-color: ${alpha(theme.palette.primary.main, 0.05)}; border-color: ${theme.palette.primary.main}; opacity: 0.8; }
                    50% { background-color: ${alpha(theme.palette.primary.main, 0.15)}; border-color: ${theme.palette.secondary.main}; opacity: 1; }
                    100% { background-color: ${alpha(theme.palette.primary.main, 0.05)}; border-color: ${theme.palette.primary.main}; opacity: 0.8; }
                }

                .fc-highlight {
                    background-color: ${alpha(theme.palette.primary.main, 0.1)} !important;
                    border: 2px dashed ${theme.palette.primary.main} !important;
                    animation: selection-anim 1.5s infinite ease-in-out !important;
                    z-index: 3 !important;
                    border-radius: 4px;
                }
            `}</style>
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
                locale={i18n.language.startsWith('tr') ? 'tr' : 'en'}
                events={events}
                dateClick={onDateClick ? onDateClick : undefined}
                select={handleSelect}
                selectable={true}
                selectMirror={true}
                unselectAuto={false} // Preserve highlight when drawer opens
                eventClick={onEventClick}
                slotMinTime="08:00:00"
                slotMaxTime="20:00:00"
                allDaySlot={false}
                height="100%"
                eventContent={renderEventContent}
                expandRows={true}
                stickyHeaderDates={true}
                nowIndicator={true}
                dayHeaderFormat={{ weekday: 'short', day: 'numeric', month: 'numeric' }}
                slotLabelFormat={{
                    hour: i18n.language.startsWith('tr') ? '2-digit' : 'numeric',
                    minute: '2-digit',
                    hour12: !i18n.language.startsWith('tr'),
                    meridiem: i18n.language.startsWith('tr') ? false : 'short'
                }}
                eventTimeFormat={{
                    hour: i18n.language.startsWith('tr') ? '2-digit' : 'numeric',
                    minute: '2-digit',
                    hour12: !i18n.language.startsWith('tr'),
                    meridiem: i18n.language.startsWith('tr') ? false : 'short'
                }}
            />
        </Box>
    );
};
