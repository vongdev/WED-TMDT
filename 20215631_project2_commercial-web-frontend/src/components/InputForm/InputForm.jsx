import { Input } from "antd"
import { useState } from "react"

const InputForm = (props) => {
    const {type, placeholder = 'Nhập text', ...rest} = props;
    const handleOnChangeInput = (e) => {
        props.onChange(e.target.value);
    }
    return (
        <Input type={type} placeholder={placeholder} value={props.value} onChange={handleOnChangeInput} {...rest} />
    )
}

export default InputForm;