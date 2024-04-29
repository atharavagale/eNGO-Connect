// appmongo.js

const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

// Middleware
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/mydatabase', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;

// User Model
const User = mongoose.model('User', {
  username: String,
  email: String,
  password: String,
});

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Signup Endpoint
app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create new user
  const user = new User({
    username,
    email,
    password: hashedPassword,
  });

  // Save user to database
  user.save()
    .then(() => {
      res.status(201).json({ message: 'User registered successfully' });
    })
    .catch((error) => {
      res.status(500).json({ message: 'Failed to register user' });
    });
});

// Login Endpoint
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Find user by email
  User.findOne({ email })
    .then(async (user) => {
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Compare passwords
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid password' });
      }

      // Basic authentication successful
      res.status(200).json({ message: 'Login successful' });
    })
    .catch((error) => {
      res.status(500).json({ message: 'Internal server error' });
    });
});

// Start server
const PORT = process.env.PORT || 3200;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
