import { Chat } from "./types";
import { sendMessage } from "./utils";

export const docs = async (chat: Chat) => {
  console.log("!docs!");
  sendMessage(chat.id, "Il link dove puoi trovare la gli esercizi è: ...");
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "called fn docs " }),
  };
};
