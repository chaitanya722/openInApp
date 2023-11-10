const express = require("express");
const path = require("path");
const port = 4000;

const app = express();


app.listen(port, () => {
    console.log(`Server started on port ${port}`);
  });