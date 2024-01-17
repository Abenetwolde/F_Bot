const Cart = require("../Model/cart");
const Order=  require("../Model/order") ;
async function calculateTotalPrice(cartItems) {
  let totalPrice = 0;
  for (const cartItem of cartItems.items) {
    const product = cartItem.product;
    const quantity = cartItem.quantity;
    totalPrice += product.price * quantity;
  }
  return totalPrice;
}
exports.createOrder = async (userId, orderInformation, cartItems) => {
  try {
    console.log("cart Item.......s", cartItems);
    const totalPrice = await calculateTotalPrice(cartItems);

    // Create a new order document in the database without population
    const order = await Order.create({
      telegramid: userId,
      orderItems: cartItems.items.map(cartItem => ({
        product: cartItem.product._id,
        quantity: cartItem.quantity,
      })),
      totalPrice,
      paymentType: orderInformation.paymentType,
      orderfromtelegram: true,
      shippingInfo: {
        location: orderInformation.location,
        note: orderInformation.note,
        phoneNo: orderInformation.phoneNo
      }
    });

    // Populate the orderItems.product field after creating the order
    const populatedOrder = await Order.findById(order._id).populate('orderItems.product').exec();

    // Clear the user's cart after creating the order
    await Cart.findOneAndUpdate({ user: userId }, { $set: { items: [] } });

    return populatedOrder;
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
// function calculateTotalPrice(orderItems) {
//   return orderItems.reduce((total, item) => total + (item.quantity * item.product.price), 0);
// }