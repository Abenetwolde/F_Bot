const { Scenes, session,Markup } = require("telegraf");


const informationCash = new Scenes.WizardScene(
  "informationCash",
 async (ctx) => {
    ctx.reply(
      "To proceed with the order, we need some information. Please share your phone number, or you can type manually",
      Markup.keyboard([
        Markup.button.contactRequest("Share Contact")
    
      ]).resize()
    );
    return ctx.wizard.next();
  },
  async (ctx) => {
    console.log("share contact...........................",ctx.message)
    if (ctx.message.contact) {
      console.log("share contact....",ctx.message.contact)
      const phoneNumber = ctx.message.contact.phone_number;
      ctx.session.orderInformation = { ...ctx.session.orderInformation, phoneNumber:phoneNumber };
    }else {
      // User manually entered phone number
      const phoneNumber = ctx.message.text;
      ctx.session.orderInformation = { phoneNumber };
    }

    await ctx.reply(
      "Great! Now, please provide your location or send a Google Maps link."
    );
    return ctx.wizard.next();
  },
  async (ctx) => {
    console.log("ctx.message.text",ctx.message.text)
    // if (ctx.message.text) {
      // User shared location
      const location =ctx.message.text
      ctx.session.orderInformation =  {
        ...ctx.session.orderInformation,
        location,
      };
    // }
    if (ctx.session.orderInformation && ctx.session.orderInformation.location) {
      await ctx.reply("Location received. Moving to the next step.");
      return  ctx.scene.enter("NOTE_SCENE");
    } else {
      await ctx.reply("Please provide your location or send a Google Maps link.");
    }
  },
 async (ctx) => {
    return  ctx.scene.enter("NOTE_SCENE");
  }
);

module.exports = {
  informationCash
};
