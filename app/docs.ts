import { createDocFile, loadSavedCredentials } from "./gcpUtils";
import { Chat } from "./types";
import {
  createAirTableUser,
  getAirTableUserById,
  pinChatMessage,
  sendMessage,
  ursusTgId,
} from "./utils";

export const docs = async (chat: Chat) => {
  console.log("!docs!");
  getAirTableUserById(chat.id).then((response) => {
    if (response.data.records.length === 0) {
      //I need to create the file and the user
      //I create the file
      loadSavedCredentials().then((auth) => {
        createDocFile(auth, chat.username).then((docId) => {
          //then I create the user
          const fileName = `https://docs.google.com/document/d/${docId}/edit`;
          createAirTableUser(chat.id, chat.username, fileName).then((res) => {
            sendMessage(
              chat.id,
              `Ciao ${chat.username}! Ho creato il tuo file, sarà visibile il prima possibile da questo link: ${fileName}`
            ).then((res) => {
              const messageId = res.data.result.message_id;
              //pin message
              pinChatMessage(chat.id, messageId);
              console.log("pinned message with id: ", messageId);
            });
            sendMessage(
              ursusTgId,
              `${chat.username} ha creato il suo file scheda, cerca di riempirlo il prima possibile`
            );
          });
        });
      });
    } else {
      //user exists
      const file = response.data.records[0].fields.file_name;
      sendMessage(
        chat.id,
        `Ciao ${chat.username}! Il link dove puoi trovare la gli esercizi è: ${file}`
      );
    }
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "called fn docs" }),
  };
};
