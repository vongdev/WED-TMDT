import classNames from 'classnames/bind';
import styles from './HomePage.module.scss';

import ProductTypes from '../../components/ProductTypes/ProductTypes';
import SliderComponent from '../../components/SliderComponent/SliderComponent';
import images from '../../assets/images';
import CardComponent from '../../components/CartComponent/CartComponent';
import { useQuery } from '@tanstack/react-query';
import * as ProductService from '../../services/ProductService';
import { useSelector } from 'react-redux';
import { useEffect, useRef, useState } from 'react';
import Loading from '../../components/LoadingComponent/Loading';
import { useDebounce } from '../../hooks/useDebounce';
import ButtonComponent from '../../components/ButtonComponent/ButtonComponent';

const cx = classNames.bind(styles);

const HomePage = () => {
    const searchProductValue = useSelector((state) => state.product?.search);
    const searchDebounce = useDebounce(searchProductValue, 500); // debounce 500ms cho nhanh hơn
    const [productLimit, setProductLimit] = useState(5);
    const [productTypes, setProductTypes] = useState([]);
    const sliderArr = [images.slider1, images.slider2, images.slider3];

    // Lấy danh sách loại sản phẩm
    useEffect(() => {
        const fetchAllTypeProduct = async () => {
            const res = await ProductService.getAllTypeProduct();
            if (res?.status === 'OK') {
                setProductTypes(res?.data);
            }
        };
        fetchAllTypeProduct();
    }, []);

    // Fetch sản phẩm sử dụng react-query, tự động refetch khi searchDebounce hoặc productLimit thay đổi
    const { isPending, data: productsData } = useQuery({
        queryKey: ['products', productLimit, searchDebounce],
        queryFn: async () => {
            const res = await ProductService.getAllProduct(searchDebounce, productLimit);
            return res;
        },
        keepPreviousData: true,
        retry: 3,
        retryDelay: 1000,
    });

    // Lấy data sản phẩm, tổng, page từ kết quả query
    const products = productsData?.data || [];
    const total = productsData?.total || 0;
    const page = productsData?.totalPage || 1;

    return (
        <div className={cx('wrapper')}>
            <div className={cx('nav')}>
                {productTypes.map((item, index) => (
                    <ProductTypes name={item} key={index} />
                ))}
            </div>
            <div className={cx('slider-wrapper')}>
                <SliderComponent arrImage={sliderArr} />
            </div>
            <Loading isLoading={isPending}>
                <div className={cx('product-cart-wrapper')}>
                    {products.map((product) => (
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
                    ))}
                    {products.length === 0 && <img className={cx("no-product-found")} alt="" src={images.noProductFound} />}
                </div>
            </Loading>

            <div className={cx('load-more-btn-wrapper')}>
                <ButtonComponent
                    disabled={total === products.length || page === 1 || products.length === 0}
                    className={cx('load-more-products-btn')}
                    styleButton={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '20px 70px',
                        border: 'none',
                        borderRadius: '10px',
                        backgroundColor: '#3098ec',
                        color: '#fff',
                        fontSize: '1.6rem',
                        fontWeight: 600,
                    }}
                    onClick={() => setProductLimit((prev) => prev + 5)}
                    text={'Xem thêm'}
                ></ButtonComponent>
            </div>
        </div>
    );
};

export default HomePage;