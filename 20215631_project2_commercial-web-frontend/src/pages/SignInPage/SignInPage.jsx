import classNames from 'classnames/bind';
import styles from './SignInPage.module.scss';
import InputForm from '../../components/InputForm/InputForm';
import ButtonComponent from '../../components/ButtonComponent/ButtonComponent';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { EyeFilled, EyeInvisibleFilled } from '@ant-design/icons';
import * as UserService from '../../services/UserService';
import { useMutationHook } from '../../hooks/useMutationHook';
import Loading from '../../components/LoadingComponent/Loading';
import { jwtDecode } from 'jwt-decode';
import { useDispatch } from 'react-redux';
import { updateUser } from '../../redux/slices/userSlice';
import * as message from '../../components/Message/Message';

const cx = classNames.bind(styles);

const SignInPage = () => {
    const [isShowPassword, setIsShowPassword] = useState(false);
    const location = useLocation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState(null);

    const dispatch = useDispatch();

    const navigate = useNavigate();

    const mutation = useMutationHook((data) => UserService.loginUser(data));

    const { data, isPending, isSuccess } = mutation;

    useEffect(() => {
        if (isSuccess && data?.status === 'OK') {
            if (location?.state) {
                navigate(location.state);
            } else {
                navigate('/');
            }

            localStorage.setItem('access_token', JSON.stringify(data?.access_token));
            if (data?.access_token) {
                const decoded = jwtDecode(data?.access_token);
                if (decoded?.id) {
                    handleGetDetailUser(decoded?.id, data?.access_token);
                }
            }
        } else if (data?.status === 'ERR') {
            message.error(data?.message);
            setLoginError(data?.message);
        }
    }, [isSuccess, data]);

    const handleGetDetailUser = async (id, token) => {
        const res = await UserService.getDetailUser(id, token);
        dispatch(updateUser({ ...res?.data, access_token: token }));
    };

    const handleNavigateSignUp = () => {
        navigate('/sign-up');
    };

    const handleOnChangeEmail = (e) => {
        setEmail(e.target.value);
    };

    const handleOnChangePassword = (e) => {
        setPassword(e.target.value);
    };

    const handleSignIn = () => {
        setLoginError(null);
        mutation.mutate({
            email,
            password,
        });
    };

    return (
        <div className={cx('wrapper')}>
            <div className={cx('container')}>
                <h1 className={cx('title')}>Đăng nhập</h1>
                <p className={cx('sub-title')}>Đăng nhập vào hệ thống</p>
                <form className={cx('form')}>
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
                    {loginError && <span className={cx('err-sign-in-mes')}>{loginError}</span>}
                </form>
                <Loading isLoading={isPending}>
                    <ButtonComponent
                        disabled={!email.length || !password.length}
                        styleButton={{
                            backgroundColor: 'red',
                            width: '100%',
                            height: '48px',
                            border: 'none',
                            borderRadius: '4px',
                            color: '#fff',
                        }}
                        text="Đăng nhập"
                        styleText={{
                            fontSize: '1.3rem',
                            fontWeight: '600',
                        }}
                        onClick={handleSignIn}
                    />
                </Loading>

                <div className={cx('bottom')}>
                    <p className={cx('forget-password')}>Quên mật khẩu</p>
                    <div className={cx('make-account')}>
                        <p>Chưa có tài khoản?</p>
                        <span className={cx('move-to-signup')} onClick={handleNavigateSignUp}>
                            Đăng ký
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default SignInPage;
