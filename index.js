
const { Telegraf, Markup, InputFile, Scene, session, WizardScene, Scenes } = require('telegraf');
// const TelegrafI18n = require('telegraf-i18next');
const { i18next } = require('telegraf-i18next');
const { t } = require('telegraf-i18next')
const { reply } = require('telegraf-i18next')
const { Redis } = require("@telegraf/session/redis");
const http = require('http');
const LocalSession = require('telegraf-session-local');
const axios = require('axios');
const fs = require('fs').promises;
const { homeScene, productSceneTest, categoryScene, cart, searchProduct, detailScene, dateScene, noteScene, paymentScene } = require('./Scenes/index.js');
const { checkUserToken } = require('./Utils/checkUserToken');
const { Mongo } = require("@telegraf/session/mongodb");
const { checkUserLanguage } = require('./Utils/language.js');
const { MongoClient } = require('mongodb');
const { sendProduct } = require('./Templeat/prodcut.js');
const bot = new Telegraf("6372866851:AAE3TheUZ4csxKrNjVK3MLppQuDnbw2vdaM", {
  timeout: Infinity
});

// const store = Redis({
// 	url: "redis://127.0.0.1:6380",
// });
bot.use(i18next({
  debug: true,
  lng: 'en',
  fallbackLng: 'en',
  supportedLngs: ['en', 'ru'],
  resources: {
    en: {
      translation: require('./locales/en.json')
    },
    ru: {
      translation: require('./locales/ru.json')
    }
  }
}));
const { Stage } = Scenes;
const stage = new Stage([homeScene, searchProduct, detailScene, productSceneTest, categoryScene, cart, dateScene, noteScene, paymentScene/* ,productScene,latestScene,popularScene */])


// bot.use(session({ store }));
// bot.use(session());
// bot.use(i18n.middleware());


// const localSession = new LocalSession({
//   getSessionKey(ctx) {
//     const fromId = ctx.from?.id;
//     if (fromId) return String(fromId);
//   },
//   database: 'db1.json',
//   property: 'session',
//   storage: LocalSession.storageFileAsync,
//   format: {
//     serialize: (obj) => JSON.stringify(obj, null, 2),
//     deserialize: (str) => JSON.parse(str),
//   },
// });


