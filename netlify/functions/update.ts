import { Handler } from "@netlify/functions";
import { Event } from "@netlify/functions/dist/function/event";
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
};

const handler: Handler = async (event: Event) => {
  console.log("Received an update from Telegram!", event.body);
  // Message
  if (!event.body) {
    return { statusCode: 200, body: "No body" };
  }
  const jsonBody = JSON.parse(event.body);
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
  return commands[commandKeys[0]](
    jsonBody.message.chat,
    commandArguments[commandKeys[0]]
  );
};

export { handler };
