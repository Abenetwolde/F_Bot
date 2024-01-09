const { Scenes, Markup, session } = require("telegraf")
const axios = require('axios');
// const { sendProduct } = require("./Templeat/prodcut");
const { sendCartProduct } = require("../Templeat/cart");
const { sendProdcutSummary } = require("../Templeat/summary");
const { getCart, updateCartItemQuantity, removeItemFromCart } = require("../Database/cartController");
const product = require("../Model/product");

const cart = new Scenes.BaseScene('cart');


cart.enter(async (ctx) => {


  let total = 0;
  // try {
  //   if (ctx.session.cleanUpState) {
  //     ctx.session.cleanUpState.forEach((message) => {
  //       if (message?.type === 'product' && message?.type === 'pageNavigation') {
  //         ctx.telegram.deleteMessage(ctx.chat.id, message.id);
  //       }
  //     });
  //   }
  // } catch (error) {
  //   console.log(error)
  // }
  const nocartmessage = await ctx.reply(
    `You are now viewing our your carts.`,
    Markup.keyboard([
      ['Home'],

    ]).resize(),
  )
  ctx.session.cleanUpState.push({ id: nocartmessage.message_id, type: 'cart' });
  const userId = ctx.from.id

  const cart = await getCart(userId);
  let summary = 'Your cart contains the following products:\n\n';
  if (cart) {
    const cartArg = { ...cart.items, quantity: cart.quantity };
    // console.log("cartArg",cart.items)
    for (const item of cart.items) {
      // console.log("item", item)

      // await sendProduct(ctx);
      const cartMessageInfo = await sendCartProduct(ctx, item.product._id.toString(), item)
      console.log("cart message info......", cartMessageInfo)
      ctx.session.cleanUpState.push(cartMessageInfo)
    }
    const summaryinfo = await sendProdcutSummary(ctx)
    ctx.session.cleanUpState.push(summaryinfo)
    console.log("summary info.........", summaryinfo)
  }


},




  // Display categories

);

cart.action(/(removeQuantity)_(.+)/, async (ctx) => {
  try {
    const productId = ctx.match[2];
    const userId = ctx.from.id;

    // Use updateCartItemQuantity to update the cart quantity
    const updatedCart = await updateCartItemQuantity(userId, productId, -1);

    // Fetch the updated cart using getCart
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


  const updatedCart = await updateCartItemQuantity(userId, productId, 1);

  const productData = await product.findById(productId);
  const productArg = { ...updatedCart.toObject(), quantity: updatedCart.items.find(item => item.product.equals(productId)).quantity };
  console.log("productArg...........", updatedCart)
  // const cartItemIndex = ctx.session.cart.findIndex(item => item._id === productId);
  // const cartItem = ctx.session.cart[cartItemIndex];
  // cartItem.quantity++;

  for (const cartItem of updatedCart.items) {
    await sendCartProduct(ctx, productId, cartItem);
    await sendProdcutSummary(ctx)
  }
  // await sendCartProduct(ctx, productId, updatedCart.items)

  // await ctx.scene.reenter();
});

cart.action(/remove_(.+)/, async (ctx) => {
  const productId = parseInt(ctx.match[1]);
  const cartItemIndex = ctx.session.cart.findIndex(item => item.id === productId);

  ctx.session.cart.splice(cartItemIndex, 1);
  await sendCartProduct(ctx, productId, cartItem)
  await sendProdcutSummary(ctx)
  // await ctx.scene.reenter();
});

cart.action("Home", async (ctx) => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  await ctx.scene.enter("homeScene")
});
cart.hears('Home', async (ctx) => {

  //  try {
  //      if (ctx.session.cleanUpState) {
  //          ctx.session.cleanUpState.forEach(async (message) => {
  //              if (message.type === 'cart' || message.type === 'pageNavigation' || message.type === 'summary' ) {
  //                  await ctx.telegram.deleteMessage(ctx.chat.id, message.id);
  //              }
  //          });
  //      }
  //  } catch (error) {
  //      ctx.reply(error)
  //  }
  await new Promise(resolve => setTimeout(resolve, 1000));
  //  await ctx.scene.leave(); 
  await ctx.scene.enter('homeScene');
  //  await ctx.scene.leave();
});

cart.action("checkOut", async (ctx) => {
  await ctx.reply("do you want to delevery", Markup.inlineKeyboard([
    [
      { text: "✅ Yes", callback_data: "Yes" },
      { text: "❌ No", callback_data: "No" },
    ],
  ]))

});
cart.on("callback_query", async (ctx) => {
  const data = ctx.callbackQuery.data
  if (data === "Yes") {
    ctx.scene.enter("DATE_SCENE")
    await ctx.scene.leave();
  }
  if (data === "No") {
    ctx.scene.enter("NOTE_SCENE")
    await ctx.scene.leave();
  }
})
cart.action("/GoToHome", (ctx) => {
  console.log("go to Home called")
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