import ProductDetailComponent from '../../components/ProductDetailComponent/ProductDetailComponent';
import classNames from 'classnames/bind';
import styles from './ProductDetailPage.module.scss';
import { useNavigate, useParams } from 'react-router-dom';

const cx = classNames.bind(styles);

const ProductDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    return (
        <div className={cx('wrapper')}>
            <div className={cx('path')}>
                <span
                    className={cx('path-home')}
                    onClick={() => {
                        navigate('/');
                    }}
                >
                    Trang chủ 
                </span>
                &gt; 
                <span style={{color: 'red'}}>Chi tiết sản phẩm</span>
            </div>

            <ProductDetailComponent id={id} />
        </div>
    );
};

export default ProductDetailPage;
