import axios from 'axios';

// Tạo instance với cấu hình mặc định
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
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
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      // Có thể điều hướng về trang login tại đây nếu cần
      // window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);

export default api;