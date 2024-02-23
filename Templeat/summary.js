const axios = require('axios');
const sharp = require('sharp');
const { Scenes, Markup, session } = require("telegraf");
const { getCart } = require('../Database/cartController');
const apiUrl = 'http://localhost:5000'; 
module.exports = {

    sendProdcutSummary: async function (ctx, deliveryDate, note) {
  
        console.log("reach sendSummary")
        // Generate a summary message that displays the product name, quantity, price, and total price for each product with a quantity greater than 1
        let summary = '';
        let totalQuantity = 0;
        let totalPrice = 0;
        let orderItems = []
        let usernote=ctx.session?.orderInfromation?.note||null
        let paymentType=ctx.session?.orderInfromation?.paymentType||null
       const cancelorder= ctx.session.cancelOrder
        // const cartProducts = ctx.session.cart;
        const userId=ctx.from.id

        const cartProducts = await getCart(userId);
        console.log("cartProducts", cartProducts)
        cartProducts.items.forEach((product, productId) => {
            if (product.quantity > 0) {
                // console.log(ctx.session.quantity[product._id], product._id)//filter the product quantity is greater than o
                summary += `🛒 ${product.product.name}: ${product.quantity} x ${product.product.price} = ${product.quantity * product.product.price} ETB\n`;
                totalQuantity += product.quantity;
                totalPrice += product.quantity * product.product.price;
                orderItems.push({
                        "product":product._id,
                        "name": product.name,
                        "quantity": product.quantity
                    
                }
                )
            }
        });
   
        if (deliveryDate) {
            summary += `Delivery date: <b>${deliveryDate}</b>\n`
            datePick=deliveryDate
            // orderItems.push({"deliveryDate": deliveryDate})
        }

        if (usernote) {
            summary += `📔 Note for seller: ${usernote}\n`
          
            // orderItems.push({ "note": note }, )
        }
        if(paymentType){
            summary += `💳 Payment Type: ${paymentType}\n`
        }
        summary += `\nTotal Quantity: ${totalQuantity}\nTotal Price: <u>${totalPrice} ETB</u>`;
        console.log("summary", summary)

        // Check if there is a previous summary message ID stored in the cleanUpState array
        if (ctx.session.cleanUpState && ctx.session.cleanUpState.find(message => message?.type === 'summary')) {
            const messageId = ctx.session.cleanUpState.find(message => message.type === 'summary').id;
            console.log(messageId)
            // If there is a previous summary message ID, use the editMessageText method to edit its text and update its content
            if (totalQuantity > 0) {
                console.log("totalQuantity1", totalQuantity)
                ctx.telegram.editMessageText(
                    ctx.chat.id,
                    messageId,
                    null,
                    summary,
                    {
                        ...Markup.inlineKeyboard([
                            [
                                Markup.button.callback('Procced to CheckOut', 'proceedToCheckout')
                            ]
                        ]),
                        parse_mode: 'HTML' 
                    },
                
                ).catch(() => { });;
            }
            if (totalQuantity == 0) {
               await ctx.telegram.deleteMessage(ctx.chat.id, messageId)
                /* .catch((e) => {ctx.reply(e.message) }); */

               const nocartmessage= await ctx.reply("sorry you have no product on the cart.please go to home and buy", {
                    ...Markup.inlineKeyboard([
                        [

                            Markup.button.callback('Home', 'Home')
                        ]
                    ])
                }
                )
                return { id: nocartmessage.message_id, type: 'summary' }   
            }


        }
 

        else if (totalQuantity > 0) {
            console.log("totalQuantity2", totalQuantity)
            // 0, use the reply method to send a new summary message and pin it to the top of the chat
        const message =   await ctx.replyWithHTML(summary, {
                ...Markup.inlineKeyboard([
                    [
                        Markup.button.callback(`${cancelorder?'Cancel the Order':"Procced to CheckOut"}`, 'proceedToCheckout')
                    ]
                ])
            })
            return { id: message.message_id, type: 'summary' }   
            // .then((message) => {
            //     // Push the message ID and type to the cleanUpState array in the session data
            //     ctx.session.cleanUpState.push({ id: message.message_id, type: 'summary' })
            //     console.log("messageIdofSummary", message.message_id)
            //     // Pin the summary message to the top of the chat
            //     // ctx.telegram.pinChatMessage(ctx.chat.id, message.message_id).catch(() => { ctx.reply(e.message) });
            // });
        } else {
             /* .catch((e) => {ctx.reply(e.message) }); */

               const nocartmessage= await ctx.reply("sorry you have no product on the cart.please go to home and buy", {
                    ...Markup.inlineKeyboard([
                        [

                            Markup.button.callback('Home', 'Home')
                         ]
                    ])
                }
                )
                return { id: nocartmessage.message_id, type: 'summary' }   
            
/* .then((message) => {
                // Push the message ID and type to the cleanUpState array in the session data
                ctx.session.cleanUpState.push({ id: message.message_id, type: 'nocartmessage' })
                console.log("messageIdofSummary", message.message_id)
                // Pin the summary message to the top of the chat
                // ctx.telegram.pinChatMessage(ctx.chat.id, message.message_id).catch(() => { ctx.reply(e.message) });
            }); */
        } 
        console.log("orderItems", orderItems)
      
    }


}