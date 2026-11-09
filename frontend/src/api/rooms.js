import { api } from './client';

export const roomsApi = {
  listRooms: () => api.get('/rooms'),
  createRoom: (data) => api.post('/rooms', data),
  getRoom: (roomId) => api.get(`/rooms/${roomId}`),
  updateRoom: (roomId, data) => api.put(`/rooms/${roomId}`, data),
  listMembers: (roomId) => api.get(`/rooms/${roomId}/members`),
  addMember: (roomId, data) => api.post(`/rooms/${roomId}/members`, data),
  joinRoomBySlug: (slug) => api.post(`/rooms/join/${slug}`),
};
