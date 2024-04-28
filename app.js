const { error } = require("console");
const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const db = [];

app.use(express.static("public"));

io.on("connection", (socket) => {
  socket.on("new user", (user) => {
    if (user === "") {
      console.error("User name is empty");
      socket.emit("new user", { error: "name empty", name: user });
      return;
    }

    if (db.includes(user)) {
      console.error(`User ${user} already exists!`);
      socket.emit("new user", { error: "user taken", name: user });
      return;
    }
    db.push(user);
    console.log(`Current users: ${db}`);
    io.emit("new user", { error: "", name: user });
  });
  socket.on("chat message", (data) => {
    const { name, content } = data;
    if (content.startsWith("/reset")) {
      console.log("DB reset");
      db.length = 0;
    } else {
      socket.broadcast.emit("chat message", data);
    }
  });
  socket.on("typing", (userName) => {
    socket.broadcast.emit("typing", userName);
  });

  socket.on("disconnect", () => {
    io.emit("disconnect message", socket.id + " has left the chat");
  });
});

server.listen(3000, () => {
  console.log("listening on *:3000");
});
