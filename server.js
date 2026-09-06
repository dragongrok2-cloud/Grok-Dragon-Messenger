const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// In-memory storage
const messageHistory = [];
const MAX_HISTORY = 100;

io.on('connection', (socket) => {
  console.log('🐉 A new rider joined the dragon!', socket.id);

  // Send history
  socket.emit('history', messageHistory);

  // New message
  socket.on('chat message', (data) => {
    const message = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
      username: data.username || 'Anonymous Rider',
      text: data.text,
      avatar: data.avatar || '🐉',
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      reactions: {} // emoji -> [usernames]
    };

    messageHistory.push(message);
    if (messageHistory.length > MAX_HISTORY) {
      messageHistory.shift();
    }

    io.emit('chat message', message);
  });

  // Toggle reaction
  socket.on('toggle reaction', (data) => {
    const { messageId, emoji, username } = data;
    const msg = messageHistory.find(m => m.id === messageId);
    if (!msg) return;

    if (!msg.reactions[emoji]) {
      msg.reactions[emoji] = [];
    }

    const index = msg.reactions[emoji].indexOf(username);
    if (index === -1) {
      msg.reactions[emoji].push(username);
    } else {
      msg.reactions[emoji].splice(index, 1);
      if (msg.reactions[emoji].length === 0) {
        delete msg.reactions[emoji];
      }
    }

    io.emit('message updated', msg);
  });

  socket.on('disconnect', () => {
    console.log('🐉 A rider left the saddle...', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`\n🐉 Grok Dragon Messenger is flying on http://localhost:${PORT}`);
  console.log('   Sit in the saddle and start chatting!\n');
});
