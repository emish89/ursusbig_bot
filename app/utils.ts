import axios from "axios";
import https from "https";
import { AirTableResponse, TelegramResponse } from "./types";
import { airTableLink } from "./card";

export const ursusTgId = 112196086;

export const sendMessage: (
  chat_id: number,
  text: string,
  token?: string
) => Promise<TelegramResponse> = async (
  chat_id,
  text,
  token = process.env.EMISH89_BOT_TOKEN
) => {
  console.log(
    `send message url: https://api.telegram.org/bot${token}/sendMessage`
  );
  const payload = JSON.stringify({
    chat_id,
    text,
  });
  const options = {
    hostname: "api.telegram.org",
    port: 443,
    path: `/bot${token}/sendMessage`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": payload.length,
    },
  };
  const call = await doHttpRequest<TelegramResponse>(options, payload);
  return call;
};

export const pinChatMessage: (
  chat_id: number,
  message_id: number,
  token?: string
) => Promise<boolean> = async (
  chat_id,
  message_id,
  token = process.env.EMISH89_BOT_TOKEN
) => {
  console.log(
    `pin message url: https://api.telegram.org/bot${token}/pinChatMessage`
  );
  const payload = JSON.stringify({
    chat_id,
    message_id,
  });
  const options = {
    hostname: "api.telegram.org",
    port: 443,
    path: `/bot${token}/pinChatMessage`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": payload.length,
    },
  };
  await doHttpRequest<TelegramResponse>(options, payload);

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

const airtableOptions = {
  host: "api.airtable.com",
  port: 443,
  protocol: "https:",
  headers: {
    Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
};

export const getAirTableData = async (
  path: string,
  method: string,
  payload?: string
) => {
  var options = {
    ...airtableOptions,
    path: path,
    method: method,
  };
  const user = await doHttpRequest<AirTableResponse>(options, payload);
  return user;
};

//deprecated function
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

export const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const doHttpRequest = <T>(
  options: string | https.RequestOptions | URL,
  payload?: string,
  cookie?: string
) => {
  return new Promise<T>((resolve, reject) => {
    const req = https.request(options, (res) => {
      let chunks = [] as Uint8Array[];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const resBody = Buffer.concat(chunks).toString("utf8");
        if (res.statusCode === 200) {
          console.log(`Call successful - status 200`);
          if (res.headers["set-cookie"] && cookie) {
            cookie = res.headers["set-cookie"]?.[0];
            console.log("new cookie 👉", cookie);
          }
          resolve(JSON.parse(resBody));
        } else {
          console.error(`${res.statusCode} ${res.statusMessage} ${res.headers["content - type"]}
${resBody}`);
          reject(new Error(resBody));
        }
      });
    });
    req.on("error", (error) => {
      reject(error);
    });
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
};
