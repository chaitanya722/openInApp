const express = require("express");
const path = require("path");
const { autoMailLogic } = require("./controllers/autoMailLogic");
const port = 4000;
const app = express();


const botFolder = "botMails";
const SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.labels",
    "https://mail.google.com/",
  ];


app.get("/", autoMailLogic);


app.listen(port, () => {
    console.log(`Server started on port ${port}`);
  });