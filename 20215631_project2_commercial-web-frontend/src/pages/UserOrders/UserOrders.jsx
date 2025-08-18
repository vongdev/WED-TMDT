import React, { useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import styles from './UserOrders.module.scss';
import { useQuery } from '@tanstack/react-query';
import * as OrderService from '../../services/OrderService';
import Loading from '../../components/LoadingComponent/Loading';
import { useLocation, useNavigate } from 'react-router-dom';
import { Modal, Button, Empty, Input, Alert } from 'antd';
import * as message from '../../components/Message/Message';
import { useMutationHook } from '../../hooks/useMutationHook';
import { useSelector } from 'react-redux';
import { orderConstant, CANCELLABLE_STATUSES } from '../../constant';
import moment from 'moment';

const cx = classNames.bind(styles);
const { TextArea } = Input;

const UserOrders = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { state } = location;
    const userRedux = useSelector((state) => state.user);

    // Lấy token và userId từ nhiều nguồn khác nhau, ưu tiên Redux store
    const getAuthData = () => {
        // Ưu tiên từ Redux store, sau đó location state, cuối cùng là localStorage
        const token = userRedux?.access_token || state?.access_token || localStorage.getItem('access_token');
        const userId = userRedux?.id || state?.id || localStorage.getItem('userId');

        // Đảm bảo token là string và hợp lệ
        let tokenString = null;
        
        if (typeof token === 'string' && token) {
            tokenString = token;
        } else if (token && typeof token === 'object') {
            // Nếu là object, có thể là lỗi state
            console.warn('Token is an object instead of string:', token);
            tokenString = localStorage.getItem('access_token');
        }
        
        // Kiểm tra token hợp lệ
        if (!tokenString) {
            console.log('No valid token found');
        } else {
            console.log('Token found, type:', typeof tokenString);
        }
        
        return { token: tokenString, userId };
    };

    const mutation = useMutationHook((data) => {
        const { id, token, reason } = data;
        return OrderService.cancelOrder(id, token, reason);
    });

    const fetchUserOrders = async () => {
        const { token, userId } = getAuthData();
        
        if (!token || !userId) {
            console.log('Missing token or userId');
            message.error('Vui lòng đăng nhập để xem đơn hàng');
            navigate('/sign-in');
            return { status: 'ERR', message: 'Chưa đăng nhập', data: [] };
        }
        
        try {
            console.log(`Fetching orders for user ${userId} with token type: ${typeof token}`);
            const response = await OrderService.getOrderByUserId(userId, token);
            console.log('Orders fetched:', response?.data?.length || 0);
            return response;
        } catch (error) {
            console.error("Lỗi khi lấy đơn hàng:", error);
            
            if (error.response?.status === 401) {
                console.log('Token hết hạn hoặc không hợp lệ');
                message.error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
                
                // Xóa token cũ
                localStorage.removeItem('access_token');
                localStorage.removeItem('userId');
                
                // Chuyển đến trang đăng nhập sau 1s để người dùng kịp đọc thông báo
                setTimeout(() => navigate('/sign-in'), 1000);
            }
            
            return { status: 'ERR', message: error.message, data: [] };
        }
    };

    // Đảm bảo queryKey thay đổi khi userId thay đổi để tự động refetch
    const { token, userId } = getAuthData();
    
    const queryOrders = useQuery({ 
        queryKey: ['orders', userId, !!token], 
        queryFn: fetchUserOrders,
        enabled: !!token && !!userId, // Chỉ gọi API khi có cả token và userId
        refetchOnWindowFocus: false, // Tránh refetch liên tục khi focus window
        retry: 1, // Chỉ retry 1 lần khi lỗi
        staleTime: 30000 // Cache trong 30 giây
    });
    
    const { isPending, data, isError, refetch } = queryOrders;

    const [selectedOrder, setSelectedOrder] = useState(null);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelOrderId, setCancelOrderId] = useState(null);
    const [cancelModalVisible, setCancelModalVisible] = useState(false);

    const handleShowOrderDetail = (orderId) => {
        const order = data?.data?.find((order) => order._id === orderId);
        if (order) {
            setSelectedOrder(order);
            setModalIsOpen(true);
        }
    };

    const { isSuccess: isSuccessCancel, isError: isErrorCancel, data: dataCancel } = mutation;

    // Kiểm tra đơn hàng có thể hủy không
    const canCancelOrder = (order) => {
        // Không thể hủy đơn đã giao, đã hủy hoặc đang vận chuyển
        if (!order) return false;
        
        // Nếu đơn hàng ở trạng thái có thể hủy
        return CANCELLABLE_STATUSES.includes(order.status) && !order.isCancelled;
    };

    const showCancelOrderModal = (order) => {
        if (canCancelOrder(order)) {
            setCancelOrderId(order._id);
            setCancelReason('');
            setCancelModalVisible(true);
        } else {
            let reason = 'Đơn hàng này không thể hủy.';
            
            if (order.status === 'shipped') {
                reason = 'Đơn hàng đang được vận chuyển, không thể hủy. Vui lòng liên hệ với chúng tôi để được hỗ trợ.';
            } else if (order.status === 'delivered') {
                reason = 'Đơn hàng đã được giao, không thể hủy.';
            } else if (order.status === 'cancelled') {
                reason = 'Đơn hàng đã bị hủy.';
            }
            
            Modal.info({
                title: 'Không thể hủy đơn hàng',
                content: reason,
            });
        }
    };

    const handleCancelOrder = () => {
        const { token } = getAuthData();
        
        if (!token || !cancelOrderId) {
            message.error('Vui lòng đăng nhập để hủy đơn hàng');
            return;
        }
        
        mutation.mutate(
            { 
                id: cancelOrderId, 
                token: token,
                reason: cancelReason || 'Khách hàng đổi ý' 
            },
            {
                onSuccess: () => {
                    setCancelModalVisible(false);
                    refetch(); // Gọi refetch để cập nhật danh sách đơn hàng
                },
                onError: (error) => {
                    console.error("Lỗi khi hủy đơn:", error);
                    message.error(error.response?.data?.message || 'Không thể hủy đơn hàng');
                    setCancelModalVisible(false);
                }
            },
        );
    };

    const closeModal = () => {
        setModalIsOpen(false);
        setSelectedOrder(null);
    };

    useEffect(() => {
        if (isSuccessCancel && dataCancel?.status === 'OK') {
            message.success('Hủy đơn hàng thành công!');
        } else if (isErrorCancel) {
            message.error(dataCancel?.message || 'Xảy ra lỗi khi hủy đơn hàng');
        }
    }, [isSuccessCancel, isErrorCancel, dataCancel]);

    // Thêm useEffect để tự động refetch khi token thay đổi
    useEffect(() => {
        if (token) {
            refetch();
        }
    }, [token, refetch]);

    // Hàm lấy tên trạng thái hiển thị
    const getStatusDisplay = (status) => {
        return orderConstant.status[status] || status;
    };
    
    // Hàm lấy màu cho trạng thái
    const getStatusClass = (status) => {
        if (status === 'cancelled') return 'cancelled-status';
        if (status === 'delivered' || status === 'completed') return 'success-status';
        if (status === 'shipped') return 'shipping-status';
        if (status === 'processing') return 'processing-status';
        return 'pending-status';
    };

    return (
        <Loading isLoading={isPending}>
            <div className={cx('wrapper')}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>Đơn hàng của tôi</h2>
                <Loading isLoading={mutation.isPending}>
                    <div className={cx('order-container')}>
                        {isError ? (
                            <div className={cx('error-message')}>
                                <p>Có lỗi xảy ra khi lấy đơn hàng. Vui lòng thử lại sau.</p>
                                <Button type="primary" onClick={() => refetch()}>Thử lại</Button>
                            </div>
                        ) : data?.data?.length > 0 ? (
                            data.data.map((order) => (
                                <div key={order?._id} className={cx('order-item')}>
                                    <div className={cx('order-product')} onClick={() => handleShowOrderDetail(order._id)}>
                                        <img 
                                            alt="" 
                                            src={order?.orderItems[0]?.image || ''} 
                                            onError={(e) => {e.target.src = 'https://via.placeholder.com/150'}}
                                        />
                                        <div className={cx('order-right')}>
                                            <span className={cx('product-name')}>{order.orderItems[0].name}</span>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span className={cx('product-price')}>
                                                    {order.orderItems[0].price.toLocaleString('vn-VN') + ' đ'}
                                                </span>
                                                <span>x {order.orderItems[0].amount}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={cx('order-info')}>
                                        {order.orderItems.length === 1 ? (
                                            <p className={cx('total-quantity')}>{order.orderItems.length} sản phẩm</p>
                                        ) : (
                                            <p className={cx('total-quantity')}>
                                                {order.orderItems.length - 1} sản phẩm khác
                                            </p>
                                        )}

                                        <p className={cx('total-price')}>
                                            Thành tiền: <span>{order.totalPrice.toLocaleString('vn-VN') + ' đ'}</span>
                                        </p>
                                    </div>
                                    <div className={cx('order-status')}>
                                        <p>Ngày đặt hàng: {moment(order.createdAt).format('DD/MM/YYYY')}</p>
                                        <p>
                                            Trạng thái: <span className={cx(getStatusClass(order.status))}>
                                                {getStatusDisplay(order.status)}
                                            </span>
                                        </p>
                                        <p>
                                            Thanh toán:{' '}
                                            {order.isPaid === true ? (
                                                <span className={cx('success-status')}>Đã thanh toán</span>
                                            ) : (
                                                <span className={cx('failure-status')}>Chưa thanh toán</span>
                                            )}
                                        </p>
                                        
                                        {order.status === 'cancelled' && order.cancelReason && (
                                            <p>
                                                <span className={cx('cancel-reason')}>
                                                    Lý do hủy: {order.cancelReason}
                                                </span>
                                            </p>
                                        )}
                                    </div>
                                    <div className={cx('order-button')}>
                                        {canCancelOrder(order) ? (
                                            <button onClick={() => showCancelOrderModal(order)} className={cx('cancel-button')}>
                                                Hủy đơn hàng
                                            </button>
                                        ) : (
                                            <button className={cx('disabled-button')} disabled>
                                                Hủy đơn hàng
                                            </button>
                                        )}

                                        <button onClick={() => handleShowOrderDetail(order._id)} className={cx('detail-button')}>
                                            Xem chi tiết
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <Empty description="Bạn chưa có đơn hàng nào" />
                        )}
                    </div>
                </Loading>

                {/* Modal chi tiết đơn hàng */}
                {selectedOrder && (
                    <Modal
                        title="Chi tiết đơn hàng"
                        open={modalIsOpen}
                        onCancel={closeModal}
                        footer={[
                            <Button key="close" onClick={closeModal}>
                                Đóng
                            </Button>,
                        ]}
                    >
                        <div className={cx('order-detail-info')}>
                            <div className={cx('order-detail-row')}>
                                <p>Mã đơn hàng: </p>
                                <span>{selectedOrder._id}</span>
                            </div>
                            <div className={cx('order-detail-row')}>
                                <p>Tên khách hàng:</p>
                                <span>{selectedOrder.shippingAddress.fullName}</span>
                            </div>
                            <div className={cx('order-detail-row')}>
                                <p>Ngày đặt hàng:</p>{' '}
                                <span>{moment(selectedOrder.createdAt).format('DD/MM/YYYY HH:mm')}</span>
                            </div>
                            <div className={cx('order-detail-row')}>
                                <p>Phương thức thanh toán:</p>
                                <span>
                                    {orderConstant.payment[selectedOrder.paymentMethod.toLowerCase()] || selectedOrder.paymentMethod}
                                </span>
                            </div>
                            <div className={cx('order-detail-row')}>
                                <p>Phí vận chuyển: </p>
                                <span>{selectedOrder.shippingPrice.toLocaleString('vn-VN')} đ</span>
                            </div>
                            <div className={cx('order-detail-row')}>
                                <p>Thành tiền: </p>
                                <span>{selectedOrder.totalPrice.toLocaleString('vn-VN')} đ</span>
                            </div>
                            <div className={cx('order-detail-row')}>
                                <p>Địa chỉ giao hàng:</p>
                                <span>{selectedOrder.shippingAddress.address}, {selectedOrder.shippingAddress.city}</span>
                            </div>
                            <div className={cx('order-detail-row')}>
                                <p>Số điện thoại:</p>
                                <span>{selectedOrder.shippingAddress.phone}</span>
                            </div>
                            <div className={cx('order-detail-row')}>
                                <p>Trạng thái:</p>
                                <span className={cx(getStatusClass(selectedOrder.status))}>
                                    {getStatusDisplay(selectedOrder.status)}
                                </span>
                            </div>
                            
                            {selectedOrder.status === 'cancelled' && (
                                <Alert
                                    message="Thông tin hủy đơn"
                                    description={
                                        <div>
                                            <p><strong>Lý do:</strong> {selectedOrder.cancelReason || 'Không có lý do'}</p>
                                            {selectedOrder.cancelledAt && (
                                                <p><strong>Thời gian hủy:</strong> {moment(selectedOrder.cancelledAt).format('DD/MM/YYYY HH:mm')}</p>
                                            )}
                                        </div>
                                    }
                                    type="warning"
                                    showIcon
                                    style={{ marginTop: '10px' }}
                                />
                            )}
                        </div>
                        <div className={cx('order-detail-product-wrapper')}>
                            <p>Danh sách sản phẩm:</p>
                            {selectedOrder.orderItems.map((item, index) => (
                                <div className={cx('order-detail-product')} key={index}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <img 
                                            alt="" 
                                            src={item.image} 
                                            onError={(e) => {e.target.src = 'https://via.placeholder.com/150'}}
                                        />
                                        <p>{item.name}</p>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <p>Giá: {item.price.toLocaleString('vn-VN')} đ</p>
                                        <p>Số lượng: {item.amount}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Modal>
                )}
                
                {/* Modal hủy đơn hàng */}
                <Modal
                    title="Hủy đơn hàng"
                    open={cancelModalVisible}
                    onCancel={() => setCancelModalVisible(false)}
                    onOk={handleCancelOrder}
                    okText="Xác nhận hủy"
                    cancelText="Đóng"
                    okButtonProps={{ danger: true }}
                >
                    <div>
                        <p>Bạn có chắc chắn muốn hủy đơn hàng này?</p>
                        <TextArea
                            placeholder="Vui lòng cho biết lý do hủy đơn hàng (không bắt buộc)"
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            rows={4}
                            style={{ marginTop: '10px' }}
                        />
                        <p style={{ marginTop: '10px', color: '#ff4d4f' }}>
                            Lưu ý: Bạn chỉ có thể hủy đơn hàng khi trạng thái đơn là "Chờ xác nhận" hoặc "Đã xác nhận" hoặc "Đang xử lý".
                        </p>
                    </div>
                </Modal>
            </div>
        </Loading>
    );
};

export default UserOrders;