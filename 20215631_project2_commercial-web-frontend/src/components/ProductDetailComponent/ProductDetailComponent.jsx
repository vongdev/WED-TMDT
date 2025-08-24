import { Col, Image, Rate, Select, Tag, Modal, Input, Button, List } from 'antd';
import classNames from 'classnames/bind';
import styles from './ProductDetailComponent.module.scss';
import { WrapperInputNumber } from './style.js';
import { PlusOutlined, MinusOutlined, DeleteOutlined } from '@ant-design/icons';
import ButtonComponent from '../ButtonComponent/ButtonComponent';
import * as ProductService from '../../services/ProductService';
import { useQuery } from '@tanstack/react-query';
import Loading from '../LoadingComponent/Loading.jsx';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { addOrderProduct } from '../../redux/slices/orderSlice.js';
import * as message from '../Message/Message';
import * as UserService from '../../services/UserService';
import { updateUser } from '../../redux/slices/userSlice.js';
// Thêm ReviewService để gọi API xóa review
import * as ReviewService from '../../services/ReviewService';

const cx = classNames.bind(styles);
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Chuẩn hoá URL ảnh
const resolveImg = (img) => {
  if (!img) return '/no-product-found.jpg';
  if (/^https?:\/\//i.test(img)) return img;
  if (/^data:image\//i.test(img)) return img;
  return img.startsWith('/') ? img : `/${img}`;
};

// ====== Hàm lấy review và gửi review ======
const getReviewsByProduct = async (productId) => {
  const res = await fetch(`${API_URL}/review/${productId}`);
  const data = await res.json();
  return data.data || [];
};
const createOrUpdateReview = async (data, token) => {
  await fetch(`${API_URL}/review`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
};

const ProductDetailComponent = ({ id }) => {
  const [quantity, setQuantity] = useState(1);
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Option state
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedStorage, setSelectedStorage] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);

  // Đổi địa chỉ (modal)
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [addressInput, setAddressInput] = useState(user?.address || '');
  const [cityInput, setCityInput] = useState(user?.city || '');
  const [addressLoading, setAddressLoading] = useState(false);

  // Review state
  const [reviews, setReviews] = useState([]);
  const [userRate, setUserRate] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  // Lấy chi tiết sản phẩm
  const fetchGetDetailProduct = async (context) => {
    const id = context?.queryKey && context?.queryKey[1];
    const res = await ProductService.getDetailProduct(id);
    return res.data;
  };

  const { isPending, data: productDetail } = useQuery({
    queryKey: ['products-detail', id],
    queryFn: fetchGetDetailProduct,
    enabled: !!id,
  });

  // Lấy danh sách màu sắc và dung lượng
  const colors = productDetail?.options
    ? Array.from(new Set(productDetail.options.map((o) => o.color)))
    : [];
  const storages = productDetail?.options
    ? Array.from(new Set(productDetail.options.map((o) => o.storage)))
    : [];

  // Khi productDetail thay đổi, tự chọn mặc định option đầu tiên
  useEffect(() => {
    if (productDetail?.options && productDetail.options.length > 0) {
      setSelectedColor(productDetail.options[0].color);
      setSelectedStorage(productDetail.options[0].storage);
    }
  }, [productDetail]);

  // Update selected option khi chọn màu/dung lượng
  useEffect(() => {
    if (productDetail?.options && selectedColor && selectedStorage) {
      const found = productDetail.options.find(
        (o) => o.color === selectedColor && o.storage === selectedStorage
      );
      setSelectedOption(found || null);
      setQuantity(1); // reset số lượng khi đổi option
    }
  }, [selectedColor, selectedStorage, productDetail]);

  // ==== Lấy danh sách đánh giá khi có id sản phẩm ====
  useEffect(() => {
    if (id) {
      getReviewsByProduct(id).then(setReviews);
    }
  }, [id]);

  // ==== Gửi đánh giá ====
  const handleSubmitReview = async () => {
    if (!userRate) return message.error('Vui lòng chọn số sao!');
    setReviewLoading(true);
    try {
      await createOrUpdateReview(
        { productId: id, rating: userRate, comment: userComment },
        user?.access_token
      );
      message.success('Đánh giá thành công!');
      setUserRate(0); setUserComment('');
      // reload reviews
      const data = await getReviewsByProduct(id);
      setReviews(data);
    } catch (e) {
      message.error('Bạn cần đăng nhập và đã mua hàng để đánh giá!');
    }
    setReviewLoading(false);
  };

  // ==== Xóa đánh giá ====
  const handleDeleteReview = async (reviewId) => {
    try {
      await ReviewService.deleteReview(reviewId, user?.access_token);
      message.success('Đã xóa đánh giá');
      // reload reviews
      const data = await getReviewsByProduct(id);
      setReviews(data);
      setUserRate(0);
      setUserComment('');
    } catch (e) {
      message.error('Xóa đánh giá thất bại');
    }
  };

  // ==== Kiểm tra user đã đánh giá chưa để hiển thị lại rate/comment ====
  useEffect(() => {
    if (user && reviews.length > 0) {
      const myReview = reviews.find(rv => rv.user?._id === user.id);
      if (myReview) {
        setUserRate(myReview.rating);
        setUserComment(myReview.comment);
      } else {
        setUserRate(0);
        setUserComment('');
      }
    }
  }, [user, reviews]);

  const handleChangeQuantity = (e) => {
    setQuantity(Number(e.target.value));
  };

  const handleQuantity = (type) => {
    if (type === 'decrease') {
      setQuantity((q) => (q <= 1 ? 1 : q - 1));
    } else {
      const max = selectedOption?.countInStock || productDetail?.countInStock || 99;
      if (quantity < max) setQuantity((q) => q + 1);
    }
  };

  // Thêm vào giỏ hàng
  const handleAddOrderProduct = () => {
    if (!user?.id) {
      navigate('/sign-in', { state: location.pathname });
    } else {
      dispatch(
        addOrderProduct({
          orderItem: {
            name: selectedOption
              ? `${productDetail?.name} (${selectedOption.color}, ${selectedOption.storage})`
              : productDetail?.name,
            amount: quantity,
            image: selectedOption?.image || productDetail?.image,
            price: selectedOption?.price || productDetail?.price,
            product: productDetail?._id + (selectedOption ? `-${selectedOption.color}-${selectedOption.storage}` : ''),
            discount: productDetail?.discount,
          },
        }),
      );
      message.success('Đã thêm vào giỏ hàng!');
    }
  };

  // Mua ngay: chuyển sang trang thanh toán với sản phẩm đã chọn (KHÔNG chuyển giỏ)
  const handleBuyNow = () => {
    if (!user?.id) {
      navigate('/sign-in', { state: location.pathname });
    } else {
      const buyNowItem = {
        name: selectedOption
          ? `${productDetail?.name} (${selectedOption.color}, ${selectedOption.storage})`
          : productDetail?.name,
        amount: quantity,
        image: selectedOption?.image || productDetail?.image,
        price: selectedOption?.price || productDetail?.price,
        product: productDetail?._id + (selectedOption ? `-${selectedOption.color}-${selectedOption.storage}` : ''),
        discount: productDetail?.discount,
      };
      // Chuyển sang trang payment và truyền dữ liệu sản phẩm mua ngay qua state
      navigate('/payment', { state: { buyNow: [buyNowItem] } });
    }
  };

  // Đổi địa chỉ giao hàng
  const handleOpenAddressModal = () => {
    setAddressInput(user?.address || '');
    setCityInput(user?.city || '');
    setAddressModalOpen(true);
  };

  const handleSaveAddress = async () => {
    setAddressLoading(true);
    try {
      if (!addressInput) {
        message.error('Vui lòng nhập địa chỉ!');
        setAddressLoading(false);
        return;
      }
      const res = await UserService.updateUser(
        user.id,
        user.access_token,
        { address: addressInput, city: cityInput }
      );
      if (res.status === 'OK') {
        dispatch(updateUser({ address: addressInput, city: cityInput }));
        setAddressModalOpen(false);
        message.success('Cập nhật địa chỉ thành công!');
      } else {
        message.error('Cập nhật địa chỉ thất bại!');
      }
    } catch (e) {
      message.error('Cập nhật địa chỉ thất bại!');
    }
    setAddressLoading(false);
  };

  // Nếu sản phẩm không có options (cũ) thì fallback về logic cũ
  const showOptionSelect = productDetail?.options && productDetail.options.length > 0;

  return (
    <Loading isLoading={isPending}>
      <div className={cx('wrapper')}>
        <Col className={cx('wrapper-left')} span={10}>
          <Image
            style={{ width: '400px', objectFit: 'cover' }}
            src={resolveImg(selectedOption?.image || productDetail?.image)}
            alt="product-main"
            preview
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
            <Rate allowHalf value={productDetail?.rating || 0} disabled />
            <span> | Đã bán: {productDetail?.numberSold || 0}</span>
          </div>

          {/* Chọn option: màu sắc và dung lượng */}
          {showOptionSelect && (
            <>
              <div style={{ marginTop: 10 }}>
                <span style={{ fontWeight: 500 }}>Màu sắc: </span>
                <Select
                  value={selectedColor}
                  onChange={setSelectedColor}
                  style={{ width: 150, marginRight: 16 }}
                  options={colors.map((c) => ({ value: c, label: c }))}
                />
                {selectedColor && <Tag color="blue">{selectedColor}</Tag>}
              </div>
              <div style={{ marginTop: 10 }}>
                <span style={{ fontWeight: 500 }}>Dung lượng: </span>
                <Select
                  value={selectedStorage}
                  onChange={setSelectedStorage}
                  style={{ width: 150, marginRight: 16 }}
                  options={storages.map((s) => ({ value: s, label: s }))}
                />
                {selectedStorage && <Tag color="cyan">{selectedStorage}</Tag>}
              </div>
            </>
          )}

          <div className={cx('price')}>
            {(selectedOption?.price || productDetail?.price || 0).toLocaleString('vi-VN') + ' đ'}
            {productDetail?.discount ? (
              <span className={cx('discount-percent')}>-{productDetail.discount}%</span>
            ) : null}
          </div>

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
                max={selectedOption?.countInStock || productDetail?.countInStock || 99}
                value={quantity}
                onChange={handleChangeQuantity}
              />
              <ButtonComponent
                style={{ width: '30px', height: '30px' }}
                icon={<PlusOutlined />}
                size="small"
                onClick={() => handleQuantity('increase')}
                disabled={quantity >= (selectedOption?.countInStock || productDetail?.countInStock || 99)}
              />
            </div>
            <span style={{ marginLeft: 12, color: '#888' }}>
              {selectedOption?.countInStock || productDetail?.countInStock || 0} sản phẩm có sẵn
            </span>
          </div>

          {/* Địa chỉ giao hàng */}
          <div className={cx('address')}>
            <h4>Giao đến:</h4>
            <div className={cx('address-row')}>
              <span>{user?.address || <i>Chưa có địa chỉ</i>}</span>
              <span
                className={cx('address-change')}
                onClick={handleOpenAddressModal}
                tabIndex={0}
                role="button"
              >
                Thay đổi
              </span>
              {user?.city && <Tag color="geekblue" style={{ marginLeft: 8 }}>{user.city}</Tag>}
            </div>
          </div>

          <div className={cx('description')}>
            <h4>Mô tả sản phẩm:</h4>
            <p>{productDetail?.description}</p>
          </div>

          <div className={cx('actions')} style={{ margin: '20px 0' }}>
            <ButtonComponent
              className={cx('buy-now')}
              styleButton={{
                backgroundColor: '#ff424e',
                width: '180px',
                height: '48px',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
              }}
              onClick={handleBuyNow}
              text="Mua ngay"
              styleText={{
                fontSize: '1.2rem',
                fontWeight: '600',
              }}
            />
            <ButtonComponent
              className={cx('add-to-cart')}
              styleButton={{
                backgroundColor: '#fff',
                border: '1.5px solid #3a7bd5',
                color: '#3a7bd5',
                width: '180px',
                height: '48px',
                borderRadius: '6px',
                fontWeight: 600,
              }}
              onClick={handleAddOrderProduct}
              text="Thêm vào giỏ hàng"
              styleText={{
                fontSize: '1.2rem',
                fontWeight: '600',
              }}
            />
          </div>

          {/* ==== Hiển thị đánh giá khách hàng ==== */}
          <div style={{ marginTop: 32, background: '#fafcff', borderRadius: 8, padding: 16 }}>
            <h3>Đánh giá của khách hàng</h3>
            <List
              dataSource={reviews}
              locale={{ emptyText: "Chưa có đánh giá nào" }}
              renderItem={item => (
                <List.Item
                  actions={
                    user?.id === item?.user?._id
                      ? [
                          <Button
                            key="delete"
                            type="link"
                            icon={<DeleteOutlined />}
                            danger
                            onClick={() => handleDeleteReview(item._id)}
                          >
                            Xóa
                          </Button>
                        ]
                      : []
                  }
                >
                  <b>{item?.user?.name || 'Khách'}:</b>
                  <Rate value={item.rating} disabled style={{ marginLeft: 8 }} />
                  <span style={{ marginLeft: 8 }}>{item.comment}</span>
                </List.Item>
              )}
            />
            {user?.access_token && (
              <div style={{ marginTop: 12, background: '#fff', padding: 12, borderRadius: 4 }}>
                <span>Đánh giá của bạn: </span>
                <Rate value={userRate} onChange={setUserRate} />
                <Input.TextArea
                  rows={2}
                  value={userComment}
                  onChange={e => setUserComment(e.target.value)}
                  placeholder="Nhận xét của bạn"
                  style={{ margin: '8px 0' }}
                />
                <Button type="primary" loading={reviewLoading} onClick={handleSubmitReview} disabled={!userRate}>Gửi đánh giá</Button>
              </div>
            )}
          </div>
        </Col>
      </div>

      {/* Modal đổi địa chỉ giao hàng */}
      <Modal
        title="Thay đổi địa chỉ giao hàng"
        open={addressModalOpen}
        onCancel={() => setAddressModalOpen(false)}
        onOk={handleSaveAddress}
        okText="Lưu"
        confirmLoading={addressLoading}
      >
        <Input
          style={{ margin: '8px 0' }}
          placeholder="Nhập địa chỉ mới"
          value={addressInput}
          onChange={(e) => setAddressInput(e.target.value)}
        />
        <Input
          style={{ margin: '8px 0' }}
          placeholder="Thành phố"
          value={cityInput}
          onChange={(e) => setCityInput(e.target.value)}
        />
      </Modal>
    </Loading>
  );
};

export default ProductDetailComponent;