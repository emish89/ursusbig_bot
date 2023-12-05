import { Chat } from "./types";
import { sendMessage } from "./utils";

export const help = async (chat: Chat) => {
  console.log("!help!");
  await sendMessage(
    chat.id,
    `Tramite questo bot potrai avere accesso alla documentazione e le schede di Ursus. 
Puoi usare i seguenti comandi: \n
/help - Mostra questo messaggio con tutti i comandi disponibili
/docs - Rimanda e pinna il link alla documentazione
/card - Crea o rimanda e pinna il link alla scheda di allenamento
/calendar - Ti invia il link con cui puoi prenotare una chiamata con Ursus
`,
    process.env.BOT_TOKEN
  );
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "called fn help" }),
  };
};
