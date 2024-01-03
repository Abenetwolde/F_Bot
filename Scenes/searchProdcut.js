// Search Product scene
const { Scenes, Markup, session } = require("telegraf")
const axios = require('axios');
const { replace } = require("lodash");
const { getAllProducts } = require("../Database/productcontroller");
const { getProducts } = require("../Services/prodcut");
const searchProduct = new Scenes.BaseScene('searchProduct');
const itemsPerPage = 10;
const apiUrl = " http://localhost:5000"
// Dummy data for products


searchProduct.enter(async (ctx) => {
  ctx.session.viewMoreSearch=null
  console.log("reach serach scene")
  let message = `
Type the Product Name to search
Example @testecommerce12bot Prodcut name
`;
  //ctx.reply(text, [extra params])
  ctx.reply(message, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'Click here to Search a prodcut', switch_inline_query_current_chat: "" }
        ]
      ],
      force_reply: true
    },

  })

});
// Handle inline queries within the scene
searchProduct.on('inline_query', async (ctx) => {
  console.log("inline_query")
  let input = ctx.inlineQuery.query
  if (!input) {
    return;
  }

  try {
    // Extract pagination parameters from the inline query offset
    // const offset = parseInt(ctx.inlineQuery.offset) || 0;
    // const page = Math.floor(offset / pageSize) + 1;
    // Fetch product data from the backend API
    // const response = await axios.get('http://localhost:5000/api/getproducts', {
    //   params: {
    //     search: input,
    //     // page: page,
    //     pageSize: 10,
    //     // Add any other query parameters as needed
    //   },
    // });

    const response = await getProducts(ctx, {
      search: input,
      page: 1, // Set the default page value or adjust it based on your requirements
      pageSize: 10,
    });

    const products = JSON.parse(response);
console.log("prodcus",products)

    // const totalPages = products.totalPages;
    // Map the fetched products to Telegram inline query results
    const results = products?.products.map((product) => {
      const thumbnail = product?.images[0];
      console.log("prodcus titile",product?.name)
      return {
        type: 'article',
        title: product?.name||"Product",
        photo_url: String(thumbnail),
        thumb_url: String(thumbnail),
        description: product?.description,
        id: String(product?._id),
        input_message_content: {
          message_text: `${product?.name && product?.name}\n product.description,<a href="${thumbnail}">&#8205;</a>`,
          parse_mode: "HTML",
        },
        reply_markup: {
          inline_keyboard: [
            [
              // {
              //   text: 'View More',
              //   callback_data: `view_more_${product._id}`,
              // },
              {
                text: 'View More',
                url: `https://t.me/testecommerce12bot?start=chat_${product._id}`,
              },
              {
                text: 'Buy',
                callback_data: `Buy_${product?._id}`,
              },
            ],
          ],
        },
      };
    });
    // let nextOffset = null;
    // if (page < totalPages) {
    //   nextOffset = page * pageSize;
    // }

    // Calculate the next offset for pagination
    // const nextOffset = page * pageSize;

    // Send the inline query results with pagination parameters
    await ctx.answerInlineQuery(results, {
      cache_time: 0,
      // next_offset: nextOffset !== null ? nextOffset.toString() : '',

    });
  } catch (error) {
    console.error('Error fetching product data:', error);
  }
});

const productQuantityState = new Map();
async function sendOrEditMessage(ctx, productId, product) {
  const totalPrice = product.quantity * product.price;
  const messageText = `${product.name}\n${product.description}\nQuantity: ${product.quantity}\nTotal Price: ${totalPrice}`;

  if (ctx.session.viewMoreSearch) {
    // Edit the existing message
    const editedMessage = await ctx.telegram.editMessageText(
      ctx.from.id,
      ctx.session.viewMoreSearch,
      null,
      messageText,
      Markup.inlineKeyboard([
        Markup.button.callback('-', `removeQuantity_${productId}`),
        Markup.button.callback('+', `addQuantity_${productId}`),
        Markup.button.callback('Buy Now', `addQuantity_${productId}`),
      ])
    );

    ctx.session.viewMoreSearch = editedMessage.message_id;
  } else {
    // Send a new message
    const newMessage = await ctx.telegram.sendMessage(
      ctx.from.id,
      messageText,
      Markup.inlineKeyboard([
        Markup.button.callback('-', `removeQuantity_${productId}`),
        Markup.button.callback('+', `addQuantity_${productId}`),
        Markup.button.callback('Buy Now', `addQuantity_${productId}`),
      ])
    );

    ctx.session.viewMoreSearch = newMessage.message_id;
  }
}
searchProduct.action(/view_more_/, async (ctx) => {
  try {
    const productId = ctx.match.input.split('_')[2];
    const response = await axios.get(`http://localhost:5000/api/getprodcut/${productId}`);
    const selectedProductdata = response.data.product;

    const mediaGroup = selectedProductdata.images.map(image => ({
      type: 'photo',
      media: image,
    }));

    await ctx.telegram.sendMediaGroup(ctx.from.id, mediaGroup);
    // await ctx.telegram.sendMessage(
    //   ctx.from.id,
    //   selectedProductdata.description && selectedProductdata.description,
    //   Markup.inlineKeyboard([
    //     Markup.button.callback('Remove Quantity', `removeQuantity_${productId}`),
    //     Markup.button.callback('Add Quantity', `addQuantity_${productId}`)
    //   ])
    // );

    // Use the new function to send or edit the message
    await sendOrEditMessage(ctx, productId, selectedProductdata);
  } catch (error) {
    ctx.reply("Error handling view more action");
    console.error('Error handling view more action:', error);
  }
});
searchProduct.action(/(add|remove)Quantity_(.+)/, async (ctx) => {
  const action = ctx.match[1];
  const productId = ctx.match[2];

  try {
    // Fetch the product details
    const response = await axios.get(`http://localhost:5000/api/getprodcut/${productId}`);
    const product = { ...response.data.product, quantity:0 };
    // product.quantity = typeof product.quantity === 'number' ? product.quantity : 0;

    // Update the quantity based on the action
    if (action === 'add') {
      product.quantity += 1;
    } else if (action === 'remove') {
      // Ensure the quantity doesn't go below 0
      product.quantity = Math.max(0, product.quantity - 1);
    }

    // Use the new function to send or edit the message
    await sendOrEditMessage(ctx, productId, product);
  } catch (error) {
    console.error('Error handling quantity action:', error);
  }
});

