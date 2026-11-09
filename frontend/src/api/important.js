import { api } from './client';

export const importantApi = {
  listNotes: (roomId) => api.get(`/rooms/${roomId}/important`),
  createNote: (roomId, noteData) => api.post(`/rooms/${roomId}/important`, noteData),
  updateNote: (roomId, noteId, noteData) => api.put(`/rooms/${roomId}/important/${noteId}`, noteData),
  togglePin: (roomId, noteId) => api.patch(`/rooms/${roomId}/important/${noteId}/pin`),
  deleteNote: (roomId, noteId) => api.delete(`/rooms/${roomId}/important/${noteId}`),
};
