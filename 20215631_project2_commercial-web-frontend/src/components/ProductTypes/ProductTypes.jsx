import classNames from 'classnames/bind';
import styles from './ProductTypes.module.scss';
import { useNavigate } from 'react-router-dom';

const cx = classNames.bind(styles);

const ProductTypes = ({ name }) => {
    const navigate = useNavigate();

    const handleNavigateType = (type) => {
        const typeNormalize = type
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            ?.replace(/ /g, '_');
        navigate(`/products/${typeNormalize}`, {state: type});
    };
    return (
        <div className={cx('wrapper')} onClick={() => handleNavigateType(name)}>
            {name}
        </div>
    );
};

export default ProductTypes;
