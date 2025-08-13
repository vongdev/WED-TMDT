import classNames from 'classnames/bind';
import styles from './ProfilePage.module.scss';
import ButtonComponent from '../../components/ButtonComponent/ButtonComponent';
import InputForm from '../../components/InputForm/InputForm';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as UserService from '../../services/UserService';
import { useMutationHook } from '../../hooks/useMutationHook';
import Loading from '../../components/LoadingComponent/Loading';
import * as message from '../../components/Message/Message';
import { updateUser } from '../../redux/slices/userSlice';
import { Button, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { getBase64 } from '../../utils';
import { useQuery } from '@tanstack/react-query';

const cx = classNames.bind(styles);

const ProfilePage = () => {
    const user = useSelector((state) => state.user);

    const [userInfo, setUserInfo] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        avatar: '',
    });

    const mutationUpdate = useMutationHook((data) => {
        const { id, access_token, ...rest } = data;
        return UserService.updateUser(id, rest, access_token);
    });

    const dispatch = useDispatch();

    useEffect(() => {
        setUserInfo({
            email: user?.email,
            name: user?.name,
            phone: user?.phone,
            address: user?.address,
            avatar: user?.avatar,
        });
    }, [user]);

    const handleGetDetailUser = async (id, token) => {
        const res = await UserService.getDetailUser(id, token);
        dispatch(updateUser({ ...res?.data, access_token: token }));
        return res;
    };

    const handleOnChange = (e) => {
        const { id, value } = e.target;
        setUserInfo((prev) => ({ ...prev, [id]: value }));
    };

    const handleOnChangeAvatar = async (fileInfo) => {
        const file = fileInfo.file;
        if (!file.url && !file.preview) {
            file.preview = await getBase64(file.originFileObj);
        }
        setUserInfo((prev) => ({ ...prev, avatar: file.preview }));
    };

    const queryUser = useQuery({
        queryKey: ['user'],
        queryFn: () => handleGetDetailUser(user?.id, user?.access_token),
    });

    const handleUpdate = () => {
        mutationUpdate.mutate(
            { id: user?.id, ...userInfo, access_token: user?.access_token },
            {
                onSuccess: () => {
                    queryUser.refetch();
                    message.success('Cập nhật thành công');
                },
                onError: () => {
                    message.error('Cập nhật thất bại');
                },
            },
        );
    };

    return (
        <div className={cx('wrapper')}>
            <h1 className={cx('title')}>Thông tin người dùng</h1>
            <Loading isLoading={mutationUpdate.isPending}>
                <div className={cx('main')}>
                    <div className={cx('row')}>
                        <h4 className={cx('label')}>Name</h4>
                        <InputForm className={cx('input')} id="name" value={userInfo.name} onChange={handleOnChange} />
                    </div>

                    <div className={cx('row')}>
                        <h4 className={cx('label')}>Email</h4>
                        <InputForm
                            className={cx('input')}
                            id="email"
                            value={userInfo.email}
                            onChange={handleOnChange}
                        />
                    </div>

                    <div className={cx('row')}>
                        <h4 className={cx('label')}>Số điện thoại</h4>
                        <InputForm
                            className={cx('input')}
                            id="phone"
                            value={userInfo.phone}
                            onChange={handleOnChange}
                        />
                    </div>

                    <div className={cx('row')}>
                        <h4 className={cx('label')}>Địa chỉ</h4>
                        <InputForm
                            className={cx('input')}
                            id="address"
                            value={userInfo.address}
                            onChange={handleOnChange}
                        />
                    </div>

                    <div className={cx('row')}>
                        <h4 className={cx('label')}>Ảnh đại diện</h4>
                        <Upload onChange={handleOnChangeAvatar} showUploadList={false}>
                            <Button icon={<UploadOutlined />}>Chọn file</Button>
                        </Upload>
                        {userInfo.avatar && <img src={userInfo.avatar} alt="avatar" className={cx('avatar')} />}
                    </div>
                </div>

                <ButtonComponent
                    onClick={handleUpdate}
                    text={'Cập nhật'}
                    styleButton={{ height: '100%', marginLeft: '200px', marginTop: '30px' }}
                    styleText={{ color: 'rgb(26, 148, 255)', fontWeight: '600' }}
                />
            </Loading>
        </div>
    );
};

export default ProfilePage;
