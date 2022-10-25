import axios from "axios";

export const ursusTgId = 112196086;
export const airTableLink = "appkyyf1lUUVaIW0j";

export const sendMessage: (
  chat_id: number,
  text: string
) => Promise<any> = async (chat_id, text) => {
  const url = `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`;
  console.log("send message", url);
  // const resp = await axios.post(url, {
  //   chat_id,
  //   text,
  // });

  return true;
};

export const pinChatMessage = async (chat_id: number, message_id: number) => {
  const resp = await axios.post(
    `https://api.telegram.org/bot${process.env.BOT_TOKEN}/pinChatMessage`,
    {
      chat_id,
      message_id,
    }
  );

  return resp;
};

export const parseCommand = (message: string) => {
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

export const getAirTableUserById = async (id: number) => {
  const url = `https://api.airtable.com/v0/${airTableLink}/users?api_key=${process.env.AIRTABLE_API_KEY}&filterByFormula=({tg_id} = ${id})`;
  const user = await axios.get(url);
  return user;
};

export const createAirTableUser = async (
  id: number,
  name: string,
  fileName: string
) => {
  const data = {
    fields: {
      name: name,
      file_name: fileName,
      tg_id: id,
    },
  };
  const res = await axios.post(
    `https://api.airtable.com/v0/${airTableLink}/users`,
    data,
    {
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );
  return res;
};
