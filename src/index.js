"use strict";
const axios = require('axios');

module.exports = {
  register({ strapi }) {
    //code if needed for registeration purpose
  },
  async bootstrap({ strapi }) {
    const io = require("socket.io")(strapi.server.httpServer, {
      cors: {
        origin: ["http://localhost:1337", "https://localhost:1337"],
        methods: ["GET", "POST"],
        allowedHeaders: ["my-custom-header"],
        credentials: true,
      },
    });

    io.on("connection", (socket) => {
      console.log("user connected");

      socket.on("join", async ({ username }) => {
        console.log("username is ", username);
        if (username) {
          socket.join("group");
          socket.emit("welcome", {
            user: "bot",
            text: `${username}, Welcome to the group chat`,
            userData: username,
          });

          try {
            await axios.post("http://localhost:1337/api/active-users", {
              data: { users: username }
            });
            socket.emit("roomData", { done: "true" });
          } catch (error) {
            if (error.response && error.response.status === 400) {
              socket.emit("roomData", { done: "existing" });
            } else {
              console.error("Error storing active user:", error.message);
            }
          }
        } else {
          console.log("An error occurred");
        }
      });

      socket.on("sendMessage", async (data) => {
        let strapiData = {
          data: {
            message_content: data.message, 
            username: data.user, 
          },
        };

        try {
          await axios.post("http://localhost:1337/api/chat_messages", strapiData);
          socket.broadcast.to("group").emit("message", {
            user: data.username,
            text: data.message,
          });
        } catch (error) {
          console.error("Error sending message:", error.message);
        }
      });

      socket.on("getMessages", async () => {
        try {

          const response = await axios.get("http://localhost:1337/api/chat_messages");
          socket.emit("messages", response.data);
        } catch (error) {
          console.error("Error fetching messages:", error.message);
        }
      });
    });
  },
};