import React, { useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import styles from './UserOrders.module.scss';
import { useQuery } from '@tanstack/react-query';
import * as OrderService from '../../services/OrderService';
import Loading from '../../components/LoadingComponent/Loading';
import { useLocation } from 'react-router-dom';
import { Modal, Button } from 'antd';
import * as message from '../../components/Message/Message';
import { useMutationHook } from '../../hooks/useMutationHook';

const cx = classNames.bind(styles);

const UserOrders = () => {
    const location = useLocation();
    const { state } = location;

    const mutation = useMutationHook((data) => {
        const { id, token, orderItems } = data;
        const res = OrderService.cancelOrder(id, token, orderItems);
        return res;
    });

    const fetchUserOrders = async () => await OrderService.getOrderByUserId(state?.id, state?.access_token);
    const queryOrders = useQuery({ queryKey: ['users'], queryFn: fetchUserOrders });
    const { isPending, data } = queryOrders;

    const [selectedOrder, setSelectedOrder] = useState(null);
    const [modalIsOpen, setModalIsOpen] = useState(false);

    const handleShowOrderDetail = (orderId) => {
        const order = data?.data?.find((order) => order._id === orderId);
        setSelectedOrder(order);
        setModalIsOpen(true);
    };

    const { isSuccess: isSuccessCancel, isError: isErrorCancel, data: dataCancel } = mutation;

    const handleCancelOrder = (order) => {
        mutation.mutate(
            { id: order?._id, token: state?.token, orderItems: order?.orderItems },
            {
                onSettled: () => {
                    queryOrders.refetch();
                },
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
            message.error('Xảy ra lỗi');
        }
    }, [isSuccessCancel, isErrorCancel]);

    return (
        <Loading isLoading={isPending}>
            <div className={cx('wrapper')}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>Đơn hàng của tôi</h2>
                <Loading isLoading={mutation.isPending}>
                    <div className={cx('order-container')}>
                        {data?.data?.map((order) => (
                            <div key={order?._id} className={cx('order-item')}>
                                <div className={cx('order-product')} onClick={() => handleShowOrderDetail(order._id)}>
                                    <img alt="" src={order?.orderItems[0]?.image ? order?.orderItems[0]?.image : ''} />
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
                                    <p>Ngày đặt hàng: {new Date(order.createdAt).toLocaleDateString()}</p>
                                    <p>
                                        Giao hàng:{' '}
                                        {order.isDelivered === true ? (
                                            <span className={cx('success-status')}>Đã giao hàng</span>
                                        ) : (
                                            <span className={cx('failure-status')}>Chưa giao hàng</span>
                                        )}
                                    </p>
                                    <p>
                                        Thanh toán:{' '}
                                        {order.isPaid === true ? (
                                            <span className={cx('success-status')}>Đã thanh toán</span>
                                        ) : (
                                            <span className={cx('failure-status')}>Chưa thanh toán</span>
                                        )}
                                    </p>
                                </div>
                                <div className={cx('order-button')}>
                                    {order.isDelivered && order.isPaid ? (
                                        <button className={cx('disabled-button')}>Hủy đơn hàng</button>
                                    ) : (
                                        <button onClick={() => handleCancelOrder(order)}>Hủy đơn hàng</button>
                                    )}

                                    <button onClick={() => handleShowOrderDetail(order._id)}>Xem chi tiết</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Loading>

                {selectedOrder && (
                    <Modal
                        title="Chi tiết đơn hàng"
                        visible={modalIsOpen}
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
                                <span>{new Date(selectedOrder.createdAt).toLocaleDateString()}</span>
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
                                <span>{selectedOrder.shippingAddress.address}</span>
                            </div>
                        </div>
                        <div className={cx('order-detail-product-wrapper')}>
                            <p>Danh sách sản phẩm:</p>
                            {selectedOrder.orderItems.map((item) => (
                                <div className={cx('order-detail-product')} key={item._id}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <img alt="" src={item.image} />
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
            </div>
        </Loading>
    );
};

export default UserOrders;
