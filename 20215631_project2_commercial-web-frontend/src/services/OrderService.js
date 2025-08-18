import { axiosJWT } from './UserService';

// Hàm helper để lấy token hợp lệ
const getValidToken = (access_token) => {
  // Đảm bảo token là string
  return typeof access_token === 'string' && access_token
    ? access_token 
    : localStorage.getItem('access_token');
};

// Helper cấu hình auth
const auth = (access_token) => {
  const token = getValidToken(access_token);
  return {
    headers: { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    withCredentials: true,
  };
};

// Thêm debug log
const logRequest = (action, userId, token) => {
  console.log(`${action} for userId: ${userId}`);
  console.log(`Token available: ${token ? 'Yes' : 'No'}`);
  if (token) console.log(`Token type: ${typeof token}`);
};

// Lấy đơn theo userId (user hoặc admin)
export const getOrderByUserId = async (userId, access_token) => {
  try {
    const token = getValidToken(access_token);
    logRequest('Fetching orders', userId, token);
    
    if (!token) {
      console.error('No valid token available');
      throw new Error('Không có token hợp lệ. Vui lòng đăng nhập lại');
    }
    
    const res = await axiosJWT.get(`/order/get-detail/${userId}`, auth(token));
    console.log('Orders fetched successfully:', res.data);
    return res.data;
  } catch (error) {
    console.error('Error fetching orders:', error.response?.data || error.message);
    throw error;
  }
};

// Tạo đơn (user đã đăng nhập)
export const createOrder = async (data, access_token) => {
  try {
    const token = getValidToken(access_token);
    const res = await axiosJWT.post(`/order/create`, data, auth(token));
    return res.data;
  } catch (error) {
    console.error('Create order error:', error.response?.data || error.message);
    throw error;
  }
};

// Hủy đơn theo orderId (owner hoặc admin)
export const cancelOrder = async (orderId, access_token, reason = 'changed_mind') => {
  try {
    const token = getValidToken(access_token);
    
    // Sử dụng route POST thay vì DELETE để có thể gửi reason trong body
    const res = await axiosJWT.post(`/order/cancel/${orderId}`, 
      { reason }, 
      auth(token)
    );
    
    return res.data;
  } catch (error) {
    console.error('Cancel order error:', error.response?.data || error.message);
    throw error;
  }
};

// Kiểm tra xem đơn hàng có thể hủy không
export const canCancelOrder = async (orderId, access_token) => {
  try {
    const token = getValidToken(access_token);
    const res = await axiosJWT.get(`/order/can-cancel/${orderId}`, auth(token));
    return res.data;
  } catch (error) {
    console.error('Check can cancel order error:', error.response?.data || error.message);
    return { status: 'ERR', canCancel: false, message: error.response?.data?.message || 'Có lỗi xảy ra' };
  }
};

// Admin cập nhật trạng thái đơn
export const updateOrder = async (id, access_token, data) => {
  try {
    const token = getValidToken(access_token);
    const res = await axiosJWT.put(`/order/update-status/${id}`, data, auth(token));
    return res.data;
  } catch (error) {
    console.error('Update order error:', error.response?.data || error.message);
    throw error;
  }
};

// Admin: lấy tất cả đơn
export const getAllOrders = async (access_token) => {
  try {
    const token = getValidToken(access_token);
    const res = await axiosJWT.get(`/order/getAll`, auth(token));
    return res.data;
  } catch (error) {
    console.error('Get all orders error:', error.response?.data || error.message);
    throw error;
  }
};

// Admin: xoá nhiều đơn
export const deleteManyOrder = async (data, access_token) => {
  try {
    const token = getValidToken(access_token);
    const res = await axiosJWT.post(`/order/delete-many`, data, auth(token));
    return res.data;
  } catch (error) {
    console.error('Delete many orders error:', error.response?.data || error.message);
    throw error;
  }
};

// Admin: doanh thu
export const getRevenue = async (access_token) => {
  try {
    const token = getValidToken(access_token);
    const res = await axiosJWT.get(`/order/revenue`, auth(token));
    return res.data;
  } catch (error) {
    console.error('Get revenue error:', error.response?.data || error.message);
    throw error;
  }
};