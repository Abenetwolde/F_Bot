const { Scenes, Markup, session } = require("telegraf")
const axios = require('axios');
const categoryScene = new Scenes.BaseScene('category');

const apiUrl = 'http://localhost:5000';
const errorHandler = (error, ctx) => {
  console.error('Error caught:', error);
  ctx.reply('An error occurred while processing your request. Please try again later.');
};

categoryScene.enter(async (ctx) => {
  try {
    await ctx.sendChatAction('typing');

    let categories;
    try {
      categories = await axios.get(`${apiUrl}/api/getcategorys`);
    } catch (error) {
      // Handle API error gracefully
      console.error('API error:', error);
      throw new Error('Unable to fetch categories. Please try again later.');
    }

    const pairs = categories?.data.categorys.reduce((result, value, index, array) => {
      if (index % 2 === 0)
        result.push(array.slice(index, index + 2));
      return result;
    }, []);

    const catagorymMessage1= await ctx.reply(
      'You are now viewing our product Categories.',
      Markup.keyboard([
        ['Home']
      ]).resize(),
    );
ctx.session.cleanUpState.push({id:catagorymMessage1.message_id,type:"category"})
   const catagorymMessage12= await ctx.replyWithHTML(
      '<b>Choose a product category:</b>',
      Markup.inlineKeyboard(
        pairs.map(pair => pair.map(category => Markup.button.callback(`${category.icon} ${category.name}`, `category_${category._id}_${category.name}`)))
      )
    );
    ctx.session.cleanUpState.push({id:catagorymMessage12.message_id,type:"category"})
  } catch (error) {
    errorHandler(error, ctx);
  }
});


categoryScene.action(/category_(.+)/, async(ctx) => {
  const callbackData = ctx.match[1];
  const [categoryId, categoryName] = callbackData.split('_');

  // Now, you have both the category ID and name separately
  console.log('Category ID:', categoryId);
  console.log('Category Name:', categoryName);
  // ctx.scene.enter('product',  { category: categoryId });
 await ctx.scene.enter('product', { category: { id: categoryId, name: categoryName } });
  
});
categoryScene.hears('Home', async (ctx) => {
  
      // await new Promise(resolve => setTimeout(resolve, 1000));
    //  await ctx.scene.leave(); 
     await ctx.scene.enter('homeScene');
    //  await ctx.scene.leave();
 });

categoryScene.leave(async (ctx) => {
  try {
    if (ctx.session.cleanUpState) {
        ctx.session.cleanUpState.map(async(message) => {
            if (message.type === 'category') {
              console.log("reach category leave scene")
              try {
                await ctx.telegram.deleteMessage(ctx.chat.id, message.id);
              } catch (error) {
                console.log("error occoring",error) 
              }
             
            }
        });
    }
} catch (error) {
  console.error('Error in cart:', error);
}

  console.log("you are now leaving Categories scene")
  await ctx.scene.leave();
});
module.exports = {
    categoryScene 
}