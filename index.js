const express = require("express");
const path = require("path");
const { autoMailLogic } = require("./controllers/autoMailLogic");
const port = 4000;
const app = express();


app.get('/', (request, response) => {
    const filePath = path.join(__dirname, 'landingPage.html');
    response.sendFile(filePath);
  });
app.get("/start", autoMailLogic);


app.listen(port, () => {
    console.log(`Server started on port ${port}`);
  });