const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const ChatSchema = new mongoose.Schema({
  participants: { type: [String], required: true },  // [userA, userB]
  messages: [MessageSchema]  // Array of message objects
});

module.exports = mongoose.model("Chat", ChatSchema);
