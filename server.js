const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

const ROOMS = {
  saddle: { id: 'saddle', name: 'Седло', emoji: '🛋️' },
  sky: { id: 'sky', name: 'Небеса', emoji: '☁️' },
  cave: { id: 'cave', name: 'Пещера', emoji: '🌑' }
};

const histories = {
  saddle: [],
  sky: [],
  cave: []
};
const MAX_HISTORY = 100;
const riders = new Map(); // socket.id -> { username, avatar, room }

function ridersIn(room) {
  return Array.from(riders.values()).filter(r => r.room === room);
}

io.on('connection', (socket) => {
  console.log('🐉 A new rider joined the dragon!', socket.id);

  riders.set(socket.id, { username: 'Rider', avatar: '🐉', room: 'saddle' });
  socket.join('saddle');
  socket.emit('history', histories.saddle);
  io.to('saddle').emit('riders', ridersIn('saddle'));
  socket.emit('rooms', Object.values(ROOMS));
  socket.emit('room', 'saddle');

  socket.on('identify', (data) => {
    const prev = riders.get(socket.id) || { room: 'saddle' };
    riders.set(socket.id, {
      username: (data && data.username) || 'Rider',
      avatar: (data && data.avatar) || '🐉',
      room: prev.room || 'saddle'
    });
    const room = riders.get(socket.id).room;
    io.to(room).emit('riders', ridersIn(room));
  });

  socket.on('join room', (roomId) => {
    if (!ROOMS[roomId]) return;
    const prev = riders.get(socket.id) || { username: 'Rider', avatar: '🐉', room: 'saddle' };
    if (prev.room === roomId) return;

    socket.leave(prev.room);
    io.to(prev.room).emit('riders', ridersIn(prev.room));

    riders.set(socket.id, { ...prev, room: roomId });
    socket.join(roomId);
    socket.emit('history', histories[roomId] || []);
    socket.emit('room', roomId);
    io.to(roomId).emit('riders', ridersIn(roomId));
  });

  socket.on('typing', (data) => {
    const rider = riders.get(socket.id);
    const room = (rider && rider.room) || 'saddle';
    socket.to(room).emit('typing', {
      username: (data && data.username) || 'Rider',
      avatar: (data && data.avatar) || '🐉',
      isTyping: !!(data && data.isTyping)
    });
  });

  socket.on('chat message', (data) => {
    const rider = riders.get(socket.id);
    const room = (rider && rider.room) || 'saddle';
    const message = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
      username: data.username || 'Anonymous Rider',
      text: data.text,
      avatar: data.avatar || '🐉',
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      reactions: {},
      isSticker: !!data.isSticker,
      room
    };

    riders.set(socket.id, { username: message.username, avatar: message.avatar, room });
    io.to(room).emit('riders', ridersIn(room));

    histories[room] = histories[room] || [];
    histories[room].push(message);
    if (histories[room].length > MAX_HISTORY) histories[room].shift();

    io.to(room).emit('chat message', message);
  });

  socket.on('toggle reaction', (data) => {
    const { messageId, emoji, username } = data;
    const rider = riders.get(socket.id);
    const room = (rider && rider.room) || 'saddle';
    const list = histories[room] || [];
    const msg = list.find(m => m.id === messageId);
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

    io.to(room).emit('message updated', msg);
  });

  socket.on('disconnect', () => {
    const prev = riders.get(socket.id);
    const room = prev && prev.room;
    riders.delete(socket.id);
    if (room) io.to(room).emit('riders', ridersIn(room));
    console.log('🐉 A rider left the saddle...', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`\n🐉 Grok Dragon Messenger is flying on http://localhost:${PORT}`);
  console.log('   Sit in the saddle and start chatting!\n');
});
