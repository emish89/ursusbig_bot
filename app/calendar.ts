import { sendMessage } from "./utils";

export const calendar = async (id: number, params: string[]) => {
  console.log("!calendar!");
  sendMessage(id, "Prendi appuntamento con Ursus da questo link ... ");
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "called fn calendar" }),
  };
};
