const { google } = require("googleapis");

// If modifying these scopes, delete token.json.
const SCOPES = [
  "https://www.googleapis.com/auth/documents",
  "https://www.googleapis.com/auth/drive",
];

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
const loadSavedCredentialsIfExist = async () => {
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
 * Prints the title of a sample doc:
 * https://docs.google.com/document/d/195j9eDD3ccgjQRttHhJPymLJUCOUjs-jmwTrekvdjFE/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth 2.0 client.
 */
async function printDocTitle(auth) {
  const docs = google.docs({ version: "v1", auth });
  const res = await docs.documents.create({
    title: "F B",
  });
  const drive = google.drive({ version: "v3", auth });
  console.log(`The title of the document is: ${res.data.documentId}`, res.data);

  drive.permissions.create(
    {
      resource: {
        type: "anyone",
        role: "commenter",
      },
      fileId: res.data.documentId,
      fields: "id",
    },
    function (err, res) {
      if (err) {
        // Handle error
        console.log(err);
      } else {
        console.log("Permission ID: ", res);
      }
    }
  );
}
loadSavedCredentialsIfExist().then(printDocTitle).catch(console.error);
