import { Modal } from 'antd';

const ModalComponent = ({ title = 'Modal', isOpen = false, children, ...rests }) => {
    return (
        <Modal title={title} isOpen={isOpen} {...rests}>
            {children}
        </Modal>
    );
};

export default ModalComponent;
