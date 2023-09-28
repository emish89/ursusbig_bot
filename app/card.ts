import { createGDocsFile, loadSavedCredentials } from "./gcpUtils";
import { Chat } from "./types";
import {
  createAirTableUser,
  getAirTableUserById,
  pinChatMessage,
  sendMessage,
  ursusTgId,
} from "./utils";

const manageUser = async (chat: Chat) => {
  await getAirTableUserById(chat.id).then(async (response) => {
    if (response.records.length === 0) {
      //I need to create the file and the user
      //I create the file
      loadSavedCredentials().then((auth) => {
        createGDocsFile(auth, chat.username).then((docId) => {
          //then I create the user
          const fileName = `https://docs.google.com/document/d/${docId}/edit`;
          createAirTableUser(chat.id, chat.username, fileName).then(
            async (res) => {
              await Promise.all([
                sendMessage(
                  chat.id,
                  `Ciao ${chat.username}! Ho creato il tuo file, sarà visibile il prima possibile da questo link: ${fileName}`
                ).then((res) => {
                  const messageId = res.result.message_id;
                  //pin message
                  pinChatMessage(chat.id, messageId);
                  console.log("pinned card message with id: ", messageId);
                }),
                sendMessage(
                  ursusTgId,
                  `${chat.username} ha creato il suo file scheda, cerca di riempirlo il prima possibile`
                ),
              ]);
            }
          );
        });
      });
    } else {
      //user exists
      const file = response.records[0].fields.file_name;
      await sendMessage(
        chat.id,
        `Ciao ${chat.username}! Il link dove puoi trovare la gli esercizi è: ${file}`
      );
    }
  });
};
export const card = async (chat: Chat) => {
  console.log("!card!");

  await manageUser(chat).catch((err) => {
    console.log(err);
  });
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "called fn card" }),
  };
};
