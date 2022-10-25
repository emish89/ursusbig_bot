import { Chat } from "./types";
import { pinChatMessage, sendMessage } from "./utils";

export const docs = async (chat: Chat) => {
  console.log("!docs!");
  sendMessage(
    chat.id,
    "Ecco qui il link a tutta la documentazione, abbiamo pinnato il messaggio nella conversazione: LINK "
  ).then((res) => {
    const messageId = res.data.result.message_id;
    //pin message
    pinChatMessage(chat.id, messageId);
    console.log("pinned docs message with id: ", messageId);
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "called fn docs" }),
  };
};
