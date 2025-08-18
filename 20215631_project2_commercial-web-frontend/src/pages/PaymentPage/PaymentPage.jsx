import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import classNames from 'classnames/bind';
import styles from './PaymentPage.module.scss';
import { Form, Radio } from 'antd';
import * as UserService from '../../services/UserService';
import * as OrderService from '../../services/OrderService';
import * as message from '../../components/Message/Message';

import ModalComponent from '../../components/ModalComponent/ModalComponent.jsx';
import InputComponent from '../../components/InputComponent/InputComponent.jsx';
// Đã xóa import AddForm để sửa warning 1
import { useMutationHook } from '../../hooks/useMutationHook.js';
import Loading from '../../components/LoadingComponent/Loading.jsx';
import { updateUser } from '../../redux/slices/userSlice.js';
import { useNavigate } from 'react-router-dom';
import { removeAllOrdersProduct } from '../../redux/slices/orderSlice.js';
import ProcessBar from '../../components/ProcessBar/ProcessBar.jsx';

const cx = classNames.bind(styles);

const PaymentPage = () => {
    const order = useSelector((state) => state.order);
    const user = useSelector((state) => state.user);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const processBarItems = [
        {
            title: 'Giỏ hàng',
            description: 'Giỏ hàng',
        },
        {
            title: 'Thanh toán',
            description: 'Thanh toán',
        },
        {
            title: 'Đặt hàng',
            description: 'Đặt hàng',
        },
    ];

    const [isOpenModalUpdateInfo, setIsOpenModalUpdateInfo] = useState(false);
    const [stateUserDetail, setStateUserDetail] = useState({
        name: '',
        phone: '',
        address: '',
        city: '',
    });
    const [deliveryMethodValue, setDeliveryMethodValue] = useState('fast');
    const [paymentMethodValue, setPaymentMethodValue] = useState('COD');
    

    const [form] = Form.useForm();

    const mutationUpdate = useMutationHook((data) => {
        const { id, access_token, ...rests } = data;
        const res = UserService.updateUser(id, { ...rests }, access_token);
        return res;
    });

    const mutationAddOrder = useMutationHook((data) => {
        const { access_token, ...rests } = data;
        const res = OrderService.createOrder({ ...rests }, access_token);
        return res;
    });

    // Đã xóa isLoadingAddOrder để sửa warning 2
    const { data: dataAddOrder, isSuccess, isError } = mutationAddOrder;

    // Chuyển các useMemo lên trước để sửa warning 3
    const priceMemo = useMemo(() => {
        const result = order?.selectedOrderItems?.reduce((total, cur) => {
            return total + (cur.price - (cur.price * cur.discount) / 100) * cur.amount;
        }, 0);
        return result || 0;
    }, [order]);

    const deliveryMemo = useMemo(() => {
        if (!priceMemo || priceMemo === 0) return 0;
        if (priceMemo > 100000) {
            return 30000;
        } else {
            return 15000;
        }
    }, [priceMemo]);

    const totalPriceMemo = useMemo(() => {
        return (priceMemo || 0) + (deliveryMemo || 0);
    }, [priceMemo, deliveryMemo]);

    useEffect(() => {
        if (isOpenModalUpdateInfo) {
            setStateUserDetail({
                city: user?.city || '',
                name: user?.name || '',
                address: user?.address || '',
                phone: user?.phone || '',
            });
        }
    }, [isOpenModalUpdateInfo, user]);

    useEffect(() => {
        if (isOpenModalUpdateInfo) {
            form.setFieldsValue(stateUserDetail);
        }
    }, [form, stateUserDetail, isOpenModalUpdateInfo]);

    useEffect(() => {
        if (isSuccess && dataAddOrder?.status === 'OK') {
            const orderIds = [];
            order?.selectedOrderItems?.forEach((item) => {
                orderIds.push(item.product);
            });
            dispatch(removeAllOrdersProduct({ listChecked: orderIds }));
            message.success('Đặt hàng thành công');

            navigate('/order-success', {
                state: {
                    deliveryMethodValue,
                    paymentMethodValue,
                    orders: order?.selectedOrderItems,
                    totalPrice: totalPriceMemo,
                },
            });
        } else if (isError) {
            message.error('Đặt hàng thất bại');
        }
    }, [isSuccess, isError, dataAddOrder, dispatch, navigate, order, deliveryMethodValue, paymentMethodValue, totalPriceMemo]);

    const handleCancelUpdate = () => {
        setStateUserDetail({
            name: '',
            address: '',
            phone: '',
            city: '',
        });
        form.resetFields();
        setIsOpenModalUpdateInfo(false);
    };

    const handleAddOrder = async () => {
        // Kiểm tra dữ liệu đầu vào
        if (!user?.access_token) {
            message.error('Bạn cần đăng nhập để đặt hàng');
            return;
        }
        
        if (!order?.selectedOrderItems?.length) {
            message.error('Giỏ hàng trống, vui lòng thêm sản phẩm');
            return;
        }
        
        if (!user?.name || !user?.address || !user?.phone || !user?.city) {
            message.error('Vui lòng cung cấp đầy đủ thông tin giao hàng');
            return;
        }

        try {
            console.log('Bắt đầu quá trình đặt hàng...');
            
            // Chuẩn bị dữ liệu đơn hàng
            const orderData = {
                orderItems: order?.selectedOrderItems,
                fullName: user?.name,
                address: user?.address,
                phone: user?.phone,
                city: user?.city,
                paymentMethod: paymentMethodValue || 'COD',
                itemsPrice: priceMemo || 0,
                shippingPrice: deliveryMemo || 0,
                totalPrice: totalPriceMemo || 0,
                user: user.id
            };

            console.log('Dữ liệu đơn hàng:', JSON.stringify(orderData, null, 2));
            
            // Tạo fetch request
            console.log('Gửi request đến API...');
            
            // Thử API thủ công trước để kiểm tra kết nối
            try {
                console.log('Kiểm tra kết nối API...');
                // Sửa warning 4 bằng cách sử dụng kết quả
                await fetch('http://localhost:3001/api', { 
                    method: 'HEAD',
                    mode: 'no-cors'
                });
                console.log('Kết nối API OK');
            } catch (pingError) {
                console.error('Không thể kết nối đến server:', pingError);
                message.error('Không thể kết nối đến server. Vui lòng thử lại sau.');
                return;
            }
            
            // Gọi API chính
            const response = await fetch('http://localhost:3001/api/order/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.access_token}`
                },
                body: JSON.stringify(orderData)
            });
            
            console.log('Nhận response:', response.status, response.statusText);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Lỗi HTTP: ${response.status} - ${errorText}`);
            }
            
            const data = await response.json();
            console.log('Kết quả từ API:', data);
            
            // Xử lý kết quả
            if (data.status === 'OK') {
                message.success('Đặt hàng thành công');
                
                // Xóa sản phẩm đã đặt khỏi giỏ hàng
                const orderIds = [];
                order?.selectedOrderItems?.forEach((item) => {
                    orderIds.push(item.product);
                });
                dispatch(removeAllOrdersProduct({ listChecked: orderIds }));
                
                // Chuyển đến trang đặt hàng thành công
                navigate('/order-success', {
                    state: {
                        deliveryMethodValue,
                        paymentMethodValue,
                        orders: order?.selectedOrderItems,
                        totalPrice: totalPriceMemo,
                    }
                });
            } else {
                message.error(typeof data.message === 'string' ? data.message : 'Đặt hàng thất bại');
            }
        } catch (error) {
            console.error("Chi tiết lỗi khi đặt hàng:", error);
            message.error('Có lỗi xảy ra khi đặt hàng: ' + error.message);
            
            // Thử sử dụng Axios hoặc XMLHttpRequest
            try {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', 'http://localhost:3001/api/order/create', true);
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.setRequestHeader('Authorization', `Bearer ${user?.access_token}`);
                xhr.onload = function() {
                    console.log('XHR response:', xhr.status, xhr.responseText);
                };
                xhr.onerror = function() {
                    console.error('XHR error');
                };
                xhr.send(JSON.stringify({
                    orderItems: order?.selectedOrderItems,
                    fullName: user?.name,
                    address: user?.address,
                    phone: user?.phone,
                    city: user?.city,
                    paymentMethod: paymentMethodValue || 'COD',
                    itemsPrice: priceMemo || 0,
                    shippingPrice: deliveryMemo || 0,
                    totalPrice: totalPriceMemo || 0,
                    user: user.id
                }));
            } catch (xhrError) {
                console.error('XHR cũng lỗi:', xhrError);
            }
        }
    };

    const handleUpdateInfoUser = () => {
        const { name, address, phone, city } = stateUserDetail;
        if (name && address && phone && city) {
            mutationUpdate.mutate(
                { id: user?.id, access_token: user?.access_token, ...stateUserDetail },
                {
                    onSuccess: () => {
                        dispatch(updateUser({ name, address, phone, city }));
                        setIsOpenModalUpdateInfo(false);
                    },
                },
            );
        }
    };

    const handleChangeAddress = () => {
        setIsOpenModalUpdateInfo(true);
    };

    const handleChangeDeliveryMethod = (e) => {
        setDeliveryMethodValue(e.target.value);
    };

    const handleChangePaymentMethod = (e) => {
        setPaymentMethodValue(e.target.value);
    };

    const handleOnChangeDetail = (e) => {
        setStateUserDetail({
            ...stateUserDetail,
            [e.target.name]: e.target.value,
        });
    };

    return (
        <div className={cx('wrapper')}>
            <div className={cx('process')}>
                <ProcessBar current={1} items={processBarItems} />
            </div>
            <h2 className={cx('title')}>Thanh toán</h2>
            <Loading isLoading={mutationAddOrder.isPending}>
                <div className={cx('container')}>
                    <div className={cx('left')}>
                        <div className={cx('delivery-method')}>
                            <h3>Chọn phương thức giao hàng</h3>
                            <div className={cx('delivery-options-wrapper')}>
                                <Radio.Group
                                    className={cx('delivery-options')}
                                    onChange={handleChangeDeliveryMethod}
                                    value={deliveryMethodValue}
                                >
                                    <Radio value={'fast'}>
                                        <span style={{ color: '#ea8500', fontWeight: 'bold', marginRight: '12px' }}>
                                            FAST
                                        </span>
                                        Giao hàng tiết kiệm
                                    </Radio>
                                    <Radio value={'gojek'}>
                                        <span style={{ color: '#ea8500', fontWeight: 'bold', marginRight: '12px' }}>
                                            GO_JEK
                                        </span>
                                        Giao hàng nhanh
                                    </Radio>
                                </Radio.Group>
                            </div>
                        </div>
                        <div className={cx('payment-method')}>
                            <h3>Chọn phương thức thanh toán</h3>
                            <div className={cx('payment-options-wrapper')}>
                                <Radio.Group
                                    className={cx('payment-options')}
                                    onChange={handleChangePaymentMethod}
                                    value={paymentMethodValue}
                                >
                                    <Radio value={'COD'}>Thanh toán khi nhận hàng</Radio>
                                    <Radio value={'VNPAY'}>Thanh toán bằng VNPAY</Radio>
                                </Radio.Group>
                            </div>
                        </div>
                    </div>

                    <div className={cx('right')}>
                        <div className={cx('cart-address-wrapper')}>
                            <div className={cx('right-row')}>
                                <div className={cx('address')}>
                                    <p>Giao đến:</p>
                                    <span>{user?.address || 'Chưa có địa chỉ'}</span>
                                </div>
                                <span className={cx('change-address')} onClick={handleChangeAddress}>
                                    Thay đổi
                                </span>
                            </div>
                        </div>
                        <div className={cx('right-row')}>
                            <p>Tạm tính</p>
                            <span>{(priceMemo || 0).toLocaleString('vn-VN') + ' đ'}</span>
                        </div>
                        <div className={cx('right-row')}>
                            <p>Phí vận chuyển</p>
                            <span>{(deliveryMemo || 0).toLocaleString('vn-VN') + ' đ'}</span>
                        </div>

                        <div className={cx('total-price')}>
                            <p>Tổng tiền</p>
                            <span>{(totalPriceMemo || 0).toLocaleString('vn-VN') + ' đ'}</span>
                        </div>

                        <div className={cx('buy-button')}>
                            <button onClick={handleAddOrder}>Đặt hàng</button>
                        </div>
                    </div>
                </div>

                <ModalComponent
                    title="Cập nhật thông tin giao hàng"
                    open={isOpenModalUpdateInfo}
                    onCancel={handleCancelUpdate}
                    onOk={handleUpdateInfoUser}
                >
                    <Loading isLoading={mutationUpdate.isPending}>
                        <Form
                            name="basic"
                            labelCol={{ span: 6 }}
                            wrapperCol={{ span: 18 }}
                            style={{ maxWidth: 600 }}
                            initialValues={{ remember: true }}
                            autoComplete="on"
                            form={form}
                        >
                            <Form.Item
                                label="Tên khách hàng"
                                name="name"
                                rules={[{ required: true, message: 'Vui lòng nhập tên khách hàng!' }]}
                            >
                                <InputComponent
                                    value={stateUserDetail.name}
                                    onChange={handleOnChangeDetail}
                                    name="name"
                                />
                            </Form.Item>

                            <Form.Item
                                label="City"
                                name="city"
                                rules={[{ required: true, message: 'Vui lòng nhập thành phố!' }]}
                            >
                                <InputComponent
                                    value={stateUserDetail.city}
                                    onChange={handleOnChangeDetail}
                                    name="city"
                                />
                            </Form.Item>

                            <Form.Item
                                label="Số điện thoại"
                                name="phone"
                                rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }]}
                            >
                                <InputComponent
                                    value={stateUserDetail.phone}
                                    onChange={handleOnChangeDetail}
                                    name="phone"
                                />
                            </Form.Item>

                            <Form.Item
                                label="Địa chỉ"
                                name="address"
                                rules={[{ required: true, message: 'Vui lòng nhập địa chỉ!' }]}
                            >
                                <InputComponent
                                    value={stateUserDetail.address}
                                    onChange={handleOnChangeDetail}
                                    name="address"
                                />
                            </Form.Item>
                        </Form>
                    </Loading>
                </ModalComponent>
            </Loading>
        </div>
    );
};

export default PaymentPage;