import React, { useRef, useEffect, useState, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import trLocale from '@fullcalendar/core/locales/tr';
import {
    Box,
    useTheme,
    Typography,
    alpha,
    IconButton,
    Stack,
    Button,
    Popover,
    Paper
} from '@mui/material';
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { tr, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { APPOINTMENT_TYPES, APPOINTMENT_STATUSES } from '../data/mockData';

export const AppointmentCalendar = ({ events, onDateClick, onEventClick, onSelect, clearSelection }) => {
    const { t, i18n } = useTranslation();
    const theme = useTheme();
    const calendarRef = useRef(null);
    const [viewTitle, setViewTitle] = useState('');
    const [currentView, setCurrentView] = useState('timeGridWeek');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [datePickerAnchor, setDatePickerAnchor] = useState(null);

    useEffect(() => {
        if (calendarRef.current) {
            calendarRef.current.getApi().refetchEvents();
        }
    }, [events]);

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

    const handleDatesSet = (dateInfo) => {
        const newTitle = dateInfo.view.title;
        const newView = dateInfo.view.type;
        const newDate = dateInfo.view.calendar.getDate();

        if (newTitle !== viewTitle) {
            setViewTitle(newTitle);
        }
        if (newView !== currentView) {
            setCurrentView(newView);
        }
        if (newDate.getTime() !== currentDate.getTime()) {
            setCurrentDate(newDate);
        }
    };

    const handlePrev = () => {
        calendarRef.current.getApi().prev();
    };

    const handleNext = () => {
        calendarRef.current.getApi().next();
    };

    const handleToday = () => {
        calendarRef.current.getApi().today();
    };

    const handleChangeView = (view) => {
        calendarRef.current.getApi().changeView(view);
    };

    const handleDatePickerOpen = (event) => {
        setDatePickerAnchor(event.currentTarget);
    };

    const handleDatePickerClose = () => {
        setDatePickerAnchor(null);
    };

    const handleDateChange = (newDate) => {
        if (newDate) {
            calendarRef.current.getApi().gotoDate(newDate);
            handleDatePickerClose();
        }
    };

    const renderEventContent = (eventInfo) => {
        const { event, isMirror } = eventInfo;

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
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={i18n.language.startsWith('tr') ? tr : enUS}>
            <Box sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                '& .fc': { fontFamily: 'inherit' },
                '& .fc-theme-standard td, & .fc-theme-standard th': { borderColor: theme.palette.divider, backgroundColor: 'transparent' },
                '& .fc-col-header-cell': { backgroundColor: theme.palette.background.paper, borderColor: theme.palette.divider },
                '& .fc-col-header-cell-cushion': { py: 1.5, color: theme.palette.text.secondary, fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem', textDecoration: 'none !important' },
                '& .fc-timegrid-slot-label-cushion': { color: theme.palette.text.secondary, fontSize: '0.7rem', fontWeight: 600 },
                '& .fc-timegrid-now-indicator-line': { borderColor: theme.palette.error.main, borderWidth: 2 },
                '& .fc-timegrid-now-indicator-arrow': { borderColor: theme.palette.error.main },
                '& .fc-event': { border: 'none', bgcolor: 'transparent', boxShadow: 'none', '&:hover': { bgcolor: 'transparent' } }
            }}>
                <Paper elevation={0} sx={{
                    p: 2,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    background: alpha(theme.palette.background.paper, 0.8),
                    backdropFilter: 'blur(8px)',
                    zIndex: 2
                }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <Stack direction="row" sx={{ bgcolor: alpha(theme.palette.divider, 0.1), p: 0.5, borderRadius: '12px' }}>
                                <IconButton size="small" onClick={handlePrev} sx={{ color: 'text.secondary' }}>
                                    <ChevronLeft size={20} />
                                </IconButton>
                                <IconButton size="small" onClick={handleNext} sx={{ color: 'text.secondary' }}>
                                    <ChevronRight size={20} />
                                </IconButton>
                            </Stack>

                            <Button
                                variant="outlined"
                                size="small"
                                onClick={handleToday}
                                sx={{ borderRadius: '10px', fontWeight: 700, px: 2, height: 36, color: 'text.primary', borderColor: 'divider' }}
                            >
                                {t('appointments.today', 'Bugün')}
                            </Button>

                            <Button
                                onClick={handleDatePickerOpen}
                                variant="text"
                                endIcon={<CalendarIcon size={16} />}
                                sx={{
                                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                                    color: 'primary.main',
                                    borderRadius: '10px',
                                    fontWeight: 800,
                                    fontSize: '0.85rem',
                                    textTransform: 'none',
                                    height: 36,
                                    px: 2,
                                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                                    '&:hover': {
                                        bgcolor: alpha(theme.palette.primary.main, 0.12),
                                        borderColor: 'primary.main',
                                    }
                                }}
                            >
                                {format(currentDate, i18n.language.startsWith('tr') ? 'dd.MM.yyyy' : 'MM/dd/yyyy')}
                            </Button>

                            <Popover
                                open={Boolean(datePickerAnchor)}
                                anchorEl={datePickerAnchor}
                                onClose={handleDatePickerClose}
                                anchorOrigin={{
                                    vertical: 'bottom',
                                    horizontal: 'left',
                                }}
                                transformOrigin={{
                                    vertical: 'top',
                                    horizontal: 'left',
                                }}
                                sx={{
                                    '& .MuiPaper-root': {
                                        mt: 1,
                                        borderRadius: '16px',
                                        boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.15)}`
                                    }
                                }}
                            >
                                <DateCalendar
                                    value={currentDate}
                                    onChange={handleDateChange}
                                    sx={{
                                        '& .MuiPickersDay-root': {
                                            fontWeight: 600,
                                            '&.Mui-selected': {
                                                bgcolor: 'primary.main',
                                                '&:hover': {
                                                    bgcolor: 'primary.dark'
                                                }
                                            }
                                        }
                                    }}
                                />
                            </Popover>
                        </Stack>

                        <Box sx={{ textAlign: 'center' }}>
                            <Box sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 1.5,
                                px: 3,
                                py: 1,
                                bgcolor: alpha(theme.palette.primary.main, 0.08),
                                borderRadius: '16px',
                                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                                boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.1)}`
                            }}>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        fontWeight: 900,
                                        letterSpacing: '-0.02em',
                                        color: 'primary.main',
                                        textTransform: 'capitalize',
                                        lineHeight: 1
                                    }}
                                >
                                    {viewTitle.split(/\s[0-9]{4}|,\s[0-9]{4}/)[0]}
                                </Typography>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        fontWeight: 900,
                                        color: 'primary.main',
                                        lineHeight: 1
                                    }}
                                >
                                    {currentDate.getFullYear()}
                                </Typography>
                            </Box>
                        </Box>

                        <Stack direction="row" spacing={1} sx={{ bgcolor: alpha(theme.palette.divider, 0.05), p: 0.5, borderRadius: '14px' }}>
                            {[
                                { id: 'dayGridMonth', label: t('appointments.month', 'Ay') },
                                { id: 'timeGridWeek', label: t('appointments.week', 'Hafta') },
                                { id: 'timeGridDay', label: t('appointments.day', 'Gün') }
                            ].map((v) => (
                                <Button
                                    key={v.id}
                                    size="small"
                                    onClick={() => handleChangeView(v.id)}
                                    sx={{
                                        borderRadius: '10px',
                                        px: 2,
                                        textTransform: 'none',
                                        fontWeight: 800,
                                        fontSize: '0.8rem',
                                        color: currentView === v.id ? 'primary.main' : 'text.secondary',
                                        bgcolor: currentView === v.id ? 'white' : 'transparent',
                                        boxShadow: currentView === v.id ? '0 4px 12px rgba(0,0,0,0.08)' : 'none',
                                        '&:hover': {
                                            bgcolor: currentView === v.id ? 'white' : alpha(theme.palette.primary.main, 0.05)
                                        }
                                    }}
                                >
                                    {v.label}
                                </Button>
                            ))}
                        </Stack>
                    </Stack>
                </Paper>

                <Box sx={{ flex: 1, position: 'relative' }}>
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
                        headerToolbar={false}
                        locales={[trLocale]}
                        locale={i18n.language.startsWith('tr') ? 'tr' : 'en'}
                        events={events}
                        dateClick={onDateClick ? onDateClick : undefined}
                        select={handleSelect}
                        selectable={true}
                        selectMirror={true}
                        unselectAuto={false}
                        eventClick={onEventClick}
                        slotMinTime="08:00:00"
                        slotMaxTime="20:00:00"
                        allDaySlot={false}
                        height="100%"
                        eventContent={renderEventContent}
                        expandRows={true}
                        stickyHeaderDates={true}
                        nowIndicator={true}
                        datesSet={handleDatesSet}
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
            </Box>
        </LocalizationProvider>
    );
};

export default AppointmentCalendar;
