const express = require('express');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config(); // Load environment variables from .env file

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MySQL pool setup using environment variables
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test MySQL connection
pool.query('SELECT 1 + 1 AS result', (error, results) => {
    if (error) {
        console.error('MySQL connection test failed:', error);
    } else {
        console.log('MySQL connection test successful:', results[0].result);
    }
});

// Signup route
app.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Username, email, and password are required.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const tableName = 'users'; 

        pool.query(`INSERT INTO ${tableName} (username, email, password) VALUES (?, ?, ?)`, [username, email, hashedPassword], (error, results) => {
            if (error) {
                if (error.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ message: 'This email is already in use. Please try another.' });
                } else {
                    console.error('Database Error:', error);
                    return res.status(500).json({ message: 'User registration failed due to an unexpected error.', details: error.message });
                }
            }
            res.status(201).json({ success: true, message: 'User registered successfully!' });
        });
        
    } catch (error) {
        res.status(500).json({ message: 'Server error during the registration process.' });
    }
});

// Login route
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    pool.query('SELECT * FROM users WHERE email = ?', [email], async (error, results) => {
        if (error || results.length === 0) {
            res.status(401).json({ message: 'Incorrect email or password.' });
        } else {
            const match = await bcrypt.compare(password, results[0].password);
            if (match) {
                res.status(200).json({ message: 'Logged in successfully!' });
            } else {
                res.status(401).json({ message: 'Incorrect email or password.' });
            }
        }
    });
});

// Start server
const PORT = process.env.PORT || 3200;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
