import { Chat } from "./types";
import { sendMessage, ursusTgId } from "./utils";

export const calendar = async (chat: Chat, params: string[]) => {
  console.log("!calendar!");
  await Promise.all([
    sendMessage(chat.id, "Prendi appuntamento con Ursus da questo link ... "),
    sendMessage(
      ursusTgId,
      `${chat.username} ha aperto calendly per prendere appuntamento`
    ),
  ]);
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "called fn calendar" }),
  };
};
