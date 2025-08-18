const express = require('express');
const OrderController = require('../controllers/OrderController');
const { authRequired, authUserMiddleware, authMiddleware, authOrderOwnerOrAdmin } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/create', authRequired, OrderController.createOrder);                  // user đăng nhập mới tạo
router.get('/get-detail/:id', authUserMiddleware, OrderController.getDetailOrder); // :id = userId

// ⭐ HỦY ĐƠN THEO orderId: admin hoặc CHÍNH CHỦ đơn
// Giữ route DELETE cho khả năng tương thích
router.delete('/:id', authOrderOwnerOrAdmin, OrderController.cancelOrder);

// Thêm route POST cho hủy đơn với lý do (khuyên dùng)
router.post('/cancel/:id', authOrderOwnerOrAdmin, OrderController.cancelOrder);

// Thêm route riêng cho việc cập nhật trạng thái với socket.io thông báo
router.put('/update-status/:id', authMiddleware, OrderController.updateOrderStatus);

// admin-only
router.get('/getAll', authMiddleware, OrderController.getAllOrders);
router.put('/:id', authMiddleware, OrderController.updateOrderStatus);
router.post('/delete-many', authMiddleware, OrderController.deleteManyOrder);
router.get('/revenue', authMiddleware, OrderController.getRevenue);

// API để kiểm tra đơn hàng có thể hủy không (client side validation)
router.get('/can-cancel/:id', authOrderOwnerOrAdmin, async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await require('../models/OrderModel').findById(orderId);
        
        if (!order) {
            return res.status(404).json({
                status: 'ERR',
                message: 'Không tìm thấy đơn hàng'
            });
        }
        
        // Kiểm tra nếu đơn hàng ở trạng thái có thể hủy
        const canCancel = ['pending', 'confirmed', 'processing'].includes(order.status);
        
        // Nếu là user thường không phải admin, kiểm tra thêm quyền hủy đơn
        if (req.user.role !== 'admin' && order.status === 'processing') {
            return res.json({
                status: 'OK',
                canCancel: false,
                message: 'Đơn hàng đang được xử lý, không thể hủy. Vui lòng liên hệ với shop.'
            });
        }
        
        return res.json({
            status: 'OK',
            canCancel,
            message: canCancel ? 'Đơn hàng có thể hủy' : 'Đơn hàng không thể hủy ở trạng thái hiện tại'
        });
    } catch (error) {
        return res.status(500).json({
            status: 'ERR',
            message: error.message || 'Lỗi server'
        });
    }
});

module.exports = router;