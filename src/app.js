const express = require("express");
require("dotenv").config();
const cors = require("cors");
const questRoutes = require('./routes/questRoute');
const logger = require("../src/utils/logger");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();

//middleware
app.use(cors("*")); //allows frontend request
app.use(express.json()); // parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Use quest routes
app.use('/api/v1/quests', questRoutes);

// Use centralized error handler
app.use(errorHandler);


//App Port loaded from enviroment variables
const APP_PORT = process.env.APP_PORT;

// start the server
app.listen(APP_PORT, () => {
  logger.info(`App is running on Port: ${APP_PORT}`);
});
