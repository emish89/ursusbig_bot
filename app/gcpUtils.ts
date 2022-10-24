import { GaxiosResponse } from "gaxios";
import { JSONClient } from "google-auth-library/build/src/auth/googleauth";
import { google } from "googleapis";

/**
 * Reads previously authorized credentials from the save file.
 */
export const loadSavedCredentials: () => Promise<JSONClient | null> =
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
export const createDocFile: (
  auth: JSONClient | null,
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
