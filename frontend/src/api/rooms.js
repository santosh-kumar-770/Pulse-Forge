import { api } from './client';

export const roomsApi = {
  listRooms: () => api.get('/rooms'),
  discoverPublicRooms: () => api.get('/rooms/discover'),
  createRoom: (data) => api.post('/rooms', data),
  getRoom: (roomId) => api.get(`/rooms/${roomId}`),
  updateRoom: (roomId, data) => api.put(`/rooms/${roomId}`, data),
  updateRoomSettings: (roomId, data) => api.patch(`/rooms/${roomId}/settings`, data),
  
  // Join Requests & Membership
  requestJoinRoom: (roomId, data = {}) => api.post(`/rooms/${roomId}/join-request`, data),
  listJoinRequests: (roomId) => api.get(`/rooms/${roomId}/join-requests`),
  reviewJoinRequest: (roomId, requestId, data) => api.post(`/rooms/${roomId}/join-requests/${requestId}/review`, data),
  getMembershipStatus: (roomId) => api.get(`/rooms/${roomId}/membership-status`),
  
  // Slug / Direct Join
  joinRoomBySlug: (slug) => api.post(`/rooms/join/${slug}`),
  
  // Direct Member Management
  listMembers: (roomId) => api.get(`/rooms/${roomId}/members`),
  addMember: (roomId, data) => api.post(`/rooms/${roomId}/members`, data),
};
