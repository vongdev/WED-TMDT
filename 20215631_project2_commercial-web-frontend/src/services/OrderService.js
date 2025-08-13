import axios from 'axios';
import { axiosJWT } from './UserService';

const API = process.env.REACT_APP_API_URL; // ví dụ http://localhost:3001

// helper cấu hình auth
const auth = (access_token) => ({
  headers: { Authorization: `Bearer ${access_token}` }, // hoặc 'token' nếu bạn muốn giữ header cũ
  withCredentials: true, // nếu bạn dùng cookie refresh
});

// Tạo đơn (user đã đăng nhập)
export const createOrder = async (data, access_token) => {
  const res = await axiosJWT.post(`${API}/api/order/create`, data, auth(access_token));
  return res.data;
};

// Lấy đơn theo userId (user hoặc admin)
export const getOrderByUserId = async (userId, access_token) => {
  const res = await axiosJWT.get(`${API}/api/order/get-detail/${userId}`, auth(access_token));
  return res.data;
};

// Hủy đơn theo orderId (owner hoặc admin)
// FE chỉ cần gửi "reason"; server sẽ tự hoàn kho dựa trên orderItems trong DB.
export const cancelOrder = async (orderId, access_token, reason = 'changed_mind') => {
  const res = await axiosJWT.delete(`${API}/api/order/${orderId}`, {
    ...auth(access_token),
    data: { reason },          // axios.delete: body phải đặt trong 'data'
  });
  return res.data;
};

// Admin cập nhật trạng thái đơn
export const updateOrder = async (id, access_token, data) => {
  const res = await axiosJWT.put(`${API}/api/order/${id}`, data, auth(access_token));
  return res.data;
};

// Admin: lấy tất cả đơn
export const getAllOrders = async (access_token) => {
  const res = await axiosJWT.get(`${API}/api/order/getAll`, auth(access_token));
  return res.data;
};

// Admin: xoá nhiều đơn
export const deleteManyOrder = async (data, access_token) => {
  const res = await axiosJWT.post(`${API}/api/order/delete-many`, data, auth(access_token));
  return res.data;
};

// Admin: doanh thu
export const getRevenue = async (access_token) => {
  const res = await axiosJWT.get(`${API}/api/order/revenue`, auth(access_token));
  return res.data;
};
