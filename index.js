const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const UserRoutes = require('./Routes/UserRoutes');
const FriendRoutes = require('./Routes/friendRoutes')
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors')
const {Server} = require('socket.io')
const http = require('http')
const Chat = require('./Models/ChatModel')


dotenv.config();
const app = express();

const server = http.createServer(app)
const allowedOrigins = [
  "https://web.chatwithus.ameyashriwas.com",
  "http://localhost:3000"
];

const io = new Server(server, {
  cors: {
    origin: "https://web.chatwithus.ameyashriwas.com",
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"]
});


io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join Room
  socket.on("joinRoom", async ({ senderId, receiverId }) => {
    const roomId = [senderId, receiverId].sort().join("_");
    socket.join(roomId);

    try {
      let chat = await Chat.findOne({ participants: { $all: [senderId, receiverId] } });

      if (!chat) {
        // Create new conversation if it doesn't exist
        chat = new Chat({
          participants: [senderId, receiverId],
          messages: []
        });
        await chat.save();
      }

      socket.emit("loadMessages", chat.messages);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  });

  // Send Message
  socket.on("sendMessage", async ({ senderId, receiverId, message }) => {
    const roomId = [senderId, receiverId].sort().join("_");

    try {
      let chat = await Chat.findOne({ participants: { $all: [senderId, receiverId] } });

      if (!chat) {
        // Create new chat if it doesn't exist
        chat = new Chat({
          participants: [senderId, receiverId],
          messages: []
        });
      }

      // Push message into the existing message array
      const newMessage = {
        senderId,
        receiverId,
        message
      };

      chat.messages.push(newMessage);
      await chat.save();

      // Emit message to room
      io.to(roomId).emit("newMessage", newMessage);

    } catch (error) {
      console.error("Error sending message:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

app.get("/messages", async (req, res) => {
  const { senderId, receiverId } = req.query;
  console.log('receinv or not')

  if (!senderId || !receiverId) {
    return res.status(400).send("Both sender and receiver IDs are required.");
  }

  try {
    const chat = await Chat.findOne({
      participants: { $all: [senderId, receiverId] }
    });

    if (chat) {
      res.status(200).json(chat.messages);
    } else {
      res.status(404).send("No conversation found");
    }
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).send("Failed to fetch messages");
  }
});





app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],  // Include OPTIONS for preflight
  allowedHeaders: ['Content-Type', 'Authorization'],     // Add allowed headers
  credentials: true                                       // Allow cookies and authorization headers
}));

// Handle preflight requests globally
app.options('*', cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));


// Middleware
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'view')));
app.set('view engine', 'ejs');
app.use('/upload', express.static(path.join(__dirname, 'upload')));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI
)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/', UserRoutes);
app.use('/friend', FriendRoutes)


// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Start Server
const PORT = process.env.PORT || 5200;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
