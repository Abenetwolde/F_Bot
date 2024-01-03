const { Scenes, Markup } = require("telegraf")
const { sendProdcutSummary } = require("../Templeat/summary")
const axios = require('axios');
const { createOrder } = require("../Database/orderController");
const apiUrl = 'http://localhost:5000';

const noteScene = new Scenes.BaseScene("NOTE_SCENE")

/**
 * Upon entering, scene contains:
 * 1. Voucher applied, if any (i.e. ctx.scene.state.voucher)
 * 2. Delivery date, if any (i.e. ctx.scene.state.date)
 * 
 * isWaiting: {
 *      status: true,               // If user is in text-only mode
 * }
 */
 let orderResponse = null
noteScene.enter(async (ctx) => {
    ctx.session.cleanUpState = []
    ctx.session.timeout = []
    ctx.session.isWaiting = {
        status: false
    }
    await ctx.reply("Last step before we're able to generate your invoice! 🙂",)
    Markup.keyboard([
        ["🏠 Back to Home"]
    ]).resize()
    await ctx.reply("Would you like to leave a note along with the order?<i>Kindly send a message that you wish to place on your order, or press the Skip button below this message to leave nothing</i>", Markup.inlineKeyboard([
        { text: "⏩ Skip", callback_data: "Skip" }
    ]))

    // await Utils.sendWelcomeMessage(ctx, Template.noteWelcomeMessage(), Template.noteMenuButtons())
    // Utils.sendSystemMessage(ctx, Template.inputNoteMessage(), Template.inputNoteButton())
})

// Listener to clear message after scene ends
noteScene.on("message", async (ctx) => {

    if (!(ctx.session.isWaiting && ctx.session.isWaiting.status)) {
        await ctx.replyWithHTML(`This is the note that you wish to leave for the seller: <i>${ctx.message.text}</i>`, Markup.inlineKeyboard([
            [
                { text: "✅ Confirm", callback_data: "Yes" },
                { text: "❌ Cancel", callback_data: "No" },
            ],
        ]))
        // Utils.sendSystemMessage(ctx, Template.noteConfirmationMessage(ctx.message.text), Template.confirmationButtons())
        ctx.session.isWaiting.note = ctx.message.text
        ctx.session.isWaiting.status = true     // Activate text input mode
    }
})

noteScene.on("callback_query", async (ctx) => {
    if ((ctx.session.isWaiting && ctx.session.isWaiting.status)) {
        if (ctx.callbackQuery.data === "Yes") {

            
            const result = await sendProdcutSummary(ctx, ctx.scene.state.deliveryDate, ctx.session.isWaiting.note)
console.log("resut...........",result)
            const orderData={
                shippingInfo: {   
                    note:result.usernote ,
                  },
                  orderItems:result.orderItems,
                  orderfromtelegram:true,
                  telegramid: ctx.from.id,
                  totalPrice:result.totalPrice,
                  delivery:result.datePick!==null?"Yes":"no",
                  shippedAt: result.datePick??result.datePick
                }
            console.log("resultFromnote", result)
            try {
                const orderResponse= await createOrder(orderData)
                // orderResponse = await axios.post(`${apiUrl}/api/createorder`, orderData);
                 console.log("orderResponse.........",orderResponse)
            //    await ctx.reply(response.data.sccess)
            } catch (error) {
                console.error("orderResponseerror",error)
                // await ctx.reply(error)
            } 

      
console.log("orderData=>",orderData)
            ctx.scene.enter("PAYMENT_SCENE", {
                userId: orderResponse.data.order.user,
                orderId: orderResponse.data.order._id,
                deliveryDate: ctx.scene.state.deliveryDate,
                note: ctx.session.isWaiting.note,
            })
        } else {
            ctx.reply("cancling ...")
            
        }
    } else if (ctx.callbackQuery.data === "Skip") {
        ctx.scene.enter("PAYMENT_SCENE", {
            voucher: ctx.scene.state.voucher,
            deliveryDate: ctx.scene.state.deliveryDate,
            cartMessage: ctx.scene.state.cartMessage,
        })
    }
    // await ctx.answerCbQuery()
    await ctx.scene.leave();
})

noteScene.leave(async (ctx) => {
    try {
        console.log("Cleaning note scene")
        // Utils.clearTimeout(ctx)
        // Utils.cleanUpMessage(ctx, true)
    } catch (error) {

    }
})

module.exports = {
    noteScene
}