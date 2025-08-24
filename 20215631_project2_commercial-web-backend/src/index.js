const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const routes = require('./routes');
const cors = require('cors');
const cookieParser = require('cookie-parser');

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// ====== Tạo HTTP server ======
const server = http.createServer(app);

// ====== Khởi tạo Socket.IO ======
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ["GET", "POST"],
    credentials: true
  }
});

// ====== Socket.IO Event Handlers ======
io.on('connection', (socket) => {
  console.log('Người dùng đã kết nối:', socket.id);

  socket.on('join-admin-room', () => {
    socket.join('admin-room');
    console.log('Admin đã tham gia room');
  });

  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`Người dùng ${userId} đã tham gia room`);
  });

  socket.on('disconnect', () => {
    console.log('Người dùng đã ngắt kết nối');
  });
});

// ====== Khởi tạo global function để gửi thông báo ======
global.notifyAdmin = (type, data) => {
  io.to('admin-room').emit('notification', { type, data });
};

global.notifyUser = (userId, notification) => {
  io.to(`user-${userId}`).emit('notification', notification);
};

// ====== CORS ======
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));

// ====== Middleware ======
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// ====== Chia sẻ socket.io cho các route ======
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ====== Routes ======
routes(app);

// ====== Thêm ReviewRouter cho chức năng đánh giá sản phẩm ======
const ReviewRouter = require('./routes/ReviewRouter');
app.use('/api/review', ReviewRouter);

// ====== MongoDB Connect ======
mongoose.connect(process.env.MONGO_DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('✅ MongoDB connected successfully');
})
.catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1); // Thoát nếu DB không kết nối được
});

// ====== Start Server - Thay đổi app.listen thành server.listen ======
server.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
    console.log(`🔌 Socket.IO đã được kích hoạt`);
});