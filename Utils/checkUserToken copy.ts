import { Scenes, Markup, session } from "telegraf";
import { promises as fs } from 'fs';

const apiUrl = 'http://localhost:5000';

export const checkUserToken = async function (chatId: string) {
    console.log("reach checkUserToken");

    try {
        // Read the sessions file
        const data = await fs.readFile('db1.json', 'utf8');

        // Parse the JSON data
        const sessions = JSON.parse(data);

        // Find the session for the user with the given chatId
        const sessionData = sessions.sessions.find((session: any) => {
            const sessionChatId = session.id.split(':')[0];
            console.log("sessionChatId", sessionChatId)
            return sessionChatId === chatId;
        });

        // console.log("sesstion from chcek token", sessionData)
        // Check if a session exists for the user and if it has a token
        if (sessionData && sessionData.data.token) {
            console.log("There is a token set");
            return sessionData.data.token;
        } else {
            return null;
        }
    } catch (err) {
        console.error(err);
        return null;
    }
};
