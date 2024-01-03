const Product = require('../Model/product');

async function getAllProducts(data) {
 try { 
    // category, sortBy, page = 1, pageSize = 3 
    console.log("hit the prodcut api",data)
    let filter = {};
    if (data.category) {
        filter = { category: data.category };
    }
    if (data.search) {
        filter.name = { $regex: data.search, $options: 'i' };
    }
    // const sortBy = data.sortBy||"latest";

    // let sortQuery; 
    // switch (sortBy) {
    //   case 'latest':
    //     sortQuery = { createdAt: -1 };
    //     break;
    //   case 'popular':
    //     sortQuery = { countInStock: -1 };
    //     break;
    //   default:
    //     sortQuery = {};
    // }
    // if (req.query.search) {
    //     filter.$text = { $search: req.query.search };
    // }


    // Parse the page and pageSize query parameters
    const page = parseInt(data.page) || 1;
    const pageSize = parseInt(data.pageSize) || 3;
    
    // Calculate the number of products to skip
    const skip = page * pageSize-pageSize;
    
    // Find the products for the current page
    const products = await Product.find(filter).populate("category").skip(skip).limit(pageSize)/* .sort(sortQuery); */
    
    // Count the total number of products
    // const total = await Product.countDocuments(filter);
     const count = await Product.countDocuments(filter);
     const totalPages = Math.ceil(count / pageSize);
    return {
      products: products,
      count,
      page,
      pageSize,
      totalPages,
    };
  } catch (error) {
    throw new Error('Error fetching products from the database.');
  }
}
// Database file (e.g., database.js)
async function getSingleProduct(productId) {
    try {
      const product = await Product.findById(productId).populate('category');
      // Convert Mongoose document to plain JavaScript object
      return product ? product.toObject() : null;
    } catch (error) {
      throw new Error('Error fetching product from the database.');
    }
  }
  
module.exports = {
  getAllProducts,
  getSingleProduct
};
