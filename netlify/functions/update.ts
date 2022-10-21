import { Handler } from "@netlify/functions";
import { Event } from "@netlify/functions/dist/function/event";

const parseCommand = (message: string) => {
  const tokens = message.split(" ");
  if (!tokens[0].match(/^\//)) {
    return null;
  }
  const command: string[] = [];
  const cmd = tokens.shift();
  const match = cmd?.match(/\/(\w*)/);
  if (match && match.length > 0) {
    command[match[1]] = tokens;
  }
  return command;
};

const bot = (params: string[]) => {
  console.log("!bot!", params);
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "called fn bot with params " + params }),
  };
};
const commands = {
  bot,
};

const handler: Handler = async (event: Event) => {
  console.log("Received an update from Telegram!", event.body);
  // Message
  if (!event.body) {
    return { statusCode: 200, body: "No body" };
  }
  const jsonBody = JSON.parse(event.body);
  const message = jsonBody.message.text;

  const commandArguments = parseCommand(message.trim());
  if (commandArguments === null) {
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Errore nessun comando" }),
    };
  }
  const commandKeys = Object.keys(commandArguments);
  if (commandKeys.length === 0 || !commands[commandKeys[0]]) {
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Errore comando non trovato" }),
    };
  }
  return commands[commandKeys[0]](commandArguments[commandKeys[0]]);
};

export { handler };
