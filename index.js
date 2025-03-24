const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const UserRoutes = require('./Routes/UserRoutes');
const FriendRoutes = require('./Routes/friendRoutes');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');
const Chat = require('./Models/ChatModel');

dotenv.config();
const app = express();
const server = http.createServer(app);

// ✅ Use environment variable for CORS origins
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  "https://web.chatwithus.ameyashriwas.com",
  "http://localhost:3000"
];

// ✅ Unified CORS Configuration
const corsOptions = {
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

// ✅ Apply CORS middleware for Express
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ✅ Socket.io with CORS configuration
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  },
  transports: ["websocket", "polling"]
});

// ✅ Socket Authentication Middleware (optional)
io.use((socket, next) => {
  const token = socket.handshake.query.token;  // Add token for secure connection
  if (token === process.env.SOCKET_AUTH_TOKEN) {
    next();
  } else {
    next(new Error("Authentication error"));
  }
});

io.on("connection", (socket) => {
  console.log(`✅ User connected: ${socket.id}`);

  // ✅ Join Room
  socket.on("joinRoom", async ({ senderId, receiverId }) => {
    try {
      const roomId = [senderId, receiverId].sort().join("_");
      socket.join(roomId);

      // Validate MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(senderId) || !mongoose.Types.ObjectId.isValid(receiverId)) {
        console.error("🔥 Invalid MongoDB ObjectId format");
        return socket.emit("error", "Invalid user ID format");
      }

      let chat = await Chat.findOne({
        participants: {
          $all: [mongoose.Types.ObjectId(senderId), mongoose.Types.ObjectId(receiverId)]
        }
      });

      if (!chat) {
        chat = new Chat({
          participants: [senderId, receiverId],
          messages: []
        });
        await chat.save();
      }

      // ✅ Emit existing messages
      socket.emit("loadMessages", chat.messages);
    } catch (error) {
      console.error("🔥 Error joining room:", error.message);
      socket.emit("error", "Failed to join room");
    }
  });

  // ✅ Send Message
  socket.on("sendMessage", async ({ senderId, receiverId, message }) => {
    const roomId = [senderId, receiverId].sort().join("_");

    try {
      // Validate MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(senderId) || !mongoose.Types.ObjectId.isValid(receiverId)) {
        console.error("🔥 Invalid MongoDB ObjectId format");
        return socket.emit("error", "Invalid user ID format");
      }

      let chat = await Chat.findOne({
        participants: {
          $all: [mongoose.Types.ObjectId(senderId), mongoose.Types.ObjectId(receiverId)]
        }
      });

      if (!chat) {
        chat = new Chat({
          participants: [senderId, receiverId],
          messages: []
        });

        await chat.save();  // ✅ Add await to ensure it's saved before adding messages
      }

      const newMessage = {
        senderId,
        receiverId,
        message,
        timestamp: new Date()
      };

      chat.messages.push(newMessage);
      await chat.save();

      // ✅ Emit the message to the room
      io.to(roomId).emit("newMessage", newMessage);
    } catch (error) {
      console.error("🔥 Error sending message:", error.message);
      socket.emit("error", "Failed to send message");
    }
  });

  // ✅ Handle disconnect with room cleanup
  socket.on("disconnect", () => {
    console.log(`⚠️ User disconnected: ${socket.id}`);

    // Leave all rooms
    const rooms = Array.from(socket.rooms);
    rooms.forEach((room) => socket.leave(room));
  });
});

// ✅ Fetch Messages API
app.get("/messages", async (req, res) => {
  const { senderId, receiverId } = req.query;

  if (!senderId || !receiverId) {
    return res.status(400).send("Both sender and receiver IDs are required.");
  }

  try {
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(senderId) || !mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).send("Invalid MongoDB ObjectId format");
    }

    const chat = await Chat.findOne({
      participants: {
        $all: [mongoose.Types.ObjectId(senderId), mongoose.Types.ObjectId(receiverId)]
      }
    });

    if (chat) {
      res.status(200).json(chat.messages);
    } else {
      res.status(404).send("No conversation found");
    }
  } catch (error) {
    console.error("🔥 Error fetching messages:", error.message);
    res.status(500).send("Failed to fetch messages");
  }
});

// ✅ Middleware
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'view')));
app.set('view engine', 'ejs');
app.use('/upload', express.static(path.join(__dirname, 'upload')));

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => console.error('🔥 MongoDB connection error:', err));

// ✅ Routes
app.use('/', UserRoutes);
app.use('/friend', FriendRoutes);

// ✅ Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('🔥 Something went wrong!');
});

// ✅ Start Server
const PORT = process.env.PORT || 5200;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
