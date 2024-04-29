const { error } = require("console");
const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

// db = [{socketId, userName}, ...]
const db = [];

function kickUser(socketId, db) {
  const index = db.findIndex((conn) => conn.socketId === socketId);
  if (index !== -1) {
    db.splice(index, 1);
  }
}

function getUserName(socketId, db) {
  const user = db.find((conn) => conn.socketId === socketId);
  return user ? user.userName : null;
}

app.use(express.static("public"));

io.on("connection", async (socket) => {
  console.log(`User ${socket.id} connected`);
  const socketId = socket.id;

  socket.on("new user", (user) => {
    // console.log(`ON new user: ${JSON.stringify(user)}`);
    if (user === "") {
      console.error("User name is empty");
      socket.emit("new user", { error: "name empty", name: user });
      return;
    }
    if (db.map((conn) => conn.socketId).includes(socketId)) {
      console.error(`User ${user} already exists!`);
      socket.emit("new user", { error: "user taken", name: user });
      return;
    }
    db.push({ socketId: socketId, userName: user });
    console.log(`Current users: ${JSON.stringify(db)}`);
    io.emit("new user", { error: "", name: user });
    io.emit("online users", db);
  });

  socket.on("chat message", (data) => {
    console.log(`ON chat message: ${JSON.stringify(data)}`);
    const { mode, name, content, targetSocketId } = data;
    if (content.startsWith("/reset")) {
      console.log("State reset");
      db.length = 0;
    } else if (mode === "private") {
      const targetUser = db.find((conn) => conn.socketId === targetSocketId);
      if (!targetUser) {
        console.error(`Target user not found: ${targetSocketId}`);
        return;
      }
      io.to(targetSocketId).emit("chat message", { name, content, mode: "private", targetSocketId: socketId });
    } else if (mode === "public") {
      socket.broadcast.emit("chat message", data);
    } else {
      console.error(`Unknown mode: ${mode}`);
    }
  });

  socket.on("typing", (userName) => {
    // console.log(`ON typing: ${userName}`);
    socket.broadcast.emit("typing", userName);
  });

  socket.on("disconnect", () => {
    console.log(`user ${socketId} disconnected`);
    const userName = getUserName(socketId, db);
    if (!userName) {
      console.error("User that disconnected is not in our db");
      return;
    }
    io.emit("disconnect message", userName + " has left the chat");
    kickUser(socketId, db);
    io.emit("online users", db);
  });
});

server.listen(3000, () => {
  console.log("listening on *:3000");
});
