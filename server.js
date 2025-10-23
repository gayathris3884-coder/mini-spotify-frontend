require('dotenv').config(); // Load Cloudinary keys
const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Default route
app.get('/', (req, res) => {
  res.send('🎵 Mini Spotify Backend is Live! Use /upload to add songs or /songs to list songs.');
});

// Connect to Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});

// Setup file upload
const upload = multer({ storage: multer.memoryStorage() });

// Upload route
app.post('/upload', upload.single('song'), (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).send('No file uploaded!');

  streamifier.createReadStream(file.buffer)
    .pipe(cloudinary.uploader.upload_stream(
      { resource_type: 'video', folder: 'mini-spotify' },
      (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ url: result.secure_url, name: file.originalname });
      }
    ));
});

// List songs
app.get('/songs', async (req, res) => {
  try {
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'mini-spotify/',
      resource_type: 'video',
      max_results: 100
    });

    const songs = result.resources.map(s => ({
      name: s.public_id.split('/')[1],
      url: s.secure_url
    }));

    res.json(songs);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
