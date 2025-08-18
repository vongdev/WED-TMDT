// src/components/ModalCancelOrder/ModalCancelOrder.jsx
import React, { useState } from 'react';
import { Modal, Input, Button } from 'antd';

const ModalCancelOrder = ({ isVisible, onCancel, onConfirm }) => {
  const [reason, setReason] = useState('');
  
  return (
    <Modal
      title="Hủy đơn hàng"
      open={isVisible}
      onCancel={onCancel}
      footer={[
        <Button key="back" onClick={onCancel}>
          Quay lại
        </Button>,
        <Button key="submit" type="primary" danger onClick={() => onConfirm(reason)}>
          Xác nhận hủy
        </Button>,
      ]}
    >
      <p>Bạn có chắc chắn muốn hủy đơn hàng này?</p>
      <Input.TextArea
        placeholder="Vui lòng nhập lý do hủy đơn"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={4}
      />
      <p style={{ marginTop: 10, color: '#ff4d4f' }}>
        Lưu ý: Bạn chỉ có thể hủy đơn hàng khi trạng thái đơn là "Chờ xác nhận" hoặc "Đang xử lý".
      </p>
    </Modal>
  );
};

export default ModalCancelOrder;