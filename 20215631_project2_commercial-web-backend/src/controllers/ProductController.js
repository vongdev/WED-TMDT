const ProductService = require('../services/ProductService');

// Tạo sản phẩm
const createProduct = async (req, res) => {
    try {
        // Nếu có options thì cho phép bỏ qua check các trường ngoài cùng
        // Chỉ check nếu không có options (tạo sản phẩm truyền thống)
        const { name, image, type, countInStock, price, rating, description, discount, options } = req.body;
        if (!options || !Array.isArray(options) || options.length === 0) {
            // Sản phẩm không có options => check các trường cũ
            if (!name || !image || !type || !countInStock || !price || !rating || !discount) {
                return res.status(200).json({
                    status: 'ERR',
                    message: 'The input is required',
                });
            }
        } else {
            // Sản phẩm có options => chỉ cần name, type, image
            if (!name || !type || !image) {
                return res.status(200).json({
                    status: 'ERR',
                    message: 'The input is required (name, type, image, options)',
                });
            }
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

// Cập nhật sản phẩm
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

// Lấy chi tiết sản phẩm
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

// Xóa nhiều sản phẩm
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

// Xóa 1 sản phẩm
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

// Lấy danh sách sản phẩm
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

// Lấy tất cả loại sản phẩm
const getAllType = async (req, res) => {
    try {
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