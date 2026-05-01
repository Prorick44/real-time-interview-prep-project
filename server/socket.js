const { Server } = require("socket.io");

function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join_room", (roomId) => {
      socket.join(roomId);
      console.log(`Joined room: ${roomId}`);
    });

    socket.on("send_code", ({ roomId, code }) => {
      socket.to(roomId).emit("receive_code", code);
    });

    socket.on("send_message", ({ roomId, msg }) => {
      socket.to(roomId).emit("receive_message", msg);
    });

    socket.on("send_output", ({ roomId, output }) => {
      socket.to(roomId).emit("receive_output", output);
    });

    socket.on("leave_room", (roomId) => {
      socket.leave(roomId);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
}

module.exports = initSocket;