// bot.use(localSession.middleware());
const mongoClient = new MongoClient('mongodb://127.0.0.1:27017', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Connect to the MongoDB server
mongoClient.connect()
  .then(() => {
    console.log('MongoDB connected successfully');

    // Use the MongoDB client to initialize the Mongo store
    const store = Mongo({
      client: mongoClient,
      database: 'telegraf-bot',

    });

    // Create a new Telegraf bot


    // Use the session middleware with the MongoDB store
    bot.use(session({ store, getSessionKey: (ctx) => ctx.from?.id.toString(), }));

    // Rest of your bot setup...
    bot.use((ctx, next) => {
      if (!ctx.session) {
        ctx.session = {}; // Initialize session if not exists
      }
      if (ctx.session.locale) {
        ctx.i18next.changeLanguage(ctx.session.locale);
      }
      return next();
    });


    bot.use(stage.middleware())

    bot.use(async (ctx, next) => {
      const currentTime = new Date().getTime();

      // Set the start time on the user's first interaction
      if (!ctx.session.startTime) {
        ctx.session.startTime = currentTime;
        console.log('User session started');
      }

   
      ctx.session.lastInteractionTime = currentTime;


      if (ctx.session.intervalId) {
        clearInterval(ctx.session.intervalId);
      }

      
      ctx.session.intervalId = setInterval(async () => {
        const startTime = ctx.session.startTime || 0;
        const lastInteractionTime = ctx.session.lastInteractionTime || 0;

     
        const duration = lastInteractionTime - startTime;

        // If user is inactive for a certain duration (e.g., 1 minute)
        if (duration > 1 * 60 * 1000) {
   
          const formattedDuration = new Date(duration).toISOString().substr(11, 8);

          await ctx.reply(`User spent ${formattedDuration} in the chat`);



          ctx.session.startTime = 0;
        
          clearInterval(ctx.session.intervalId);
        }

      }, 60000);

      // Call the next middleware
      await next();
    });

    bot.use((ctx, next) => {
      const start = new Date();
      return next(ctx).then(() => {
        const ms = new Date() - start;
        console.log('Response time: %sms', ms);
      });
    })

    bot.start(async (ctx) => {
      console.log("chatid", ctx.chat.id)
      const startCommand = ctx.message.text.split(' ');
      if (startCommand.length === 2 && startCommand[1].startsWith('chat_')) {
        // Extract the question ID from the arguments
        const questionId = startCommand[1].replace('chat_', '');
        console.log("id from search scene", questionId)
        try {
          // Fetch the product details
          const response = await axios.get(`http://localhost:5000/api/getprodcut/${questionId}`);
          const product = response.data.product;
          // product.quantity = typeof product.quantity === 'number' ? product.quantity : 0;

          // Update the quantity based on the action

          await ctx.scene.enter("product", { product: product })
          // await ctx.scene.leave()
          // Use the new function to send or edit the message
          // await sendProduct(ctx, questionId, product);
        } catch (error) {
          console.error('Error handling quantity action:', error);
        }
        // ctx.session.questionId = questionId;
        // // Find the question by ID and populate the replies
        // const question = await TyQuestion.findById(questionId).populate('replies.user').exec();
        // console.log("question", question)
        // if (question) {
        //     // Display the question and replies to the user
        //     sendQuestionWithReplies(ctx, question);
        //     return;
        // }
      } else {
        try {
          if (ctx.session.cleanUpState) {
            ctx.session.cleanUpState.forEach(async (message) => {

              if (message?.type === 'product' || message?.type === 'pageNavigation') {
                console.log("reach start.........")
                await ctx.telegram.deleteMessage(ctx.chat.id, message.id).catch((e) => ctx.reply(e.message));

              }
            });
          }
        } catch (error) {
          console.error("error while deleting message when the bot start", error)
        }
        // Check if the user has selected a language.
        if (!ctx.session.locale) {
          // If not, ask the user to select a language.
          const message = await ctx.reply('Please choose your language', Markup.inlineKeyboard([
            Markup.button.callback('English', 'set_lang:en'),
            Markup.button.callback('አማርኛ', 'set_lang:ru')
          ]))
          ctx.session.languageMessageId = message.message_id;
          const userToken = await checkUserToken(`${ctx.from.id}`, ctx)
          console.log("userToken", userToken)

          if (userToken == null) {
            // If the user doesn't have a token, register them.
            try {
              const response = await axios.post('http://localhost:5000/api/createuser', {
                telegramid: ctx.from.id,
                name: ctx.from.first_name,
                last: ctx.from.last_name
                // other necessary data...       
              });
              console.log("response.data", response.data)

              await ctx.reply(response.data.token)

              ctx.session.token = response.data.token;
            }
            catch (error) {
              if (error.message == 'User already exists!') {
                await ctx.reply("User already exists! ")
              }
              console.log(error.response)
            }
          }

        } else {
          // If the user has selected a language, check if they have a token.
          const userToken = await checkUserToken(`${ctx.from.id}`, ctx)
          console.log("userToken", userToken)

          if (userToken == null) {
            // If the user doesn't have a token, register them.
            try {
              const response = await axios.post('http://localhost:5000/api/createuser', {
                telegramid: ctx.from.id,
                name: ctx.from.first_name,
                last: ctx.from.last_name
                // other necessary data...       
              });
              console.log("response.data", response.data)

              await ctx.reply(response.data.token)
              const data = await fs.readFile('db.json', 'utf8');

              ctx.session.token = response.data.token;
            }
            catch (error) {
              if (error.message == 'User already exists!') {
                await ctx.reply("User already exists! ")
              }
              console.log(error.response)
            }
          }
          // Whether the user was just registered or is already registered, enter the home scene.
          await ctx.scene.enter('homeScene');
        }
      }
      // ctx.replyWithPhoto("https://backend-vg1d.onrender.com/393a8c4d-b965-45ab-83ad-8a774141fa12.png")

    });
    bot.action(/set_lang:(.+)/, async (ctx) => {
      if (!ctx.session) {
        ctx.session = {}; // Initialize session if not exists
      }
      ctx.session.locale = ctx.match[1];

      ctx.i18next.changeLanguage(ctx.session.locale);
      if (ctx.session.languageMessageId) {
        await ctx.telegram.deleteMessage(ctx.chat.id, ctx.session.languageMessageId);
      }
      await ctx.scene.enter('homeScene');;
    });
  })

bot.on("pre_checkout_query", async (ctx) => {
  await ctx.answerPreCheckoutQuery(true)
  /*     respond to a pre-checkout query sent by a user when they are about to make a payment. 
        By passing in true, 
      this code is indicating that the payment should be allowed to proceed. */
})
/* This code uses the getWebhookInfo method to check 
   if a webhook is set for your bot. If a webhook is set, it may cause conflicts with the getUpdates 
   method and result in the error message you are seeing. In this case, you should either remove the webhook or switch to using webhooks 
    instead of the getUpdates method to receive updates. */
bot.telegram.getWebhookInfo().then(info => {
  if (info.url) {
    console.log(`Webhook is set to ${info.url}, this may cause conflicts with getUpdates method`)
  } else {
    console.log('No webhook is set, getUpdates method should work fine')
  }
})
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });
// bot.use(session({ defaultSession: () => ({ locale: 'en' }) }))

