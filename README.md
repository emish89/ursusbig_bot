# ursusbig_bot - the telegram bot

## How to start developing

run:

```
npm i
netlify dev
```

## Starting point

This bot was built using [this article](https://travishorn.com/building-a-telegram-bot-with-netlify).

## Token generation

If token is not working run index.js and follow the instructions to generate a new token.
`node .` to run the file.

The file needed is `credentials.json` and `token.json` should be regenerated.
The file in the remote env variable is `token.json`.

Example of `credentials.json`:

```
{
  "installed": {
    "client_id": string,
    "project_id": "ursusbig-bot-366419",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": string,
    "redirect_uris": ["http://localhost"]
  }
}
```

[Source](https://developers.google.com/drive/api/quickstart/nodejs?hl=it#set_up_the_sample)

## TODO

- aggiornare excel
- prendere i dati excel e metterli nel messaggio con video e link
- creare un foglio con mail - foglio
