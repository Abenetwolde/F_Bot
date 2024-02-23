const { Scenes, Markup } = require("telegraf")
const { sendProdcutSummary } = require("../Templeat/summary")
const axios = require('axios');
const { createOrder, getOrderById } = require("../Database/orderController");
const { getCart } = require("../Database/cartController");
const apiUrl = 'http://localhost:5000';

const addressOnline = new Scenes.BaseScene("addressOnline")
addressOnline.enter(async (ctx) => {
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


    const note1message2 = await ctx.reply(
        "Great! Now, please provide your location or send a Google Maps link?",
        {
          reply_markup: {
            // keyboard: [["❌ Cancel"]],
            resize_keyboard: true, // Optional, to make the keyboard smaller
            force_reply: true,
          },
        }
      );
    ctx.session.cleanUpState.push({ id: note1message.message_id, type: 'addressOnline' });
    ctx.session.cleanUpState.push({ id: note1message2.message_id, type: 'addressOnline' });
    // ctx.session.cleanUpState.push(summaymessage);

})

addressOnline.on("message", async (ctx) => {
    const text = ctx.message.text;

    if (text === "❌ Cancel" || text === "/start") {
        return ctx.scene.enter("cart")
    } else {
        ctx.session.orderInformation = {
            ...ctx.session.orderInformation,
            location: ctx.message.text,
        };
        await ctx.scene.enter("NOTE_SCENE");
    }

});






addressOnline.leave(async (ctx) => {
    try {
        if (ctx.session.cleanUpState) {
            // Iterate over the cleanUpState array
            for (const message of ctx.session.cleanUpState) {
                // Check if the message exists before attempting to delete it
                if (/* message?.type === 'addressOnline' */ message?.type === 'summary') {
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
    addressOnline
}