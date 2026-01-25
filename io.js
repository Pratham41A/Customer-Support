let io;

module.exports = {
  initIo: (server) => {
    const { Server } = require("socket.io");
    io = new Server(server, {
      cors: { origin: "*" }
    });
  },

  getIo: () => {
    return io;
  }
};
