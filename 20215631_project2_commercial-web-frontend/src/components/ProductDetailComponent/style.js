import { Button, InputNumber } from "antd";
import styled from "styled-components";

export const WrapperInputNumber = styled(InputNumber)`
    &.ant-input-number {
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        border: none;
    }

    .ant-input-number-handler-wrap {
        display: none;
    }

    .ant-input-number-input-wrap {
    }
`

export const WrapperQuantityButton = styled(Button)`

`