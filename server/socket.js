const { Server } = require("socket.io");

function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  const users = {};

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join_room", ({ roomId, name }) => {
      socket.join(roomId);

      if (!users[roomId]) users[roomId] = [];
      users[roomId].push({ id: socket.id, name });

      io.to(roomId).emit("users_update", users[roomId]);
    });

    socket.on("send_code", ({ roomId, code }) => {
      socket.to(roomId).emit("receive_code", code);
    });

    socket.on("send_message", ({ roomId, msg }) => {
      socket.to(roomId).emit("receive_message", msg);
    });

    socket.on("typing", ({ roomId, name }) => {
      socket.to(roomId).emit("user_typing", name);
    });

    socket.on("send_output", ({ roomId, output }) => {
      socket.to(roomId).emit("receive_output", output);
    });

    socket.on("leave_room", (roomId) => {
      socket.leave(roomId);
    });

    socket.on("disconnect", () => {
      for (const room in users) {
        users[room] = users[room].filter((u) => u.id !== socket.id);
        io.to(room).emit("users_update", users[room]);
      }
    });
  });
}

module.exports = initSocket;
