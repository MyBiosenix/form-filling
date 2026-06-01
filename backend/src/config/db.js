const mongoose = require("mongoose");
const env = require("./env");

const connectDB = async () => {
  try {
    if (!env.mongoUri) {
      throw new Error("MONGODB_URI is missing in backend/.env");
    }

    await mongoose.connect(env.mongoUri);
    console.log("Mongodb Connected");
  } catch (err) {
    console.error(err.message);
    console.log("Mongodb Connection Failed");
    process.exit(1);
  }
};

module.exports = connectDB;
