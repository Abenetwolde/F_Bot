// const User = require('../Model/user');
const Users = require('../Model/user')
const jwt = require("jsonwebtoken");
const connectDatabase = require('../config/database');

async function createUser(data) {
  console.log("reach register user................", data.telegramid)
  console.log("reach register user................", data.name)

  try {

    let user = await Users.findOne({ telegramid: data.telegramid });

    if (user) {
      return { token: user.token, message: 'User already registered.' };
    } else {
      const token = jwt.sign(
        { userId: data.telegramid },
        process.env.JWT_TOKEN_SECRET_KEY || "hfjkdhjkhsjdkghjkd",
        { expiresIn: "7d" }
      );
      console.log("user................", token)
      user = await new Users({
        telegramid: data.telegramid,
        first_name: data.first_name,
        last_name: data.last_name,
        username: data.username,
        is_bot: data.is_bot,
        language:data.language,
        token: token,
      });
      console.log("user................", user)
      user = await user.save();

      return { success: true, user };
    }
  } catch (error) {
    throw new Error(error.message);
  }
}
async function updateUserLanguage(telegramId, language) {
  try {
    const user = await Users.findOne({ telegramid: telegramId });

    if (user) {
      // Update the user's language
      user.language = language;
      await user.save();
      return { success: true, message: 'User language updated successfully' };
    } else {
      return { success: false, message: 'User not found' };
    }
  } catch (error) {
    throw new Error(error.message);
  }
}

module.exports = {
  createUser,
  updateUserLanguage
  // Add other database functions related to the User model here
};
