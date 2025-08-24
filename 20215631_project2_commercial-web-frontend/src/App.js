import React, { useEffect, useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { routes } from './routes';
import DefaultComponent from './components/DefaultComponent/DefaultComponent';
import { Fragment } from 'react';
import { jwtDecode } from 'jwt-decode';
import * as UserService from './services/UserService';
import { useDispatch, useSelector } from 'react-redux';
import { updateUser } from './redux/slices/userSlice';
import Loading from './components/LoadingComponent/Loading';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { connectSocket, disconnectSocket, joinAdminRoom, joinUserRoom, listenToNotifications } from './socket';

function App() {
    const dispatch = useDispatch();
    const [isLoading, setIsLoading] = useState(false);
    const user = useSelector((state) => state.user);

    // Sử dụng useCallback để memoize hàm
    const handleGetDetailUser = useCallback(async (id, token) => {
        try {
            const res = await UserService.getDetailUser(id, token);
            if (res?.status === 'OK') {
                dispatch(updateUser({ ...res?.data, id, access_token: token }));
                console.log('User session restored successfully');
            }
        } catch (error) {
            console.error('Error getting user details:', error);
        }
    }, [dispatch]);

    // Khởi tạo socket và lắng nghe thông báo
    useEffect(() => {
        if (user?.isLoggedIn) {
            // Kết nối socket
            connectSocket();
            
            // Tham gia phòng chat tương ứng
            if (user?.isAdmin) {
                joinAdminRoom();
            } else {
                joinUserRoom(user?.id);
            }
            
            // Lắng nghe thông báo
            listenToNotifications((notification) => {
                console.log('Notification received:', notification);
                
                // Hiển thị thông báo dựa trên loại
                if (notification.message) {
                    switch (notification.type) {
                        case 'ORDER_STATUS_UPDATED':
                            toast.info(notification.message);
                            break;
                        case 'ORDER_CANCELLED':
                            toast.warning(notification.message);
                            break;
                        default:
                            toast.info(notification.message);
                    }
                }
            });
        }
        
        // Cleanup khi component unmount
        return () => {
            disconnectSocket();
        };
    }, [user?.isLoggedIn, user?.isAdmin, user?.id]);
    

    useEffect(() => {
        const restoreUserSession = async () => {
            setIsLoading(true);
            try {
                // Lấy token từ localStorage
                const token = localStorage.getItem('access_token');
                const userId = localStorage.getItem('userId');

                if (!token || !userId) {
                    console.log('No saved session found');
                    setIsLoading(false);
                    return;
                }

                // Kiểm tra token hết hạn
                try {
                    const decoded = jwtDecode(token);
                    const currentTime = Date.now() / 1000;
                    
                    // Nếu token hết hạn, thử refresh
                    if (decoded.exp && decoded.exp < currentTime) {
                        console.log('Token expired, attempting refresh');
                        const refreshResponse = await UserService.refreshToken();
                        if (refreshResponse?.access_token) {
                            console.log('Token refreshed successfully');
                            // Tiếp tục với token mới
                            await handleGetDetailUser(userId, refreshResponse.access_token);
                        } else {
                            console.log('Failed to refresh token');
                        }
                    } else {
                        // Token còn hạn, lấy thông tin user
                        await handleGetDetailUser(userId, token);
                    }
                } catch (decodeError) {
                    console.error('Error decoding token:', decodeError);
                    // Token không hợp lệ, thử refresh
                    try {
                        const refreshResponse = await UserService.refreshToken();
                        if (refreshResponse?.access_token) {
                            await handleGetDetailUser(userId, refreshResponse.access_token);
                        }
                    } catch (refreshError) {
                        console.error('Error refreshing token:', refreshError);
                    }
                }
            } catch (error) {
                console.error('Error restoring session:', error);
            } finally {
                setIsLoading(false);
            }
        };

        restoreUserSession();
    }, [handleGetDetailUser]); // Thêm handleGetDetailUser vào dependency array

    return (
        <div>
            <Loading isLoading={isLoading}>
                <Router>
                    <Routes>
                        {routes.map((route) => {
                            const Page = route.page;
                            const isCheckAuth = !route.isPrivate || user.isAdmin;
                            const Layout = route.isShowHeader ? DefaultComponent : Fragment;
                            return (
                                <Route
                                    key={route.path}
                                    path={isCheckAuth ? route.path : undefined}
                                    element={
                                        <Layout>
                                            <Page />
                                        </Layout>
                                    }
                                />
                            );
                        })}
                    </Routes>
                </Router>
            </Loading>
            
            {/* Thêm ToastContainer để hiển thị thông báo */}
            <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />
            {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
        </div>
    );
}

export default App;