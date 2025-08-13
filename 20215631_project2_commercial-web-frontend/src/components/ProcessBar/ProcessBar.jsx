import { Steps } from 'antd';

const ProcessBar = ({ current, items = [] }) => {
    return (
        <div>
            <Steps current={current} items={items} />
        </div>
    );
};

export default ProcessBar;
