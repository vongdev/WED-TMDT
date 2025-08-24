import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

// Đặt BASE_URL để đảm bảo nhất quán trong toàn bộ ứng dụng
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Tạo axiosJWT với baseURL để tránh trùng lặp
export const axiosJWT = axios.create({
  baseURL: BASE_URL
});

// Console log để debug
console.log('API Base URL:', BASE_URL);

// Helper: Tạo object cấu hình header có Authorization đúng chuẩn
export const authHeader = (access_token) => {
  const tokenString = typeof access_token === 'string'
    ? access_token
    : (access_token?.token || localStorage.getItem('access_token') || '');

  return {
    headers: {
      Authorization: `Bearer ${tokenString}`,
      'Content-Type': 'application/json'
    },
    withCredentials: true
  };
};

// REFRESH TOKEN HANDLING
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor: Tự động gán token nếu có
axiosJWT.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Debug
    // console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Tự refresh token khi hết hạn
axiosJWT.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Nếu lỗi 401 (Unauthorized) và chưa thử refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        try {
          const token = await new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          });
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axiosJWT(originalRequest);
        } catch (err) {
          return Promise.reject(err);
        }
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post(`${BASE_URL}/user/refresh-token`, {}, { withCredentials: true });
        if (res.data?.access_token) {
          localStorage.setItem('access_token', res.data.access_token);
          originalRequest.headers.Authorization = `Bearer ${res.data.access_token}`;
          processQueue(null, res.data.access_token);
          return axiosJWT(originalRequest);
        } else {
          localStorage.removeItem('access_token');
          localStorage.removeItem('userId');
          window.location.href = '/sign-in';
          return Promise.reject(error);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('userId');
        window.location.href = '/sign-in';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

// ================= API =================

export const loginUser = async (data) => {
  const res = await axios.post(`${BASE_URL}/user/sign-in`, data);
  if (res.data?.access_token) {
    localStorage.setItem('access_token', res.data.access_token);
    localStorage.setItem('userId', res.data.id);
  }
  return res.data;
};

export const signUpUser = async (data) => {
  const res = await axios.post(`${BASE_URL}/user/sign-up`, data);
  return res.data;
};

export const getDetailUser = async (id, access_token) => {
  const res = await axiosJWT.get(`/user/get-detail/${id}`, authHeader(access_token));
  return res.data;
};

export const getAllUsers = async (access_token) => {
  const res = await axiosJWT.get(`/user/getAll`, authHeader(access_token));
  return res.data;
};

export const updateUser = async (id, access_token, data) => {
  const tokenString = typeof access_token === 'string'
    ? access_token
    : localStorage.getItem('access_token');
  if (!tokenString) throw new Error('Token không tồn tại');
  const res = await axiosJWT.put(
    `/user/update-user/${id}`,
    data,
    authHeader(tokenString)
  );
  return res.data;
};

export const deleteUser = async (id, access_token, data) => {
  const res = await axiosJWT.delete(`/user/delete-user/${id}`, {
    ...authHeader(access_token),
    data
  });
  return res.data;
};

export const deleteManyUser = async (data, access_token) => {
  const res = await axiosJWT.post(`/user/delete-many-user`, data, authHeader(access_token));
  return res.data;
};

export const refreshToken = async () => {
  const res = await axios.post(`${BASE_URL}/user/refresh-token`, {}, { withCredentials: true });
  if (res.data?.access_token) {
    localStorage.setItem('access_token', res.data.access_token);
  }
  return res.data;
};

export const logoutUser = async () => {
  const res = await axios.post(`${BASE_URL}/user/log-out`, {}, { withCredentials: true });
  localStorage.removeItem('access_token');
  localStorage.removeItem('userId');
  return res.data;
};