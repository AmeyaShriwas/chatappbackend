const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const UserRoutes = require('./Routes/UserRoutes');
const FriendRoutes = require('./Routes/friendRoutes')
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors')

dotenv.config();

const app = express();

// Allow requests from your frontend domain
app.use(cors({
  origin: '*', // or '*', if you want to allow all domains
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allow methods as needed
}));

// Middleware
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'view')));
app.set('view engine', 'ejs');

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
