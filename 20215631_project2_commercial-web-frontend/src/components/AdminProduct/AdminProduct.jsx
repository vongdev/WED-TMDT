import classNames from 'classnames/bind';
import styles from './AdminProduct.module.scss';
import { Button, Form, Input, Modal, Select, Space, Upload } from 'antd';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import TableComponent from '../TableComponent/TableComponent';
import { useEffect, useRef, useState } from 'react';
import InputComponent from '../InputComponent/InputComponent';
import { AddForm, CenteredRow } from './style';
import { getBase64, renderOptions } from '../../utils';
import { useMutationHook } from '../../hooks/useMutationHook';
import * as ProductService from '../../services/ProductService';
import Loading from '../LoadingComponent/Loading';
import * as message from '../../components/Message/Message';
import { useQuery } from '@tanstack/react-query';
import { DeleteOutlined, EditOutlined, SearchOutlined } from '@ant-design/icons';
import DrawerComponent from '../DrawerComponent/DrawerComponent';
import { useSelector } from 'react-redux';
import ModalComponent from '../ModalComponent/ModalComponent';
import Highlighter from 'react-highlight-words';

const cx = classNames.bind(styles);

const AdminProduct = () => {
    const searchInput = useRef(null);
    const user = useSelector((state) => state?.user);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [rowSelected, setRowSelected] = useState('');
    const [isOpenDrawer, setIsOpenDrawer] = useState(false);
    const [isPendingUpdate, setIsPendingUpdate] = useState(false);
    const [typeSelect, setTypeSelect] = useState('');

    const initialProduct = () => ({
        name: '',
        price: '',
        description: '',
        rating: '',
        image: '',
        type: '',
        countInStock: '',
        newType: '',
        discount: '',
    });
    const [stateProduct, setStateProduct] = useState(initialProduct());
    const [stateProductDetail, setStateProductDetail] = useState(initialProduct());
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const [form] = Form.useForm();

    const mutation = useMutationHook((data) => {
        const { name, price, description, rating, image, type, countInStock, discount } = data;
        const res = ProductService.createProduct({
            name,
            price,
            description,
            rating,
            image,
            type,
            countInStock,
            discount,
        });
        return res;
    });

    const mutationUpdate = useMutationHook((data) => {
        const { id, access_token, ...rests } = data;
        const res = ProductService.updateProduct(id, access_token, { ...rests });
        return res;
    });

    const mutationDelete = useMutationHook((data) => {
        const { id, access_token } = data;
        const res = ProductService.deleteProduct(id, access_token);
        return res;
    });

    const mutationDeleteMany = useMutationHook((data) => {
        const { access_token, ...ids } = data;
        const res = ProductService.deleteManyProduct(ids, access_token);
        return res;
    });

    const getAllProduct = async () => {
        const res = await ProductService.getAllProduct();
        return res;
    };

    const fetchAllTypeProduct = async () => {
        const res = await ProductService.getAllTypeProduct();
        return res;
    };

    const { data, isPending, isSuccess, isError } = mutation;
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

    const queryProduct = useQuery({
        queryKey: ['products'],
        queryFn: getAllProduct,
    });

    const typeProduct = useQuery({
        queryKey: ['type-product'],
        queryFn: fetchAllTypeProduct,
    });

    const { isLoading: isLoadingProducts, data: products } = queryProduct;

    const fetchGetDetailProduct = async (rowSelected) => {
        if (rowSelected) {
            const res = await ProductService.getDetailProduct(rowSelected);
            if (res?.data) {
                setStateProductDetail({
                    name: res?.data?.name,
                    price: res?.data?.price,
                    description: res?.data?.description,
                    rating: res?.data?.rating,
                    image: res?.data?.image,
                    type: res?.data?.type,
                    countInStock: res?.data?.countInStock,
                    discount: res?.data?.discount,
                });
            }
            setIsPendingUpdate(false);
        }
    };

    useEffect(() => {
        if (!isModalOpen) form.setFieldsValue(stateProductDetail);
        else form.setFieldsValue(initialProduct());
    }, [form, stateProductDetail, isModalOpen]);

    useEffect(() => {
        if (rowSelected) {
            setIsPendingUpdate(true);
            fetchGetDetailProduct(rowSelected);
        }
    }, [rowSelected]);

    const handleDetailProduct = () => {
        setIsOpenDrawer(true);
    };

    const handleShowDeleteProduct = () => {
        setIsDeleteModalOpen(true);
    };

    const renderAction = () => {
        return (
            <div className={cx('table-action')}>
                <DeleteOutlined style={{ color: 'red', cursor: 'pointer' }} onClick={handleShowDeleteProduct} />
                <EditOutlined style={{ color: '#3C5B6F', cursor: 'pointer' }} onClick={handleDetailProduct} />
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
            title: 'Tên sản phẩm',
            dataIndex: 'name',
            sorter: (a, b) => a.name.length - b.name.length,
            ...getColumnSearchProps('name'),
            width: '40%',

        },
        {
            title: 'Giá',
            dataIndex: 'price',
            sorter: (a, b) => parseFloat(a.price.replace(/[,.đ]/g, '')) - parseFloat(b.price.replace(/[,.đ]/g, '')),
            filters: [
                {
                    text: '< 10.000.000đ',
                    value: 'opt1',
                },
                {
                    text: 'Từ 10.000.000đ đến 30.000.000đ',
                    value: 'opt2',
                },
                {
                    text: '>= 30.000.000đ',
                    value: 'opt3',
                },
            ],
            filterMode: 'tree',
            filterSearch: true,
            onFilter: (value, record) => {
                if (value === 'opt1') return parseFloat(record.price.replace(/[,.đ]/g, '')) < 10000000;
                else if (value === 'opt2')
                    return (
                        parseFloat(record.price.replace(/[,.đ]/g, '')) >= 10000000 &&
                        parseFloat(record.price.replace(/[,.đ]/g, '')) < 30000000
                    );
                else return parseFloat(record.price.replace(/[,.đ]/g, '')) >= 30000000;
            },
            ellipsis: true
        },
        {
            title: 'Đánh giá',
            dataIndex: 'rating',
            sorter: (a, b) => a.rating - b.rating,
            filters: [
                {
                    text: '>= 4',
                    value: 'opt1',
                },
                {
                    text: '3 <= rating < 4',
                    value: 'opt2',
                },
                {
                    text: '2 <= rating < 3',
                    value: 'opt3',
                },
                {
                    text: '< 2',
                    value: 'opt4',
                },
            ],
            filterMode: 'tree',
            filterSearch: true,
            onFilter: (value, record) => {
                if (value === 'opt1') return record.rating >= 4;
                else if (value === 'opt2') return record.price >= 3 && record.price < 4;
                else if (value === 'opt3') return record.price >= 2 && record.price < 3;
                else return record.price < 2;
            },
            ellipsis: true
        },
        {
            title: 'Loại',
            dataIndex: 'type',
        },
        {
            title: 'Action',
            dataIndex: 'action',
            render: renderAction,
        },
    ];

    const columnsExport = [
        {
            title: 'Tên sản phẩm',
            dataIndex: 'name',
            sorter: (a, b) => a.name.length - b.name.length,
            ...getColumnSearchProps('name'),
        },
        {
            title: 'Giá',
            dataIndex: 'price',
            sorter: (a, b) => a.price - b.price,
        },
        {
            title: 'Đánh giá',
            dataIndex: 'rating',
            sorter: (a, b) => a.rating - b.rating,
        },
        {
            title: 'Loại',
            dataIndex: 'type',
        },
    ];

    const tableData = products?.data.map((product) => {
        return { ...product, price: product.price.toLocaleString('vn-VN') + ' đ', key: product._id };
    });

    useEffect(() => {
        if (isSuccess && data?.status === 'OK') {
            message.success();
            handleCancel();
        } else if (isError) {
            message.error();
        }
    }, [isSuccess, isError]);

    useEffect(() => {
        if (isSuccessDeleted && dataDeleted?.status === 'OK') {
            message.success();
            handleDeleteCancel();
        } else if (isError) {
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

    useEffect(() => {
        if (isSuccessUpdated && dataUpdated?.status === 'OK') {
            message.success();
            handleCloseDrawer();
        } else if (isErrorUpdated) {
            message.error();
        }
    }, [isSuccessUpdated, isErrorUpdated]);

    const handleDeleteProduct = () => {
        mutationDelete.mutate(
            { id: rowSelected, token: user?.access_token },
            {
                onSettled: () => {
                    queryProduct.refetch();
                },
            },
        );
    };

    const handleDeleteManyProduct = (_ids) => {
        mutationDeleteMany.mutate(
            { ids: _ids, token: user?.access_token },
            {
                onSettled: () => {
                    queryProduct.refetch();
                },
            },
        );
    };

    const handleDeleteCancel = () => {
        setIsDeleteModalOpen(false);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
        setStateProduct({
            name: '',
            price: '',
            description: '',
            rating: '',
            image: '',
            type: '',
            countInStock: '',
            discount: '',
        });
        form.resetFields();
    };

    const handleCloseDrawer = () => {
        setIsOpenDrawer(false);
        setStateProductDetail({
            name: '',
            price: '',
            description: '',
            rating: '',
            image: '',
            type: '',
            countInStock: '',
        });
        form.resetFields();
    };

    const onFinish = () => {
        const params = {
            name: stateProduct.name,
            price: stateProduct.price,
            description: stateProduct.description,
            rating: stateProduct.rating,
            image: stateProduct.image,
            type: stateProduct.type === 'add_type' ? stateProduct.newType : stateProduct.type,
            countInStock: stateProduct.countInStock,
            discount: stateProduct.discount,
        };
        mutation.mutate(params, {
            onSettled: () => {
                queryProduct.refetch();
                typeProduct.refetch();
            },
        });
    };

    const handleOnChange = (e) => {
        setStateProduct({
            ...stateProduct,
            [e.target.name]: e.target.value,
        });
    };

    const handleOnChangeDetail = (e) => {
        setStateProductDetail({
            ...stateProductDetail,
            [e.target.name]: e.target.value,
        });
    };

    const handleOnChangeSelectType = (value) => {
        setStateProduct({
            ...stateProduct,
            type: value,
        });
    };

    const handleOnChangeAvatar = async (fileInfo) => {
        // const file = fileList[0];
        const file = fileInfo.file;
        if (!file.url && !file.preview) {
            file.preview = await getBase64(file.originFileObj);
        }
        setStateProduct({
            ...stateProduct,
            image: file.preview,
        });
    };

    const handleOnChangeAvatarDetail = async (fileInfo) => {
        // const file = fileList[0];
        const file = fileInfo.file;
        if (!file.url && !file.preview) {
            file.preview = await getBase64(file.originFileObj);
        }
        setStateProductDetail({
            ...stateProductDetail,
            image: file.preview,
        });
    };

    const onUpdateProduct = () => {
        mutationUpdate.mutate(
            { id: rowSelected, access_token: user?.access_token, ...stateProductDetail },
            {
                onSettled: () => {
                    queryProduct.refetch();
                },
            },
        );
    };

    return (
        <div className={cx('wrapper')}>
            <h1 className={cx('title')}>Quản lý sản phẩm</h1>

            <Button className={cx('add-button')} icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
                Thêm
            </Button>

            <div>
                <TableComponent
                    columns={columns}
                    columnsExport={columnsExport}
                    data={tableData}
                    isLoading={isLoadingProducts}
                    handleDeleteMany={handleDeleteManyProduct}
                    onRow={(record, rowIndex) => {
                        return {
                            onClick: (event) => {
                                setRowSelected(record._id);
                            },
                        };
                    }}
                />
            </div>

            <ModalComponent forceRender title="Tạo sản phẩm" open={isModalOpen} onCancel={handleCancel} footer={null}>
                <Loading isLoading={isPending}>
                    <AddForm
                        name="basic"
                        labelCol={{
                            span: 8,
                        }}
                        wrapperCol={{
                            span: 16,
                        }}
                        style={{
                            maxWidth: 600,
                        }}
                        initialValues={{
                            remember: true,
                        }}
                        onFinish={onFinish}
                        autoComplete="off"
                        form={form}
                    >
                        <Form.Item
                            label="Tên sản phẩm"
                            name="Name"
                            rules={[
                                {
                                    required: true,
                                    message: 'Vui lòng nhập tên sản phẩm!',
                                },
                            ]}
                        >
                            <InputComponent value={stateProduct.name} onChange={handleOnChange} name="name" />
                        </Form.Item>

                        <Form.Item
                            label="Loại"
                            name="type"
                            rules={[
                                {
                                    required: true,
                                    message: 'Vui lòng chọn loại sản phẩm!',
                                },
                            ]}
                        >
                            <Select
                                value={stateProduct.type}
                                onChange={handleOnChangeSelectType}
                                options={renderOptions(typeProduct?.data?.data)}
                            />
                            {/* {typeSelect === 'add_type' && (
                                <InputComponent value={stateProduct.type} onChange={handleOnChange} name="type" />
                            )} */}
                        </Form.Item>

                        {stateProduct.type === 'add_type' && (
                            <Form.Item
                                label="Thêm loại"
                                name="newType"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Vui lòng nhập loại sản phẩm mới',
                                    },
                                ]}
                            >
                                <InputComponent value={stateProduct.newType} onChange={handleOnChange} name="newType" />
                            </Form.Item>
                        )}

                        <Form.Item
                            label="Số lượng trong kho"
                            name="countInStock"
                            rules={[
                                {
                                    required: true,
                                    message: 'Vui lòng nhập số lượng sản phẩm!',
                                },
                            ]}
                        >
                            <InputComponent
                                value={stateProduct.countInStock}
                                onChange={handleOnChange}
                                name="countInStock"
                            />
                        </Form.Item>

                        <Form.Item
                            label="Giá"
                            name="price"
                            rules={[
                                {
                                    required: true,
                                    message: 'Vui lòng nhập giá sản phẩm!',
                                },
                            ]}
                        >
                            <InputComponent value={stateProduct.price} onChange={handleOnChange} name="price" />
                        </Form.Item>

                        <Form.Item
                            label="Đánh giá"
                            name="rating"
                            rules={[
                                {
                                    required: true,
                                    message: 'Vui lòng nhập điểm đánh giá sản phẩm!',
                                },
                            ]}
                        >
                            <InputComponent value={stateProduct.rating} onChange={handleOnChange} name="rating" />
                        </Form.Item>

                        <Form.Item
                            label="Giảm giá"
                            name="discount"
                            rules={[
                                {
                                    required: true,
                                    message: 'Vui lòng nhập giảm giá sản phẩm!',
                                },
                            ]}
                        >
                            <InputComponent value={stateProduct.discount} onChange={handleOnChange} name="discount" />
                        </Form.Item>

                        <Form.Item
                            label="Mô tả"
                            name="description"
                            rules={[
                                {
                                    required: true,
                                    message: 'Vui lòng nhập mô tả sản phẩm!',
                                },
                            ]}
                        >
                            <InputComponent
                                value={stateProduct.description}
                                onChange={handleOnChange}
                                name="description"
                            />
                        </Form.Item>

                        <CenteredRow label="Hình ảnh" name="image">
                            <Upload onChange={handleOnChangeAvatar} showUploadList={false}>
                                <Button icon={<UploadOutlined />}>Chọn file</Button>
                            </Upload>
                            {stateProduct.image && (
                                <img src={stateProduct.image} alt="avatar" className={cx('avatar')} />
                            )}
                        </CenteredRow>

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
            </ModalComponent>

            <DrawerComponent
                title="Chi tiết sản phẩm"
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
                        // onFinish={onUpdateProduct}
                        autoComplete="off"
                        form={form}
                    >
                        <Form.Item
                            label="Tên sản phẩm"
                            name="name"
                            rules={[
                                {
                                    required: true,
                                    message: 'Vui lòng nhập tên sản phẩm!',
                                },
                            ]}
                        >
                            <InputComponent
                                value={stateProductDetail.name}
                                onChange={handleOnChangeDetail}
                                name="name"
                            />
                        </Form.Item>

                        <Form.Item
                            label="Loại"
                            name="type"
                            rules={[
                                {
                                    required: true,
                                    message: 'Vui lòng nhập loại sản phẩm!',
                                },
                            ]}
                        >
                            <InputComponent
                                value={stateProductDetail.type}
                                onChange={handleOnChangeDetail}
                                name="type"
                            />
                        </Form.Item>

                        <Form.Item
                            label="Số lượng trong kho"
                            name="countInStock"
                            rules={[
                                {
                                    required: true,
                                    message: 'Vui lòng nhập số lượng sản phẩm!',
                                },
                            ]}
                        >
                            <InputComponent
                                value={stateProductDetail.countInStock}
                                onChange={handleOnChangeDetail}
                                name="countInStock"
                            />
                        </Form.Item>

                        <Form.Item
                            label="Giá"
                            name="price"
                            rules={[
                                {
                                    required: true,
                                    message: 'Vui lòng nhập giá sản phẩm!',
                                },
                            ]}
                        >
                            <InputComponent
                                value={stateProductDetail.price}
                                onChange={handleOnChangeDetail}
                                name="price"
                            />
                        </Form.Item>

                        <Form.Item
                            label="Đánh giá"
                            name="rating"
                            rules={[
                                {
                                    required: true,
                                    message: 'Vui lòng nhập điểm đánh giá sản phẩm!',
                                },
                            ]}
                        >
                            <InputComponent
                                value={stateProductDetail.rating}
                                onChange={handleOnChangeDetail}
                                name="rating"
                            />
                        </Form.Item>

                        <Form.Item
                            label="Giảm giá"
                            name="discount"
                            rules={[
                                {
                                    required: true,
                                    message: 'Vui lòng nhập giảm giá sản phẩm!',
                                },
                            ]}
                        >
                            <InputComponent
                                value={stateProductDetail.discount}
                                onChange={handleOnChangeDetail}
                                name="discount"
                            />
                        </Form.Item>

                        <Form.Item
                            label="Mô tả"
                            name="description"
                            rules={[
                                {
                                    required: true,
                                    message: 'Vui lòng nhập mô tả sản phẩm!',
                                },
                            ]}
                        >
                            <InputComponent
                                value={stateProductDetail.description}
                                onChange={handleOnChangeDetail}
                                name="description"
                            />
                        </Form.Item>

                        <CenteredRow
                            label="Hình ảnh"
                            name="image"
                            rules={[
                                {
                                    required: true,
                                },
                            ]}
                        >
                            <Upload onChange={handleOnChangeAvatarDetail} showUploadList={false}>
                                <Button icon={<UploadOutlined />}>Chọn file</Button>
                            </Upload>
                            {stateProductDetail?.image && (
                                <img src={stateProductDetail?.image} alt="avatar" className={cx('avatar')} />
                            )}
                        </CenteredRow>

                        <Form.Item
                            wrapperCol={{
                                offset: 8,
                                span: 16,
                            }}
                        >
                            <Button
                                className={cx('submit-btn')}
                                type="primary"
                                htmlType="submit"
                                onClick={onUpdateProduct}
                            >
                                Xác nhận
                            </Button>
                        </Form.Item>
                    </AddForm>
                </Loading>
            </DrawerComponent>

            <ModalComponent
                forceRender
                title="Xóa sản phẩm"
                open={isDeleteModalOpen}
                onCancel={handleDeleteCancel}
                onOk={handleDeleteProduct}
            >
                <Loading isLoading={isPendingDeleted}>
                    <div>Bạn chắc chắn muốn xóa sản phẩm này ?</div>
                </Loading>
            </ModalComponent>
        </div>
    );
};

export default AdminProduct;
