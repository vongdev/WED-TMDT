const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose'); // Không cần { default: ... }
const routes = require('./routes');
const cors = require('cors');
const cookieParser = require('cookie-parser');

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// ====== CORS ======
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));

// ====== Middleware ======
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// ====== Routes ======
routes(app);

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

// ====== Start Server ======
app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
});
