import axios from "axios";

export const ursusTgId = 112196086;

export const sendMessage = async (chat_id: number, text: string) => {
  await axios.post(
    `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,
    {
      chat_id,
      text,
    }
  );

  return true;
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
  const url = `https://api.airtable.com/v0/appkyyf1lUUVaIW0j/users?api_key=${process.env.AIRTABLE_API_KEY}&filterByFormula=({tg_id} = ${id})`;
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
    "https://api.airtable.com/v0/appkyyf1lUUVaIW0j/users",
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
