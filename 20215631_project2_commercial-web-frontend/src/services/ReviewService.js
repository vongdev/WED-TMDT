// src/services/ReviewService.js
import axios from 'axios';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const getReviewsByProduct = async (productId) => {
    const res = await axios.get(`${API_URL}/review/${productId}`);
    return res.data;
};

export const createOrUpdateReview = async (data, token) => {
    const res = await axios.post(`${API_URL}/review`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
};