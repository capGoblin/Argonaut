import { Request } from "express";
import { handleMessage } from "./lib/Telegram";

interface TelegramUpdate {
  message?: {
    chat: {
      id: number;
    };
    text?: string;
  };
}

async function handleRequest(req: Request): Promise<void> {
  const body = req.body as TelegramUpdate;
  if (body && body.message) {
    await handleMessage(body.message);
  }
  return;
}

export { handleRequest };
