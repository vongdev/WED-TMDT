const express = require('express');
const OrderController = require('../controllers/OrderController');
const { authRequired, authUserMiddleware, authMiddleware, authOrderOwnerOrAdmin } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/create', authRequired, OrderController.createOrder);                  // user đăng nhập mới tạo
router.get('/get-detail/:id', authUserMiddleware, OrderController.getDetailOrder); // :id = userId

// ⭐ HỦY ĐƠN THEO orderId: admin hoặc CHÍNH CHỦ đơn
router.delete('/:id', authOrderOwnerOrAdmin, OrderController.cancelOrder);

// admin-only
router.get('/getAll', authMiddleware, OrderController.getAllOrders);
router.put('/:id', authMiddleware, OrderController.updateOrderStatus);
router.post('/delete-many', authMiddleware, OrderController.deleteManyOrder);
router.get('/revenue', authMiddleware, OrderController.getRevenue);

module.exports = router;

