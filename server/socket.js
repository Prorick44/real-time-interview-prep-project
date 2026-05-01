const { Server } = require("socket.io");

function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join_room", (roomId) => {
      socket.join(roomId);
      console.log(`User ${socket.id} joined room ${roomId}`);
    });

    socket.on("send_code", ({ roomId, code }) => {
      console.log("CODE SENT:", roomId);
      socket.to(roomId).emit("receive_code", code);
    });

    socket.on("send_message", ({ roomId, msg }) => {
      console.log("MSG SENT:", roomId, msg);
      socket.to(roomId).emit("receive_message", msg);
    });
  });
}

module.exports = initSocket;
