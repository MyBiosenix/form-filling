const connectDB = require("./config/db");
const env = require("./config/env");
const app = require("./app");

connectDB();

app.listen(env.port, () => {
  console.log(`Server Started on Port ${env.port}`);
});
