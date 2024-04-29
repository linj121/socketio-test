const socket = io();
const form = document.getElementById("form");
const input = document.getElementById("input");

let onlineUsers = [];

// "public" or "private"
let messageMode = "public";
const privateMessageTarget = { targetSocketId: null, targetUserName: null };

function clearAllMessages() {
  messages.innerHTML = "";
}

function appendMessage(msg) {
  const messages = document.getElementById("messages");
  const item = document.createElement("li");
  item.textContent = msg;
  messages.appendChild(item);
  window.scrollTo(0, document.body.scrollHeight);
}

function setPrivateMessageTarget(socketId) {
  messageMode = "private";
  privateMessageTarget.targetSocketId = socketId;
  privateMessageTarget.targetUserName = onlineUsers.find((user) => user.socketId === socketId).userName;
  console.log(`Set private message target: ${JSON.stringify(privateMessageTarget)}`);
}

let currentUserName = prompt("Enter your nick name");
const promptWhileEmpty = () => {
  while (!currentUserName) {
    alert("Name is empty! Please enter your user name!");
    currentUserName = prompt("Enter your nick name");
  }
};

socket.emit("new user", currentUserName);
socket.on("new user", (data) => {
  console.log(`On new user: ${JSON.stringify(data)}`);
  const { error, name } = data;
  if (error) {
    switch (error) {
      case "name empty":
        alert("Got an empty user name!");
        promptWhileEmpty();
        return;
      case "user taken":
        alert(currentUserName + " is already taken. Please try another name.");
        currentUserName = prompt("Enter your nick name");
        socket.emit("new user", currentUserName);
        return;
      default:
        console.error(`Unregistered error message: ${error}`);
        return;
    }
  }
  appendMessage(`${name === currentUserName ? "You have" : name + " has"} joined the chat! Let's have fun!`);
});

socket.on("online users", (data) => {
  console.log(`On online users: ${JSON.stringify(data)}`);
  onlineUsers = data;
  const onlineUserElement = document.getElementById("online-users-list");
  onlineUserElement.innerHTML = "";
  onlineUsers.forEach((user) => {
    const { socketId, userName } = user;
    const item = document.createElement("li");
    item.innerHTML = `<span>${userName}</span><button onclick="setPrivateMessageTarget('${socketId}')">Private Chat</button>`;
    onlineUserElement.appendChild(item);
  });
  console.log(`Online users: ${JSON.stringify(onlineUsers)}`);
});

form.addEventListener("input", function (e) {
  socket.emit("typing", currentUserName);
});

form.addEventListener("submit", function (e) {
  e.preventDefault();
  const messageContent = input.value;
  if (messageContent) {
    if (messageContent.startsWith("/clear")) {
      clearAllMessages();
    } else if (messageMode === "private") {
      if (!privateMessageTarget.targetSocketId) {
        appendMessage("No private message target set!");
        return;
      }
      socket.emit("chat message", {
        name: currentUserName,
        content: messageContent,
        mode: "private",
        targetSocketId: privateMessageTarget.targetSocketId,
      });
      appendMessage(`To ${privateMessageTarget.targetUserName}: ${messageContent}`);
    } else {
      socket.emit("chat message", {
        name: currentUserName,
        content: messageContent,
        mode: "public",
        targetSocketId: null,
      });
      appendMessage("You: " + messageContent);
    }
    input.value = "";
  }
});

socket.on("typing", function (userName) {
  console.log(`On typing: ${userName}`);
  const typing = document.getElementById("typing");
  typing.textContent = `${userName} is typing...`;
  setTimeout(() => {
    typing.textContent = "";
    // typing = null;
  }, 1000);
});

socket.on("chat message", function (data) {
  console.log(`On chat message: ${JSON.stringify(data)}`);
  const { name, content, mode } = data;
  if (!name) {
    console.error("Name is empty!");
    return;
  }
  appendMessage(`${mode === "private" ? "PM From " : ""}${name}: ${content}`);
});

socket.on("disconnect message", function (msg) {
  console.log(`On disconnect message: ${msg}`);
  appendMessage(msg);
});
