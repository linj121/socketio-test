const socket = io();
const messages = document.getElementById("messages");
const form = document.getElementById("form");
const input = document.getElementById("input");

let onlineUsers = [];

function appendMessage(msg) {
  const item = document.createElement("li");
  item.textContent = msg;
  messages.appendChild(item);
  window.scrollTo(0, document.body.scrollHeight);
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
  appendMessage(
    `${
      name === currentUserName ? "You" : name
    } have joined the chat! Let's have fun!`
  );
});

socket.on("online users", (data) => {
  console.log(`On online users: ${JSON.stringify(data)}`);
  onlineUsers = data;
  const onlineUserElement = document.getElementById("online-users");
  onlineUserElement.innerHTML = "";
  onlineUsers.forEach((user) => {
    const item = document.createElement("li");
    item.textContent = user.userName;
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
    socket.emit("chat message", {
      name: currentUserName,
      content: messageContent,
    });
    input.value = "";
    appendMessage("You: " + messageContent);
  }
});

socket.on("typing", function (userName) {
  console.log(`On typing: ${userName}`);
  const typing = document.getElementById("typing");
  typing.textContent = `${userName} is typing...`;
  setTimeout(() => {
    typing.textContent = "";
    typing = null;
  }, 1000);
});

socket.on("chat message", function (data) {
  console.log(`On chat message: ${JSON.stringify(data)}`);
  const { name, content } = data;
  if (name !== undefined && name !== currentUserName)
    appendMessage(`${name}: ${content}`);
});

socket.on("disconnect message", function (msg) {
  appendMessage(msg);
});
