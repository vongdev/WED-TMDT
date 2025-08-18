const OrderService = require('../services/OrderService');

const createOrder = async (req, res) => {
    try {
        const { paymentMethod, itemsPrice, shippingPrice, totalPrice, fullName, address, city, phone } = req.body;
        if (!itemsPrice || !shippingPrice || !totalPrice || !fullName || !address || !city || !phone) {
            return res.status(200).json({
                status: 'ERR',
                message: 'The input is required',
            });
        }
        const response = await OrderService.createOrder(req.body);
        return res.status(200).json(response);
    } catch (e) {
        return res.status(404).json({
            message: e,
        });
    }
};

const getDetailOrder = async (req, res) => {
    try {
        const userId = req.params.id;
        if (!userId) {
            return res.status(200).json({
                status: 'ERR',
                message: 'userId is required',
            });
        }
        const response = await OrderService.getDetailOrder(userId);
        return res.status(200).json(response);
    } catch (e) {
        console.log(e);
        return res.status(404).json({
            message: e,
        });
    }
};

// Cập nhật logic hủy đơn hàng
const cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { reason } = req.body || {};
    if (!orderId) {
      return res.status(400).json({ status: 'ERR', message: 'orderId is required' });
    }
    
    // Thêm thông tin người dùng vào request để xử lý trong service
    const response = await OrderService.cancelOrder(orderId, { reason, user: req.user });
    
    // Nếu hủy thành công, thông báo cho admin
    if (response.status === 'OK') {
      // Sử dụng global function để thông báo cho admin
      global.notifyAdmin('ORDER_CANCELLED', {
        orderId,
        userId: req.user?._id,
        username: req.user?.name || req.user?.email,
        reason,
        timestamp: new Date()
      });
    }
    
    return res.status(response.status === 'OK' ? 200 : (response.code ? 409 : 400)).json(response);
  } catch (e) {
    return res.status(500).json({ status: 'ERR', message: e?.message || String(e) });
  }
};


const getAllOrders = async (req, res) => {
    try {
        const response = await OrderService.getAllOrders();
        return res.status(200).json(response);
    } catch (e) {
        console.log(e);
        return res.status(404).json({
            message: e,
        });
    }
};

// Cập nhật hàm xử lý cập nhật trạng thái đơn hàng
const updateOrderStatus = async (req, res) => {
    try {
        const orderId = req.params.id;
        const data = req.body;
        
        if (!orderId) {
            return res.status(200).json({
                status: 'ERR',
                message: 'orderId is required',
            });
        }
        
        // Thêm thông tin người cập nhật (admin)
        data.updatedBy = req.user?._id;
        
        const response = await OrderService.updateOrderStatus(orderId, data);
        
        // Nếu cập nhật thành công, thông báo cho người dùng
        if (response.status === 'OK' && response.data) {
            // Thông báo cho người dùng về trạng thái mới của đơn hàng
            global.notifyUser(response.data.user, {
                type: 'ORDER_STATUS_UPDATED',
                message: `Đơn hàng #${orderId} đã được cập nhật sang trạng thái: ${getStatusText(data.status)}`,
                orderId: orderId,
                status: data.status
            });
        }
        
        return res.status(200).json(response);
    } catch (e) {
        console.log(e);
        return res.status(404).json({
            message: e,
        });
    }
};

const deleteManyOrder = async (req, res) => {
    try {
        const orderIds = req.body.ids;
        if (!orderIds) {
            return res.status(200).json({
                status: 'ERR',
                message: 'orderIds are required',
            });
        }
        const response = await OrderService.deleteManyOrder(orderIds);
        return res.status(200).json(response);
    } catch (e) {
        console.log(e);
        return res.status(404).json({
            message: e,
        });
    }
};

const getRevenue = async (req, res) => {
    try {
        const response = await OrderService.getRevenue();
        return res.status(200).json(response);
    } catch (e) {
        console.log(e);
        return res.status(404).json({
            message: e,
        });
    }
};

// Hàm hỗ trợ chuyển đổi trạng thái sang text
function getStatusText(status) {
    const statusMap = {
        'pending': 'Chờ xác nhận',
        'confirmed': 'Đã xác nhận',
        'processing': 'Đang xử lý',
        'shipped': 'Đang vận chuyển',
        'delivered': 'Đã giao hàng',
        'cancelled': 'Đã hủy'
    };
    return statusMap[status] || status;
}

module.exports = {
    createOrder,
    getDetailOrder,
    cancelOrder,
    getAllOrders,
    updateOrderStatus,
    deleteManyOrder,
    getRevenue,
};