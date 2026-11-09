import { api } from './client';

export const tasksApi = {
  listTasks: (roomId, params = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.priority) query.set('priority', params.priority);
    if (params.search) query.set('search', params.search);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return api.get(`/rooms/${roomId}/tasks${qs}`);
  },
  createTask: (roomId, taskData) => api.post(`/rooms/${roomId}/tasks`, taskData),
  updateTask: (roomId, taskId, taskData) => api.put(`/rooms/${roomId}/tasks/${taskId}`, taskData),
  updateTaskStatus: (roomId, taskId, status) => api.patch(`/rooms/${roomId}/tasks/${taskId}/status`, { status }),
  deleteTask: (roomId, taskId) => api.delete(`/rooms/${roomId}/tasks/${taskId}`),
};
