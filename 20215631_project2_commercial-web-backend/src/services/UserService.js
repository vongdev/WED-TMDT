const User = require('../models/UserModel');
const bcrypt = require('bcrypt');
const { generalAccessToken, generalRefreshToken } = require('./JwtService');

const createUser = (newUser) => {
    return new Promise(async (resolve, reject) => {
        const { name, email, password, confirmPassword, phone } = newUser;
        try {
            // Kiểm tra email đã tồn tại hay chưa
            const checkUser = await User.findOne({
                email: email,
            });
            if (checkUser !== null) {
                resolve({
                    status: 'ERR',
                    message: 'Địa chỉ email đã tồn tại',
                });
            }
            const hashPassword = bcrypt.hashSync(password, 10);
            console.log(hashPassword);
            const createdUser = await User.create({
                name,
                email,
                password: hashPassword,
                phone,
            });
            if (createdUser) {
                resolve({
                    status: 'OK',
                    message: 'SUCCESS',
                    data: createdUser,
                });
            }
        } catch (e) {
            reject(e);
        }
    });
};

const loginUser = (userLogin) => {
    return new Promise(async (resolve, reject) => {
        const { email, password } = userLogin;
        try {
            const checkUser = await User.findOne({
                email: email,
            });
            // Kiểm tra tài khoản người dùng có trong database chưa
            if (checkUser === null) {
                resolve({
                    status: 'ERR',
                    message: 'Tài khoản không tồn tại',
                });
            }

            const comparePassword = bcrypt.compareSync(password, checkUser.password);

            if (!comparePassword) {
                resolve({
                    status: 'ERR',
                    message: 'Mật khẩu không đúng',
                });
            }
            const access_token = await generalAccessToken({
                id: checkUser.id,
                isAdmin: checkUser.isAdmin,
            });

            const refresh_token = await generalRefreshToken({
                id: checkUser.id,
                isAdmin: checkUser.isAdmin,
            });
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                access_token,
                refresh_token,
            });
        } catch (e) {
            reject(e);
        }
    });
};

const updateUser = (id, data) => {
    return new Promise(async (resolve, reject) => {
        try {
            const checkUser = await User.findOne({ _id: id });

            if (checkUser === null) {
                resolve({
                    status: 'OK',
                    message: 'User is not exist',
                });
            }

            const updateUser = await User.findByIdAndUpdate(id, data, { new: true });

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: updateUser,
            });
        } catch (e) {
            reject(e);
        }
    });
};

const deleteManyUser = (ids) => {
    return new Promise(async (resolve, reject) => {
        try {
            await User.deleteMany({ _id: ids });

            resolve({
                status: 'OK',
                message: 'DELETE USERS SUCCESS',
            });
        } catch (e) {
            reject(e);
        }
    });
};

const deleteUser = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const checkUser = await User.findOne({ _id: id });

            if (checkUser === null) {
                resolve({
                    status: 'OK',
                    message: 'User is not exist',
                });
            }

            await User.findByIdAndDelete(id);

            resolve({
                status: 'OK',
                message: 'DELETE SUCCESS',
            });
        } catch (e) {
            reject(e);
        }
    });
};

const getAllUser = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const allUser = await User.find();

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: allUser,
            });
        } catch (e) {
            console.log(e);
            reject(e);
        }
    });
};

const getDetailUser = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const user = await User.findOne({ _id: id });

            console.log('user', user);

            if (user === null) {
                resolve({
                    status: 'OK',
                    message: 'User is not exist',
                });
            }

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: user,
            });
        } catch (e) {
            reject(e);
        }
    });
};

module.exports = {
    createUser,
    loginUser,
    updateUser,
    deleteUser,
    getAllUser,
    getDetailUser,
    deleteManyUser,
};
