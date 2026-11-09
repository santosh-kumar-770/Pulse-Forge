import { api } from './client';

export const timelineApi = {
  getTimeline: (roomId) => api.get(`/rooms/${roomId}/timeline`),
  createEvent: (roomId, eventData) => api.post(`/rooms/${roomId}/timeline/events`, eventData),
  updateEventStatus: (roomId, eventId, status) => api.patch(`/rooms/${roomId}/timeline/events/${eventId}/status`, { status }),
  deleteEvent: (roomId, eventId) => api.delete(`/rooms/${roomId}/timeline/events/${eventId}`),
  addRetrospectiveLog: (roomId, logData) => api.post(`/rooms/${roomId}/timeline/retrospective`, logData),
};
