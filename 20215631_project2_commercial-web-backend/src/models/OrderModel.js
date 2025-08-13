// models/Order.js
const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  name:     { type: String,  required: true },
  amount:   { type: Number,  required: true, min: 1 },
  image:    { type: String,  required: true },
  price:    { type: Number,  required: true, min: 0 },
  discount: { type: Number,  default: 0,     min: 0 },
  product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
}, { _id: false });

const orderSchema = new mongoose.Schema(
  {
    orderItems:       { type: [orderItemSchema], required: true },

    shippingAddress: {
      fullName: { type: String, required: true },
      address:  { type: String, required: true },
      city:     { type: String, required: true },
      // ⚠️ đổi Number -> String để không mất số 0 ở đầu
      phone:    { type: String, required: true, trim: true },
    },

    // phương thức thanh toán – tùy bạn, có thể bổ sung thêm
    paymentMethod: { type: String, enum: ['COD', 'VNPAY', 'MOMO'], default: 'COD', required: true },

    itemsPrice:    { type: Number, required: true, min: 0 },
    shippingPrice: { type: Number, required: true, min: 0 },
    totalPrice:    { type: Number, required: true, min: 0 },

    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // ===== Trạng thái đơn để điều khiển hủy =====
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
      index: true,
    },

    // thanh toán/giao hàng (giữ lại để tương thích)
    isPaid:      { type: Boolean, default: false },
    paidAt:      { type: Date },
    isDelivered: { type: Boolean, default: false },
    deliveredAt: { type: Date },

    // ===== Thông tin hủy (phục vụ logic “đổi ý”/admin hủy) =====
    isCancelled:  { type: Boolean, default: false },
    cancelledAt:  { type: Date },
    cancelReason: { type: String },
    cancelledBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// index hữu ích cho trang quản trị/lọc theo user
orderSchema.index({ user: 1, createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
