
const { Scenes, Markup, session } = require("telegraf")
const fs = require('fs').promises;

const apiUrl = 'http://localhost:5000';
module.exports = {
    checkUserLanguage: async function (chatId) {
        console.log("reach language")
        

        try {
          // Read the sessions file
          const data = await fs.readFile('db1.json', 'utf8');
  
          // Parse the JSON data
          const sessions = JSON.parse(data);
  
          // Find the session for the user with the given chatId
          const session = sessions.sessions.find((session) => {
              const sessionChatId = session.id.split(':')[0];
              console.log("sessionChatId",sessionChatId)
              return sessionChatId === chatId;
          });
  // console.log("sesstion from chcek token",session)
          // Check if a session exists for the user and if it has a token
          if (session && session.data.locale) {
            console.log("There is a token set");
            return session.data.locale;
          } else {
            return null;
          }
        } catch (err) {
          console.error(err);
          return null;
        }
    }


}