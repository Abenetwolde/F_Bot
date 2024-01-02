const User = require('../Model/user');

async function createUser(data) {
    console.log("reach register user................",data.telegramid)
    console.log("reach register user................", data.name)

  try {
    let user = await User.findOne({ telegramid: data.telegramid });
 
    if (user) {
      return { token: user.token, message: 'User already registered.' };
    } else {
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_TOKEN_SECRET_KEY,
            { expiresIn: "7d" }
          ); 

      user = new User({
        telegramid: data.telegramid,
        name: data.name,
        token: token,
      });
      console.log("user................",user)
      user = await user.save();

      return { success: true, user };
    }
  } catch (error) {
    throw new Error(error.message);
  }
}

module.exports = {
  createUser,
  // Add other database functions related to the User model here
};
