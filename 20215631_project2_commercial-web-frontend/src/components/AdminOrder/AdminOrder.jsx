import classNames from 'classnames/bind';
import styles from './AdminOrder.module.scss';
import { Button, Space, Select, Tag, Tooltip, Modal, Input, Table } from 'antd';
import TableComponent from '../TableComponent/TableComponent';
import InputComponent from '../InputComponent/InputComponent';
import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import * as OrderService from '../../services/OrderService';
import { SearchOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { orderConstant, ADMIN_ORDER_STATUSES } from '../../constant.js';
import { useMutationHook } from '../../hooks/useMutationHook';
import * as message from '../../components/Message/Message';
import moment from 'moment';

const cx = classNames.bind(styles);
const { Option } = Select;
const { TextArea } = Input;

const AdminOrder = () => {
    const searchInput = useRef(null);
    const user = useSelector((state) => state?.user);
    const [orderDetail, setOrderDetail] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [statusUpdateNote, setStatusUpdateNote] = useState('');

    const getAllOrders = async () => {
        const res = await OrderService.getAllOrders(user?.access_token);
        return res;
    };

    // Lấy doanh thu (các đơn hàng có isPaid = true)
    const getRevenue = async () => {
        const res = await OrderService.getRevenue(user?.access_token);
        return res;
    };

    const queryOrder = useQuery({
        queryKey: ['orders'],
        queryFn: getAllOrders,
        refetchInterval: 30000, // Tự động refresh mỗi 30 giây
    });

    const { isLoading: isLoadingOrders, data: orders, refetch: refetchOrders } = queryOrder;

    const mutationUpdate = useMutationHook((data) => {
        const { id, access_token, ...rests } = data;
        const res = OrderService.updateOrder(id, access_token, { ...rests });
        return res;
    });

    const mutationDeleteMany = useMutationHook((data) => {
        const { access_token, ...ids } = data;
        const res = OrderService.deleteManyOrder(ids, access_token);
        return res;
    });

    const {
        data: dataUpdated,
        isPending: isPendingUpdated,
        isSuccess: isSuccessUpdated,
        isError: isErrorUpdated,
    } = mutationUpdate;

    const {
        data: dataDeletedMany,
        isPending: isPendingDeletedMany,
        isSuccess: isSuccessDeletedMany,
        isError: isErrorDeletedMany,
    } = mutationDeleteMany;

    // Hiển thị modal chi tiết đơn hàng
    const showOrderDetail = (orderId) => {
        const order = orders?.data?.find(o => o._id === orderId);
        if (order) {
            setOrderDetail(order);
            setIsModalVisible(true);
        }
    };

    const handleChange = (id, value, note) => {
        // Nếu đang cập nhật status
        if (value) {
            // Hiển thị modal xác nhận nếu đang chuyển sang trạng thái cancelled
            if (value === 'cancelled') {
                Modal.confirm({
                    title: 'Xác nhận hủy đơn hàng',
                    content: (
                        <div>
                            <p>Bạn có chắc chắn muốn hủy đơn hàng này?</p>
                            <TextArea
                                placeholder="Lý do hủy đơn"
                                value={statusUpdateNote}
                                onChange={(e) => setStatusUpdateNote(e.target.value)}
                                rows={3}
                            />
                        </div>
                    ),
                    onOk() {
                        mutationUpdate.mutate({
                            id,
                            access_token: user.access_token,
                            status: value,
                            note: statusUpdateNote || 'Admin hủy đơn hàng'
                        }, {
                            onSuccess: () => {
                                setStatusUpdateNote('');
                                refetchOrders();
                            }
                        });
                    },
                    onCancel() {
                        setStatusUpdateNote('');
                    },
                });
            } else {
                // Cập nhật trạng thái bình thường
                mutationUpdate.mutate({
                    id,
                    access_token: user.access_token,
                    status: value,
                    note: note || `Admin thay đổi trạng thái đơn hàng sang ${orderConstant.status[value] || value}`
                }, {
                    onSuccess: () => {
                        refetchOrders();
                    }
                });
            }
        }
    };

    const handleDeleteManyOrder = (_ids) => {
        mutationDeleteMany.mutate(
            { ids: _ids, token: user?.access_token },
            {
                onSettled: () => {
                    refetchOrders();
                },
            },
        );
    };

    const getColumnSearchProps = (dataIndex) => ({
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
            <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
                <InputComponent
                    ref={searchInput}
                    placeholder={`Search ${dataIndex}`}
                    value={selectedKeys[0]}
                    onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                    style={{ marginBottom: 8, display: 'block' }}
                />
                <Space>
                    <Button
                        type="primary"
                        onClick={() => {
                            confirm();
                        }}
                        icon={<SearchOutlined />}
                        size="small"
                        style={{ width: 90 }}
                    >
                        Search
                    </Button>
                    <Button
                        onClick={() => {
                            clearFilters();
                        }}
                        size="small"
                        style={{ width: 90 }}
                    >
                        Reset
                    </Button>
                </Space>
            </div>
        ),
        filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? '#1677ff' : undefined }} />,
        onFilter: (value, record) => record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()),
        onFilterDropdownOpenChange: (visible) => {
            if (visible) {
                setTimeout(() => searchInput.current?.select(), 100);
            }
        },
    });

    // Hàm render cho cột trạng thái đơn hàng
    const renderOrderStatus = (status, record) => {
        // Nếu đơn hàng đã hủy, chỉ hiển thị trạng thái, không cho phép thay đổi
        if (status === 'cancelled') {
            return (
                <Tooltip title={`Lý do: ${record.cancelReason || 'Không có lý do'}`}>
                    <Tag color="red">
                        Đã hủy <InfoCircleOutlined />
                    </Tag>
                </Tooltip>
            );
        }
        
        // Nếu đơn hàng đã giao hàng hoặc hoàn thành, chỉ hiển thị tag
        if (['delivered', 'completed'].includes(status)) {
            return <Tag color="green">{orderConstant.status[status] || status}</Tag>;
        }
        
        // Các trạng thái khác có thể thay đổi
        return (
            <Select
                defaultValue={status}
                value={status}
                style={{ width: 130 }}
                onChange={(value) => handleChange(record.key, value)}
            >
                {ADMIN_ORDER_STATUSES.map(item => (
                    <Option key={item.value} value={item.value}>{item.label}</Option>
                ))}
            </Select>
        );
    };

    const columns = [
        {
            title: 'Tên khách hàng',
            dataIndex: 'userName',
            sorter: (a, b) => a.userName.localeCompare(b.userName),
            ...getColumnSearchProps('userName'),
            width: '14%',
        },
        {
            title: 'SĐT',
            dataIndex: 'phone',
            sorter: (a, b) => a.phone.localeCompare(b.phone),
            ...getColumnSearchProps('phone'),
        },
        {
            title: 'Địa chỉ',
            dataIndex: 'address',
            sorter: (a, b) => a.address.localeCompare(b.address),
            ...getColumnSearchProps('address'),
        },
        {
            title: 'Ngày đặt hàng',
            dataIndex: 'date',
            ...getColumnSearchProps('date'),
            sorter: (a, b) => moment(a.createdAt).unix() - moment(b.createdAt).unix(),
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'totalPrice',
            sorter: (a, b) => a.totalPriceRaw - b.totalPriceRaw,
        },
        {
            title: 'Trạng thái đơn hàng',
            dataIndex: 'status',
            render: renderOrderStatus,
            filters: ADMIN_ORDER_STATUSES.map(item => ({ text: item.label, value: item.value })),
            onFilter: (value, record) => record.status === value,
        },
        {
            title: 'TT Thanh toán',
            dataIndex: 'isPaid',
            render: (isPaid, record) => (
                <Tag color={isPaid ? 'green' : 'orange'}>
                    {isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                </Tag>
            ),
            filters: [
                { text: 'Đã thanh toán', value: true },
                { text: 'Chưa thanh toán', value: false }
            ],
            onFilter: (value, record) => record.isPaid === value,
        },
        {
            title: 'Phương thức thanh toán',
            dataIndex: 'paymentMethod',
            ...getColumnSearchProps('paymentMethod'),
            filters: Object.entries(orderConstant.payment).map(([key, value]) => ({ text: value, value: key.toUpperCase() })),
            onFilter: (value, record) => record.paymentMethodRaw === value,
        },
        {
            title: 'Chi tiết',
            key: 'action',
            render: (_, record) => (
                <Button type="link" onClick={() => showOrderDetail(record.key)}>
                    Xem chi tiết
                </Button>
            ),
        },
    ];

    const columnsExport = [
        {
            title: 'Tên khách hàng',
            dataIndex: 'userName',
            key: 'userName',
        },
        {
            title: 'SĐT',
            dataIndex: 'phone',
            key: 'phone',
        },
        {
            title: 'Địa chỉ',
            dataIndex: 'address',
            key: 'address',
        },
        {
            title: 'Ngày đặt hàng',
            dataIndex: 'date',
            key: 'date',
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'totalPrice',
            key: 'totalPrice',
        },
        {
            title: 'Trạng thái đơn hàng',
            dataIndex: 'statusText',
            key: 'statusText',
        },
        {
            title: 'TT Thanh toán',
            dataIndex: 'isPaidText',
            key: 'isPaidText',
        },
        {
            title: 'Phương thức thanh toán',
            dataIndex: 'paymentMethod',
            key: 'paymentMethod',
        },
    ];

    const tableData = orders?.data?.map((order) => {
        const paymentMethodKey = order.paymentMethod?.toLowerCase();
        return {
            ...order,
            key: order._id,
            userName: order.shippingAddress.fullName,
            phone: order.shippingAddress.phone,
            address: `${order.shippingAddress.address}, ${order.shippingAddress.city}`,
            date: moment(order.createdAt).format('DD/MM/YYYY HH:mm'),
            createdAt: order.createdAt,
            totalPrice: order.totalPrice.toLocaleString('vn-VN') + ' đ',
            totalPriceRaw: order.totalPrice,
            status: order.status,
            statusText: orderConstant.status[order.status] || order.status,
            isPaid: order.isPaid,
            isPaidText: order.isPaid ? 'Đã thanh toán' : 'Chưa thanh toán',
            paymentMethod: orderConstant.payment[paymentMethodKey] || order.paymentMethod,
            paymentMethodRaw: order.paymentMethod,
        };
    }) || [];

    useEffect(() => {
        if (isSuccessUpdated && dataUpdated?.status === 'OK') {
            message.success('Cập nhật thành công!');
        } else if (isErrorUpdated) {
            message.error(dataUpdated?.message || 'Cập nhật thất bại');
        }
    }, [isSuccessUpdated, isErrorUpdated, dataUpdated]);

    useEffect(() => {
        if (isSuccessDeletedMany && dataDeletedMany?.status === 'OK') {
            message.success('Xóa thành công!');
        } else if (isErrorDeletedMany) {
            message.error(dataDeletedMany?.message || 'Xóa thất bại');
        }
    }, [isSuccessDeletedMany, isErrorDeletedMany, dataDeletedMany]);

    // Định nghĩa các cột cho modal chi tiết đơn hàng
    const orderItemColumns = [
        {
            title: 'Sản phẩm',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img 
                        src={record.image} 
                        alt={text} 
                        style={{ width: '60px', height: '60px', objectFit: 'cover' }} 
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/60' }}
                    />
                    <span>{text}</span>
                </div>
            ),
        },
        {
            title: 'Giá',
            dataIndex: 'price',
            key: 'price',
            render: (price) => `${price.toLocaleString('vn-VN')} đ`,
        },
        {
            title: 'Số lượng',
            dataIndex: 'amount',
            key: 'amount',
        },
        {
            title: 'Thành tiền',
            key: 'total',
            render: (_, record) => `${(record.price * record.amount).toLocaleString('vn-VN')} đ`,
        },
    ];

    return (
        <div className={cx('wrapper')}>
            <h1 className={cx('title')}>Quản lý đơn hàng</h1>
            <div>
                <TableComponent
                    columns={columns}
                    columnsExport={columnsExport}
                    data={tableData}
                    isLoading={isLoadingOrders || isPendingUpdated || isPendingDeletedMany}
                    handleDeleteMany={handleDeleteManyOrder}
                />
            </div>

            {/* Modal chi tiết đơn hàng */}
            <Modal
                title="Chi tiết đơn hàng"
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                width={800}
                footer={[
                    <Button key="close" onClick={() => setIsModalVisible(false)}>
                        Đóng
                    </Button>
                ]}
            >
                {orderDetail && (
                    <div>
                        <div style={{ marginBottom: '20px' }}>
                            <p><strong>Mã đơn hàng:</strong> {orderDetail._id}</p>
                            <p><strong>Khách hàng:</strong> {orderDetail.shippingAddress.fullName}</p>
                            <p><strong>Địa chỉ:</strong> {orderDetail.shippingAddress.address}, {orderDetail.shippingAddress.city}</p>
                            <p><strong>Số điện thoại:</strong> {orderDetail.shippingAddress.phone}</p>
                            <p><strong>Ngày đặt hàng:</strong> {moment(orderDetail.createdAt).format('DD/MM/YYYY HH:mm:ss')}</p>
                            <p>
                                <strong>Trạng thái đơn hàng:</strong> {' '}
                                <Tag color={
                                    orderDetail.status === 'cancelled' ? 'red' : 
                                    ['delivered', 'completed'].includes(orderDetail.status) ? 'green' : 'blue'
                                }>
                                    {orderConstant.status[orderDetail.status] || orderDetail.status}
                                </Tag>
                            </p>
                            <p>
                                <strong>Trạng thái thanh toán:</strong> {' '}
                                <Tag color={orderDetail.isPaid ? 'green' : 'orange'}>
                                    {orderDetail.isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                                </Tag>
                            </p>
                            <p><strong>Phương thức thanh toán:</strong> {
                                orderConstant.payment[orderDetail.paymentMethod.toLowerCase()] || orderDetail.paymentMethod
                            }</p>
                        </div>
                        
                        <h3>Danh sách sản phẩm</h3>
                        <Table
                            columns={orderItemColumns}
                            dataSource={orderDetail.orderItems.map((item, index) => ({...item, key: index}))}
                            pagination={false}
                            summary={() => (
                                <Table.Summary.Row>
                                    <Table.Summary.Cell colSpan={3} align="right"><strong>Tổng cộng:</strong></Table.Summary.Cell>
                                    <Table.Summary.Cell><strong>{orderDetail.totalPrice.toLocaleString('vn-VN')} đ</strong></Table.Summary.Cell>
                                </Table.Summary.Row>
                            )}
                        />
                        
                        {orderDetail.status === 'cancelled' && (
                            <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#fff2f0', borderRadius: '4px' }}>
                                <p><strong>Lý do hủy:</strong> {orderDetail.cancelReason || 'Không có lý do'}</p>
                                <p><strong>Người hủy:</strong> {orderDetail.cancelledByRole === 'Admin' ? 'Quản trị viên' : 'Khách hàng'}</p>
                                <p><strong>Thời gian hủy:</strong> {moment(orderDetail.cancelledAt).format('DD/MM/YYYY HH:mm:ss')}</p>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AdminOrder;