bot.telegram.setMyCommands([
  { command: 'start', description: 'Test command' },
  { command: 'greetings', description: 'Greetings command' }
]);


// bot.use(async (ctx, next) => {
//   if (!ctx.session.messages) {
//     ctx.session.messages = [];
//   }
//   const message = await next();

//   if (message && message.message_id) {
//     ctx.session.messages.push({
//       id: message.message_id,
//       type: message.chat.type,
//     });
//   } 

// });

// Middleware to track user interactions and send duration to API if inactive


// Middleware to periodically check user activity and send to API
// setInterval(async () => {
//   bot.use(async (ctx) => {
//     const startTime = ctx.session.startTime || 0;
//     const lastInteractionTime = ctx.session.lastInteractionTime || 0;

//     // Calculate session duration
//     const duration = lastInteractionTime - startTime;
// console.log("duration..........",duration)
//     // If user is inactive for a certain duration (e.g., 5 minutes)
//     if (duration > 1 * 60 * 1000) {
//       // Format the duration into HH:MM:SS
//       const formattedDuration = new Date(duration).toISOString().substr(11, 8);

//       // Log or send the duration to an API
//       console.log(`User spent ${formattedDuration} in the chat`);

//       // Assuming your API endpoint is 'YOUR_API_ENDPOINT'
//       // try {
//       //   await axios.post('YOUR_API_ENDPOINT', {
//       //     userId: ctx.from.id,
//       //     duration: formattedDuration,
//       //   });
//       // } catch (error) {
//       //   console.error('Error sending duration to API:', error.message);
//       // }

//       // Reset the start time for the next session
//       ctx.session.startTime = undefined;
//     }
//   });
// }, 6000); // Check every 1 minute





bot.command('product', async (ctx) => {
  ctx.scene.enter("PRODUCT_SCENE")
});

bot.command('mariya', async (ctx) => {
  const userId = ctx.message.from.id
  try {
    const res = await bot.telegram.sendMessage("355514342", 'Hey Maria, How are you?This is Lelasew, my Telegram is accidentally banned(idk what happen) you can reach me now at @abnetw see you!')
    console.log("res...........", res)
  } catch (err) {
    console.log('An error occurred:', err)
  }

})





bot.command('farewell', (ctx) => {
  return ctx.reply(ctx.i18next.t('farewell'));
});

bot.command('changeLanguage', async (ctx) => {
  let language = ctx.session.locale == "en" ? "ru" : "en";
  ctx.i18next.changeLanguage(language);
  return ctx.reply(ctx.i18next.t('changeLanguage'));
});
const storeLocation = {
  latitude: 8.987376259110306,// Replace with the actual latitude of your store
  longitude: 38.78894603158134, // Replace with the actual longitude of your store
};

// Function to calculate distance
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
    Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
};

// Function to convert degrees to radians
const deg2rad = (deg) => {
  return deg * (Math.PI / 180);
};

// Start command
bot.command('location', (ctx) => {
  ctx.reply('Please share your location:', Markup.keyboard([[Markup.button.locationRequest('Share Location')]]).resize());
});

