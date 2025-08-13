import NavbarComponent from '../../components/NavbarComponent/NavbarComponent';
import classNames from 'classnames/bind';
import styles from './TypeProductPage.module.scss';
import images from '../../assets/images';
import CardComponent from '../../components/CartComponent/CartComponent';
import { Pagination } from 'antd';
import { useLocation } from 'react-router-dom';
import * as ProductService from '../../services/ProductService';
import { useEffect, useState } from 'react';
import Loading from '../../components/LoadingComponent/Loading';
import { useSelector } from 'react-redux';
import { useDebounce } from '../../hooks/useDebounce';

const cx = classNames.bind(styles);

const TypeProductPage = () => {
    const { state } = useLocation();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [panigate, setPanigate] = useState({
        page: 0,
        limit: 4,
        total: 1,
    });
    const searchProductValue = useSelector((state) => state?.product?.search);
    const searchDebounce = useDebounce(searchProductValue, 500);

    const fetchProductType = async (type, page, limit) => {
        setLoading(true);
        const res = await ProductService.getProductType(type, page, limit);
        if (res?.status === 'OK') {
            setProducts(res?.data);
            setPanigate({ ...panigate, total: res?.total });
        } else {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (state) {
            fetchProductType(state, panigate.page, panigate.limit);
        }
    }, [state, panigate.page, panigate.limit]);

    const onChangePagination = (current, pageSize) => {
        setPanigate({
            ...panigate,
            page: current - 1,
            limit: pageSize,
        });
    };

    return (
        <Loading isLoading={!loading}>
            <div className={cx('wrapper')}>
                <NavbarComponent />
                <div className={cx('product-container')}>
                    <div className={cx('products')}>
                        {products
                            ?.filter((pro) => {
                                if (searchDebounce === '') {
                                    return pro;
                                } else if (pro?.name.toLowerCase().includes(searchDebounce.toLowerCase())) {
                                    return pro;
                                } else {
                                    return null;
                                }
                            })
                            .map((product) => {
                                return (
                                    <CardComponent
                                        key={product._id}
                                        id={product._id}
                                        countInStock={product.countInStock}
                                        description={product.description}
                                        image={product.image}
                                        name={product.name}
                                        price={product.price}
                                        rating={product.rating}
                                        type={product.type}
                                        numberSold={product.numberSold}
                                        discount={product.discount}
                                    />
                                );
                            })}
                        {products.length === 0 && <img alt="" src={images.noProductFound} />}
                    </div>
                    <div className={cx('pagination')}>
                        <Pagination
                            defaultCurrent={panigate.page + 1}
                            total={panigate.total}
                            onChange={onChangePagination}
                        />
                    </div>
                </div>
            </div>
        </Loading>
    );
};

export default TypeProductPage;
