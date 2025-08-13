import { SearchOutlined } from '@ant-design/icons';
import classNames from 'classnames/bind';
import styles from './ButtonInputSearch.module.scss';
import InputComponent from '../InputComponent/InputComponent';
import ButtonComponent from '../ButtonComponent/ButtonComponent';

const cx = classNames.bind(styles);

const ButtonInputSearch = (props) => {
  // bóc tách textButton, KHÔNG truyền xuống Input
  const { size, placeholder, textButton, ...rest } = props;

  return (
    <div className={cx('wrapper')}>
      <InputComponent
        {...rest}                      // các prop khác (onChange, value, v.v.)
        size={size}
        placeholder={placeholder}
        variant="borderless"
        className={cx('input')}        // đặt sau để đảm bảo className này được dùng
      />
      <ButtonComponent className={cx('button')} size={size} icon={<SearchOutlined />}>
        {textButton}
      </ButtonComponent>
    </div>
  );
};

export default ButtonInputSearch;
