import axios from 'axios';
import { getSecureItem, deleteSecureItem } from '../utils/storage';

const TOKEN_KEY = 'jwt_token';
const USER_KEY = 'user_data';

// Dùng relative path '/api' để tận dụng Vite proxy ở dev mode hoặc biến môi trường ở production
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

// TỰ ĐỘNG THÊM TOKEN CHO MỌI REQUEST
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getSecureItem(TOKEN_KEY);
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// XỬ LÝ LỖI GLOBAL TỪ SERVER
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // 401: Unauthorized (Token hết hạn hoặc không hợp lệ)
    if (error.response?.status === 401) {
      await deleteSecureItem(TOKEN_KEY);
      await deleteSecureItem(USER_KEY);

      // Chuyển hướng về trang đăng nhập nếu không phải đang ở trang login/register
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
