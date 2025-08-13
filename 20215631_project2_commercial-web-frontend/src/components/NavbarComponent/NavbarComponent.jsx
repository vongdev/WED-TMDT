import { Checkbox, Rate, Row } from 'antd';
import * as ProductService from '../../services/ProductService';

import classNames from 'classnames/bind';
import styles from './NavbarComponent.module.scss';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

const cx = classNames.bind(styles);

const NavbarComponent = () => {
    const navigate = useNavigate();

    const fetchAllTypeProduct = async () => {
        const res = await ProductService.getAllTypeProduct();
        return res;
    };
    const typeProduct = useQuery({
        queryKey: ['type-product'],
        queryFn: fetchAllTypeProduct,
    });

    const handleNavigateType = (type) => {
        const typeNormalize = type
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            ?.replace(/ /g, '_');
        navigate(`/products/${typeNormalize}`, { state: type });
    };


    const onChange = () => {};
    const renderComponent = (type, options) => {
        switch (type) {
            case 'list':
                return options?.map((option) => {
                    return (
                        <p className={cx('list-item')} onClick={() => handleNavigateType(option)}>
                            {option}
                        </p>
                    );
                });

            case 'checkbox':
                return (
                    <Checkbox.Group className={cx('checkbox-group')} onChange={onChange}>
                        {options.map((option) => {
                            return <Checkbox value={option.value}>{option.label}</Checkbox>;
                        })}
                    </Checkbox.Group>
                );

            case 'rating':
                return options.map((option) => {
                    return (
                        <div className={cx('rating-item')}>
                            <Rate disabled defaultValue={option} />
                            <span>Từ {option} sao</span>
                        </div>
                    );
                });

            case 'price':
                return options.map((option) => {
                    return <span className={cx('price-item')}>{option}</span>;
                });

            default:
                return {};
        }
    };

    return (
        <div className={cx('wrapper')}>
            <h4 className={cx('label')}>Danh mục sản phẩm</h4>
            <div className={cx('content')}>{renderComponent('list', typeProduct?.data?.data)}</div>
        </div>
    );
};

export default NavbarComponent;
