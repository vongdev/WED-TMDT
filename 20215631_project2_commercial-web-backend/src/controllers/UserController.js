const UserService = require('../services/UserService');
const JwtService = require('../services/JwtService');

const createUser = async (req, res) => {
    try {
        const { name, email, password, confirmPassword, phone } = req.body;
        const reg = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
        const isCheckEmail = reg.test(email);
        const isCheckPassword = password.length >= 6;

        if (!email || !password || !confirmPassword) {
            return res.status(200).json({
                status: 'ERR',
                message: 'Vui lòng nhập đầy đủ các trường',
            });
        } else if (!isCheckEmail) {
            return res.status(200).json({
                status: 'ERR',
                message: 'Email không hợp lệ',
            });
        } else if (!isCheckPassword) {
            return res.status(200).json({
                status: 'ERR',
                message: 'Mật khẩu cần ít nhất 6 ký tự',
            });
        } else if (password !== confirmPassword) {
            return res.status(200).json({
                status: 'ERR',
                message: 'Mật khẩu không trùng khớp',
            });
        }
        const response = await UserService.createUser(req.body);
        return res.status(200).json(response);
    } catch (e) {
        console.log(e);
        return res.status(404).json({
            message: e,
        });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const reg = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
        const isCheckEmail = reg.test(email);
        if (!email || !password) {
            return res.status(400).json({
                status: 'ERR',
                message: 'The input is required',
            });
        } else if (!isCheckEmail) {
            return res.status(200).json({
                status: 'ERR',
                message: 'Email không hợp lệ',
            });
        }
        const response = await UserService.loginUser(req.body);
        const { refresh_token, ...newResponse } = response;
        res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: false,     // dev (HTTP). Deploy HTTPS mới để true
      sameSite: 'lax',   // dev dùng 'lax'. Khác domain thực tế: 'none' + secure:true
      path: '/',         // tuỳ chọn, cho rõ ràng
      // maxAge: 7 * 24 * 60 * 60 * 1000 // nếu muốn theo REFRESH_TOKEN_EXPIRES
    });

    return res.status(200).json(newResponse);
  } catch (e) {
    console.log(e);
    return res.status(404).json({ message: e });
  }
};

const updateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const data = req.body;
        if (!userId) {
            return res.status(200).json({
                status: 'ERR',
                message: 'userId is required',
            });
        }
        const response = await UserService.updateUser(userId, data);
        return res.status(200).json(response);
    } catch (e) {
        console.log(e);
        return res.status(404).json({
            message: e,
        });
    }
};

const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        // const token = req.headers;
        if (!userId) {
            return res.status(200).json({
                status: 'ERR',
                message: 'userId is required',
            });
        }
        const response = await UserService.deleteUser(userId);
        return res.status(200).json(response);
    } catch (e) {
        console.log(e);
        return res.status(404).json({
            message: e,
        });
    }
};

const deleteManyUser = async (req, res) => {
    try {
        const userIds = req.body.ids;
        if (!userIds) {
            return res.status(200).json({
                status: 'ERR',
                message: 'userIds are required',
            });
        }
        const response = await UserService.deleteManyUser(userIds);
        return res.status(200).json(response);
    } catch (e) {
        console.log(e);
        return res.status(404).json({
            message: e,
        });
    }
};

const getAllUser = async (req, res) => {
    try {
        const response = await UserService.getAllUser();
        return res.status(200).json(response);
    } catch (e) {
        console.log('getAllUser controller', e);
        return res.status(404).json({
            message: e,
        });
    }
};

const getDetailUser = async (req, res) => {
    try {
        const userId = req.params.id;
        // const token = req.headers;
        if (!userId) {
            return res.status(200).json({
                status: 'ERR',
                message: 'userId is required',
            });
        }
        const response = await UserService.getDetailUser(userId);
        return res.status(200).json(response);
    } catch (e) {
        console.log(e);
        return res.status(404).json({
            message: e,
        });
    }
};

const refreshToken = async (req, res) => {
    try {
        const token = req.cookies.refresh_token;
        if (!token) {
            return res.status(200).json({
                status: 'ERR',
                message: 'Token is required',
            });
        }
        const response = await JwtService.refreshTokenJwtService(token);
        return res.status(200).json(response);
    } catch (e) {
        console.log(e);
        return res.status(404).json({
            message: e,
        });
    }
};

const logoutUser = async (req, res) => {
    try {
        res.clearCookie('refresh_token');
        return res.status(200).json({
            status: 'OK',
            message: 'Log out successfully',
        });
    } catch (e) {
        console.log(e);
        return res.status(404).json({
            message: e,
        });
    }
};

module.exports = {
    createUser,
    loginUser,
    updateUser,
    deleteUser,
    getAllUser,
    getDetailUser,
    refreshToken,
    logoutUser,
    deleteManyUser,
};