// // Function to generate data
// const generateData = (count) => {
//     let items = [];
//     for (let i = 0; i < count; i++) {
//       items.push({
//         title: `Item ${i}`,
//         description: `Description for item ${i}`,
//         id: `${i}`
//       });
//     }
//     return items;
//   };

//   searchProduct.enter(async (ctx) => {
// //  ctx.replyWithChatAction('sending Prodcuts');
//        ctx.reply(
//       `You are now viewing our serarchproducts.`,
//     //   Markup.keyboard([
//     //     ['Home', 'Category'],
//     //     ['Checkout']
//     //   ]).resize(),
//     );


// });

//   // Inline query handler
//   bot.on('inline_query', async ({ inlineQuery, answerInlineQuery }) => {
//     const offset = parseInt(inlineQuery.offset) || 0;
//     const itemsPerPage = 10;
//     const data = generateData(100);

//     let results = data.slice(offset, offset + itemsPerPage).map((item) => ({
//       type: 'article',
//       id: item.id,
//       title: item.title,
//       description: item.description,
//       input_message_content: {
//         message_text: `*${item.title}*\n${item.description}`,
//         parse_mode: 'Markdown'
//       },
//       reply_markup: {
//         inline_keyboard: [[{ text: 'More info', callback_data: `moreinfo:${item.id}` }]]
//       }
//     }));

//     return answerInlineQuery(results, {
//       is_personal: true,
//       next_offset: offset + results.length,
//       cache_time: 10
//     });
//   });

//   // Callback query handler
//   searchProduct.on('callback_query', async (ctx) => {
//     const callbackData = ctx.callbackQuery.data.split(':');
//     if (callbackData[0] === 'moreinfo') {
//       const itemId = callbackData[1];
//       await ctx.answerCbQuery(`More info for item ${itemId}`);
//     }
//   });
//   searchProduct.leave(async (ctx) => {
//     await ctx.scene.leave();
//  })
//  module.exports = {
//     searchProduct
//  }

// const searchProduct = new Scenes.BaseScene('productSearchScene');

// searchProduct.enter(async (ctx) => {
//   await ctx.reply('Please enter a search query to find products:', Markup.forceReply());
// });

// searchProduct.on('text', async (ctx) => {
//   const query = ctx.message.text;

//   // Retrieve search results from external API
//   const response = await axios.get(`${apiUrl}/api/search?q=${query}`);

//   // Store search results in session
//   ctx.session.searchResults = response.data.products;

//   // Send search results
//   for (const product of response.data) {
//     await ctx.replyWithPhoto(
//       product.images[0],
//       { caption: `${product.name}\n${product.description}`,
//         reply_markup: Markup.inlineKeyboard([
//           [Markup.button.callback('View More', `view_more_${product.id}`)],
//         ])
//       }
//     );
//   }
// });

// searchProduct.on('inline_query', async (ctx) => {
//    const query = ctx.inlineQuery.query;
//    const offset = parseInt(ctx.inlineQuery.offset) || 0;

//    // Retrieve search results from external API
//    const response = await axios.get(`${apiUrl}/api/search?q=${query}&offset=${offset}&limit=${itemsPerPage}`);

//    // Generate inline query results
//    const results = response.data.map(product => ({
//      type: 'article',
//      id: product._id,
//      title: product.name,
//      description: product.description??product.description,
//      thumb_url: product.images[0],
//      input_message_content: {
//        message_text: `${product.name}\n${product.description??product.description}`,
//      },
//     ...Markup.inlineKeyboard([
//        [Markup.button.callback('View More', `view_more_${product._id}`)],
//      ]),
//    }));

//    // Answer inline query
//    await ctx.answerInlineQuery(results, {
//      next_offset: offset + itemsPerPage,
//    });
// });

// searchProduct.action(/view_more_(.+)/, async (ctx) => {
//    const productId = parseInt(ctx.match[1]);
//    const productIndex = ctx.session.searchResults.findIndex(product => product.id === productId);
//    const product = ctx.session.searchResults[productIndex];

//    await ctx.replyWithPhoto(
//      product.images[0],
//      { caption: `${product.name}\n${product.description}\nPrice: ${product.price}\n\nAdditional information:\n${product.additionalInformation}`,
//        reply_markup: Markup.inlineKeyboard([
//          [Markup.button.callback('-', `decrease_quantity_${product.id}`), Markup.button.callback(`${product.quantity}`, `quantity_${product.id}`), Markup.button.callback('+', `increase_quantity_${product.id}`)],
//          [Markup.button.callback('Buy', `buy_${product.id}`)],
//        ])
//      }
//    );
// });
module.exports = {
  searchProduct
}