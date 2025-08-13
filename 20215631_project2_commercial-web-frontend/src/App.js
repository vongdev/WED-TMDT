import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { routes } from './routes';
import DefaultComponent from './components/DefaultComponent/DefaultComponent';
import { Fragment } from 'react';
import { isJsonString } from './utils';
import { jwtDecode } from 'jwt-decode';
import * as UserService from './services/UserService';
import { useDispatch, useSelector } from 'react-redux';
import { updateUser } from './redux/slices/userSlice';
import Loading from './components/LoadingComponent/Loading';

function App() {
    const dispatch = useDispatch();
    const [isLoading, setIsLoading] = useState(false);
    const user = useSelector((state) => state.user);

    useEffect(() => {
        setIsLoading(true);
        const { storageData, decoded } = handleDecoded();
        if (decoded?.id) {
            handleGetDetailUser(decoded?.id, storageData);
        }
        setIsLoading(false);
    }, []);

    const handleDecoded = () => {
        let storageData = localStorage.getItem('access_token');
        let decoded = {};
        if (storageData && isJsonString(storageData)) {
            storageData = JSON.parse(storageData);
            decoded = jwtDecode(storageData);
        }
        return { decoded, storageData };
    };

    UserService.axiosJWT.interceptors.request.use(
        async (config) => {
            // Do something before request is sent
            const currentTime = new Date();
            const { decoded } = handleDecoded();
            if (decoded?.exp < currentTime.getTime() / 1000) {
                const data = await UserService.refreshToken();
                config.headers['token'] = `Bearer ${data.access_token}`;
            }
            return config;
        },
        (error) => {
            // Do something with request error
            return Promise.reject(error);
        },
    );

    const handleGetDetailUser = async (id, token) => {
        const res = await UserService.getDetailUser(id, token);
        dispatch(updateUser({ ...res?.data, access_token: token }));
    };

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
        </div>
    );
}

export default App;