bot.on('location', async (ctx) => {
  const userLocation = ctx.message.location;
  console.log(userLocation)
  const latitude = ctx.message.location.latitude;
  const longitude = ctx.message.location.longitude;
  const apiKey = '00e3d74bccb441b789b527912050f884';
  const geocodingUrl = `https://api.opencagedata.com/geocode/v1/json?key=${apiKey}&q=${latitude}+${longitude}&pretty=1`;


  try {
    const response = await axios.get(geocodingUrl);
    const firstResult = response.data.results[0]; // Get the first result

    if (firstResult) {
      const formattedAddress = firstResult.formatted;
      const country = firstResult.components.country;

      ctx.reply(`Location: ${formattedAddress}, Country: ${country}`);
    } else {
      ctx.reply('Location not found');
    }
  } catch (error) {
    console.error('Error fetching location data:', error);
    ctx.reply('Sorry, there was an error processing your location.');
  }
  const distance = calculateDistance(
    userLocation.latitude,
    userLocation.longitude,
    storeLocation.latitude,
    storeLocation.longitude
  );

  // Set price based on the distance (replace with your pricing logic)
  let price;
  if (distance < 5) {
    price = '$10 Birr';
  } else {
    price = '15 Birr';
  }
  // Function to estimate travel time based on average speed
  const estimateTravelTime = (distance, averageSpeed) => {
    // Assuming averageSpeed is in kilometers per hour
    const travelTimeInHours = distance / averageSpeed;
    const travelTimeInMinutes = travelTimeInHours * 60;
    return travelTimeInMinutes;
  };

  // Example coordinates (replace with actual coordinates)
  // const origin = { latitude: 37.7749, longitude: -122.4194 }; // San Francisco, CA
  // const destination = { latitude: 34.0522, longitude: -118.2437 }; // Los Angeles, CA

  // // Calculate distance between origin and destination
  // const distance = calculateDistance(origin.latitude, origin.longitude, destination.latitude, destination.longitude);

  // Estimate travel time (assuming an average speed of 60 km/h)
  const averageSpeed = 60; // in kilometers per hour
  const travelTime = estimateTravelTime(distance, averageSpeed);
  ctx.reply(`Estimated travel time: ${travelTime.toFixed(2)} minutes`);
  console.log(`Distance: ${distance.toFixed(2)} km`);

  console.log(`Estimated travel time: ${travelTime.toFixed(2)} minutes`);

  ctx.reply(`Distance to the store: ${distance.toFixed(2)} km\nPrice: ${price}`);
});



// bot.action("Home", async (ctx) => {
//   await ctx.scene.enter("homeScene")
//   console.log("go to Home called")
//   // await ctx.scene.leave();
// });
bot.catch(async (err, ctx) => {
  console.log(`Error while handling update ${ctx.update.update_id}:`, err)

  const errorCode = err.response && err.response.error_code;
  let errorMessage = '';

  switch (errorCode) {
    case 400:
      errorMessage = 'Bad Request: The request was not understood or lacked required parameters.';
      break;
    case 403:
      errorMessage = 'Forbidden: The bot was blocked by the user.';
      break;
    case 404:
      errorMessage = 'Not Found: The requested resource could not be found.';
      break;
    case 409:
      errorMessage = 'Conflict: The request could not be completed due to a conflict with the current state of the resource.';
      break;
    case 429:
      errorMessage = 'Too Many Requests: The bot is sending too many requests to the Telegram servers.';
      break;
    case 500:
      errorMessage = 'Internal Server Error: An error occurred on the server.';
      break;
    default:
      errorMessage = 'An error occurred while processing your request.';
  }
  const adminChatId = '2126443079'
  // Notify the user
  await ctx.telegram.sendMessage(adminChatId, errorMessage).catch((err) => {
    console.log('Failed to send error message to user:', err);
  });
  // if (ctx && ctx.chat && ctx.chat.id) {
  await ctx.telegram.sendMessage(adminChatId, errorMessage).catch((err) => {
    console.log('Failed to send error message to user:', err);
  });
  // }
})
setInterval(async () => {
  bot.use(async (ctx) => {
    const startTime = ctx.session.startTime || 0;
    const lastInteractionTime = ctx.session.lastInteractionTime || 0;

    // Calculate session duration
    const duration = lastInteractionTime - startTime;
    console.log("duration..........", duration)
    // If user is inactive for a certain duration (e.g., 5 minutes)
    if (duration > 1 * 6 * 1000) {
      // Format the duration into HH:MM:SS
      const formattedDuration = new Date(duration).toISOString().substr(11, 8);

      // Log or send the duration to an API
      console.log(`User spent ${formattedDuration} in the chat`);
      await ctx.reply(`User spent ${formattedDuration} in the chat`)
      // Assuming your API endpoint is 'YOUR_API_ENDPOINT'
      // try {
      //   await axios.post('YOUR_API_ENDPOINT', {
      //     userId: ctx.from.id,
      //     duration: formattedDuration,
      //   });
      // } catch (error) {
      //   console.error('Error sending duration to API:', error.message);
      // }

      // Reset the start time for the next session
      ctx.session.startTime = undefined;
    }
  });
}, 6000);
bot.on('chosen_inline_result', async (ctx) => {
  // Extract relevant information
  const userId = ctx.update.chosen_inline_result.from.id;
  const queryResultId = ctx.update.chosen_inline_result.result_id;
  const inlineMessageId = ctx.update.chosen_inline_result.inline_message_id;
  // Log the chosen inline result
  console.log(`User ${userId} chose inline result ${queryResultId}`);
  // Extract message ID and chat ID
  // const messageId = ctx.update.chosen_inline_result.inline_message_id;
  // const chatId = ctx.chat.id;
  console.log("ctx", ctx)
  if (inlineMessageId) {
    try {
      // Use deleteMessage to delete the message
      await ctx.telegram.deleteMessage(userId, inlineMessageId);
      console.log(`Message deleted: ${messageId}`);
    } catch (error) {
      console.error(`Error deleting message: ${error}`);
    }
  } else {
    console.warn('Message ID or Chat ID not available');
  }
});
// You can add additional logic here if needed

