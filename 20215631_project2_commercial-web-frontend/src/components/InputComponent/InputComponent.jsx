import { Input } from 'antd';

const InputComponent = ({ size, placeholder, bordered, ...rest }) => {
  // map bordered sang variant mới
  let variant;
  if (bordered === false) variant = 'borderless';
  else if (bordered === true) variant = 'outlined'; 
  // (hoặc 'filled' tuỳ style bạn muốn)

  return (
    <Input
      size={size}
      placeholder={placeholder}
      variant={variant}
      {...rest} // truyền các prop khác
    />
  );
};

export default InputComponent;
