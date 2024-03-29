import { Handler } from "@netlify/functions";
import { parseCommand } from "../../app/utils";
import { help } from "../../app/help";
import { docs } from "../../app/docs";
import { calendar } from "../../app/calendar";
import { card } from "../../app/card";

const commands = {
  help,
  docs,
  calendar,
  card,
  start: help,
};

const handler: Handler = async (event) => {
  console.log(
    new Date().toLocaleString() + " Received an update from Telegram!",
    event.body
  );
  //This is to avoid timeout errors and continuing to perform the same function
  setTimeout(() => {
    console.log("finish 200 for timeout");
    return {
      statusCode: 200,
    };
  }, 9500);

  // Message
  if (!event.body) {
    return { statusCode: 200, body: "No body" };
  }

  const jsonBody = JSON.parse(event.body);
  if (!jsonBody.message) {
    return { statusCode: 200, body: "No message" };
  }

  const message = jsonBody.message.text;
  if (jsonBody.message.from.is_bot) {
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Messaggio ricevuto da bot!" }),
    };
  }
  const commandArguments = parseCommand(message.trim());
  if (commandArguments === null) {
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Errore - Nessun comando" }),
    };
  }
  const commandKeys = Object.keys(commandArguments);
  if (commandKeys.length === 0 || !commands[commandKeys[0]]) {
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Errore - Comando non trovato" }),
    };
  }
  const res = await commands[commandKeys[0]](
    jsonBody.message.chat,
    commandArguments[commandKeys[0]]
  );
  console.log("finish", res);
  return res;
};

export { handler };
