import React from 'react';
import classNames from 'classnames/bind';
import styles from './OrderSuccessPage.module.scss';
import { useLocation, useNavigate } from 'react-router-dom';
import { orderConstant } from '../../constant.js';
import ProcessBar from '../../components/ProcessBar/ProcessBar.jsx';

const cx = classNames.bind(styles);

const OrderSuccessPage = () => {
    const location = useLocation();
    const { state } = location;
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

    return (
        <div className={cx('wrapper')}>
            <div className={cx('process')}>
                <ProcessBar current={2} items={processBarItems} />
            </div>
            <h2 className={cx('title')}>Đặt hàng thành công!</h2>
            <div className={cx('container')}>
                <div className={cx('top')}>
                    <div className={cx('delivery-method')}>
                        <h3>Phương thức giao hàng: </h3>
                        <div className={cx('delivery-options-wrapper')}>
                            <span style={{ color: '#ea8500', fontWeight: 'bold', marginRight: '12px' }}>
                                {orderConstant.delivery[state?.deliveryMethodValue]}
                            </span>
                            Giao hàng tiết kiệm
                        </div>
                    </div>
                    <div className={cx('payment-method')}>
                        <h3>Phương thức thanh toán: </h3>
                        <div className={cx('payment-options-wrapper')}>
                            {orderConstant.payment[state?.paymentMethodValue]}
                        </div>
                    </div>
                </div>

                <h2 style={{ fontSize: '1.6rem', fontWeight: 'bold', margin: '50px 0 12px 0' }}>Danh sách sản phẩm</h2>

                <div className={cx('bottom')}>
                    <div className={cx('cart-header')}>
                        <div className={cx('cart-header-label')}>Sản phẩm</div>
                        <div className={cx('cart-header-label')}>Đơn giá</div>
                        <div className={cx('cart-header-label')}>Số lượng</div>
                        <div className={cx('cart-header-label')}>Thành tiền</div>
                        <div></div>
                    </div>
                    <div className={cx('cart-body')}>
                        {state.orders?.map((item) => (
                            <div className={cx('cart-item')} key={item.product}>
                                <div className={cx('cart-item-image')}>
                                    <img src={item.image} alt="product-small" />
                                </div>
                                <div className={cx('cart-item-name')}>{item.name}</div>
                                <div className={cx('cart-item-price')}>{item.price.toLocaleString('vn-VN') + ' đ'}</div>
                                <div className={cx('cart-item-quantity')}>{item?.amount}</div>
                                <div className={cx('cart-item-total')}>
                                    {(item.price * item.amount).toLocaleString('vn-VN') + ' đ'}
                                </div>
                            </div>
                        ))}
                        <div className={cx('total-price')}>
                            <span>Tổng tiền: </span>
                            {state.totalPrice.toLocaleString('vn-VN') + ' đ'}
                        </div>
                    </div>
                </div>

                <button className={cx('return-home')} onClick={() => navigate('/')}>
                    Trở về trang chủ
                </button>
            </div>
        </div>
    );
};

export default OrderSuccessPage;
