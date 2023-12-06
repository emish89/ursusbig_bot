import { createGDocsFile, loadSavedCredentials, printSheet } from "./gcpUtils";
import { Chat } from "./types";
import {
  createAirTableUser,
  getAirTableData,
  pinChatMessage,
  sendMessage,
  ursusTgId,
} from "./utils";

export const airTableLink = "appkyyf1lUUVaIW0j";

const manageUser = async (chat: Chat) => {
  await getAirTableData(
    `/v0/${airTableLink}/users?api_key=${process.env.AIRTABLE_API_KEY}&filterByFormula=(%7Btg_id%7D+%3D+${chat.id})`
  ).then(async (response) => {
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
                  `Ciao ${chat.username}! Ho creato il tuo file, sarà visibile il prima possibile da questo link: ${fileName}`,
                  process.env.BOT_TOKEN
                ).then((res) => {
                  const messageId = res.result.message_id;
                  //pin message
                  pinChatMessage(chat.id, messageId, process.env.BOT_TOKEN);
                  console.log("pinned card message with id: ", messageId);
                }),
                sendMessage(
                  ursusTgId,
                  `${chat.username} ha creato il suo file scheda, cerca di riempirlo il prima possibile`,
                  process.env.BOT_TOKEN
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
        `Ciao ${chat.username}! Il link dove puoi trovare la gli esercizi è: ${file}`,
        process.env.BOT_TOKEN
      );
    }
  });
};

const manageUserSheet = async (chat: Chat) => {
  await getAirTableData(
    `/v0/${airTableLink}/users?api_key=${process.env.AIRTABLE_API_KEY}&filterByFormula=(%7Btg_id%7D+%3D+${chat.id})`
  ).then(async (response) => {
    if (response.records.length !== 0) {
      const file = response.records[0].fields.file_name;

      loadSavedCredentials().then((auth) => {
        printSheet(auth, chat.username)
          .then(async (message) => {
            console.log(message);
            await sendMessage(
              chat.id,
              `Ciao ${chat.username}! Il link dove puoi trovare la gli esercizi è: ${file}`,
              process.env.BOT_TOKEN
            );
          })
          .catch((err) => {
            console.log(err);
          });
      });
    } else {
      //user not existing
    }
  });
};

export const card = async (chat: Chat) => {
  console.log("!card!");

  await manageUserSheet(chat).catch((err) => {
    console.log(err);
  });
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "called fn card" }),
  };
};
