const Cart = require('../Model/cart');

const Product = require('../Model/product'); // Import the Product model

async function createCart(userId, productId, quantity) {
  try {
    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    const cartItem = cart.items.find((item) => item.product.toString() === productId);

    if (!cartItem) {
      const productData = await Product.findById(productId);
      const product = { product: productData, quantity };
      cart.items.push(product);
    } else {
      cartItem.quantity += quantity;
    }

    await cart.save();

    // Manually populate product details
    const populatedCart = await Cart.findById(cart._id).populate({
      path: 'items.product',
      populate: {
        path: 'category',
        model: 'Category', // replace with your actual Category model name
      },
    });

    return populatedCart.items.find((item) => item.product._id.toString() === productId);
  } catch (error) {
    console.error('Error creating cart:', error);
    throw new Error('Failed to create cart.');
  }
}




async function getCart  (userId)  {
    try {
      const cart = await Cart.findOne({ user: userId }).populate({
        path: 'items.product',
        populate: {
          path: 'category',
          model: 'Category', // replace with your actual Category model name
        },
      })
      console.log("cart get",cart)
      return cart || { items: [] }; // Return an empty cart if not found
    } catch (error) {
      console.error('Error fetching cart:', error);
      throw new Error('Failed to fetch cart.');
    }
}
async function updateCartItemQuantity(userId, productId, quantity) {
  try {
    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      throw new Error('Cart not found.');
    }

    // Check if the item is already in the cart
    const existingItem = cart.items.find(item => item.product.equals(productId));

    if (existingItem) {
      // If the item is already in the cart, update the quantity
      if (quantity > 0) {
        // Add quantity
        existingItem.quantity += quantity;
      } else if (quantity < 0) {
        // Subtract quantity, but ensure it doesn't go below 0
        existingItem.quantity = Math.max(existingItem.quantity + quantity, 0);
      }
    } else if (quantity > 0) {
      // If the item is not in the cart and quantity is positive, add it
      cart.items.push({ product: productId, quantity });
    }

    // Save the updated cart
    await cart.save();

    // Populate the 'product' field in the 'items' array
    const updatedCart = await Cart.findOne({ user: userId }).populate({
      path: 'items.product',
      populate: {
        path: 'category',
        model: 'Category', // replace with your actual Category model name
      },
    });

    return updatedCart;
  } catch (error) {
    console.error('Error updating cart item quantity:', error);
    throw new Error('Failed to update cart item quantity.');
  }
}

  

  
async function removeItemFromCart(cartId) {
  console.log("cartId",cartId)
    try {
      const cart = await Cart.findByIdAndDelete(cartId);
  
      if (!cart) {
        throw new Error('Cart not found.');
      }
  
      // // Remove the item from the cart based on the productId
      // cart.items = cart.items.filter(item => !item.product.equals(productId));
  
      // Save the updated cart
      // await cart.save();

  
      return cart;
    } catch (error) {
      console.error('Error removing item from cart:', error);
      throw new Error('Failed to remove item from cart.');
    }
  }
  
  module.exports = { createCart, getCart,updateCartItemQuantity, removeItemFromCart };