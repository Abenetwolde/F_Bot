const { Markup } = require('telegraf');
const { sendProdcutSummary } = require('../../Templeat/summary');
const axios = require('axios');
const sharp = require('sharp');
module.exports = {
    // ... (other functions)

    sendProductToChannel: async function (ctx, productd, product, isCart) {
        const formatTelegramMessage = (product) => {
            const { name, description,images, price, available, warranty, category, highlights } = product;

            const formattedHighlights = highlights.map((highlight) => `${highlight}`).join(',');
           const formattedButton=images.length === 1?"":"Buy"
            const formattedPrice = product.quantity !== 0 ?
                `\n\n. . .\n\n${product.quantity}x ${product.price} ETB = ${product.quantity * product.price} ETB` : '';

            return `
${category.icon} ${name} ${category.icon}
${description}
💴 ${price} ETB
${formattedHighlights}
.
.
#${category.name} ${category.icon}
${formattedButton}

      `;
        };
        const productId = productd.toString()
        const caption = `🌐 New Product: ${product.name}\n${formatTelegramMessage(product)}`;

        const paginationKeyboard = Markup.inlineKeyboard([
            Markup.button.url('Order 📔', `https://t.me/testecommerce12bot?start=chat_${productId}`),
        ]);

        const channelId = -1002011345443;
        const images = product.images.map(image => image.imageUrl);
        // const mediaGroup = images.map(image => ({
        //     type: 'photo',
        //     media: image,
        // }));

        // // Add the caption to each item in the media group
        // mediaGroup.forEach(item => {
        //     item.caption = caption;
        // });
        let mediaGroup=[]
        images.map((i,index)=>index==0?mediaGroup.push(            {
                  media: i,
                  type: 'photo',
                  caption: caption,
            //    parse_mode: 'MarkdownV2'
             },
            ):mediaGroup.push(            {
                media: i,
                type: 'photo',
                
            //  parse_mode: 'MarkdownV2'
           },
          ))
        // let mediaGroup = [
        //     {
        //       media: 'https://th.bing.com/th/id/OIP.5sU8YRNczaPYF0IyIZRDSgHaPf?rs=1&pid=ImgDetMain',
        //       type: 'photo',
        //       caption: '**My caption**',
        //       parse_mode: 'MarkdownV2'
        //     },
        //     {
        //       media: 'https://th.bing.com/th/id/OIP.4Y0vnHhGVZKcFJSQf9XcGwHaDt?rs=1&pid=ImgDetMain',
        //       type: 'photo'
        //     },
         
        //   ];
        if (images.length === 1) {
            // If there's only one image, send it with the order link in the caption
            const image = images[0];
            const response = await axios.get(image, { responseType: 'arraybuffer' });
            const imageBuffer = await sharp(response.data)
                .resize(200, 200)
                .toBuffer();

            // Send single photo with the caption containing the order link
            const sentMessage = await ctx.telegram.sendPhoto(
                channelId,
                { source: imageBuffer },
                {
                    caption: caption,
                    ...paginationKeyboard,
                },
               
            );

            // Store the sent message ID in the session
            ctx.session.cleanUpState.push({
                id: sentMessage.message_id,
                type: 'channelpost',
                productId: productId,
            });
        } else {
            const sentMessage = await ctx.telegram.sendMediaGroup(channelId, mediaGroup, {
                // message_thread_id: productId, // Use product ID as the message thread ID
                caption: "caption", // Set the caption for the entire media group
                reply_markup: paginationKeyboard
            });
            // Store the sent message IDs in the session
            sentMessage.forEach(message => {
                ctx.session.cleanUpState.push({
                    id: message.message_id,
                    type: 'channelpost',
                    productId: productId,
                });
            });
        }
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

