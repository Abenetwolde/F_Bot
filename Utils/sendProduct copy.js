const { Markup } = require('telegraf');
const { sendProdcutSummary } = require('../Templeat/summary');
const axios = require('axios');
const sharp = require('sharp');
module.exports = {
    // ... (other functions)

    sendProductToChannel: async function (ctx, productd, product, isCart) {
        const formatTelegramMessage = (product) => {
            const { name, description, price, available, warranty, category, highlights } = product;

            const formattedHighlights = highlights.map((highlight) => `${highlight}`).join(',');
            const formattedPrice = product.quantity !== 0 ?
                `\n\n. . .\n\n${product.quantity}x ${product.price} ETB = ${product.quantity * product.price} ETB` : '';

            return `
          ${category.icon} ${name} ${category.icon}
          ${description}
          💴 ${price} ETB
          #${category.name} ${category.icon}
          ${formattedHighlights}
          ${formattedPrice}
      `;
        };
        const productId = productd.toString()
        const caption = `🌐 New Product: ${product.name}\n${formatTelegramMessage(product)}`;

        const paginationKeyboard = Markup.inlineKeyboard([
            Markup.button.callback('⬅️ Previous', `prevImage_${productId}`),
            Markup.button.callback('➡️ Next', `nextImage_${productId}`),
            Markup.button.callback('View More', `viewMore_${productId}`),
            Markup.button.callback('View Less', `viewLess_${productId}`),
        ]);

        const channelId = -1002043550645; // Replace with your actual channel ID
        //   const channelMessage = ctx.session.cleanUpState.find(message => message?.type === 'channelpost' && message?.productId === productId /* && message?.userId === ctx.from.id */);
        //   const image = product?.images[ctx.session.currentImageIndex[productId]].imageUrl;
        //   console.log("channelMessage",channelMessage)
        //   if (channelMessage) {
        //       const messageId = channelMessage.id;
        //       console.log("edit more test")
        //       if (ctx.callbackQuery?.data.startsWith('prevImage') || ctx.callbackQuery?.data.startsWith('nextImage')) {
        //           // Handle image pagination
        //           const action = ctx.callbackQuery.data.split('_')[0]; // Extract the action (prevImage or nextImage)
        //           handleImagePagination(ctx, productId, messageId, product.images, action);
        //       } else if (ctx.callbackQuery?.data.startsWith('viewMore')) {
        //           // Handle View More
        //           console.log("view more test")
        //           ctx.session.viewMore[productId] = true;
        //             updateProductMessage(ctx, productId, product,messageId);
        //           // ctx.session.viewMore[productId] = true;
        //           // handleViewMore(ctx, productId, messageId, product);
        //       } else if (ctx.callbackQuery?.data.startsWith('viewLess')) {
        //           // Handle View Less
        //           ctx.session.viewMore[productId] = false;
        //           handleViewLess(ctx, productId, messageId, product);
        //       }
        //   } else {
        const resizeimage = image;
        const response = await axios.get(resizeimage, { responseType: 'arraybuffer' });
        const imageBuffer = await sharp(response.data)
            .resize(200, 200)
            .toBuffer();

        const sentMessage = await ctx.telegram.sendPhoto(
            channelId, // Replace with your actual channel ID
            { source: imageBuffer },
            {
                caption: caption,
                ...paginationKeyboard,
            }
        );
        console.log("sentMessage.message_id,", sentMessage.message_id,)
        ctx.session.cleanUpState.push({
            id: sentMessage.message_id,
            type: 'channelpost',
            productId: productId,
            // userId: ctx.from.id,
        });
        console.log("  ctx.session.cleanUpState", ctx.session.cleanUpState)


        // Return any necessary data or perform additional actions

    }
}

// Other functions ...

//   // Helper function to handle image pagination
//   handleImagePagination: function (ctx, productId, messageId, images, action) {
//       ctx.session.currentImageIndex[productId] += (action === 'nextImage') ? 1 : -1;

//       if (ctx.session.currentImageIndex[productId] >= images.length) {
//           ctx.session.currentImageIndex[productId] = 0;
//       } else if (ctx.session.currentImageIndex[productId] < 0) {
//           ctx.session.currentImageIndex[productId] = images.length - 1;
//       }

//       updateProductMessage(ctx, productId, messageId);
//   },

//   // Helper function to handle View More
//   handleViewMore: function (ctx, productId, messageId, product) {
//     console.log("view more test")
//     ctx.session.viewMore[productId] = true;
//       updateProductMessage(ctx, productId, product,messageId);
//   },

//   // Helper function to handle View Less
//   handleViewLess: function (ctx, productId, messageId, product) {
//       product.quantity = 0; // Reset quantity if View Less is clicked
//       updateProductMessage(ctx, productId, product,messageId);
//   },

//   // Helper function to update product message
//   updateProductMessage: async function (ctx, productId,product, messageId) {
//       const image = product.images[ctx.session.currentImageIndex[productId]].imageUrl;
//       const updatedCaption = ctx.session.viewMore[productId]?`🌐 New Product: ${product.name}\n${formatTelegramMessage(product)}`:"view more test";

//       await ctx.telegram.editMessageMedia(
//           ctx.channelId,
//           messageId,
//           null,
//           {
//               type: 'photo',
//               media: image,
//               caption: updatedCaption,
//           },
//           { reply_markup: paginationKeyboard }
//       );
//   },

