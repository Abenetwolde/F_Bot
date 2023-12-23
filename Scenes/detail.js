const { Scenes, Markup, session } = require("telegraf")
const axios = require('axios');
const detailScene = new Scenes.BaseScene('productDetails');
const products = [
    {
      id: 1,
      name: 'Product 11',
      description: 'This is the description for Product 1.',
      images: [
        "https://th.bing.com/th/id/OIP.K8piq_1Rl_AyeNbcDyPpPgAAAA?pid=ImgDet&rs=1",
        "https://th.bing.com/th/id/OIP.y7QJCUnLeQFDE2FXeXH_CwHaHa?pid=ImgDet&rs=1"
      ]
    },
    {
      id: 2,
      name: 'Product 3',
      description: 'This is the description for Product 2.',
      images: [
        "https://th.bing.com/th/id/OIP.y7QJCUnLeQFDE2FXeXH_CwHaHa?pid=ImgDet&rs=1",
        "https://th.bing.com/th/id/OIP.y7QJCUnLeQFDE2FXeXH_CwHaHa?pid=ImgDet&rs=1"
      ]
    },
    // Add more products as needed...
  ];
  const generateProductDetailsReply = (product) => {
    // You can customize this message format based on your needs
    return `
      <b>${product.name}</b>
      Description: ${product.description}
      Images:
      ${product.images.map(image => `<a href="${image}">&#8205;</a>`).join('\n')}
    `;
  };

detailScene.enter(async(ctx) => {
//   await ctx.sendChatAction('typing');
const selectedProductId = ctx.session.selectedProductId;

// Find the product based on the ID
const selectedProduct = products.find(product => String(product.id) === selectedProductId);

if (!selectedProduct) {
  // Handle the case where the product is not found
  ctx.reply('Product not found.');
  return;
}

// Send the photo with the detailed information as a caption
ctx.replyWithPhoto({ url: selectedProduct.images[0] }, {
  caption: generateProductDetailsReply(selectedProduct),
  parse_mode: "HTML",
});

});


module.exports = {
    detailScene 
}