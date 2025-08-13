const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

function getTokenFromHeaders(req) {
  // Ưu tiên chuẩn Authorization, fallback header 'token' cũ
  const auth = req.headers.authorization || req.headers.token;
  if (!auth) return null;
  const parts = auth.split(' ');
  return parts.length === 2 ? parts[1] : parts[0];
}

const authRequired = (req, res, next) => {
  const token = getTokenFromHeaders(req);
  if (!token) {
    return res.status(401).json({ status: 'ERROR', message: 'Missing token' });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, user) => {
    if (err) {
      return res.status(401).json({ status: 'ERROR', message: 'Invalid token' });
    }
    req.user = user; // gắn user vào req để dùng sau
    next();
  });
};

const authMiddleware = (req, res, next) => {
  authRequired(req, res, () => {
    if (req.user?.isAdmin) return next();
    return res.status(403).json({ status: 'ERROR', message: 'Forbidden' });
  });
};

// Dùng khi :id là userId (vd: /user/get-detail/:id, /user/update-user/:id)
const authUserMiddleware = (req, res, next) => {
  authRequired(req, res, () => {
    const userId = String(req.params.id || '');
    if (req.user?.isAdmin || String(req.user?.id) === userId) return next();
    return res.status(403).json({ status: 'ERROR', message: 'Forbidden' });
  });
};

// Dùng khi :id là orderId (vd: /order/:id, /order/cancel/:id)
const Order = require('../models/OrderModel'); // chỉnh path nếu model để nơi khác
const authOrderOwnerOrAdmin = (req, res, next) => {
  authRequired(req, res, async () => {
    try {
      const order = await Order.findById(req.params.id).select('user');
      if (!order) return res.status(404).json({ status: 'ERROR', message: 'Order not found' });
      if (req.user?.isAdmin || String(order.user) === String(req.user?.id)) {
        return next();
      }
      return res.status(403).json({ status: 'ERROR', message: 'Forbidden' });
    } catch (e) {
      return res.status(500).json({ status: 'ERROR', message: 'Server error' });
    }
  });
};

module.exports = {
  authMiddleware,
  authUserMiddleware,
  authRequired,
  authOrderOwnerOrAdmin,
};
