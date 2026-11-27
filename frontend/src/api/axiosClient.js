import axios from 'axios';
import { tokenStorage } from '../utils/storage.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue = [];

function processQueue(error, newAccessToken = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(newAccessToken);
    }
  });
  failedQueue = [];
}

function dispatchForceLogout(reason) {
  tokenStorage.clearAll();
  window.dispatchEvent(
    new CustomEvent('cinematic:auth-logout', {
      detail: { reason },
    })
  );
}

// Request Interceptor: Attach Bearer JWT token
axiosClient.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getAccessToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 503 Maintenance, 403 Locked, and 401 Concurrency-Safe Token Refresh
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const errorCode = error.response?.data?.errorCode;

    // 1. Maintenance Mode (503)
    if (status === 503 && errorCode === 'MAINTENANCE_MODE') {
      window.dispatchEvent(
        new CustomEvent('cinematic:maintenance', {
          detail: {
            enabled: true,
            message:
              error.response?.data?.message ||
              'Hệ thống CINEMATIC đang bảo trì. Vui lòng quay lại sau ít phút.',
          },
        })
      );
      return Promise.reject(error);
    }

    // 2. Account Locked (403)
    if (status === 403 && errorCode === 'ACCOUNT_LOCKED') {
      dispatchForceLogout(
        error.response?.data?.message || 'Tài khoản của bạn đã bị khóa bởi quản trị viên.'
      );
      return Promise.reject(error);
    }

    // 3. Unauthorized (401) -> Try refresh token queue once
    const isAuthEndpoint =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/register') ||
      originalRequest?.url?.includes('/auth/refresh');

    if (status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      const refreshToken = tokenStorage.getRefreshToken();
      if (!refreshToken) {
        if (tokenStorage.getAccessToken()) {
          dispatchForceLogout('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axiosClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshRes = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });
        const newAccessToken = refreshRes.data?.data?.access_token;
        const newRefreshToken = refreshRes.data?.data?.refresh_token;

        if (!newAccessToken) {
          throw new Error('Không thể làm mới phiên đăng nhập.');
        }

        tokenStorage.setTokens(newAccessToken, newRefreshToken);
        processQueue(null, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        dispatchForceLogout('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
