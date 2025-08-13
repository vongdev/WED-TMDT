const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/ProductController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Tạo
router.post('/create', ProductController.createProduct);

// Lấy danh sách & loại — ĐỂ TRƯỚC
router.get('/get-all', ProductController.getAllProduct);
router.get('/get-all-type', ProductController.getAllType);

// Chi tiết theo id
router.get('/detail/:id', ProductController.getDetailProduct);

// Cập nhật/Xoá
router.put('/update/:id', authMiddleware, ProductController.updateProduct);
router.delete('/delete/:id', authMiddleware, ProductController.deleteProduct);
router.post('/delete-many-product', authMiddleware, ProductController.deleteManyProduct);

// ❌ TUYỆT ĐỐI KHÔNG để route kiểu `router.get('/:id', ...)` nếu bạn dùng `/detail/:id`.
// Nếu lỡ có `/:id`, hãy xoá nó, hoặc chuyển nó xuống cuối cùng (sau /get-all, /get-all-type).
module.exports = router;
