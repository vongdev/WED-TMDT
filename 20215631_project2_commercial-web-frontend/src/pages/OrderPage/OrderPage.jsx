import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import classNames from 'classnames/bind';
import styles from './OrderPage.module.scss';
import { Checkbox, Form, Steps } from 'antd';
import { DeleteOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { WrapperInputNumber } from './style.js';
import ButtonComponent from '../../components/ButtonComponent/ButtonComponent';
import {
    decreaseAmount,
    increaseAmount,
    removeAllOrdersProduct,
    removeOrderProduct,
    selectedOrder,
} from '../../redux/slices/orderSlice.js';
import * as UserService from '../../services/UserService';
import * as message from '../../components/Message/Message';

import ModalComponent from '../../components/ModalComponent/ModalComponent.jsx';
import InputComponent from '../../components/InputComponent/InputComponent.jsx';
import { AddForm } from '../../components/AdminProduct/style.js';
import { useMutationHook } from '../../hooks/useMutationHook.js';
import Loading from '../../components/LoadingComponent/Loading.jsx';
import { updateUser } from '../../redux/slices/userSlice.js';
import { useNavigate } from 'react-router-dom';
import ProcessBar from '../../components/ProcessBar/ProcessBar.jsx';

const cx = classNames.bind(styles);

const OrderPage = () => {
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
            // subTitle: 'Left 00:00:08',
        },
        {
            title: 'Đặt hàng',
            description: 'Đặt hàng',
        },
    ];

    const [listChecked, setListChecked] = useState([]);
    const [isOpenModalUpdateInfo, setIsOpenModalUpdateInfo] = useState(false);
    const [stateUserDetail, setStateUserDetail] = useState({
        name: '',
        phone: '',
        address: '',
        city: '',
    });

    const [form] = Form.useForm();

    const mutationUpdate = useMutationHook((data) => {
        const { id, access_token, ...rests } = data;
        const res = UserService.updateUser(id, access_token, { ...rests });
        return res;
    });

    const handleOnChangeCheckAll = (e) => {
        if (e.target.checked === true) {
            const newListChecked = [];
            order?.orderItems?.forEach((item) => {
                newListChecked.push(item?.product);
            });
            setListChecked(newListChecked);
        } else {
            setListChecked([]);
        }
    };

    useEffect(() => {
        dispatch(selectedOrder({ listChecked }));
    }, [listChecked]);

    useEffect(() => {
        if (isOpenModalUpdateInfo) {
            setStateUserDetail({
                city: user?.city,
                name: user?.name,
                address: user?.address,
                phone: user?.phone,
            });
        }
    }, [isOpenModalUpdateInfo]);

    useEffect(() => {
        form.setFieldsValue(stateUserDetail);
    }, [form, stateUserDetail]);

    const handleOnChangeCheckbox = (e) => {
        if (listChecked.includes(e.target.value)) {
            const newListChecked = listChecked.filter((item) => item !== e.target.value);
            setListChecked(newListChecked);
        } else {
            setListChecked([...listChecked, e.target.value]);
        }
    };

    const handleQuantity = (type, idProduct) => {
        if (type === 'increase') {
            dispatch(increaseAmount({ idProduct }));
        } else {
            dispatch(decreaseAmount({ idProduct }));
        }
    };

    const handleRemoveProduct = (idProduct) => {
        dispatch(removeOrderProduct({ idProduct }));
    };

    const handleRemoveAllProduct = () => {
        if (listChecked.length >= 1) {
            dispatch(removeAllOrdersProduct({ listChecked }));
        }
    };

    const handleBuying = () => {
        if (!order.selectedOrderItems.length) {
            message.error('Vui lòng chọn sản phẩm!');
        } else if (!user.phone || !user.address || !user.name || !user.city) {
            setIsOpenModalUpdateInfo(true);
        } else {
            navigate('/payment');
        }
    };

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

    const priceMemo = useMemo(() => {
        const result = order?.selectedOrderItems?.reduce((total, cur) => {
            return total + (cur.price - (cur.price * cur.discount) / 100) * cur.amount;
        }, 0);
        return result;
    }, [order]);

    const priceDiscountMemo = useMemo(() => {
        const result = order?.selectedOrderItems?.reduce((total, cur) => {
            return total + cur.discount * cur.amount;
        }, 0);
        return Number(result) ? result : 0;
    }, [order]);

    const deliveryMemo = useMemo(() => {
        if (priceMemo === 0) return 0;
        if (priceMemo > 100000) {
            return 30000;
        } else {
            return 15000;
        }
    }, [priceMemo]);

    const totalPriceMemo = useMemo(() => {
        return priceMemo + deliveryMemo;
    }, [priceMemo, deliveryMemo]);

    const handleOnChangeDetail = (e) => {
        setStateUserDetail({
            ...stateUserDetail,
            [e.target.name]: e.target.value,
        });
    };

    return (
        <div className={cx('wrapper')}>
            <div className={cx('process')}>
                <ProcessBar current={0} items={processBarItems} />
            </div>
            <h2 className={cx('title')}>Giỏ hàng</h2>
            <div className={cx('container')}>
                <div className={cx('left')}>
                    <div className={cx('cart-body-top')}>
                        <div className={cx('cart-body-selectAll')}>
                            <Checkbox
                                onChange={handleOnChangeCheckAll}
                                checked={listChecked.length === order?.orderItems.length}
                            >
                                <p>Chọn tất cả</p>
                            </Checkbox>
                        </div>

                        <div className={cx('cart-body-deleteAll')} onClick={() => handleRemoveAllProduct()}>
                            <span>Xóa tất cả</span>
                            <DeleteOutlined />
                        </div>
                    </div>
                    <div className={cx('cart-header')}>
                        <div className={cx('cart-header-label')}>Sản phẩm</div>
                        <div className={cx('cart-header-label')}>Đơn giá</div>
                        <div className={cx('cart-header-label')}>Số lượng</div>
                        <div className={cx('cart-header-label')}>Giảm giá</div>
                        <div className={cx('cart-header-label')}>Thành tiền</div>
                        <div></div>
                    </div>

                    <div className={cx('cart-body')}>
                        {order?.orderItems?.length > 0 ? (
                            order.orderItems.map((item) => (
                                <div className={cx('cart-item')} key={item.product}>
                                    <Checkbox
                                        style={{ width: '100%' }}
                                        onChange={handleOnChangeCheckbox}
                                        value={item.product}
                                        checked={listChecked.includes(item.product)}
                                    ></Checkbox>

                                    <div className={cx('cart-item-image')}>
                                        <img src={item.image} alt="product-small" />
                                    </div>
                                    <div className={cx('cart-item-name')}>{item.name}</div>
                                    <div className={cx('cart-item-price')}>
                                        {item.price.toLocaleString('vi-VN') + ' đ'}
                                    </div>
                                    <div className={cx('cart-item-quantity')}>
                                        <ButtonComponent
                                            style={{ width: '30px', height: '30px' }}
                                            icon={<MinusOutlined />}
                                            size="small"
                                            onClick={() => handleQuantity('decrease', item.product)}
                                        />
                                        <WrapperInputNumber readOnly min={1} max={99} value={item?.amount} />
                                        <ButtonComponent
                                            style={{ width: '30px', height: '30px' }}
                                            icon={<PlusOutlined />}
                                            size="small"
                                            onClick={() => handleQuantity('increase', item.product)}
                                        />
                                    </div>
                                    <div className={cx('cart-item-total')}>
                                        {item.discount ? item.discount + '%' : 0}
                                    </div>
                                    <div className={cx('cart-item-total')}>
                                        {(
                                            (item.price - (item.price * item.discount) / 100) *
                                            item.amount
                                        ).toLocaleString('vn-VN') + ' đ'}
                                    </div>

                                    <div className={cx('cart-item-delete')}>
                                        <DeleteOutlined
                                            style={{ color: 'red' }}
                                            onClick={() => handleRemoveProduct(item.product)}
                                        />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className={cx('cart-empty')}>Giỏ hàng trống</div>
                        )}
                    </div>
                </div>

                <div className={cx('right')}>
                    <div className={cx('cart-address-wrapper')}>
                        <div className={cx('right-row')}>
                            <div className={cx('address')}>
                                <p>Giao đến:</p>
                                <span>{user?.address}</span>
                            </div>
                            <span className={cx('change-address')} onClick={handleChangeAddress}>
                                Thay đổi
                            </span>
                        </div>
                    </div>
                    <div className={cx('right-row')}>
                        <p>Tạm tính</p>
                        <span>{priceMemo.toLocaleString('vn-VN') + ' đ'}</span>
                    </div>

                    <div className={cx('right-row')}>
                        <p>Phí vận chuyển</p>
                        <span>{deliveryMemo.toLocaleString('vn-VN') + ' đ'}</span>
                    </div>

                    <div className={cx('total-price')}>
                        <p>Tổng tiền</p>
                        <span>{totalPriceMemo.toLocaleString('vn-VN') + ' đ'}</span>
                    </div>

                    <div className={cx('buy-button')}>
                        <button onClick={() => handleBuying()}>Mua hàng</button>
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
                    <AddForm
                        name="basic"
                        labelCol={{
                            span: 6,
                        }}
                        wrapperCol={{
                            span: 18,
                        }}
                        style={{
                            maxWidth: 600,
                        }}
                        initialValues={{
                            remember: true,
                        }}
                        // onFinish={onUpdateUser}
                        autoComplete="on"
                        form={form}
                    >
                        <Form.Item
                            label="Tên khách hàng"
                            name="name"
                            rules={[
                                {
                                    required: true,
                                    message: 'Vui lòng nhập tên khách hàng!',
                                },
                            ]}
                        >
                            <InputComponent value={stateUserDetail.name} onChange={handleOnChangeDetail} name="name" />
                        </Form.Item>

                        <Form.Item
                            label="City"
                            name="city"
                            rules={[
                                {
                                    required: true,
                                    message: 'Vui lòng nhập thành phố!',
                                },
                            ]}
                        >
                            <InputComponent value={stateUserDetail.city} onChange={handleOnChangeDetail} name="city" />
                        </Form.Item>

                        <Form.Item
                            label="Số điện thoại"
                            name="phone"
                            rules={[
                                {
                                    required: true,
                                    message: 'Vui lòng nhập số điện thoại!',
                                },
                            ]}
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
                            rules={[
                                {
                                    required: true,
                                    // message: 'Vui lòng nhập giá sản phẩm!',
                                },
                            ]}
                        >
                            <InputComponent
                                value={stateUserDetail.address}
                                onChange={handleOnChangeDetail}
                                name="address"
                            />
                        </Form.Item>
                    </AddForm>
                </Loading>
            </ModalComponent>
        </div>
    );
};

export default OrderPage;
