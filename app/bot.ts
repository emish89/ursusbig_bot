import { sendMessage } from "./utils";

export const bot = async (id: number, params: string[]) => {
  console.log("!bot!", params);
  sendMessage(id, "Messaggio ricevuto " + params);
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "called fn bot with params " + params }),
  };
};
