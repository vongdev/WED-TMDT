const express = require('express');
const router = express.Router();
const ReviewController = require('../controllers/ReviewController');
const { authRequired } = require('../middleware/authMiddleware');

router.post('/', authRequired, ReviewController.createOrUpdateReview); // User đánh giá/sửa
router.get('/:productId', ReviewController.getReviewsByProduct); // Lấy review theo sản phẩm
router.delete('/:id', authRequired, ReviewController.deleteReview); // Chỉ chính chủ được xóa

module.exports = router;
