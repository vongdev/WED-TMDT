import { Badge, Col, Popover, Row } from 'antd';
import className from 'classnames/bind';
import styles from './HeaderComponent.module.scss';
import { UserOutlined, CaretDownOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import ButtonInputSearch from '../ButtonInputSearch/ButtonInputSearch';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import * as UserService from '../../services/UserService';
import { resetUser } from '../../redux/slices/userSlice';
import { useEffect, useState } from 'react';
import Loading from '../LoadingComponent/Loading';
import { searchProduct } from '../../redux/slices/productSlice';
import * as message from '../../components/Message/Message';

const cx = className.bind(styles);

const HeaderComponent = ({ isHiddenCart = false, isHiddenSearch = false }) => {
    const navigate = useNavigate();
    const user = useSelector((state) => state.user);
    const order = useSelector((state) => state.order);

    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [isOpenPopup, setIsOpenPopup] = useState(false);

    const handleNavigateLogin = () => {
        navigate('/sign-in');
    };

    const handleLogout = async () => {
        setLoading(true);
        await UserService.logoutUser();
        localStorage.clear();
        dispatch(resetUser());
        setLoading(false);
        message.success('Đăng xuất thành công !');
        navigate('/');
    };

    const handleClickPopupItem = (type) => {
        if (type === 'profile') {
            navigate('/profile-user');
        } else if (type === 'admin') {
            navigate('/system/admin');
        } else if (type === 'orders') {
            navigate('/user-orders', {
                state: {
                    id: user?.id,
                    token: user?.access_token,
                },
            });
        }

        setIsOpenPopup(false);
    };

    useEffect(() => {
        setLoading(true);
        setLoading(false);
    }, [user?.name, user?.avatar]);

    const userMenu = (
        <div className={cx('user-menu')}>
            <p className={cx('user-menu-item')} onClick={() => handleClickPopupItem('profile')}>
                Thông tin người dùng
            </p>
            {user?.isAdmin && (
                <p className={cx('user-menu-item')} onClick={() => handleClickPopupItem('admin')}>
                    Quản lý hệ thống
                </p>
            )}
            <p className={cx('user-menu-item')} onClick={() => handleClickPopupItem('orders')}>
                Đơn hàng của tôi
            </p>
            <p className={cx('user-menu-item')} onClick={handleLogout}>
                Đăng xuất
            </p>
        </div>
    );

    const onChangeSearchInput = (e) => {
        setSearch(e.target.value);
        dispatch(searchProduct(e.target.value));
    };

    return (
        <div>
            <Row className={cx('wrapper')}>
                <Col className={cx('logo')} span={3} onClick={() => navigate('/')}>
                    LOGO
                </Col>
                {!isHiddenSearch && (
                    <Col span={12}>
                        <ButtonInputSearch
                            size="large"
                            placeholder="Tìm kiếm sản phẩm..."
                            textButton="Tìm kiếm"
                            onChange={onChangeSearchInput}
                        />
                    </Col>
                )}
                <Col span={6} className={cx('header-right')}>
                    <Loading isLoading={loading}>
                        <div className={cx('account-wrapper')}>
                            {user?.avatar ? (
                                <img className={cx('header-avatar')} src={user?.avatar} alt="avatar" />
                            ) : (
                                <UserOutlined className={cx('user-icon')} />
                            )}
                            {user?.access_token ? (
                                <Popover content={userMenu} trigger="click" open={isOpenPopup}>
                                    <span className={cx('user-name')} onClick={() => setIsOpenPopup((prev) => !prev)}>
                                        {user.name ? user.name : user.email}
                                    </span>
                                </Popover>
                            ) : (
                                <div className={cx('text-wrapper')} onClick={handleNavigateLogin}>
                                    <span>Đăng nhập / Đăng ký</span>
                                </div>
                            )}
                        </div>
                    </Loading>

                    {!isHiddenCart && (
                        <div className={cx('cart-wrapper')} onClick={() => navigate('/order')}>
                            <Badge count={order?.orderItems.length} size="small">
                                <ShoppingCartOutlined className={cx('cart-icon')} />
                            </Badge>
                            <span>Giỏ hàng</span>
                        </div>
                    )}
                </Col>
            </Row>
        </div>
    );
};

export default HeaderComponent;
