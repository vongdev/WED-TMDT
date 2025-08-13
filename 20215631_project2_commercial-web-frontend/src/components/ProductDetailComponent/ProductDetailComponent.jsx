import { Col, Image, Rate } from 'antd';
import classNames from 'classnames/bind';
import styles from './ProductDetailComponent.module.scss';
import { WrapperInputNumber } from './style.js';

import { PlusOutlined, MinusOutlined } from '@ant-design/icons';
import ButtonComponent from '../ButtonComponent/ButtonComponent';
import * as ProductService from '../../services/ProductService';
import { useQuery } from '@tanstack/react-query';
import Loading from '../LoadingComponent/Loading.jsx';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { addOrderProduct } from '../../redux/slices/orderSlice.js';

const cx = classNames.bind(styles);

// Chuẩn hoá URL ảnh: dùng ảnh trong public/, hoặc URL đầy đủ http(s)
const resolveImg = (img) => {
  if (!img) return '/no-product-found.jpg';
  if (/^https?:\/\//i.test(img)) return img;           // URL đầy đủ
  return img.startsWith('/') ? img : `/${img}`;        // tương đối -> tuyệt đối (FE 3000)
};

const ProductDetailComponent = ({ id }) => {
  const [quantity, setQuantity] = useState(1);
  const user = useSelector((state) => state.user);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const handleChangeQuantity = (e) => {
    setQuantity(Number(e.target.value));
  };

  const fetchGetDetailProduct = async (context) => {
    const id = context?.queryKey && context?.queryKey[1];
    const res = await ProductService.getDetailProduct(id);
    return res.data; // BE: { status, message, data } -> service trả res.data -> đây là product object
  };

  // FIX: 'option' -> 'enabled'
  const { isPending, data: productDetail } = useQuery({
    queryKey: ['products-detail', id],
    queryFn: fetchGetDetailProduct,
    enabled: !!id,
  });

  const handleQuantity = (type) => {
    if (type === 'decrease') {
      setQuantity((q) => (q <= 1 ? 1 : q - 1));
    } else {
      setQuantity((q) => q + 1);
    }
  };

  const handleAddOrderProduct = () => {
    if (!user?.id) {
      navigate('/sign-in', { state: location.pathname });
    } else {
      dispatch(
        addOrderProduct({
          orderItem: {
            name: productDetail?.name,
            amount: quantity,
            image: productDetail?.image,
            price: productDetail?.price,
            product: productDetail?._id,
            discount: productDetail?.discount,
          },
        }),
      );
    }
  };

  return (
    <Loading isLoading={isPending}>
      <div className={cx('wrapper')}>
        <Col className={cx('wrapper-left')} span={10}>
          <Image
            style={{ width: '400px', objectFit: 'cover' }}
            src={resolveImg(productDetail?.image)}
            alt="product-main"
            preview
            // fallback + onError để luôn có ảnh dự phòng
            fallback="/no-product-found.jpg"
            onError={(e) => {
              if (e?.currentTarget?.src !== `${window.location.origin}/no-product-found.jpg`) {
                e.currentTarget.src = '/no-product-found.jpg';
              }
            }}
          />
        </Col>

        <Col className={cx('wrapper-right')} span={14}>
          <h1 className={cx('name')}>{productDetail?.name}</h1>

          <div className={cx('rating-wrapper')}>
            <Rate allowHalf value={productDetail?.rating} disabled />
            <span> | Đã bán: {productDetail?.numberSold || 0}</span>
          </div>

          {/* FIX: 'vn-VN' -> 'vi-VN' + tránh lỗi khi price null/undefined */}
          <p className={cx('price')}>
            {(Number(productDetail?.price) || 0).toLocaleString('vi-VN') + ' đ'}
          </p>

          <div className={cx('quantity')}>
            <span className={cx('quantity-label')}>Số lượng: </span>
            <div className={cx('quantity-action')}>
              <ButtonComponent
                style={{ width: '30px', height: '30px' }}
                icon={<MinusOutlined />}
                size="small"
                onClick={() => handleQuantity('decrease')}
              />
              <WrapperInputNumber
                readOnly
                min={1}
                max={99}
                value={quantity}
                onChange={handleChangeQuantity}
              />
              <ButtonComponent
                style={{ width: '30px', height: '30px' }}
                icon={<PlusOutlined />}
                size="small"
                onClick={() => handleQuantity('increase')}
              />
            </div>
          </div>

          <div className={cx('address')}>
            <h4>Giao đến:</h4>
            <p>{user?.address}</p>
          </div>

          <div className={cx('description')}>
            <h4>Mô tả sản phẩm:</h4>
            <p>{productDetail?.description}</p>
          </div>

          <div className={cx('buy-button')}>
            <ButtonComponent
              styleButton={{
                backgroundColor: 'red',
                width: '220px',
                height: '48px',
                border: 'none',
                borderRadius: '4px',
                color: '#fff',
              }}
              onClick={handleAddOrderProduct}
              text="Mua ngay"
              styleText={{
                fontSize: '1.3rem',
                fontWeight: '600',
              }}
            />
          </div>
        </Col>
      </div>
    </Loading>
  );
};

export default ProductDetailComponent;
