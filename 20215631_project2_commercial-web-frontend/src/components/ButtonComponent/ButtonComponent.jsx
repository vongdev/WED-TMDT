import { Button } from 'antd';
import React from 'react';

const ButtonComponent = ({ size, styleButton, styleText, text, disabled, ...rests }) => {
    const background_color = styleButton?.backgroundColor;
    return (
        <Button
            disabled={disabled}
            style={{
                ...styleButton,
                background: disabled ? '#bbb' : background_color,
            }}
            size={size}
            {...rests}
        >
            <span style={styleText}>{text}</span>
        </Button>
    );
};

export default ButtonComponent;
