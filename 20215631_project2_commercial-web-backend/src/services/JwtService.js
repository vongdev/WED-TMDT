const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

// Lấy thời hạn từ .env (có default)
const ACCESS_EXPIRES  = process.env.ACCESS_TOKEN_EXPIRES  || '15m';
const REFRESH_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES || '7d';

const generalAccessToken = (payload) => {
  // Chỉ ký các field cần dùng
  const body = { id: payload.id, isAdmin: payload.isAdmin };
  return jwt.sign(body, process.env.ACCESS_TOKEN, { expiresIn: ACCESS_EXPIRES });
};

const generalRefreshToken = (payload) => {
  const body = { id: payload.id, isAdmin: payload.isAdmin };
  return jwt.sign(body, process.env.REFRESH_TOKEN, { expiresIn: REFRESH_EXPIRES });
};

const refreshTokenJwtService = (token) => {
  return new Promise((resolve) => {
    jwt.verify(token, process.env.REFRESH_TOKEN, async (err, user) => {
      if (err) {
        return resolve({ status: 'ERROR', message: 'Authentication' });
      }
      const access_token = await generalAccessToken({
        id: user?.id,
        isAdmin: user?.isAdmin,
      });
      resolve({ status: 'OK', message: 'SUCCESS', access_token });
    });
  });
};

module.exports = {
  generalAccessToken,
  generalRefreshToken,
  refreshTokenJwtService,
};
