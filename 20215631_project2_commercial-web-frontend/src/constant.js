export const orderConstant = {
    delivery: {
        fast: 'FAST',
        gojek: 'GO_JEK',
    },
    payment: {
        cod: 'Thanh toán khi nhận hàng',
        transfer: 'Thanh toán qua PayPal',
        momo: 'Thanh toán qua MoMo',
        vnpay: 'Thanh toán qua VNPay',
        banking: 'Chuyển khoản ngân hàng',
        zalopay: 'Thanh toán qua ZaloPay',
    },
    status: {
        pending: 'Chờ xác nhận',
        confirmed: 'Đã xác nhận',
        processing: 'Đang xử lý',
        shipped: 'Đang vận chuyển',
        delivered: 'Đã giao hàng',
        completed: 'Hoàn thành',
        cancelled: 'Đã hủy',
    },
    paymentStatus: {
        pending: 'Chờ thanh toán',
        paid: 'Đã thanh toán',
        failed: 'Thanh toán thất bại',
        refunded: 'Đã hoàn tiền',
    },
};

// Danh sách các trạng thái mà người dùng có thể hủy đơn
export const CANCELLABLE_STATUSES = ['pending', 'confirmed', 'processing'];

// Danh sách các trạng thái hiển thị cho admin
export const ADMIN_ORDER_STATUSES = [
    { value: 'pending', label: 'Chờ xác nhận' },
    { value: 'confirmed', label: 'Đã xác nhận' },
    { value: 'processing', label: 'Đang xử lý' },
    { value: 'shipped', label: 'Đang vận chuyển' },
    { value: 'delivered', label: 'Đã giao hàng' },
    { value: 'completed', label: 'Hoàn thành' },
    { value: 'cancelled', label: 'Đã hủy' },
];

// Helper để chuyển đổi trạng thái sang tên hiển thị
export const getStatusLabel = (status) => {
    return orderConstant.status[status] || status;
};