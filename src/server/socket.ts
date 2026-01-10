import { Server } from "socket.io";

export function setupSocket(io: Server) {
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });

    // Handle joining room for specific WA session
    socket.on("join-session", (sessionId: string) => {
        socket.join(sessionId);
        console.log(`Socket ${socket.id} joined session room: ${sessionId}`);
    });
  });
}
