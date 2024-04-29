const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path'); // Import path module
const multer = require('multer'); // Import multer for handling multipart/form-data

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/engeo', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Multer storage configuration
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, path.join(__dirname, 'public', 'uploads')); // Save uploaded files to 'public/uploads' directory
    },
    filename: function(req, file, cb) {
        cb(null, file.originalname); // Use original file name as the filename
    }
});
const upload = multer({ storage: storage });

// MongoDB schema
const PostSchema = new mongoose.Schema({
    content: String,
    imageUrl: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Post = mongoose.model('Post', PostSchema);

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/posts', async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 });
        res.json(posts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: 'Error fetching posts' });
    }
});

// Handle multipart/form-data POST request
app.post('/posts', upload.single('image'), async (req, res) => {
    try {
        const { content } = req.body;
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null; // Construct image URL from the uploaded file
        const newPost = new Post({ content, imageUrl });
        await newPost.save();
        res.status(201).json(newPost);
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'Error creating post' });
    }
});

// Route to serve the createpost.html file
app.get('/createpost.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'createpost.html'));
});

app.listen(port, () => console.log(`Server running on port ${port}`));
