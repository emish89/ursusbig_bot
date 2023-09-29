import { google } from "googleapis";
import { GoogleAuthType } from "./types";

/**
 * Reads previously authorized credentials from the save file.
 */
export const loadSavedCredentials: () => Promise<GoogleAuthType | null> =
  async () => {
    try {
      const token = process.env.GCP_TOKEN;
      if (token) {
        const credentials = JSON.parse(token);
        return google.auth.fromJSON(credentials);
      }
    } catch (err) {
      console.log(err);
    }
    return null;
  };

/**
 * Create doc file and return the id
 */
export const createGDocsFile: (
  auth: any,
  name: string
) => Promise<string | null | undefined> = async (auth, name) => {
  if (auth !== null) {
    const docs = google.docs({ version: "v1", auth });
    const fileProperties: any = {
      title: name,
    };
    const res = await docs.documents.create(fileProperties);
    const drive = google.drive({ version: "v3", auth });
    console.log(`The title of the document is: ${res.data.documentId}`);
    const permissionProperties: any = {
      resource: {
        type: "anyone",
        role: "commenter",
      },
      fileId: res.data.documentId,
      fields: "id",
    };
    await drive.permissions
      .create(permissionProperties)
      .catch((error) => console.log(error));
    console.log("Permission ID created");
    return res.data.documentId;
  } else {
    console.log("auth is null. Cannot create file");
  }
  return null;
};

/**
 * Prints data from google sheets file
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth 2.0 client.
 */
export const printSheet = async (auth) => {
  const sheets = google.sheets({ version: "v4", auth });
  sheets.spreadsheets.values.get(
    {
      auth: auth,
      spreadsheetId: "1LBvM1Pc-KNHcxIhNWjDoIttF1lV4FDA2uo-07hBYC54",
      range: "A2:BY",
    },
    (err, res) => {
      if (err) {
        console.error("The API returned an error.");
        throw err;
      }
      const rows = res.data.values;
      if (rows.length === 0) {
        console.log("No data found.");
      } else {
        console.log("Scheda");
        for (const row of rows) {
          if (row[1] && row[2]) {
            console.log("Programma", row[1], row[2]);
          }
          if (row[2] && row[4] && row[4] !== "#N/A") {
            // Print columns C and E, which correspond to indices 2 and 4.
            console.log("Nome esercizio: ", row[2], "Link video", row[4]);

            for (let i = 0; i < 8; i++) {
              console.log("Settimana ", i + 1);
              console.log(
                "N serie:",
                row[7 + 9 * i],
                "rep:",
                row[8 + 9 * i],
                "RPE:",
                row[9 + 9 * i]
              );
            }
          }
        }
      }
    }
  );
};
