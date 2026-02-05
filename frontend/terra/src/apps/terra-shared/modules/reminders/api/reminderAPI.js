import apiClient from '../../../core/api';

const BASE_URL = '/v1/health/reminders';

const mapToFrontend = (r) => {
    if (!r) return r;
    return {
        ...r,
        date: r.reminderDate,
        time: r.reminderTime
    };
};

const mapToBackend = (r) => {
    if (!r) return r;
    const { date, time, ...rest } = r;
    return {
        ...rest,
        reminderDate: date,
        reminderTime: time
    };
};

export const reminderAPI = {
    getAllReminders: () =>
        apiClient.get(BASE_URL).then(res => (res || []).map(mapToFrontend)),

    getReminderById: (id) =>
        apiClient.get(`${BASE_URL}/${id}`).then(res => mapToFrontend(res)),

    getRemindersByCustomerId: (customerId) =>
        apiClient.get(`${BASE_URL}/customer/${customerId}`).then(res => (res || []).map(mapToFrontend)),

    getRemindersByDateRange: (startDate, endDate) =>
        apiClient.get(`${BASE_URL}/date-range`, { params: { startDate, endDate } }).then(res => (res || []).map(mapToFrontend)),

    createReminder: (data) =>
        apiClient.post(BASE_URL, mapToBackend(data)).then(res => mapToFrontend(res)),

    updateReminder: (id, data) =>
        apiClient.put(`${BASE_URL}/${id}`, mapToBackend(data)).then(res => mapToFrontend(res)),

    deleteReminder: (id) =>
        apiClient.delete(`${BASE_URL}/${id}`),

    toggleComplete: (id) =>
        apiClient.patch(`${BASE_URL}/${id}/toggle-complete`).then(res => mapToFrontend(res)),
};