// Don't send a message (or take any other action)

// Check every 1 minute
// bot.on('chosen_inline_result', async (ctx) => {
//   // Store the message ID when a user selects an inline result
//   const resultId = ctx.chosenInlineResult.result_id;
//   console.log("resultId",resultId)
//   ctx.session[resultId] = ctx.chosenInlineResult.inline_message_id;
// });

// bot.on('callback_query', async (ctx) => {
//   await ctx.answerCbQuery('Processing your request...');
//   console.log("reach on callback_query")
//   // const productId = ctx.callbackQuery.data;
//   // console.log("productId", productId)// Get the product ID from the callback data
//   // const product = products.find((product) => product.id == productId); // Find the product in your products data
//   // ctx.scene.enter('product');
//   // if (product) {
//   //   console.log("there is aprodcut")

//   // }
// });
// bot.on('message', async (ctx, next) => {
//   if (ctx.message.text === 'Home') {
//     for (const message of ctx.session.messages) {

//       await ctx.telegram.deleteMessage(message.chat.id, message.id);
//     }

//     ctx.session.messages = [];

//     await ctx.scene.enter('homeScene');

//     return;
//   }
//   else if (ctx.message.text === 'Category') {
//     for (const message of ctx.session.messages) {
//       await ctx.telegram.deleteMessage(message.chat.id, message.id);
//     }

//     ctx.session.messages = [];

//     await ctx.scene.enter('category');

//     return;
//   }
//   return next();
// });

process.once("SIGINT", () => bot.stop("SIGINT"))
process.once("SIGTERM", () => bot.stop("SIGTERM"))
//  bot.telegram.setWebhook('https://tiny-lime-earthworm.cyclic.app/my-secret-path');
// bot.launch({
//   webhook: {
//     domain: 'https://boxtest.onrender.com/',
//     hookPath: '/my-secret-path',
//   },
// });
//  bot.telegram.setWebhook('https://boxtest.onrender.com/my-secret-path');
// Use telegraf's webhookCallback method to handle updates from Telegram
// app.use(bot.webhookCallback('/'));


// http.createServer(bot.webhookCallback('/my-secret-path')).listen(3000);

// module.exports = async (req, res) => {
//   try {
//     await bot.handleUpdate(req.body, res);
//   } catch (err) {
//     console.error(err);
//     res.status(500).send({ error: err.message });
//   }
// };


// bot.launch({
//   dropPendingUpdates: true, polling: {
//     timeout: 30,
//     limit: 100,
//   },
// })
const launch = async () => {
  try {
    await bot.launch({
      dropPendingUpdates: true,
      polling: {
        timeout: 30,
        limit: 100,
      },
    });
    console.log('Bot is running!');
  } catch (e) {
    console.error(`Couldn't connect to Telegram - ${e.message}; trying again in 5 seconds...`);

    // Wait for 5 seconds before attempting to reconnect
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Retry launching the bot
    await launch();
  }
};

launch();


