const { Scenes, Markup } = require("telegraf")
const { sendProdcutSummary } = require("../Templeat/summary")
const axios = require('axios');
const { createOrder, getOrderById } = require("../Database/orderController");
const { getCart } = require("../Database/cartController");
const apiUrl = 'http://localhost:5000';

const noteScene = new Scenes.BaseScene("NOTE_SCENE")
noteScene.enter(async (ctx) => {
    ctx.session.cleanUpState = []
    ctx.session.timeout = []
    ctx.session.isWaiting = {
        status: false
    }
    // const summaymessage = await sendProdcutSummary(ctx)
    // console.log("summary message from note",summaymessage)
    const note1message = await ctx.reply("Last step before we're able to generate your invoice! 🙂", Markup.keyboard([
        ["❌ Cancel"]
    ]).resize())


    const note1message2 = await ctx.reply("Would you like to leave a note along with the order?", Markup.inlineKeyboard([
        Markup.button.callback("Yes", 'yes'),
        Markup.button.callback("⏩ Skip", 'Skip'),

    ]))
    ctx.session.cleanUpState.push({ id: note1message.message_id, type: 'note' });
    ctx.session.cleanUpState.push({ id: note1message2.message_id, type: 'note' });
    // ctx.session.cleanUpState.push(summaymessage);

})
noteScene.action("yes", async (ctx) => {
    console.log("reach yes")
    // User wants to leave a note, prompt for the message using force reply
    const note3message = await ctx.reply("What is your message for the seller? (Type your message)", {
        reply_markup: {
            force_reply: true,
        },
    });
    ctx.session.cleanUpState.push({ id: note3message.message_id, type: 'note' });
});


noteScene.action("Skip", async (ctx) => {
    ctx.session.orderInformation = {
        ...ctx.session.orderInformation,
        note: "",
      };
    
      const userId = ctx.from.id;
      const cartItems = await getCart(userId);
    
      const orderInformation = ctx.session.orderInformation || {};
      const order = await createOrder(userId, orderInformation, cartItems);
      const orderJson = JSON.stringify(order);
      const orderJsonParse = JSON.parse(orderJson);
      if (orderJsonParse.paymentType && orderJsonParse.paymentType.toLowerCase() === 'online') {
      await ctx.reply(`Payment received for Order ID: ${orderJsonParse._id.toString()}. Total Amount: ${order.totalPrice}`);
      await ctx.scene.enter('paymentScene', {
        totalPrice: orderJsonParse.totalPrice,
        orderItems: orderJsonParse.orderItems,
        orderId: orderJsonParse._id.toString(),
      });
      //  await ctx.scene.leave()
      } else {
        await ctx.reply(`Order created successfully! Order ID: ${order._id}`);
        await ctx.scene.leave()
      }
});
// Listener to clear message after scene ends
noteScene.on("message", async (ctx) => {
    if (!(ctx.session.isWaiting && ctx.session.isWaiting.status)) {
        const text = ctx.message.text;

  if (text === "❌ Cancel" || text === "/start") {
            return ctx.scene.enter("cart")
        } else {
            const note4message = await ctx.replyWithHTML(`This is the note that you wish to leave for the seller: <i>${ctx.message.text}</i>`, Markup.inlineKeyboard([
                [
                    { text: "✅ Confirm", callback_data: "confirm" },
                    { text: "❌ Edit", callback_data: "edit" },
                ],
            ]));
    
            ctx.session.isWaiting.note = ctx.message.text;
            ctx.session.isWaiting.status = false;
            ctx.session.cleanUpState.push({ id: note4message.message_id, type: 'note' });
        }
  
    }
});

noteScene.action('confirm', async (ctx) => {
    const confirmedNote = ctx.session.isWaiting.note;
    ctx.session.orderInformation = {
      ...ctx.session.orderInformation,
      note: confirmedNote,
    };
  
    const userId = ctx.from.id;
    const cartItems = await getCart(userId);
  
    const orderInformation = ctx.session.orderInformation || {};
    const order = await createOrder(userId, orderInformation, cartItems);
    const orderJson = JSON.stringify(order);
    const orderJsonParse = JSON.parse(orderJson);
    if (orderJsonParse.paymentType && orderJsonParse.paymentType.toLowerCase() === 'online') {
    await ctx.reply(`Payment received for Order ID: ${orderJsonParse._id.toString()}. Total Amount: ${order.totalPrice}`);
    await ctx.scene.enter('paymentScene', {
      totalPrice: orderJsonParse.totalPrice,
      orderItems: orderJsonParse.orderItems,
      orderId: orderJsonParse._id.toString(),
    });
    //  await ctx.scene.leave()
    } else {
      await ctx.reply(`Order created successfully! Order ID: ${order._id}`);
     ctx.session.orderInformation={}
      await ctx.scene.leave()
    }
  });
  

   

noteScene.leave(async (ctx) => {
    try {
        if (ctx.session.cleanUpState) {
            // Iterate over the cleanUpState array
            for (const message of ctx.session.cleanUpState) {
                // Check if the message exists before attempting to delete it
                if (message?.type === 'note' || message?.type === 'summary') {
                    await ctx.telegram.deleteMessage(ctx.chat.id, message.id);
                }
            }
        }
    } catch (error) {
        console.error('Error in note leave:', error);
    } finally {
        // Always clear the cleanUpState array
        ctx.session.cleanUpState = [];
    }
})

module.exports = {
    noteScene
}