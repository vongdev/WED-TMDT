// models/Order.js
const mongoose = require('mongoose');

// Thêm schema cho lịch sử trạng thái
const statusHistorySchema = new mongoose.Schema({
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    required: true 
  },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  note: { type: String },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

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

    // phương thức thanh toán - bổ sung thêm các phương thức
    paymentMethod: { 
      type: String, 
      enum: ['COD', 'VNPAY', 'MOMO', 'Banking', 'ZaloPay'], 
      default: 'COD', 
      required: true 
    },

    // Thêm trạng thái thanh toán
    paymentStatus: { 
      type: String, 
      enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
      default: 'Pending' 
    },

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

    // Thêm lịch sử trạng thái
    statusHistory: [statusHistorySchema],

    // thanh toán/giao hàng (giữ lại để tương thích)
    isPaid:      { type: Boolean, default: false },
    paidAt:      { type: Date },
    isDelivered: { type: Boolean, default: false },
    deliveredAt: { type: Date },

    // ===== Thông tin hủy (phục vụ logic "đổi ý"/admin hủy) =====
    isCancelled:  { type: Boolean, default: false },
    cancelledAt:  { type: Date },
    cancelReason: { type: String },
    cancelledBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    
    // Ai hủy đơn: "User" hoặc "Admin"
    cancelledByRole: { type: String, enum: ['User', 'Admin'] },
  },
  { timestamps: true }
);

// index hữu ích cho trang quản trị/lọc theo user
orderSchema.index({ user: 1, createdAt: -1 });

// Thêm middleware pre-save để cập nhật lịch sử trạng thái
orderSchema.pre('save', function(next) {
  // Nếu trạng thái thay đổi hoặc đây là đơn hàng mới
  if (this.isNew || this.isModified('status')) {
    // Nếu đây là đơn hàng mới, thêm trạng thái ban đầu vào lịch sử
    if (!this.statusHistory) {
      this.statusHistory = [];
    }
    
    // Thêm trạng thái mới vào lịch sử
    this.statusHistory.push({
      status: this.status,
      updatedBy: this.updatedBy || this.user, // Nếu không có updatedBy, sử dụng user
      note: this.statusNote || '',
      timestamp: new Date()
    });

    // Xóa các biến tạm thời
    delete this.updatedBy;
    delete this.statusNote;
  }
  
  // Đồng bộ trạng thái isCancelled với status
  if (this.status === 'cancelled' && !this.isCancelled) {
    this.isCancelled = true;
    this.cancelledAt = new Date();
  }
  
  next();
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;