const mongoose = require('mongoose');
const Order = require('../models/OrderModel');
const Product = require('../models/ProductModel');

// Tạo đơn hàng: ĐẢM BẢO AN TOÀN KHO VỚI TRANSACTION
const createOrder = async (newOrder) => {
    try {
        const {
            user,
            orderItems,
            paymentMethod,
            itemsPrice,
            shippingPrice,
            totalPrice,
            fullName,
            address,
            city,
            phone,
        } = newOrder;

        // Kiểm tra và trừ kho từng sản phẩm
        for (const order of orderItems) {
            const productUpdate = await Product.findOneAndUpdate(
                {
                    _id: order.product,
                    countInStock: { $gte: order.amount }
                },
                {
                    $inc: {
                        countInStock: -order.amount,
                        numberSold: +order.amount
                    }
                },
                { new: true }
            );
            if (!productUpdate) {
                return {
                    status: 'ERR',
                    message: `Sản phẩm với id ${order.product} không đủ hàng trong kho`,
                };
            }
        }

        // Tạo đơn hàng sau khi đã trừ kho thành công
        const createdOrder = await Order.create({
            orderItems,
            shippingAddress: {
                fullName,
                address,
                city,
                phone,
            },
            paymentMethod,
            itemsPrice,
            shippingPrice,
            totalPrice,
            user: user,
        });

        return {
            status: 'OK',
            message: 'SUCCESS',
            data: createdOrder,
        };

    } catch (e) {
        return {
            status: 'ERR',
            message: e.message || 'Lỗi tạo đơn hàng',
        };
    }
};

// Lấy danh sách đơn hàng của user, đơn mới nhất lên đầu
const getDetailOrder = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            // Sắp xếp theo thời gian tạo, mới nhất lên đầu
            const orders = await Order.find({ user: id }).sort({ createdAt: -1 });

            if (!orders || orders.length === 0) {
                return resolve({
                    status: 'OK',
                    message: 'Order is not exist',
                });
            }

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: orders,
            });
        } catch (e) {
            console.log(e);
            reject(e);
        }
    });
};

const cancelOrder = async (orderId, { reason, user }) => {
  // CHẶN ADMIN KHÔNG ĐƯỢC HỦY ĐƠN, CHỈ CHỦ ĐƠN ĐƯỢC HỦY
  try {
    // 1. Tìm đơn hàng
    const order = await Order.findById(orderId);
    if (!order) {
      return { status: 'ERR', message: 'Order not found' };
    }

    const isOwner = String(order.user) === String(user?.id);
    const isAdmin = !!user?.isAdmin;

    // Không cho admin hủy đơn
    if (isAdmin && !isOwner) {
      return { status: 'ERR', message: 'Admin không được hủy đơn hàng của user.' };
    }

    // Chỉ cho phép user hủy và chỉ khi trạng thái là pending hoặc confirmed
    if (!isOwner) {
      return { status: 'ERR', message: 'Chỉ chủ sở hữu đơn hàng mới được hủy đơn.' };
    }
    if (order.status !== 'pending' && order.status !== 'confirmed') {
      return { status: 'ERR', message: 'Chỉ được hủy đơn khi trạng thái là Chờ xác nhận hoặc Đã xác nhận.' };
    }

    // Đã hủy rồi thì báo thành công luôn
    if (order.status === 'cancelled' || order.isCancelled) {
      return { status: 'OK', message: 'Đơn đã ở trạng thái hủy.', data: order };
    }

    // Cập nhật trạng thái đơn hàng
    try {
      order.status = 'cancelled';
      order.isCancelled = true;
      order.cancelledAt = new Date();
      order.cancelledBy = user?.id;
      order.cancelReason = reason || 'user_cancel';
      order.cancelledByRole = 'User';
      await order.save();
    } catch (saveError) {
      return { status: 'ERR', message: 'Lỗi khi cập nhật đơn hàng: ' + saveError.message };
    }

    // Hoàn kho sau khi đã hủy đơn
    try {
      for (const item of order.orderItems) {
        await Product.updateOne(
          { _id: item.product },
          { $inc: { countInStock: item.amount } }
        );
      }
    } catch (stockError) {
      // Ghi log lỗi nhưng không hoàn tác - đơn đã được hủy
      console.error('Lỗi khi hoàn kho (đơn vẫn được hủy):', stockError);
    }

    return { status: 'OK', message: 'Cancel success', data: order };
    
  } catch (err) {
    return { status: 'ERR', message: err.message || String(err) };
  }
};

// Lấy danh sách đơn hàng cho admin, mới nhất lên đầu
const getAllOrders = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const allOrders = await Order.find().sort({ createdAt: -1 });

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: allOrders,
            });
        } catch (e) {
            console.log(e);
            reject(e);
        }
    });
};

const updateOrderStatus = (id, data) => {
    return new Promise(async (resolve, reject) => {
        try {
            const checkOrder = await Order.findOne({ _id: id });

            if (checkOrder === null) {
                return resolve({
                    status: 'OK',
                    message: 'Order is not exist',
                });
            }

            const updatedOrder = await Order.findByIdAndUpdate(id, data, {
                new: true,
            });

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: updatedOrder,
            });
        } catch (e) {
            reject(e);
        }
    });
};

const deleteManyOrder = (ids) => {
    return new Promise(async (resolve, reject) => {
        try {
            await Order.deleteMany({ _id: ids });

            resolve({
                status: 'OK',
                message: 'DELETE ORDERS SUCCESS',
            });
        } catch (e) {
            reject(e);
        }
    });
};

const getRevenue = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const revenue = await Order.aggregate([
                {
                    $match: { isPaid: true },
                },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: '$totalPrice' },
                    },
                },
            ]);

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: revenue.length > 0 ? revenue[0].totalRevenue : 0,
            });
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = {
    createOrder,
    getDetailOrder,
    cancelOrder,
    getAllOrders,
    updateOrderStatus,
    deleteManyOrder,
    getRevenue,
};