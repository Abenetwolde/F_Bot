const { Scenes, Markup } = require("telegraf");

const informationCash = new Scenes.WizardScene(
  "informationCash",
  (ctx) => {
    ctx.reply(
      "To proceed with the order, we need some information. Please share your phone number.",
      Markup.keyboard([
        Markup.button.contactRequest("Share Contact"),
        "❌ Cancel"

      ]).resize()
    );
    return ctx.wizard.next();
  },
  (ctx) => {
   const text= ctx.message?.text;
    if (text === "❌ Cancel" || text === "/start") {
      return ctx.scene.enter("cart")
  }
    if (ctx.message.contact) {
      console.log("share contact....", ctx.message.contact);
      // User shared contact
      const phoneNumber = ctx.message.contact.phone_number;
      console.log("validatePhoneNumber(phoneNumber)",validatePhoneNumber(phoneNumber))
    
      ctx.session.orderInformation = { ...ctx.session.orderInformation, phoneNumber };
      console.log(" ctx.session.orderInformation.phoneNumber)", ctx.session.orderInformation.phoneNumber)
      // if( ctx.session.orderInformation.phoneNumber) return ctx.wizard.next()

    } else {
      // User manually entered phone number
      const phoneNumber = ctx.message.text;
      if (validatePhoneNumber(phoneNumber)) {
        ctx.session.orderInformation = { ...ctx.session.orderInformation, phoneNumber };
      } else {
        ctx.reply("Invalid phone number format. Please enter a valid phone number starting with 0 or +251, followed by 9 digits.");
         return ctx.scene.reenter(); // Re-enter the same step
      }

    }
    ctx.reply(
      "Great! Now, please provide your location or send a Google Maps link.", Markup.keyboard([
        ["❌ Cancel"]

      ]).resize()
    );
    // Check if the user shared their contact



    return ctx.wizard.next();
  },
  async (ctx) => {

    const text=ctx.message.text
    if (ctx.message.text) {
      console.log("share location....", ctx.message.text);
      // User shared location
      if (text === "❌ Cancel" || text === "/start") {
        return ctx.scene.enter("cart")
    }
      const location = ctx.message.text
      ctx.session.orderInformation = {
        ...ctx.session.orderInformation,
        location: location,
      };
    }

    return ctx.scene.enter("NOTE_SCENE");
  },
  // (ctx) => {
  //   return ctx.scene.enter("NOTE_SCENE");
  // }
);
function validatePhoneNumber(phoneNumber) {
  const phoneNumberRegex = /^(0|\+251)\d{9}$/; // Match either starts with 0 or +251 followed by 9 digits
  return phoneNumberRegex.test(phoneNumber);
}
module.exports = {
  informationCash
};
