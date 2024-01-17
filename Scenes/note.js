const { Scenes, Markup } = require("telegraf")
const { sendProdcutSummary } = require("../Templeat/summary")
const axios = require('axios');
const { createOrder } = require("../Database/orderController");
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
    const note1message = await ctx.reply("Last step before we're able to generate your invoice! 🙂",)
    Markup.keyboard([
        ["🏠 Back to Home"]
    ]).resize()

    const note1message2 = await ctx.reply("Would you like to leave a note along with the order?<i>Kindly send a message that you wish to place on your order, or press the Skip button below this message to leave nothing</i>", Markup.inlineKeyboard([
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
    await ctx.scene.enter("selectePaymentType");
});
// Listener to clear message after scene ends
noteScene.on("message", async (ctx) => {
    if (!(ctx.session.isWaiting && ctx.session.isWaiting.status)) {
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
});

noteScene.action("confirm", async (ctx) => {
    const confirmedNote = ctx.session.isWaiting.note;
    // Assuming you have an orderInformation session already
    ctx.session.orderInformation = {
        ...ctx.session.orderInformation,
        note: confirmedNote,
    };

    const userId = ctx.from.id;
    const cartItems = await getCart(userId)

    const orderInformation = ctx.session.orderInformation || {};
    const order = await createOrder(userId, orderInformation, cartItems);
  console.log("order information..........",order)
    if (orderInformation.paymentType && orderInformation.paymentType.toLowerCase() === 'online') {
        const payData =
            JSON.stringify({
              totalPrice: order.totalPrice,
              orderItems: order.orderItems,
              orderId: order._id.toString(), // Convert ObjectId to string
            })
          
      
          await ctx.reply(
            `Order created successfully! Order ID: ${order._id}\nYou chose ${orderInformation.paymentType} payment.`,
            Markup.inlineKeyboard([
              Markup.button.callback('Pay', `pay:${payData}`),
            ])
          );
      } else {
        // If it's not online, simply reply with the order ID
        await ctx.reply(`Order created successfully! Order ID: ${order._id}`);
        ctx.session.orderInformation={}
      }
    // await ctx.scene.enter("selectePaymentType");
    await ctx.scene.leave()
});

noteScene.action("edit", async (ctx) => {
    // User wants to edit the note, ask for a new message
    const note5mesagge = await ctx.reply("Edit your message for the seller:", {
        reply_markup: {
            force_reply: true,
        },
    });
    ctx.session.cleanUpState.push({ id: note5mesagge.message_id, type: 'note' });
});
noteScene.action(/pay:(\d+):(.+):(.+)/, async (ctx) => {
    // Extract the passed data from the button callback
    const [, totalPrice, orderItems, orderId] = ctx.match;
  
    // Convert orderItems to an array (assumes it's a JSON string representation)
    const orderItemsArray = JSON.parse(orderItems);
  
    // Reply with a message acknowledging the payment
    await ctx.reply(`Payment received for Order ID: ${orderId}. Total Amount: ${totalPrice}`);
  
    // Enter the payment scene with the necessary data
    ctx.scene.enter("paymentScene", {
      totalPrice: +totalPrice, // Convert to a number if needed
      orderItems: orderItemsArray,
      orderId,
    });
  });
// noteScene.on("callback_query", async (ctx) => {
//     if ((ctx.session.isWaiting && ctx.session.isWaiting.status)) {
//         if (ctx.callbackQuery.data === "Yes") {


//             const result = await sendProdcutSummary(ctx, ctx.scene.state.deliveryDate, ctx.session.isWaiting.note)
// console.log("resut...........",result)
            // const orderData={
            //     shippingInfo: {   
            //         note:result.usernote ,
            //       },
            //       orderItems:result.orderItems,
            //       orderfromtelegram:true,
            //       telegramid: ctx.from.id,
            //       totalPrice:result.totalPrice,

            //     }
//             console.log("resultFromnote", result)
//             try {
//                 const orderResponse= await createOrder(orderData)
//                 // orderResponse = await axios.post(`${apiUrl}/api/createorder`, orderData);
//                  console.log("orderResponse.........",orderResponse)
//             //    await ctx.reply(response.data.sccess)
//             } catch (error) {
//                 console.error("orderResponseerror",error)
//                 // await ctx.reply(error)
//             } 


// console.log("orderData=>",orderData)
//             ctx.scene.enter("PAYMENT_SCENE", {
//                 userId: orderResponse.data.order.user,
//                 orderId: orderResponse.data.order._id,
//                 deliveryDate: ctx.scene.state.deliveryDate,
//                 note: ctx.session.isWaiting.note,
//             })
//         } else {
//             ctx.reply("cancling ...")

//         }
//     } else if (ctx.callbackQuery.data === "Skip") {
//         ctx.scene.enter("PAYMENT_SCENE", {
//             voucher: ctx.scene.state.voucher,
//             deliveryDate: ctx.scene.state.deliveryDate,
//             cartMessage: ctx.scene.state.cartMessage,
//         })
//     }
//     // await ctx.answerCbQuery()
//     await ctx.scene.leave();
// })

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