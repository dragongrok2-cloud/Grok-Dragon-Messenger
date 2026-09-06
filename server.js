const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Serve static files from public folder
app.use(express.static(path.join(__dirname, 'public')));

// In-memory message history (simple version)
const messageHistory = [];
const MAX_HISTORY = 100;

io.on('connection', (socket) => {
  console.log('🐉 A new rider joined the dragon!', socket.id);

  // Send recent history to the new user
  socket.emit('history', messageHistory);

  // When someone sends a message
  socket.on('chat message', (data) => {
    const message = {
      id: Date.now(),
      username: data.username || 'Anonymous Rider',
      text: data.text,
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    };

    // Save to history
    messageHistory.push(message);
    if (messageHistory.length > MAX_HISTORY) {
      messageHistory.shift();
    }

    // Broadcast to everyone
    io.emit('chat message', message);
  });

  socket.on('disconnect', () => {
    console.log('🐉 A rider left the saddle...', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`\n🐉 Grok Dragon Messenger is flying on http://localhost:${PORT}`);
  console.log('   Sit in the saddle and start chatting!\n');
});
