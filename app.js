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
  const socketId = socket.id;

  socket.on("new user", (user) => {
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
    console.log(`Current users: ${db}`);
    io.emit("new user", { error: "", name: user });
    io.emit("online users", db);
  });

  socket.on("chat message", (data) => {
    const { name, content } = data;
    if (content.startsWith("/reset")) {
      console.log("State reset");
      db.length = 0;
    } else {
      socket.broadcast.emit("chat message", data);
    }
  });

  socket.on("typing", (userName) => {
    socket.broadcast.emit("typing", userName);
  });

  socket.on("disconnect", () => {
    io.emit(
      "disconnect message",
      getUserName(socketId, db) + " has left the chat"
    );
    kickUser(socketId, db);
    io.emit("online users", db);
  });
});

server.listen(3000, () => {
  console.log("listening on *:3000");
});
