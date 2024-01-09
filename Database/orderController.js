exports.createOrder = async (userId, orderData) => {
  try {
    const newOrder =  new Order({
      ...orderData,
      user: userId,
    });

    // Calculate total price based on order items
    newOrder.totalPrice = calculateTotalPrice(newOrder.orderItems);

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
      });
    return orders;
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw new Error('Failed to fetch orders.');
  }
};

exports.updateOrderQuantity = async (orderId, productIndex, newQuantity) => {
  try {
    const order = await Order.findById(orderId);

    if (!order) {
      throw new Error('Order not found.');
    }

    const orderItem = order.orderItems[productIndex];

    if (!orderItem) {
      throw new Error('Product not found in the order.');
    }

    // Update the quantity and recalculate total price
    orderItem.quantity = newQuantity;
    order.totalPrice = calculateTotalPrice(order.orderItems);

    await order.save();

    return order;
  } catch (error) {
    console.error('Error updating order quantity:', error);
    throw new Error('Failed to update order quantity.');
  }
};

exports.cancelOrder = async (orderId) => {
  try {
    const order = await Order.findById(orderId);

    if (!order) {
      throw new Error('Order not found.');
    }

    // Optionally, you can perform additional checks before canceling the order

    await order.remove();

    return 'Order canceled successfully.';
  } catch (error) {
    console.error('Error canceling order:', error);
    throw new Error('Failed to cancel order.');
  }
};

// Helper function to calculate total price based on order items
function calculateTotalPrice(orderItems) {
  return orderItems.reduce((total, item) => total + (item.quantity * item.product.price), 0);
}