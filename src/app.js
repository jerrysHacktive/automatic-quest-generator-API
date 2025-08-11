const express = require("express");
const dotenv = require("dotenv");
const questRoutes = require("./routes/questRoute");
const logger = require("./utils/logger");
const { errorHandler } = require("./middleware/errorHandler");
const path = require("path");

dotenv.config();

const app = express();
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

//  files from the public directory
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/v1/quests", questRoutes);

app.use(errorHandler);

const APP_PORT = process.env.APP_PORT || 3000;
app.listen(APP_PORT, () => {
  logger.info(`Server running on port ${APP_PORT}`);
});
