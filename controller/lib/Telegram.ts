import dotenv from "dotenv";
import { axiosInstance } from "./axios";

dotenv.config();

interface TelegramMessage {
  chat: {
    id: number;
  };
  text?: string;
}

const startMessage = `
Hello! 👋

`;

const helpMessage = `
Hello! Here are the commands you can use:

/start - Start a conversation with the bot.
/help - Display this help message.


If you need further assistance, feel free to ask!
`;

function sendMessage(messageObj: TelegramMessage, messageText: string) {
  return axiosInstance.get("sendMessage", {
    params: {
      chat_id: messageObj.chat.id,
      text: messageText,
    },
  });
}

async function handleMessage(messageObj: TelegramMessage) {
  const cmd = messageObj.text || "";

  if (cmd === "/start") {
    return sendMessage(messageObj, startMessage);
  } else if (cmd === "/help") {
    return sendMessage(messageObj, helpMessage);
  }
}

export { handleMessage };
