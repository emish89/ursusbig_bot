import { Chat, TelegramResponse } from "./types";
import { pinChatMessage, sendMessage } from "./utils";

export const docs = async (chat: Chat) => {
  console.log("!docs!");
  await sendMessage(
    chat.id,
    "Ecco qui il link a tutta la documentazione, abbiamo pinnato il messaggio nella conversazione: LINK ",
    process.env.BOT_TOKEN
  ).then(async (res: TelegramResponse) => {
    const messageId = res?.result?.message_id;
    if (messageId) {
      //pin message
      await pinChatMessage(chat.id, messageId, process.env.BOT_TOKEN);
      console.log("pinned docs message with id: ", messageId);
    } else {
      console.log("error pinning docs message - ", res);
    }
  });
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "called fn docs" }),
  };
};
