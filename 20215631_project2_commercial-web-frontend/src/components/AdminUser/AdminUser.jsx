import classNames from 'classnames/bind';
import styles from './AdminUser.module.scss';
import { Button, Form, Space, Upload } from 'antd';
import TableComponent from '../TableComponent/TableComponent';
import ModalComponent from '../ModalComponent/ModalComponent';
import Loading from '../LoadingComponent/Loading';
import InputComponent from '../InputComponent/InputComponent';
import DrawerComponent from '../DrawerComponent/DrawerComponent';
import { getBase64 } from '../../utils';
import { useEffect, useRef, useState } from 'react';
import * as message from '../../components/Message/Message';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { useMutationHook } from '../../hooks/useMutationHook';
import * as UserService from '../../services/UserService';
import { UploadOutlined, DeleteOutlined, EditOutlined, SearchOutlined } from '@ant-design/icons';
import { AddForm, CenteredRow } from '../AdminProduct/style';

const cx = classNames.bind(styles);

const AdminUser = () => {
    const searchInput = useRef(null);

    const [rowSelected, setRowSelected] = useState('');
    const [isOpenDrawer, setIsOpenDrawer] = useState(false);
    const [isPendingUpdate, setIsPendingUpdate] = useState(false);
    const user = useSelector((state) => state?.user);

    const [stateUserDetail, setStateUserDetail] = useState({
        name: '',
        email: '',
        phone: '',
        isAdmin: false,
        avatar: '',
        address: '',
    });
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const [form] = Form.useForm();

    const mutationUpdate = useMutationHook((data) => {
        const { id, access_token, ...rests } = data;
        const res = UserService.updateUser(id, { ...rests }, access_token);
        return res;
    });

    const mutationDelete = useMutationHook((data) => {
        const { id, access_token } = data;
        const res = UserService.deleteUser(id, access_token);
        return res;
    });

    const mutationDeleteMany = useMutationHook((data) => {
        const { access_token, ...ids } = data;
        const res = UserService.deleteManyUser(ids, access_token);
        return res;
    });

    const getAllUsers = async () => {
        const res = await UserService.getAllUsers(user?.access_token);
        return res;
    };

    const {
        data: dataUpdated,
        isPending: isPendingUpdated,
        isSuccess: isSuccessUpdated,
        isError: isErrorUpdated,
    } = mutationUpdate;

    const {
        data: dataDeleted,
        isPending: isPendingDeleted,
        isSuccess: isSuccessDeleted,
        isError: isErrorDeleted,
    } = mutationDelete;

    const {
        data: dataDeletedMany,
        isPending: isPendingDeletedMany,
        isSuccess: isSuccessDeletedMany,
        isError: isErrorDeletedMany,
    } = mutationDeleteMany;

    const queryUser = useQuery({
        queryKey: ['users'],
        queryFn: getAllUsers,
    });

    const { isLoading: isLoadingUsers, data: users } = queryUser;

    const fetchGetDetailUser = async (rowSelected) => {
        if (rowSelected) {
            const res = await UserService.getDetailUser(rowSelected);
            if (res?.data) {
                setStateUserDetail({
                    name: res?.data?.name,
                    email: res?.data?.email,
                    phone: res?.data?.phone,
                    isAdmin: res?.data?.isAdmin,
                    avatar: res?.data?.avatar,
                    address: res?.data?.address,
                });
            }
            setIsPendingUpdate(false);
        }
    };

    useEffect(() => {
        form.setFieldsValue(stateUserDetail);
    }, [form, stateUserDetail]);

    useEffect(() => {
        if (rowSelected && isOpenDrawer) {
            setIsPendingUpdate(true);
            fetchGetDetailUser(rowSelected);
        }
    }, [rowSelected, isOpenDrawer]);

    const handleDetailUser = () => {
        setIsOpenDrawer(true);
    };

    const handleShowDeleteUser = () => {
        setIsDeleteModalOpen(true);
    };

    const renderAction = () => {
        return (
            <div className={cx('table-action')}>
                <DeleteOutlined style={{ color: 'red', cursor: 'pointer' }} onClick={handleShowDeleteUser} />
                <EditOutlined style={{ color: '#3C5B6F', cursor: 'pointer' }} onClick={handleDetailUser} />
            </div>
        );
    };

    const handleSearch = (selectedKeys, confirm, dataIndex) => {
        confirm();
        // setSearchText(selectedKeys[0]);
        // setSearchedColumn(dataIndex);
    };
    const handleReset = (clearFilters) => {
        clearFilters();
        // setSearchText('');
    };
    const getColumnSearchProps = (dataIndex) => ({
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
            <div
                style={{
                    padding: 8,
                }}
                onKeyDown={(e) => e.stopPropagation()}
            >
                <InputComponent
                    ref={searchInput}
                    placeholder={`Search ${dataIndex}`}
                    value={selectedKeys[0]}
                    onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                    onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
                    style={{
                        marginBottom: 8,
                        display: 'block',
                    }}
                />
                <Space>
                    <Button
                        type="primary"
                        onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
                        icon={<SearchOutlined />}
                        size="small"
                        style={{
                            width: 90,
                        }}
                    >
                        Search
                    </Button>
                    <Button
                        onClick={() => clearFilters && handleReset(clearFilters)}
                        size="small"
                        style={{
                            width: 90,
                        }}
                    >
                        Reset
                    </Button>
                </Space>
            </div>
        ),
        filterIcon: (filtered) => (
            <SearchOutlined
                style={{
                    color: filtered ? '#1677ff' : undefined,
                }}
            />
        ),
        onFilter: (value, record) => record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()),
        onFilterDropdownOpenChange: (visible) => {
            if (visible) {
                setTimeout(() => searchInput.current?.select(), 100);
            }
        },
        // render: (text) =>
        //     searchedColumn === dataIndex ? (
        //         <Highlighter
        //             highlightStyle={{
        //                 backgroundColor: '#ffc069',
        //                 padding: 0,
        //             }}
        //             searchWords={[searchText]}
        //             autoEscape
        //             textToHighlight={text ? text.toString() : ''}
        //         />
        //     ) : (
        //         text
        //     ),
    });

    const columns = [
        {
            title: 'Tên người dùng',
            dataIndex: 'name',
            sorter: (a, b) => a.name.length - b.name.length,
            ...getColumnSearchProps('name'),
        },
        {
            title: 'Email',
            dataIndex: 'email',
            sorter: (a, b) => a.email.length - b.email.length,
            ...getColumnSearchProps('email'),
        },
        {
            title: 'Địa chỉ',
            dataIndex: 'address',
            sorter: (a, b) => a.address.length - b.address.length,
            ...getColumnSearchProps('address'),
        },
        {
            title: 'Vai trò',
            dataIndex: 'isAdmin',
            filters: [
                {
                    text: 'Admin',
                    value: true,
                },
                {
                    text: 'Khách hàng',
                    value: false,
                },
            ],
        },
        {
            title: 'SĐT',
            dataIndex: 'phone',
            sorter: (a, b) => a.phone - b.phone,
            ...getColumnSearchProps('phone'),
        },
        {
            title: '',
            dataIndex: 'action',
            render: renderAction,
        },
    ];

    const columnsExport = [
        {
            title: 'Tên người dùng',
            dataIndex: 'name',
            sorter: (a, b) => a.name.length - b.name.length,
            ...getColumnSearchProps('name'),
        },
        {
            title: 'Email',
            dataIndex: 'email',
            sorter: (a, b) => a.email.length - b.email.length,
            ...getColumnSearchProps('email'),
        },
        {
            title: 'Địa chỉ',
            dataIndex: 'address',
            sorter: (a, b) => a.address.length - b.address.length,
            ...getColumnSearchProps('address'),
        },
        {
            title: 'Vai trò',
            dataIndex: 'isAdmin',
            filters: [
                {
                    text: 'Admin',
                    value: true,
                },
                {
                    text: 'Khách hàng',
                    value: false,
                },
            ],
        },
        {
            title: 'SĐT',
            dataIndex: 'phone',
            sorter: (a, b) => a.phone - b.phone,
            ...getColumnSearchProps('phone'),
        },
    ];

    const tableData = users?.data.map((user) => {
        return {
            ...user,
            key: user._id,
            phone: user.phone,
            isAdmin: user.isAdmin ? 'Admin' : 'Khách hàng',
        };
    });

    useEffect(() => {
        if (isSuccessUpdated && dataUpdated?.status === 'OK') {
            message.success();
            handleCloseDrawer();
        } else if (isErrorUpdated) {
            message.error();
        }
    }, [isSuccessUpdated, isErrorUpdated]);

    useEffect(() => {
        if (isSuccessDeleted && dataDeleted?.status === 'OK') {
            message.success();
            setIsDeleteModalOpen(false);
        } else if (isErrorDeleted) {
            message.error();
        }
    }, [isSuccessDeleted, isErrorDeleted]);

    useEffect(() => {
        if (isSuccessDeletedMany && dataDeletedMany?.status === 'OK') {
            message.success();
        } else if (isErrorDeletedMany) {
            message.error();
        }
    }, [isSuccessDeletedMany, isErrorDeletedMany]);

    const handleDeleteUser = () => {
        mutationDelete.mutate(
            { id: rowSelected, token: user?.access_token },
            {
                onSettled: () => {
                    queryUser.refetch();
                },
            },
        );
    };

    const handleDeleteManyUser = (_ids) => {
        mutationDeleteMany.mutate(
            { ids: _ids, token: user?.access_token },
            {
                onSettled: () => {
                    queryUser.refetch();
                },
            },
        );
    };

    const handleDeleteCancel = () => {
        setIsDeleteModalOpen(false);
    };

    const handleCloseDrawer = () => {
        setIsOpenDrawer(false);
        setStateUserDetail({
            name: '',
            email: '',
            phone: '',
            isAdmin: false,
        });
        form.resetFields();
    };

    const onUpdateUser = () => {
        handleCloseDrawer();
    };
    return (
        <div className={cx('wrapper')}>
            <h1 className={cx('title')}>Quản lý người dùng</h1>
            <div>
                <TableComponent
                    columns={columns}
                    columnsExport={columnsExport}
                    data={tableData}
                    isLoading={isLoadingUsers}
                    handleDeleteMany={handleDeleteManyUser}
                    onRow={(record, rowIndex) => {
                        return {
                            onClick: (event) => {
                                setRowSelected(record._id);
                            },
                        };
                    }}
                />
            </div>

            <DrawerComponent
                title="Chi tiết Khách hàng"
                isOpen={isOpenDrawer}
                onClose={() => setIsOpenDrawer(false)}
                width="90%"
            >
                <Loading isLoading={isPendingUpdate}>
                    <AddForm
                        name="basic"
                        labelCol={{
                            span: 6,
                        }}
                        wrapperCol={{
                            span: 18,
                        }}
                        style={{
                            maxWidth: 600,
                        }}
                        initialValues={{
                            remember: true,
                        }}
                        onFinish={onUpdateUser}
                        autoComplete="on"
                        form={form}
                    >
                        <Form.Item label="Tên khách hàng" name="name">
                            <InputComponent disabled value={stateUserDetail.name} name="name" />
                        </Form.Item>

                        <Form.Item label="Email" name="email">
                            <InputComponent value={stateUserDetail.email} disabled name="email" />
                        </Form.Item>

                        <Form.Item label="Số điện thoại" name="phone">
                            <InputComponent value={stateUserDetail.phone} disabled name="phone" />
                        </Form.Item>

                        <Form.Item label="Địa chỉ" name="address">
                            <InputComponent disabled value={stateUserDetail.address} name="address" />
                        </Form.Item>

                        <Form.Item
                            wrapperCol={{
                                offset: 8,
                                span: 16,
                            }}
                        >
                            <Button className={cx('submit-btn')} type="primary" htmlType="submit">
                                Xác nhận
                            </Button>
                        </Form.Item>
                    </AddForm>
                </Loading>
            </DrawerComponent>

            <ModalComponent
                title="Xóa khách hàng"
                open={isDeleteModalOpen}
                onCancel={handleDeleteCancel}
                onOk={handleDeleteUser}
            >
                <Loading isLoading={isPendingDeleted}>
                    <div>Bạn chắc chắn muốn xóa tài khoản này ?</div>
                </Loading>
            </ModalComponent>
        </div>
    );
};

export default AdminUser;
