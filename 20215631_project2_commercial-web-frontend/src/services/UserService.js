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

// Helper function cho authorization header - đảm bảo token là string
const authHeader = (access_token) => {
  // Đảm bảo token là string
  const tokenString = typeof access_token === 'string' 
    ? access_token 
    : (access_token?.token || localStorage.getItem('access_token') || '');
  
  return {
    headers: { 
      Authorization: `Bearer ${tokenString}`,
      'Content-Type': 'application/json'
    },
    withCredentials: true,
  };
};

// Thêm request interceptor để debug
axiosJWT.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    // Thêm token từ localStorage nếu không có
    const token = localStorage.getItem('access_token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Kiểm tra token hết hạn
    try {
      if (token) {
        const decodedToken = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        
        if (decodedToken.exp && decodedToken.exp < currentTime) {
          console.log('Token expired, will attempt refresh');
        }
      }
    } catch (error) {
      console.error('Error checking token expiration:', error);
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Thêm response interceptor để xử lý token hết hạn
axiosJWT.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Nếu lỗi 401 (Unauthorized) và chưa thử refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Nếu đang refresh, đưa request vào queue
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
        console.log('Attempting to refresh token...');
        const res = await axios.post(`${BASE_URL}/user/refresh-token`, {}, {
          withCredentials: true
        });
        
        if (res.data?.access_token) {
          console.log('Token refreshed successfully');
          localStorage.setItem('access_token', res.data.access_token);
          
          // Cập nhật header cho request ban đầu
          originalRequest.headers.Authorization = `Bearer ${res.data.access_token}`;
          
          // Xử lý các request đang chờ
          processQueue(null, res.data.access_token);
          
          return axiosJWT(originalRequest);
        } else {
          console.log('Failed to refresh token, logging out');
          localStorage.removeItem('access_token');
          localStorage.removeItem('userId');
          window.location.href = '/sign-in';
          return Promise.reject(error);
        }
      } catch (refreshError) {
        console.error('Error refreshing token:', refreshError);
        processQueue(refreshError, null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('userId');
        window.location.href = '/sign-in';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    console.error('API Error:', error.response?.status, error.config?.url, error.response?.data);
    return Promise.reject(error);
  }
);

export const loginUser = async (data) => {
  try {
    const res = await axios.post(`${BASE_URL}/user/sign-in`, data);
    // Lưu token vào localStorage ngay khi đăng nhập thành công
    if (res.data?.access_token) {
      localStorage.setItem('access_token', res.data.access_token);
      localStorage.setItem('userId', res.data.id);
    }
    return res.data;
  } catch (error) {
    console.error('Login error:', error.response?.data);
    throw error;
  }
};

export const signUpUser = async (data) => {
  try {
    const res = await axios.post(`${BASE_URL}/user/sign-up`, data);
    return res.data;
  } catch (error) {
    console.error('Sign up error:', error.response?.data);
    throw error;
  }
};

export const getDetailUser = async (id, access_token) => {
  try {
    const res = await axiosJWT.get(`/user/get-detail/${id}`, authHeader(access_token));
    return res.data;
  } catch (error) {
    console.error('Get user detail error:', error.response?.data);
    throw error;
  }
};

export const getAllUsers = async (access_token) => {
  try {
    const res = await axiosJWT.get(`/user/getAll`, authHeader(access_token));
    return res.data;
  } catch (error) {
    console.error('Get all users error:', error.response?.data);
    throw error;
  }
};

export const updateUser = async (id, access_token, data) => {
  try {
    // Kiểm tra và xử lý token
    const tokenString = typeof access_token === 'string' 
      ? access_token 
      : localStorage.getItem('access_token');
    
    if (!tokenString) {
      throw new Error('Token không tồn tại');
    }

    console.log(`Updating user ${id}`);
    
    const res = await axiosJWT.put(
      `/user/update-user/${id}`,
      data,
      authHeader(tokenString)
    );
    
    console.log('Update response:', res.data);
    return res.data;
  } catch (error) {
    console.error('Update error:', error.response?.data || error.message);
    throw error;
  }
};

export const deleteUser = async (id, access_token, data) => {
  try {
    const res = await axiosJWT.delete(`/user/delete-user/${id}`, {
      ...authHeader(access_token),
      data
    });
    return res.data;
  } catch (error) {
    console.error('Delete user error:', error.response?.data);
    throw error;
  }
};

export const deleteManyUser = async (data, access_token) => {
  try {
    const res = await axiosJWT.post(`/user/delete-many-user`, data, authHeader(access_token));
    return res.data;
  } catch (error) {
    console.error('Delete many users error:', error.response?.data);
    throw error;
  }
};

export const refreshToken = async () => {
  try {
    const res = await axios.post(`${BASE_URL}/user/refresh-token`, {}, {
      withCredentials: true,
    });
    
    // Cập nhật token mới vào localStorage
    if (res.data?.access_token) {
      localStorage.setItem('access_token', res.data.access_token);
    }
    
    return res.data;
  } catch (error) {
    console.error('Refresh token error:', error.response?.data);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    const res = await axios.post(`${BASE_URL}/user/log-out`, {}, {
      withCredentials: true,
    });
    
    // Xóa token khỏi localStorage khi đăng xuất
    localStorage.removeItem('access_token');
    localStorage.removeItem('userId');
    
    return res.data;
  } catch (error) {
    console.error('Logout error:', error.response?.data);
    // Vẫn xóa token khỏi localStorage ngay cả khi có lỗi
    localStorage.removeItem('access_token');
    localStorage.removeItem('userId');
    throw error;
  }
};