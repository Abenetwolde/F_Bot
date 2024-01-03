// botFunctions.js
const Order = require('../Model/order');

exports.createOrder = async (userId, orderData) => {
  try {
    const newOrder =  new Order({
      ...orderData,
    });

    const savedOrder = await newOrder.save();
    return savedOrder._id;
  } catch (error) {
    console.error('Error creating order:', error);
    throw new Error('Failed to create order.');
  }
};

exports.getOrders = async () => {
  try {
    const orders = await Order.find()
      .populate('user')
      .populate({
        path: 'orderItems.product',
        populate: {
          path: 'category',
          model: 'Category', // replace with your actual Category model name
        },
      })
   

    return orders;
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw new Error('Failed to fetch orders.');
  }
};
