const express = require('express');
const router = express.Router();
const ReviewController = require('../controllers/ReviewController');
const { authRequired } = require('../middleware/authMiddleware');

router.post('/', authRequired, ReviewController.createOrUpdateReview); // Khách đánh giá/sửa
router.get('/:productId', ReviewController.getReviewsByProduct); // Lấy review theo sản phẩm

module.exports = router;