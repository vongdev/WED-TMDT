const Review = require('../models/ReviewModel');
const Product = require('../models/ProductModel');

exports.createOrUpdateReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.user?.id;

    if (!productId || !rating) return res.status(400).json({ status: 'ERR', message: 'Thiếu thông tin' });

    // Upsert review
    await Review.findOneAndUpdate(
      { product: productId, user: userId },
      { rating, comment },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Tính lại rating trung bình và số review
    const reviews = await Review.find({ product: productId });
    const avgRating = reviews.length ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length) : 0;

    await Product.findByIdAndUpdate(productId, {
      rating: avgRating,
      numReviews: reviews.length,
    });

    return res.json({ status: 'OK', message: 'Đánh giá thành công' });
  } catch (error) {
    return res.status(500).json({ status: 'ERR', message: error.message });
  }
};

exports.getReviewsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const reviews = await Review.find({ product: productId }).populate('user', 'name');
    res.json({ status: 'OK', data: reviews });
  } catch (error) {
    res.status(500).json({ status: 'ERR', message: error.message });
  }
};

// Thêm API xóa review - chỉ chính chủ được xóa
exports.deleteReview = async (req, res) => {
  try {
    const reviewId = req.params.id;
    const userId = req.user?.id;
    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ status: 'ERR', message: 'Review not found' });
    if (String(review.user) !== String(userId)) {
      return res.status(403).json({ status: 'ERR', message: 'Bạn không có quyền xóa đánh giá này' });
    }
    await review.deleteOne();
    // Cập nhật lại rating trung bình cho sản phẩm
    const reviews = await Review.find({ product: review.product });
    const avgRating = reviews.length ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length) : 0;
    await Product.findByIdAndUpdate(review.product, {
      rating: avgRating,
      numReviews: reviews.length,
    });
    return res.json({ status: 'OK', message: 'Đã xóa đánh giá' });
  } catch (e) {
    return res.status(500).json({ status: 'ERR', message: e.message });
  }
};