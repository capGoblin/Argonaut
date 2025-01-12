require('dotenv').config();
const { axiosInstance, } = require("./axios");

const startMessage = `
Hello! 👋

`;

const helpMessage = `
Hello! Here are the commands you can use:

/start - Start a conversation with the bot.
/help - Display this help message.


If you need further assistance, feel free to ask!
`;

function sendMessage(messageObj, messageText) {
    return axiosInstance.get("sendMessage", {
        chat_id: messageObj.chat.id,
        text: messageText,
    });
}

async function handleMessage(messageObj) {
    const cmd = messageObj.text || "";

    if (cmd === "/start") {
        return sendMessage(messageObj, startMessage);
    } else if (cmd === "/help") {
        return sendMessage(messageObj, helpMessage);
    }
}

module.exports = { handleMessage };
