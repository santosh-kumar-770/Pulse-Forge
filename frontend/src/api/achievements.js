import { api } from './client';

export const achievementsApi = {
  listAchievements: (roomId) => api.get(`/rooms/${roomId}/achievements`),
  createAchievement: (roomId, achData) => api.post(`/rooms/${roomId}/achievements`, achData),
  toggleStar: (roomId, achId) => api.patch(`/rooms/${roomId}/achievements/${achId}/star`),
  updateAchievement: (roomId, achId, achData) => api.put(`/rooms/${roomId}/achievements/${achId}`, achData),
  deleteAchievement: (roomId, achId) => api.delete(`/rooms/${roomId}/achievements/${achId}`),
};
