import axios from 'axios';
import { axiosJWT, authHeader } from './UserService'; // import thêm authHeader nếu có

export const getAllProduct = async (search, limit) => {
    let res = {};
    if (search?.length > 0) {
        res = await axios.get(`${process.env.REACT_APP_API_URL}/product/get-all?filter=name&filter=${search}`);
    } else {
        if (limit) res = await axios.get(`${process.env.REACT_APP_API_URL}/product/get-all?limit=${limit}`);
        else res = await axios.get(`${process.env.REACT_APP_API_URL}/product/get-all`);
    }
    return res.data;
};

export const createProduct = async (data) => {
    const res = await axios.post(`${process.env.REACT_APP_API_URL}/product/create`, data);
    return res.data;
};

export const getDetailProduct = async (id) => {
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/product/detail/${id}`);
    return res.data;
};

// ==== SỬA ĐÚNG CHUẨN AUTHORIZATION HEADER ====
export const updateProduct = async (id, access_token, data) => {
    const res = await axiosJWT.put(
        `${process.env.REACT_APP_API_URL}/product/update/${id}`,
        data,
        authHeader(access_token)
    );
    return res.data;
};

export const deleteProduct = async (id, access_token) => {
    const res = await axiosJWT.delete(
        `${process.env.REACT_APP_API_URL}/product/delete/${id}`,
        authHeader(access_token)
    );
    return res.data;
};

export const deleteManyProduct = async (data, access_token) => {
    const res = await axiosJWT.post(
        `${process.env.REACT_APP_API_URL}/product/delete-many-product`,
        data,
        authHeader(access_token)
    );
    return res.data;
};

export const getAllTypeProduct = async () => {
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/product/get-all-type`);
    return res.data;
};

export const getProductType = async (type, page, limit) => {
    if (type) {
        const res = await axios.get(
            `${process.env.REACT_APP_API_URL}/product/get-all?filter=type&filter=${type}&limit=${limit}&page=${page}`,
        );
        return res.data;
    }
};