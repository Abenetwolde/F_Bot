const Category = require('../Model/category');

async function getAllCategories() {
  try {
     page = 1, pageSize = 20 
    const skip = (page - 1) * pageSize;
    
    const categoriesData = await Category.find()
      .skip(skip)
      .limit(pageSize)


    const count = await Category.countDocuments();
    const totalPages = Math.ceil(count / pageSize);
 
    return {
      categories: categoriesData,
      count,
      page,
      pageSize,
      totalPages,
    };
  } catch (error) {
    throw new Error('Error fetching categories from the database.');
  }
}

module.exports = {
  getAllCategories,
};
