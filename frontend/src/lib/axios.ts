import axios from 'axios';

// Tạo instance với cấu hình mặc định
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Tự động gắn Token vào request gửi đi
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: Xử lý phản hồi (Rút gọn data & Xử lý lỗi 401)
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 (FR-FE-SEC-001: Token Handling)
    if (error.response?.status === 401) {
      if (originalRequest.url?.includes('/auth/login')) {
        return Promise.reject(error);
      }

      // Khi nhận 401: clear token, redirect login, STOP retry API
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

export default api;