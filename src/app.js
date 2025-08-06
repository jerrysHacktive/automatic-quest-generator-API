const express = require("express");
require("dotenv").config();
const cors = require("cors");
const logger = require("../src/utils/logger");

const app = express();

//middleware
app.use(cors("*")); //allows frontend request
app.use(express.json()); // parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

//App Port loaded from enviroment variables
const APP_PORT = process.env.APP_PORT;

// start the server
app.listen(APP_PORT, () => {
  console.log(`App is running on Port: ${APP_PORT}`);
});
