const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config({ path: "./config.env" });

process.on("uncaughtException", (err) => {
  console.log(err.name, err.message);
  console.log("UNCAUGHT EXCEPTION, Shutting Down...");
  process.exit(1);
});

const app = require("./app");

mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => console.log("Connected to database..."));

const server = app.listen(3000, "127.0.0.1", () => {
  console.log("Listening on port 3000...");
});

process.on("unhandledRejection", (err) => {
  console.log(err.name, err.message);
  console.log("UNHANDELED REJECTION, Shutting Down...");
  server.close(() => {
    process.exit(1);
  });
});
