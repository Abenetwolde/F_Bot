const { MongoClient } = require('mongodb');

const mongoClient = new MongoClient('mongodb://127.0.0.1:27017', {
  useNewUrlParser: true,
  useUnifiedTopology: true,

}); 


async function checkUserToken(chatId ,ctx) {
  try {
//     await mongoClient.connect();
//     const database =await mongoClient.db('telegraf-bot');
//     const sessionsCollection = await database.collection('telegraf-sessions');
// // if(sessionsCollection)return true
//     // Find the session for the user with the given chatId
//     const session = await sessionsCollection.findOne({
//       'key': chatId,
//     });
//     console.log("sesstion found",session)

    // Check if a session exists for the user and if it has a token
    console.log("ctx.session",ctx.session)
    if (ctx.session && ctx.session.token) {
      console.log('There is a token set');
      return ctx.session.token;
    } else {
      return null;
    }
  } catch (error) {
    console.error(error);
    return null;
  } finally {
    await mongoClient.close();
  }
}

module.exports = {
  checkUserToken,
};
