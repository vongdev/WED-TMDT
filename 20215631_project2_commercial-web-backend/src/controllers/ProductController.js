const ProductService = require('../services/ProductService');

const createProduct = async (req, res) => {
    try {
        const { name, image, type, countInStock, price, rating, description, discount } = req.body;

        if (!name || !image || !type || !countInStock || !price || !rating || !discount) {
            return res.status(200).json({
                status: 'ERR',
                message: 'The input is required',
            });
        }
        const response = await ProductService.createProduct(req.body);
        return res.status(200).json(response);
    } catch (e) {
        console.log(e);
        return res.status(404).json({
            message: e,
        });
    }
};

const updateProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const data = req.body;
        if (!productId) {
            return res.status(200).json({
                status: 'ERR',
                message: 'productId is required',
            });
        }
        const response = await ProductService.updateProduct(productId, data);
        return res.status(200).json(response);
    } catch (e) {
        console.log(e);
        return res.status(404).json({
            message: e,
        });
    }
};

const getDetailProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        if (!productId) {
            return res.status(200).json({
                status: 'ERR',
                message: 'productId is required',
            });
        }
        const response = await ProductService.getDetailProduct(productId);
        return res.status(200).json(response);
    } catch (e) {
        console.log(e);
        return res.status(404).json({
            message: e,
        });
    }
};

const deleteManyProduct = async (req, res) => {
    try {
        const productIds = req.body.ids;
        if (!productIds) {
            return res.status(200).json({
                status: 'ERR',
                message: 'productIds are required',
            });
        }
        const response = await ProductService.deleteManyProduct(productIds);
        return res.status(200).json(response);
    } catch (e) {
        console.log(e);
        return res.status(404).json({
            message: e,
        });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        if (!productId) {
            return res.status(200).json({
                status: 'ERR',
                message: 'productId is required',
            });
        }
        const response = await ProductService.deleteProduct(productId);
        return res.status(200).json(response);
    } catch (e) {
        console.log(e);
        return res.status(404).json({
            message: e,
        });
    }
};

// controllers/ProductController.js
const getAllProduct = async (req, res) => {
  try {
    const { limit, page, sort, filter } = req.query;
    const response = await ProductService.getAllProduct(limit, page, sort, filter);
    return res.status(200).json(response);
  } catch (e) {
    console.log('getAllProduct ERROR:', e);
    return res.status(404).json({ message: e?.message || String(e) });
  }
};

const getAllType = async (req, res) => {
    try {
        const { limit, page, sort, filter } = req.query;
        const response = await ProductService.getAllType();
        return res.status(200).json(response);
    } catch (e) {
        return res.status(404).json({
            message: e,
        });
    }
};

module.exports = {
    createProduct,
    updateProduct,
    getDetailProduct,
    deleteProduct,
    getAllProduct,
    deleteManyProduct,
    getAllType,
};
