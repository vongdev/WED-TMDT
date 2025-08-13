import classNames from 'classnames/bind';
import styles from './SignUpPage.module.scss';
import InputForm from '../../components/InputForm/InputForm';
import ButtonComponent from '../../components/ButtonComponent/ButtonComponent';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import * as UserService from '../../services/UserService';

import { EyeFilled, EyeInvisibleFilled } from '@ant-design/icons';
import { useMutationHook } from '../../hooks/useMutationHook';
import Loading from '../../components/LoadingComponent/Loading';
import * as message from '../../components/Message/Message';

const cx = classNames.bind(styles);

const SignUpPage = () => {
    const [isShowPassword, setIsShowPassword] = useState(false);
    const [isShowConfirmPassword, setIsShowConfirmPassword] = useState(false);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const mutation = useMutationHook((data) => UserService.signUpUser(data));

    const { data, isPending, isSuccess, isError } = mutation;

    useEffect(() => {
        if (isSuccess && data?.status === 'OK') {
            message.success('Đăng ký thành công!');
            handleNavigateSignIn();
        } else if (data?.status === 'ERR') {
            message.error(data?.message);
        }
    }, [isSuccess, isError]);

    const navigate = useNavigate();
    const handleNavigateSignIn = () => {
        navigate('/sign-in');
    };

    const handleOnChangeEmail = (e) => {
        setEmail(e.target.value);
    };

    const handleOnChangePassword = (e) => {
        setPassword(e.target.value);
    };

    const handleOnChangeConfirmPassword = (e) => {
        setConfirmPassword(e.target.value);
    };

    const handleSignUp = () => {
        mutation.mutate({ email, password, confirmPassword });
    };

    return (
        <div className={cx('wrapper')}>
            <div className={cx('container')}>
                <h1 className={cx('title')}>Đăng ký</h1>
                <p className={cx('sub-title')}>Tạo tài khoản mới</p>
                <div className={cx('form')}>
                    <div className={cx('form-email')}>
                        <p>Địa chỉ email: </p>
                        <InputForm
                            className={cx('input')}
                            type="text"
                            placeholder="Nhập địa chỉ email..."
                            value={email}
                            onChange={handleOnChangeEmail}
                        />
                    </div>
                    <div className={cx('form-password')}>
                        <p>Mật khẩu:</p>
                        <InputForm
                            className={cx('input')}
                            type={isShowPassword ? 'text' : 'password'}
                            placeholder="******"
                            value={password}
                            onChange={handleOnChangePassword}
                        />
                        <div className={cx('show-password')} onClick={() => setIsShowPassword(!isShowPassword)}>
                            {isShowPassword ? <EyeFilled /> : <EyeInvisibleFilled />}
                        </div>
                    </div>
                    <div className={cx('form-confirm-password')}>
                        <p>Xác nhận mật khẩu:</p>
                        <InputForm
                            className={cx('input')}
                            type={isShowConfirmPassword ? 'text' : 'password'}
                            placeholder="******"
                            value={confirmPassword}
                            onChange={handleOnChangeConfirmPassword}
                        />
                        <div
                            className={cx('show-confirm-password')}
                            onClick={() => setIsShowConfirmPassword(!isShowConfirmPassword)}
                        >
                            {isShowConfirmPassword ? <EyeFilled /> : <EyeInvisibleFilled />}
                        </div>
                    </div>
                    {/* {data?.status === 'ERR' && <span className={cx('err-sign-up-mes')}>{data?.message}</span>} */}
                </div>

                <Loading isLoading={isPending}>
                    <ButtonComponent
                        disabled={!email.length || !password.length || !confirmPassword.length}
                        styleButton={{
                            backgroundColor: 'red',
                            width: '100%',
                            height: '48px',
                            border: 'none',
                            borderRadius: '4px',
                            color: '#fff',
                        }}
                        text="Đăng ký"
                        styleText={{
                            fontSize: '1.3rem',
                            fontWeight: '600',
                        }}
                        onClick={handleSignUp}
                    />
                </Loading>

                <div className={cx('bottom')}>
                    <div className={cx('make-account')}>
                        <p>Đã có tài khoản?</p>
                        <span className={cx('move-to-signin')} onClick={handleNavigateSignIn}>
                            Đăng nhập
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignUpPage;
