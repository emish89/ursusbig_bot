import { sendMessage } from "./utils";

export const docs = async (id: number) => {
  console.log("!docs!");
  sendMessage(id, "Il link dove puoi trovare la gli esercizi è: ...");
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "called fn docs " }),
  };
};
