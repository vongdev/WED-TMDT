import classNames from 'classnames/bind';
import styles from './AdminOrder.module.scss';
import { Button, Space, Select } from 'antd';
import TableComponent from '../TableComponent/TableComponent';
import InputComponent from '../InputComponent/InputComponent';
import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import * as OrderService from '../../services/OrderService';
import { SearchOutlined } from '@ant-design/icons';
import { orderConstant } from '../../constant.js';
import { useMutationHook } from '../../hooks/useMutationHook';
import * as message from '../../components/Message/Message';

const cx = classNames.bind(styles);
const { Option } = Select;

const AdminOrder = () => {
    const searchInput = useRef(null);
    const user = useSelector((state) => state?.user);
    const [dataUpdateStatus, setDataUpdateStatus] = useState({});

    const getAllOrders = async () => {
        const res = await OrderService.getAllOrders(user?.access_token);
        return res;
    };

    // Lấy doanh thu (các đơn hàng có isPaid = true)
    const getRevenue = async () => {
        const res = await OrderService.getRevenue();
        return res;
    };

    // getRevenue();

    const queryOrder = useQuery({
        queryKey: ['orders'],
        queryFn: getAllOrders,
    });

    const { isLoading: isLoadingOrders, data: orders } = queryOrder;

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

    const handleChange = (id, field, value) => {
        setDataUpdateStatus((prevState) => {
            const updatedStatus = {
                ...prevState,
                [field]: value,
            };
            mutationUpdate.mutate({ id, access_token: user.access_token, ...updatedStatus });
            return updatedStatus;
        });
    };

    const handleDeleteManyOrder = (_ids) => {
        mutationDeleteMany.mutate(
            { ids: _ids, token: user?.access_token },
            {
                onSettled: () => {
                    queryOrder.refetch();
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
                    <Button type="primary" icon={<SearchOutlined />} size="small" style={{ width: 90 }}>
                        Search
                    </Button>
                    <Button size="small" style={{ width: 90 }}>
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

    const columns = [
        {
            title: 'Tên khách hàng',
            dataIndex: 'userName',
            sorter: (a, b) => a.userName.length - b.userName.length,
            ...getColumnSearchProps('userName'),
            width: '14%',
        },
        {
            title: 'SĐT',
            dataIndex: 'phone',
            sorter: (a, b) => a.phone.length - b.phone.length,
            ...getColumnSearchProps('phone'),
        },
        {
            title: 'Địa chỉ',
            dataIndex: 'address',
            sorter: (a, b) => a.address.length - b.address.length,
            ...getColumnSearchProps('address'),
        },
        {
            title: 'Ngày đặt hàng',
            dataIndex: 'date',
            ...getColumnSearchProps('date'),
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'totalPrice',
            sorter: (a, b) => a.totalPrice - b.totalPrice,
            ...getColumnSearchProps('totalPrice'),
        },
        {
            title: 'TT Vận chuyển',
            dataIndex: 'isDelivered',
            render: (text, record) => (
                <Select
                    defaultValue={record.isDelivered}
                    onChange={(value) => handleChange(record.key, 'isDelivered', value)}
                >
                    <Option value={true}>Đã vận chuyển</Option>
                    <Option value={false}>Chưa vận chuyển</Option>
                </Select>
            ),
        },
        {
            title: 'TT Thanh toán',
            dataIndex: 'isPaid',
            render: (text, record) => (
                <Select defaultValue={record.isPaid} onChange={(value) => handleChange(record.key, 'isPaid', value)}>
                    <Option value={true}>Đã thanh toán</Option>
                    <Option value={false}>Chưa thanh toán</Option>
                </Select>
            ),
        },
        {
            title: 'Phương thức thanh toán',
            dataIndex: 'paymentMethod',
            ...getColumnSearchProps('paymentMethod'),
            width: '18%',
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
            title: 'TT Vận chuyển',
            dataIndex: 'isDelivered',
            key: 'isDelivered',
        },
        {
            title: 'TT Thanh toán',
            dataIndex: 'isPaid',
            key: 'isPaid',
        },
        {
            title: 'Phương thức thanh toán',
            dataIndex: 'paymentMethod',
            key: 'paymentMethod',
        },
    ];

    const tableData = orders?.data.map((order) => {
        return {
            ...order,
            key: order._id,
            userName: order.shippingAddress.fullName,
            phone: '0' + order.shippingAddress.phone,
            address: order.shippingAddress.address,
            date: new Date(order.createdAt).toLocaleDateString(),
            totalPrice: order.totalPrice.toLocaleString('vn-VN') + ' đ',
            isDelivered: order.isDelivered,
            isPaid: order.isPaid,
            paymentMethod: orderConstant.payment[order.paymentMethod],
        };
    });

    useEffect(() => {
        if (isSuccessUpdated && dataUpdated?.status === 'OK') {
            message.success('Cập nhật thành công!');
        } else if (isErrorUpdated) {
            message.error('Cập nhật thất bại');
        }
    }, [isSuccessUpdated, isErrorUpdated, dataUpdated?.status]);

    useEffect(() => {
        if (isSuccessDeletedMany && dataDeletedMany?.status === 'OK') {
            message.success();
        } else if (isErrorDeletedMany) {
            message.error();
        }
    }, [isSuccessDeletedMany, isErrorDeletedMany]);

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
        </div>
    );
};

export default AdminOrder;
