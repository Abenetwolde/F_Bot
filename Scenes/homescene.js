const { Scenes, Markup, session } = require("telegraf")
const axios = require('axios');

const { t, match } = require('telegraf-i18next')
const homeScene = new Scenes.BaseScene('homeScene');

homeScene.enter(async (ctx) => {
    try {
        // Display the initial message
        console.log("isthere a prodcut on session????????",ctx.session.products)
        ctx.session.cleanUpState = ctx.session.cleanUpState || [];

        try {
            const welcomeMessage = await ctx.reply(
                `Hello ${ctx.from.first_name}!`,
                Markup.keyboard([
                    [ctx.i18next.t('Category'), ctx.i18next.t('Search'), ctx.i18next.t('cart')],
                    [ctx.i18next.t('cart'), ctx.i18next.t('order'), ctx.i18next.t('Language')]
                ]).resize(),
            );

            // Save the welcome message ID to the cleanUpState array in the session data
            ctx.session.cleanUpState.push({ id: welcomeMessage.message_id, type: 'home' });
        } catch (error) {
            console.error('Error in homeScene.enter (first Message):', error);
        }

        // Display the secondary message
        try {
            const secondaryMessage = await ctx.reply(
                ctx.i18next.t('wellcomemessage'),
                Markup.inlineKeyboard([
                    [Markup.button.callback(ctx.i18next.t('Latest'), 'latest'),
                    Markup.button.callback('Popular', 'popular')],
                ])
            )
            ctx.session.cleanUpState.push({ id: secondaryMessage.message_id, type: 'home' });
        } catch (error) {
            console.error('Error in homeScene.enter (Secondary Message):', error);
        }

    } catch (error) {
        console.error('Error in homeScene.enter:', error);
    }
});



homeScene.hears(match('Search'), async (ctx) => {
    await ctx.scene.enter("searchProduct")
})
homeScene.hears(match('Category'), async (ctx) => {
    await ctx.scene.enter("category")
})
homeScene.hears(match('cart'), async (ctx) => {
    await ctx.scene.enter("cart")
})
homeScene.hears(match('order'), async (ctx) => {
    await ctx.scene.enter("category")
})
homeScene.action('latest', async (ctx) => {
    await ctx.scene.enter('product', { sortBy: 'latest' });
    // await ctx.scene.leave();
});

homeScene.action('popular', async (ctx) => {
    await ctx.scene.enter('product', { sortBy: 'popular' });
    // await ctx.scene.leave();
});
homeScene.hears(match('Language'), async (ctx) => {
    const message = await ctx.reply('Please choose your language', Markup.inlineKeyboard([
        Markup.button.callback('English', 'set_lang:en'),
        Markup.button.callback('አማርኛ', 'set_lang:ru')
    ]))
    ctx.session.languageMessageId = message.message_id;
})
homeScene.leave(async (ctx) => {
    try {
        if (ctx.session.cleanUpState) {
            // Iterate over the cleanUpState array
            for (const message of ctx.session.cleanUpState) {
                // Check if the message exists before attempting to delete it
                if (message?.type === 'home') {
                    await ctx.telegram.deleteMessage(ctx.chat.id, message.id);
                }
            }
        }
    } catch (error) {
        console.error('Error in homeScene.leave:', error);
    } finally {
        // Always clear the cleanUpState array
        ctx.session.cleanUpState = [];
    }

    // Leave the scene
    await ctx.scene.leave();
});

module.exports = {
    homeScene
}