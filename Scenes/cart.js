const { Scenes, Markup, session } = require("telegraf")
const axios = require('axios');
// const { sendProduct } = require("./Templeat/prodcut");
const { sendCartProduct } = require("../Templeat/cart");
const { sendProdcutSummary } = require("../Templeat/summary");

const cart = new Scenes.BaseScene('cart');

 
cart.enter(async (ctx) => {

   
  let total = 0;
  try {
    if (ctx.session.cleanUpState) {
        ctx.session.cleanUpState.forEach((message) => {
            if (message.type === 'product' && message.type === 'pageNavigation') {
                ctx.telegram.deleteMessage(ctx.chat.id, message.id);
            }
        });
    }
} catch (error) {
console.log(error)
}
 const nocartmessage= await ctx.reply(
    `You are now viewing our your carts.`,
    Markup.keyboard([
      ['Home'],
    
    ]).resize(),
  )
  ctx.session.cleanUpState.push({id: nocartmessage.message_id, type: 'cart' });
  console.log("ffrom cart scene", ctx.session.cart)
  let summary = 'Your cart contains the following products:\n\n';
  if(ctx.session.cart){
    for (const item of ctx.session.cart) {
      console.log("item", item)
   
      // await sendProduct(ctx);
      await sendCartProduct(ctx, item._id, item)
     
    }
  const summaryinfo=  await sendProdcutSummary(ctx) 
  ctx.session.cleanUpState.push(summaryinfo)
  console.log("summary info.........",summaryinfo)
  }


},




  // Display categories
 
);
cart.action(/(removeQuantity)_(.+)/, async (ctx) => {

  try {
    const productId = ctx.match[2];
    console.log(productId)
    const cartItemIndex = ctx.session.cart.findIndex(item => item._id === productId);
    const cartItem = ctx.session.cart[cartItemIndex];
    console.log("cartItem", cartItem)
    if (cartItem.quantity >= 1) {
      cartItem.quantity--;
      await sendCartProduct(ctx, productId, cartItem)
      await sendProdcutSummary(ctx)
    } 
    if (cartItem.quantity == 0) {
      
      console.log("delete", cartItem.name)
      ctx.session.cart.splice(cartItemIndex, 1);
      // await sendCartProduct(ctx,productId,cartItem)
      await ctx.answerCbQuery(`You have delete ${cartItem.name} from your cart page.`);
      try {
        if (ctx.session.cleanUpState && ctx.session.cleanUpState.find(message => message.type === 'cart' && message.productId === productId)) {
          const messageId = ctx.session.cleanUpState.find(message => message.type === 'cart' && message.productId === productId).id;
  
          console.log("messageId", messageId)
          await ctx.deleteMessage(messageId);
          // await sendProdcutSummary(ctx)
        }
      } catch (error) {
        ctx.reply(error.message)
      }
      
    }
  } catch (error) {
    ctx.reply(error.message)
  }


}
);
cart.action(/(addQuantity)_(.+)/, async (ctx) => {
  const productId = ctx.match[2];
  console.log(productId)
  const cartItemIndex = ctx.session.cart.findIndex(item => item._id === productId);
  const cartItem = ctx.session.cart[cartItemIndex];
  cartItem.quantity++;


  await sendCartProduct(ctx, productId, cartItem)
  await sendProdcutSummary(ctx)
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
cart.action("/GoToHome", (ctx) => {
  console.log("go to Home called")
  // await ctx.scene.leave();
});
cart.action("Home", async(ctx) => {
  ctx.session.shouldContinueSending = false
  await new Promise(resolve => setTimeout(resolve, 1000));
  await ctx.scene.enter("homeScene")

  // await ctx.scene.leave();
}); 
cart.hears('Home', async (ctx) => {
  ctx.session.shouldContinueSending = false
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
  ctx.reply("do you want to delevery",Markup.inlineKeyboard([
    [ 
        { text: "✅ Yes", callback_data: "Yes" },
        { text: "❌ No", callback_data: "No" },
    ],
]))

});
cart.on("callback_query", async (ctx) => {
  const data = ctx.callbackQuery.data
  if(data==="Yes")
  {
    ctx.scene.enter("DATE_SCENE")
    await ctx.scene.leave();
  }
  if(data==="No")
  {
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
            ctx.session.cleanUpState.map(async(message) => {
                if (message?.type === 'nocartmessage' || message?.type === 'cart'||message?.type === 'summary') {
                  console.log("reach cart leave scene")
                  try {
                    await ctx.telegram.deleteMessage(ctx.chat.id, message?.id);
                  } catch (error) {
                    console.log("error occoring",error) 
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