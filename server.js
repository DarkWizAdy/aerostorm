const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const photos = [];

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname)));

app.post('/upload', (req, res) => {
  const { image } = req.body;
  if (!image || typeof image !== 'string' || !image.startsWith('data:image/')) {
    return res.status(400).json({ error: 'Invalid image payload' });
  }

  photos.push(image);
  io.emit('new-photo', image);
  res.status(201).json({ success: true });
});

app.get('/photos-list', (req, res) => {
  res.json(photos);
});

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
