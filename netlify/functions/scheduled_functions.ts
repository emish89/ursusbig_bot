import type { Config } from "@netlify/functions";
import { sendMessage } from "../../app/utils";
const https = require("https");

let datadomeCookie =
  "datadome=4B9sg-BaM9rUPzb2PhCqixwrXW3z0d26bireGwL7-s~844neDnkUI7XdJ1apHRavJK8eQjupfaWHchxIr7bYaMcUeWtQC7Yytefop3s1EqBLOEx3lk8dQtab8IzqweDa";
const airTableLink = "app8ZlUBxYk4GIIAn";

const postCall = (options, payload) => {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let chunks: any[] = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const resBody = Buffer.concat(chunks).toString("utf8");
        if (res.statusCode === 200) {
          console.log(`Call successful - status 200`);
          if (res.headers["set-cookie"]) {
            datadomeCookie = res.headers["set-cookie"]?.[0];
            console.log("new datadome cookie", datadomeCookie);
          }

          console.log("datadome is: 👉", datadomeCookie);
          resolve(JSON.parse(resBody));
        } else {
          console.error(
            `${res.statusCode} ${res.statusMessage} ${res.headers["content-type"]} ${resBody}`
          );
          reject(new Error(resBody));
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.write(payload);
    req.end();
  });
};

const getOptions = (path, payloadLength, token) => {
  return {
    hostname: "apptoogoodtogo.com",
    path: path,
    method: "POST",
    port: 443, // 👈️ replace with 80 for HTTP requests
    headers: {
      Host: "apptoogoodtogo.com",
      "User-Agent":
        "TooGoodToGo/23.4.10 (9027) (iPhone/iPhone 14 Pro; iOS 16.4.1; Scale/3.00/iOS)",
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
      Accept: "application/json",
      "Content-Length": payloadLength,
      "Cache-Control": "no-cache",
      Cookie: datadomeCookie,
    },
  };
};

const postTGTGRequest = (token) => {
  console.log("start postTGTGRequest");
  const payload =
    '{"paging":{"size":50,"page":0},"user_id":"14292893","bucket":{"filler_type":"Favorites"},"origin":{"longitude":7.66081667075481,"latitude":45.05647115706452},"radius":1}';
  const options = getOptions("/api/discover/v1/bucket", payload.length, token);
  const call = postCall(options, payload);
  console.log("end postTGTGRequest");
  return call;
};

const refreshTGTGToken = () => {
  console.log("start refreshTGTGToken");
  const payload =
    '{"refresh_token":"e30.eyJzdWIiOiIxNDI5Mjg5MyIsImV4cCI6MTcyNzQ1MDMzMiwidCI6InE4VU0yLUZ3UzBlZXBJZ1MwS0E0TFE6MDowIn0.cs_-5z3EwaFPBzOQXo-_cnr9nw6Uox6SOyrF_SCe6iQ"}';
  const token =
    "e30.eyJzdWIiOiIxNDI5Mjg5MyIsImV4cCI6MTY5NjAwMDczMiwidCI6IjFjeHZGV2QtVGthNkZIMzBfendrZGc6MDoxIn0.Ciw9lmpyoHGK7CnEY9Ra9zmd3z4mzbH3TYjlTMu6U_w";
  const options = getOptions(
    "/api/auth/v3/token/refresh",
    payload.length,
    token
  );
  const call = postCall(options, payload);
  console.log("end refreshTGTGToken");
  return call;
};

const getAirTable = async () => {
  const url = `https://api.airtable.com/v0/${airTableLink}/tgtg?api_key=${process.env.AIRTABLE_API_KEY}`;
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let chunks: any[] = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const resBody = Buffer.concat(chunks).toString("utf8");
          if (res.statusCode === 200) {
            console.log(`Call successful - status 200`);
            resolve(JSON.parse(resBody));
          } else {
            console.error(
              `${res.statusCode} ${res.statusMessage} ${res.headers["content - type"]} ${resBody} `
            );
            reject(new Error(resBody));
          }
        });
      })
      .on("error", (err) => {
        console.log("Error: " + err.message);
        reject(err);
      });
  });
};
const setAirTableValues = async (cookie, lastValue) => {
  const payload = JSON.stringify({
    records: [
      {
        id: "recQ75TNQfzYbdTe7",
        fields: {
          value: cookie,
        },
      },
      {
        id: "recCYgd28xd0wJypi",
        fields: {
          value: lastValue,
        },
      },
    ],
  });
  const options = {
    hostname: "api.airtable.com",
    path: `/v0/${airTableLink}/tgtg?api_key=${process.env.AIRTABLE_API_KEY}`,
    method: "PATCH",
    port: 443,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  };
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let chunks: any[] = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const resBody = Buffer.concat(chunks).toString("utf8");
        if (res.statusCode === 200) {
          console.log(`Call successful - status 200`);
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
    req.write(payload);
    req.end();
  });
};

export default async (req: Request) => {
  const { next_run } = await req.json();

  console.log("Received event! Next invocation at:", next_run);

  try {
    const table: any = await getAirTable();
    console.log(table);
    datadomeCookie = table.records.find((r) => r.id === "recQ75TNQfzYbdTe7")
      .fields.value;
    const lastValue = table.records.find((r) => r.id === "recCYgd28xd0wJypi")
      .fields.value;
    console.log("cookie & last value are: 👉️", datadomeCookie);

    const refreshedToken: any = await refreshTGTGToken();
    const token = refreshedToken.access_token;
    console.log("token is: 👉", token);
    const result: any = await postTGTGRequest(token);
    //console.log("result is: 👉️", result);
    const availableItems = result.mobile_bucket.items.filter(
      (item) => !(item.items_available <= 0)
    );
    if (availableItems.length > 0) {
      const newValue = JSON.stringify(
        availableItems.map((item) => item.display_name).join(",")
      );
      if (newValue !== lastValue) {
        await sendMessage(
          112196086,
          "Le offerte disponibili sono " +
            availableItems.length +
            ": \n" +
            availableItems
              .map((item) => {
                return (
                  item.display_name +
                  " -> " +
                  item.items_available +
                  " disponibili - dalle " +
                  new Date(item.pickup_interval.start).toLocaleString("it-IT", {
                    timeZone: "Europe/Rome",
                  }) +
                  " alle " +
                  new Date(item.pickup_interval.end).toLocaleString("it-IT", {
                    timeZone: "Europe/Rome",
                  })
                );
              })
              .join("\n\n")
        );
      }
      await setAirTableValues(datadomeCookie, newValue);
    }

    // 👇️️ response structure assume you use proxy integration with API gateway
    return new Response("OK");
  } catch (error) {
    console.log("Error is: 👉️", error);
    return new Response("KO");
  }
};

export const config: Config = {
  schedule: "@hourly",
};
