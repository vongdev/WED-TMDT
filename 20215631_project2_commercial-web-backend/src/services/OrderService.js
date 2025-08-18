const mongoose = require('mongoose');
const Order = require('../models/OrderModel');
const Product = require('../models/ProductModel');

const createOrder = (newOrder) => {
    return new Promise(async (resolve, reject) => {
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
        try {
            const promise = orderItems.map(async (order) => {
                const productData = await Product.findOneAndUpdate(
                    {
                        _id: order.product,
                        countInStock: { $gte: order.amount },
                    },
                    {
                        $inc: {
                            countInStock: -order.amount,
                            numberSold: +order.amount,
                        },
                    },
                    {
                        new: true,
                    },
                );
                console.log('productData', productData);

                if (!productData) {
                    return {
                        status: 'ERR',
                        message: 'ERR',
                        id: order.product,
                    };
                }
            });

            const results = await Promise.all(promise);
            const newData = results && results.filter((item) => item && item.id);
            if (newData.length) {
                return resolve({
                    status: 'ERR',
                    message: `Sản phẩm có id ${newData.map((item) => item.id).join(', ')} không đủ hàng`,
                });
            }

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

            if (createdOrder) {
                resolve({
                    status: 'OK',
                    message: 'SUCCESS',
                });
            } else {
                resolve({
                    status: 'ERR',
                    message: 'Không thể tạo đơn hàng',
                });
            }
        } catch (e) {
            reject(e);
        }
    });
};

const getDetailOrder = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const order = await Order.find({ user: id });

            if (order === null) {
                resolve({
                    status: 'OK',
                    message: 'Order is not exist',
                });
            }

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: order,
            });
        } catch (e) {
            console.log(e);
            reject(e);
        }
    });
};

const cancelOrder = async (orderId, { reason, user }) => {
  console.log('Bắt đầu hủy đơn hàng:', { orderId, reason, userId: user?.id });
  
  try {
    // 1. Tìm đơn hàng
    const order = await Order.findById(orderId);
    if (!order) {
      console.log('Không tìm thấy đơn hàng:', orderId);
      return { status: 'ERR', message: 'Order not found' };
    }

    console.log('Thông tin đơn hàng:', {
      id: order._id,
      status: order.status,
      isCancelled: order.isCancelled,
      orderUserId: order.user
    });

    // 2. Kiểm tra quyền
    const isOwner = String(order.user) === String(user?.id);
    const isAdmin = !!user?.isAdmin;
    console.log('Quyền hủy đơn:', { isOwner, isAdmin });

    // 3. Kiểm tra các điều kiện không thể hủy
    if (isOwner && !isAdmin) {
      if (order.isDelivered || order.status === 'delivered') {
        return { status: 'ERR', code: 'DELIVERED', message: 'Đơn đã giao, không thể hủy.' };
      }
      if (order.isPaid && order.paymentMethod !== 'COD') {
        return { status: 'ERR', code: 'PAID_ONLINE', message: 'Đơn đã thanh toán online, cần xử lý hoàn tiền.' };
      }
      if (order.status === 'shipped') {
        return { status: 'ERR', code: 'SHIPPED', message: 'Đơn đã giao cho đơn vị vận chuyển, liên hệ CSKH để hỗ trợ.' };
      }
    }

    if (isAdmin) {
      if (order.isDelivered || order.status === 'delivered') {
        return { status: 'ERR', code: 'DELIVERED', message: 'Đơn đã giao, không thể hủy.' };
      }
    }

    // 4. Nếu đã hủy rồi thì báo thành công luôn
    if (order.status === 'cancelled' || order.isCancelled) {
      console.log('Đơn hàng đã ở trạng thái hủy');
      return { status: 'OK', message: 'Đơn đã ở trạng thái hủy.', data: order };
    }

    // 5. Cập nhật trạng thái đơn hàng trước
    try {
      console.log('Cập nhật trạng thái đơn hàng...');
      order.status = 'cancelled';
      order.isCancelled = true;
      order.cancelledAt = new Date();
      order.cancelledBy = user?.id;
      order.cancelReason = reason || (isAdmin ? 'admin_cancel' : 'user_cancel');
      await order.save();
    } catch (saveError) {
      console.error('Lỗi khi lưu đơn hàng:', saveError);
      return { status: 'ERR', message: 'Lỗi khi cập nhật đơn hàng: ' + saveError.message };
    }

    // 6. Hoàn kho sau khi đã hủy đơn
    console.log('Bắt đầu hoàn kho...');
    try {
      for (const item of order.orderItems) {
        console.log('Hoàn kho cho sản phẩm:', { 
          productId: item.product, 
          amount: item.amount 
        });
        
        await Product.updateOne(
          { _id: item.product },
          { $inc: { countInStock: item.amount } }
        );
      }
    } catch (stockError) {
      // Ghi log lỗi nhưng không hoàn tác - đơn đã được hủy
      console.error('Lỗi khi hoàn kho (đơn vẫn được hủy):', stockError);
    }

    console.log('Hủy đơn hàng thành công:', orderId);
    return { status: 'OK', message: 'Cancel success', data: order };
    
  } catch (err) {
    console.error('Lỗi trong quá trình hủy đơn:', err);
    return { status: 'ERR', message: err.message || String(err) };
  }
};

const getAllOrders = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const allOrders = await Order.find();

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
                resolve({
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