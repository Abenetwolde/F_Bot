const { Scenes, Markup } = require("telegraf")
const moment = require("moment")
const _ = require("lodash")
const Calendar = require("../Templeat/Calender")
const { sendProdcutSummary } = require("../Templeat/summary")

const dateScene = new Scenes.BaseScene("DATE_SCENE")

/**
 * Upon entering, scene contains:
 * 1. Voucher applied from cart scene (i.e. ctx.scene.state.voucher)
 * 
 * isWaiting: {
 *      status: true,               // If user is in text-only mode
 *      date: XXX                    // callback_query that user selects
 * }
 */

dateScene.enter(async (ctx) => {
    ctx.session.cleanUpState = []
    ctx.session.timeout = []
    ctx.session.isWaiting = {
        status: false
    }
    ctx.session.isWaiting.date = Calendar.getTodayDate()
    console.log(" ctx.session.isWaiting.date", ctx.session.isWaiting.date)
   await ctx.reply("Just two more steps before we're able to generate your invoice! 🙂",)
    Markup.keyboard([
        ["🏠 Back to Home"]
    ]).resize()

    const calendar = await Calendar.sendCalendarMessage(ctx)
    ctx.session.cleanUpState.push({ id: calendar.message_id, type: "calendar" })   // Update as calendar type to prevent message from deletion in midst of selecting a date
})

dateScene.on("callback_query", async (ctx) => {
    const data = ctx.callbackQuery.data

    if (data !== "NIL") {
        if (!(ctx.session.isWaiting && ctx.session.isWaiting.status)) {
            if (data === "Previous") {
                const month = parseInt(ctx.session.isWaiting.date.split("-")[1]) - 1
                console.log("month",month)
                Calendar.updateDateInState(ctx, month)
                await Calendar.editMessageByID(ctx, _.find(ctx.session.cleanUpState, function (o) {
                    return o.type === "calendar"
                }).id, month)
            } else if (data === "Next") {
                const month = parseInt(ctx.session.isWaiting.date.split("-")[1]) + 1
                Calendar.updateDateInState(ctx, month)
                await Calendar.editMessageByID(ctx,  _.find(ctx.session.cleanUpState, function (o) {
                    return o.type === "calendar"
                }).id, month)
            } else {
                var momentDate = moment(data, "DD-MM-YYYY").format("DD-MM-YYYY")
         
                await ctx.replyWithHTML(     `
                You've selected <b>${momentDate === "Invalid date" ? data : momentDate}</b>. Are you sure?
                `,Markup.inlineKeyboard([
                    [
                        { text: "✅ Confirm", callback_data: "Yes" },
                        { text: "❌ Cancel", callback_data: "No" },
                    ],
                ]))
                // Utils.sendSystemMessage(ctx, Template.dateConfirmationMessage(data), Template.confirmationButtons())
                ctx.session.isWaiting = {       // Activate input mode
                    status: true,
                    date: data
                }
            }
        } else {
            if (data === "Yes") {
                console.log("you click yes")
                await sendProdcutSummary(ctx, ctx.session.isWaiting.date)
        
               await ctx.scene.enter("NOTE_SCENE", {
                    deliveryDate: ctx.session.isWaiting.date,
                    
                })
            } else if (data === "No") {
                ctx.scene.enter("NOTE_SCENE")
                // await Utils.cancelButtonConfirmation(ctx, Template.cancelDateMessage(), 3)
            }
        }
    }
    await ctx.answerCbQuery()
})

module.exports = {
    dateScene
}