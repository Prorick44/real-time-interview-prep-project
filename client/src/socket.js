import { io } from "socket.io-client";

export const socket = io(
  "`https://real-time-interview-prep-project.onrender.com",
  {
    transports: ["websocket"],
    autoConnect: true,
  },
);
