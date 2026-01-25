require("dotenv/config")
const { refreshOutlookSubscription } = require("./services.js");
const { scheduler } = require("./scheduler.js");
const { connectMongoDb } = require("./mongoDb.js");
const {router} = require("./routes.js");
const { initIo,getIo } = require("./io.js");

const express = require("express");
const cors = require("cors");
const http = require('http');

const app = express();
app.use(express.json());
app.use(cors());
app.use("/", router);

const server = http.createServer(app);
initIo(server);
const io = getIo()
io.on("connection",async (socket) => {
  console.log("Socket Connection : ", socket.id);

  socket.on("disconnect", () => {
    console.log("Socket Disconnection : ", socket.id);
  });
});

server.listen(process.env.PORT, async () => {
  await connectMongoDb();
  await refreshOutlookSubscription();
  await  scheduler();
  console.log('Om Ganeshaay Namah')
  console.log(`✅ Server`);
});
