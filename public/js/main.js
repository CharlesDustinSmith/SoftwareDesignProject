//const {get, set} = require("../../utils/session");
const chatForm = document.getElementById("chat-form");
const chatMessages = document.querySelector(".chat-messages");

const username = prompt("What is your name?");
const room = prompt("What room would you like to join");
//To get username and room from URL

const socket = io();

//Join chat group
socket.emit("joinRoom", { username, room});

//Message from server.
socket.on("message", message => {
    //console.log(message);
    outputMessage(message);

    //To scroll down everytime we recieve a message.
    chatMessages.scrollTop = chatMessages.scrollHeight;
});

// Event Listener for submitting messages
chatForm.addEventListener("submit", (e) => {
    //This is to prevent the file from reloading after you press submit.
    e.preventDefault();

    //To get the text input for message.
    const msg = e.target.elements.msg.value;

    //To emit a message to the server.
    socket.emit("chatMessage",msg);
    
    //To clear out the text field.
    e.target.elements.msg.value = "";
    e.target.elements.msg.focus();
});

//Output message to Dom
function outputMessage(message) {
    const div = document.createElement("div");
    div.classList.add("message");
    div.innerHTML = `<p class="meta"> ${message.username} <span>${message.time}</span></p>
    <p class="text">
       ${message.text}
    </p>`;
    document.querySelector('.chat-messages').appendChild(div);
}