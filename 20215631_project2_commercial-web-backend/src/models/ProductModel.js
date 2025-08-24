const mongoose = require('mongoose');

// Định nghĩa schema cho từng option/phiên bản sản phẩm
const optionSchema = new mongoose.Schema({
    color: { type: String, required: true },
    storage: { type: String, required: true },
    image: { type: String },          // Ảnh riêng cho từng option (nếu có)
    price: { type: Number, required: true },
    countInStock: { type: Number, required: true },
}, { _id: false });

const productSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true },
        image: { type: String, required: true },
        type: { type: String, required: true },
        price: { type: Number, required: true }, // Giá mặc định
        countInStock: { type: Number, required: true }, // Số lượng tổng (có thể tính tổng các option)
        rating: { type: Number, required: true, default: 0 },
        numReviews: { type: Number, default: 0 },
        description: { type: String },
        discount: { type: Number },
        numberSold: { type: Number },
        options: [optionSchema], // <--- Thêm dòng này
    },
    {
        timestamps: true,
    },
);
const Product = mongoose.model('Product', productSchema);

module.exports = Product;