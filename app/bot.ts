import { Chat } from "./types";
import { sendMessage } from "./utils";

export const bot = async (chat: Chat, params: string[]) => {
  console.log("!bot!", params);
  sendMessage(chat.id, "Messaggio ricevuto " + params);
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "called fn bot with params " + params }),
  };
};
