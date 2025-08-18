const Product = require('../models/ProductModel');
const bcrypt = require('bcrypt');
const { generalAccessToken, generalRefreshToken } = require('./JwtService');

const createProduct = (newProduct) => {
    return new Promise(async (resolve, reject) => {
        const { name, image, type, countInStock, price, rating, description, discount } = newProduct;
        try {
            // Kiểm tra email đã tồn tại hay chưa
            const checkProduct = await Product.findOne({
                name: name,
            });
            if (checkProduct !== null) {
                resolve({
                    status: 'OK',
                    message: "Product's name is already exist",
                });
            }

            const newProduct = await Product.create({
                name,
                image,
                type,
                countInStock,
                price,
                rating,
                description,
                discount,
            });
            if (newProduct) {
                resolve({
                    status: 'OK',
                    message: 'SUCCESS',
                    data: newProduct,
                });
            }
        } catch (e) {
            reject(e);
        }
    });
};

const updateProduct = (id, data) => {
    return new Promise(async (resolve, reject) => {
        try {
            const checkProduct = await Product.findOne({ _id: id });

            if (checkProduct === null) {
                resolve({
                    status: 'OK',
                    message: 'Product is not exist',
                });
            }

            const updatedProduct = await Product.findByIdAndUpdate(id, data, {
                new: true,
            });

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: updatedProduct,
            });
        } catch (e) {
            reject(e);
        }
    });
};

const deleteProduct = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const checkProduct = await Product.findOne({ _id: id });

            if (checkProduct === null) {
                resolve({
                    status: 'OK',
                    message: 'Product is not exist',
                });
            }

            await Product.findByIdAndDelete(id);

            resolve({
                status: 'OK',
                message: 'DELETE SUCCESS',
            });
        } catch (e) {
            reject(e);
        }
    });
};


const getAllProduct = async (limit, page, sort, filter) => {
  try {
    // paging: page 1-based
    const _limit = Number.isFinite(parseInt(limit)) ? parseInt(limit) : 0; // 0 = không phân trang
    const _page  = Number.isFinite(parseInt(page)) && parseInt(page) > 0 ? parseInt(page) : 1;

    // filter
    let q = {};
    if (Array.isArray(filter) && filter.length >= 2) {
      const [label, val] = filter;
      if (label && val !== undefined) q[label] = { $regex: String(val), $options: 'i' };
    } else if (typeof filter === 'string' && filter) {
      try {
        if (filter.trim().startsWith('{')) {
          const obj = JSON.parse(filter);
          Object.entries(obj).forEach(([k, v]) => {
            if (v !== undefined && v !== '') {
              q[k] = typeof v === 'string' ? { $regex: v, $options: 'i' } : v;
            }
          });
        } else if (filter.includes(':')) {
          const [label, val] = filter.split(':');
          if (label && val) q[label] = { $regex: val, $options: 'i' };
        }
      } catch { /* filter xấu thì bỏ qua */ }
    }

    // sort: hỗ trợ "-createdAt"
    let _sort = { createdAt: -1 };
    if (Array.isArray(sort) && sort.length >= 2) {
      const [dir, field] = sort;
      const dirNum = (dir === -1 || dir === '-1' || String(dir).toLowerCase() === 'desc') ? -1 : 1;
      if (field) _sort = { [field]: dirNum };
    } else if (typeof sort === 'string' && sort) {
      _sort = sort.startsWith('-') ? { [sort.slice(1)]: -1 } : { [sort]: 1 };
    }

    // query
    const total = await Product.countDocuments(q);
    let cursor = Product.find(q).sort(_sort);
    if (_limit > 0) {
      const skip = (_page - 1) * _limit;
      cursor = cursor.skip(skip).limit(_limit);
    }
    const items = await cursor.exec();

    return {
      status: 'OK',
      message: 'SUCCESS',
      data: items,
      total,
      currentPage: _limit > 0 ? _page : 1,
      totalPage: _limit > 0 ? Math.ceil(total / _limit) : 1,
    };
  } catch (err) {
    return { status: 'ERR', message: err.message || String(err) };
  }
};



const getDetailProduct = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const product = await Product.findOne({ _id: id });

            if (product === null) {
                resolve({
                    status: 'OK',
                    message: 'Product is not exist',
                });
            }

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: product,
            });
        } catch (e) {
            reject(e);
        }
    });
};

const deleteManyProduct = (ids) => {
    return new Promise(async (resolve, reject) => {
        try {
            await Product.deleteMany({ _id: ids });

            resolve({
                status: 'OK',
                message: 'DELETE PRODUCTS SUCCESS',
            });
        } catch (e) {
            reject(e);
        }
    });
};

const getAllType = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const allType = await Product.distinct('type');
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: allType,
            });
        } catch (e) {
            console.log(e);
            reject(e);
        }
    });
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
