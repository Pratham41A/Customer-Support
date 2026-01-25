const mongoose = require("mongoose");
exports.connectMongoDb =async() => {
  return  await mongoose.connect(process.env.MONGO_URL, {
        dbName: process.env.MONGO_DB_NAME,
        appName: process.env.MONGO_APP_NAME,
    });
}