const { assignWith } = require("lodash");
const { Scenes, session, Markup } = require("telegraf");


const informationCash = new Scenes.WizardScene(
  "informationCash",
  async (ctx) => {
  await  ctx.reply(
      "To proceed with the order, we need some information. Please share your phone number, or you can type manually",
      Markup.keyboard([
        Markup.button.contactRequest("Share Contact")

      ]).resize()
    );

    return ctx.wizard.next();
  },
  async (ctx) => {
    console.log("share contact...........................", ctx.message)
    let phoneNumber = "";

    if (ctx.message.contact) {
      console.log("share contact....", ctx.message.contact);
      phoneNumber = ctx.message.contact.phone_number;
    } else {
      // User manually entered phone number
      phoneNumber = ctx.message.text;
    }

    if (phoneNumber) {
      ctx.session.orderInformation = { ...ctx.session.orderInformation, phoneNumber };
      // Manually move to the next step
      return informationCash.handlers[2](ctx);
    } else {
      await ctx.reply("Please provide a valid phone number.");
    }
  },
  async (ctx) => {
    const updatedKeyboard = Markup.keyboard([
      ["❌ Cancel"]
    ]).resize();
    await ctx.reply(
      "Great! Now, please provide your location or send a Google Maps link.",
      updatedKeyboard
    );
    console.log("ctx.message.text", ctx.message.text)
    // if (ctx.message.text) {
    // User shared location
    const location = ctx.message.text
    if (location === "❌ Cancel" || location === "/start") {
      return ctx.scene.enter("cart")
    } else {
      ctx.session.orderInformation = {
        ...ctx.session.orderInformation,
        location,
      };
    }
    // }
    if (ctx.session.orderInformation && ctx.session.orderInformation.location) {
      await ctx.reply("Location received. Moving to the next step.");
      return ctx.scene.enter("NOTE_SCENE");
    } else {
      await ctx.reply("Please provide your location or send a Google Maps link.");
    }
  },
  async (ctx) => {
    return ctx.scene.enter("NOTE_SCENE");
  }
);

module.exports = {
  informationCash
};
