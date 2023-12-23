// "  if (ctx.session.cleanUpState && ctx.session.cleanUpState.find(message => message.type === 'product' && message.productId === productId)) {
//     const messageId = ctx.session.cleanUpState.find(message => message.type === 'product' && message.productId === productId).id;
//     // If there is a previous message ID, use the editMessageMedia method to edit its media and update its image
//     try {
//         await ctx.telegram.editMessageMedia(
//             ctx.chat.id,
//             messageId,
//             null,
//             {
//                 type: 'photo',
//                 media: image,
//                 caption: caption
//             },
//             Markup.inlineKeyboard([
//                 product.quantity == 0 ? [
//                     Markup.button.callback('⬅️', `previous_${productId}`),
//                     ctx.session.viewMore[productId] ? Markup.button.callback('View Less', `viewLess_${productId}`) : Markup.button.callback('View More', `viewMore_${productId}`),
//                     Markup.button.callback('➡️', `next_${productId}`),
//                     // ...(ctx.session.viewMore[productId] ? [Markup.button.callback('Buy', `buy_${productId}`)] : [])
//                 ] : [],
//                 ctx.session.viewMore[productId] ?
//                     [
//                         Markup.button.callback('Colors', `Checkout`),

//                     ]:[],
//                     ctx.session.viewMore[productId] ?  [
//                         Markup.button.callback('Colors', `Checkout`),

//                     ]:[],
            
//                 ...(product.quantity > 0 ? [
//                     [
//                         Markup.button.callback('Remove Quantity', `removeQuantity_${productId}`),
//                         Markup.button.callback(`${product.quantity} * ${product.price} = ${product.quantity * product.price} ${product.currency}`, `quantity_${productId}`),
//                         Markup.button.callback('Add Quantity', `addQuantity_${productId}`)
//                     ], [
//                         Markup.button.callback('Check Out', `Checkout`),

//                     ]
//                 ] : (ctx.session.viewMore[productId] ? [
//                     [
//                         Markup.button.callback('Buy', `buy_${productId}`)
//                     ]
//                 ] : []))
//             ])
//         )
//     } catch (error) {
//         if (error.response.error_code === 400 && error.response.description.includes('message is not modified')) {
//             console.log("Caught the 'message is not modified' error");
//         } else {
//             console.log("An unexpected error occurred: ", error);
//         }
//     }

// }"
// can you refactore the above telegraf.js code and optimazed in best way the above code in the same file?