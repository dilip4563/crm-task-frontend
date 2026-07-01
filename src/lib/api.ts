import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('crm_token') : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('crm_token');
      localStorage.removeItem('crm_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// Auth
export const authApi = {
  login: (data: { username: string; password: string }) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  changePassword: (data: { currentPassword?: string; newPassword: string }) => api.post('/auth/change-password', data),
};

// Admin
export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  getDashboardStats: () => api.get('/admin/dashboard'),
  getEmployees: (params?: any) => api.get('/admin/employees', { params }),
  createEmployee: (data: any) => api.post('/admin/employees', data),
  updateEmployee: (id: string, data: any) => api.put(`/admin/employees/${id}`, data),
  resetPassword: (id: string) => api.post(`/admin/employees/${id}/reset-password`),
  getActivity: (id: string) => api.get(`/admin/employees/${id}/activity`),
  getReports: (params?: any) => api.get('/admin/reports', { params }),
  exportReport: (params?: any) => api.get('/admin/reports/export', { params, responseType: 'blob' }),
};

// Tasks
export const taskApi = {
  getAll: (params?: any) => api.get('/tasks', { params }),
  getMine: (params?: any) => api.get('/tasks/mine', { params }),
  getOne: (id: string) => api.get(`/tasks/${id}`),
  create: (data: any) => api.post('/tasks', data),
  update: (id: string, data: any) => api.put(`/tasks/${id}`, data),
  delete: (id: string) => api.delete(`/tasks/${id}`),
  addComment: (id: string, content: string) => api.post(`/tasks/${id}/comments`, { content }),
};

// Employee
export const employeeApi = {
  getDashboard: () => api.get('/employee/dashboard'),
};

// Notifications
export const notifApi = {
  getAll: () => api.get('/notifications'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};
