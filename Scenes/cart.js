const { Scenes, Markup, session } = require("telegraf")
const axios = require('axios');
const { sendCartProduct } = require("../Templeat/cart");
const { sendProdcutSummary } = require("../Templeat/summary");
const { getCart, updateCartItemQuantity, removeItemFromCart } = require("../Database/cartController");
const cart = new Scenes.BaseScene('cart');

cart.enter(async (ctx) => {

  const nocartmessage = await ctx.reply(
    `You are now viewing our your carts.`,
    Markup.keyboard([
      ['Home'],

    ]).resize(),
  )
  ctx.session.cleanUpState.push({ id: nocartmessage.message_id, type: 'cart' });
  const userId = ctx.from.id

  const cart = await getCart(userId);
  
  if (cart) {
    for (const item of cart?.items) {
      const cartMessageInfo = await sendCartProduct(ctx, item.product._id.toString(), item)
      console.log("cart message info......", cartMessageInfo)
      ctx.session.cleanUpState.push(cartMessageInfo)
    }
    const summaryinfo = await sendProdcutSummary(ctx)
    ctx.session.cleanUpState.push(summaryinfo)
    console.log("summary info.........", summaryinfo)
  }


},

);

cart.action(/(removeQuantity)_(.+)/, async (ctx) => {
  try {
    const productId = ctx.match[2];
    const userId = ctx.from.id;

 await updateCartItemQuantity(userId, productId, -1);

    const cart = await getCart(userId);

    const cartItemIndex = cart.items.findIndex(item => item.product._id.toString() === productId);
    const cartItem = cart.items[cartItemIndex];

    if (cartItem.quantity >= 1) {
      // If quantity is still greater than or equal to 1, update the cart and send the updated cart product
      await sendCartProduct(ctx, productId, cartItem);
      await sendProdcutSummary(ctx);
    }

    if (cartItem.quantity === 0) {
      await removeItemFromCart(userId, productId)

      await ctx.answerCbQuery(`You have deleted ${cartItem.product.name} from your cart page.`);

      try {
        // Delete the corresponding message from the cleanup state
        if (ctx.session.cleanUpState && ctx.session.cleanUpState.find(message => message.type === 'cart' && message.productId === productId)) {
          const messageId = ctx.session.cleanUpState.find(message => message.type === 'cart' && message.productId === productId).id;
          await ctx.deleteMessage(messageId);
        }
      } catch (error) {
        ctx.reply(error.message);
      }

      // Send the updated product summary
      await sendProdcutSummary(ctx);
    }


  } catch (error) {
    ctx.reply(error.message);
  }
});

cart.action(/(addQuantity)_(.+)/, async (ctx) => {
  const productId = ctx.match[2];
  console.log(productId)
  const userId = ctx.from.id;


 await updateCartItemQuantity(userId, productId, 1);

    const cart = await getCart(userId);

    const cartItemIndex = cart.items.findIndex(item => item.product._id.toString() === productId);
    const cartItem = cart.items[cartItemIndex];

    await sendCartProduct(ctx, productId, cartItem);
    await sendProdcutSummary(ctx)
});


cart.action("Home", async (ctx) => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  await ctx.scene.enter("homeScene")
});
cart.hears('Home', async (ctx) => {
  await new Promise(resolve => setTimeout(resolve, 1000));
 
  await ctx.scene.enter('homeScene');

});
cart.action("proceedToCheckout", async (ctx) => {
  // await sendProdcutSummary(ctx)
  await ctx.scene.enter("selectePaymentType")
//   await ctx.reply("Would you like to leave a note along with the order?", Markup.inlineKeyboard([
//     Markup.button.callback( "⏩ Skip", 'Skip')
// ]))
// await ctx.scene.leave();
});



cart.leave(async (ctx) => {
  try {
    if (ctx.session.cleanUpState) {
      ctx.session.cleanUpState.map(async (message) => {
        if (message?.type === 'nocartmessage' || message?.type === 'cart' || message?.type === 'summary') {
          console.log("reach cart leave scene")
          try {
            await ctx.telegram.deleteMessage(ctx.chat.id, message?.id);
          } catch (error) {
            console.log("error occoring", error)
          }

        }
      });
    }
  } catch (error) {
    console.error('Error in cart:', error);
  }
  await ctx.scene.leave();
});

module.exports = {
  cart
}