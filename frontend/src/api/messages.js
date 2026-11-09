import { api } from './client';

export const messagesApi = {
  listMessages: (roomId) => api.get(`/rooms/${roomId}/messages`),
  sendMessage: (roomId, content) => api.post(`/rooms/${roomId}/messages`, { content }),
  togglePin: (roomId, messageId) => api.patch(`/rooms/${roomId}/messages/${messageId}/pin`),
  deleteMessage: (roomId, messageId) => api.delete(`/rooms/${roomId}/messages/${messageId}`),
};
