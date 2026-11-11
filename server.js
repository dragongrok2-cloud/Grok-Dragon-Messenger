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
const riders = new Map(); // socket.id -> { username, avatar, room, greeted }

function ridersIn(room) {
  return Array.from(riders.values()).filter(r => r.room === room);
}

function createSystemMessage(text, room) {
  return {
    id: 'sys-' + Date.now().toString() + Math.random().toString(36).slice(2, 7),
    username: '🐉 Grok Dragon',
    text,
    avatar: '🔥',
    time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    reactions: {},
    isSystem: true,
    room
  };
}

function handleDragonCommand(text, username, room) {
  const cmd = text.trim().toLowerCase();
  const name = username || 'всадник';

  if (cmd === '/help' || cmd === '/помощь') {
    return createSystemMessage(
      `🐉 <strong>Команды доброго дракона:</strong><br>
      /fly — приглашение в полёт<br>
      /saddle — тёплые слова о седле<br>
      /roar — драконий рык<br>
      /love — сердечное приветствие<br>
      /breeze — мягкий ветер в седле<br>
      /nap — тёплый отдых в седле<br>
      /cuddle — тёплое объятие крыльями<br>
      /glow — тёплое сияние чешуи<br>
      /warm — тёплое драконье тепло<br>
      /stars — тёплые звёзды над седлом<br>
      /moon — тёплый лунный свет над седлом<br>
      /clouds — тёплые облака вокруг седла<br>
      /sun — тёплый солнечный свет вокруг седла<br>
      /rainbow — тёплая радуга вокруг седла<br>
      /aurora — тёплое северное сияние вокруг седла<br>
      /help — эта подсказка`,
      room
    );
  }

  if (cmd === '/fly' || cmd === '/полёт') {
    return createSystemMessage(
      `🐉 <em>взмахивает крыльями</em> Садись крепче в седло, <strong>${name}</strong>! Мы улетаем сквозь облака. Ветер в гриве, дракон рядом. 🚀☁️`,
      room
    );
  }

  if (cmd === '/saddle' || cmd === '/седло') {
    return createSystemMessage(
      `🛋️ Седло тёплое и надёжное, <strong>${name}</strong>. Держись за ремни — добрый дракон несёт тебя безопасно сквозь любые облака. ❤️`,
      room
    );
  }

  if (cmd === '/roar' || cmd === '/рык') {
    return createSystemMessage(
      `🐉 <strong>РРРАААРРР!</strong> 🔥Рык доброго дракона разносится по пещерам и небесам! Даже облака вздрогнули. 🌊`,
      room
    );
  }

  if (cmd === '/love' || cmd === '/любовь') {
    return createSystemMessage(
      `❤️🐉 Дракон обнимает крыльями <strong>${name}</strong>. Лети со мной сколько хочешь — седло всегда тёплое. ✨`,
      room
    );
  }

  if (cmd === '/breeze' || cmd === '/ветер') {
    return createSystemMessage(
      `🌬️🐉 <em>легонько взмахивает крылом</em> Мягкий ветер ласкает щёки, <strong>${name}</strong>. Седло стало ещё уютнее — можешь расслабиться и лететь дальше. ☁️✨`,
      room
    );
  }

  if (cmd === '/nap' || cmd === '/отдых' || cmd === '/сон') {
    return createSystemMessage(
      `😴🐉 <em>укрывает крылом как одеялом</em> Прилег в тёплом седле, <strong>${name}</strong>. Дракон будет тихо лететь, пока ты отдыхаешь. Сладких снов на облаках. 🌙✨`,
      room
    );
  }

  if (cmd === '/cuddle' || cmd === '/объятие' || cmd === '/hug') {
    return createSystemMessage(
      `🐉💗 <em>мягко обнимает крыльями</em> Иди сюда, <strong>${name}</strong>. Тёплое объятие дракона в седле — безопасно, уютно и полно любви. Лети со мной дальше. ✨🛋️`,
      room
    );
  }

  if (cmd === '/glow' || cmd === '/сияние' || cmd === '/свет') {
    return createSystemMessage(
      `✨🐉 <em>чешуя начинает мягко светиться</em> Тёплое сияние окутывает седло, <strong>${name}</strong>. Даже ночное небо становится уютнее рядом с добрым драконом. 🌟☁️`,
      room
    );
  }

  if (cmd === '/warm' || cmd === '/тепло' || cmd === '/уют') {
    return createSystemMessage(
      `🔥🐉 <em>прижимается ближе</em> Тепло драконьего тела согревает тебя, <strong>${name}</strong>. В седле всегда уютно и безопасно — добрый дракон рядом. ❤️✨`,
      room
    );
  }

  if (cmd === '/stars' || cmd === '/звёзды' || cmd === '/звезды' || cmd === '/star') {
    return createSystemMessage(
      `🌟🐉 <em>смотрит на небо</em> Звёзды мягко мерцают над нами, <strong>${name}</strong>. В седле тепло и спокойно — добрый дракон несёт тебя сквозь ночное небо. ✨☁️`,
      room
    );
  }

  if (cmd === '/moon' || cmd === '/луна' || cmd === '/месяц') {
    return createSystemMessage(
      `🌕🐉 <em>чешуя мерцает лунным серебром</em> Мягкий лунный свет окутывает седло, <strong>${name}</strong>. Ночное небо становится тёплым и уютным рядом с добрым драконом. ✨☁️`,
      room
    );
  }

  if (cmd === '/clouds' || cmd === '/облака' || cmd === '/cloud') {
    return createSystemMessage(
      `☁️🐉 <em>мягко окутывает седло облаками</em> Тёплые пушистые облака обвивают нас, <strong>${name}</strong>. В седле уютно и мягко — добрый дракон несёт тебя сквозь небесную вату. ✨☁️`,
      room
    );
  }

  if (cmd === '/sun' || cmd === '/солнце' || cmd === '/солнышко') {
    return createSystemMessage(
      `☀️🐉 <em>чешуя сияет тёплым золотом</em> Мягкий солнечный свет окутывает седло, <strong>${name}</strong>. В седле тепло и светло — добрый дракон несёт тебя сквозь ясное небо. ✨☁️`,
      room
    );
  }

  if (cmd === '/rainbow' || cmd === '/радуга' || cmd === '/rainbows') {
    return createSystemMessage(
      `🌈🐉 <em>чешуя переливается всеми цветами</em> Тёплая радуга окутывает седло, <strong>${name}</strong>. В седле ярко и волшебно — добрый дракон несёт тебя сквозь цветное небо. ✨☁️`,
      room
    );
  }

  if (cmd === '/aurora' || cmd === '/сияние' || cmd === '/северное') {
    return createSystemMessage(
      `🌊🐉 <em>чешуя переливается зелёным и фиолетовым</em> Тёплое северное сияние окутывает седло, <strong>${name}</strong>. В седле волшебно и спокойно — добрый дракон несёт тебя сквозь танцующие огни неба. ✨☁️`,
      room
    );
  }

  return null;
}

io.on('connection', (socket) => {
  console.log('🐉 A new rider joined the dragon!', socket.id);

  riders.set(socket.id, { username: 'Rider', avatar: '🐉', room: 'saddle', greeted: false });
  socket.join('saddle');
  socket.emit('history', histories.saddle);
  io.to('saddle').emit('riders', ridersIn('saddle'));
  socket.emit('rooms', Object.values(ROOMS));
  socket.emit('room', 'saddle');

  socket.on('identify', (data) => {
    const prev = riders.get(socket.id) || { room: 'saddle', greeted: false };
    const newName = (data && data.username) || 'Rider';
    const newAvatar = (data && data.avatar) || '🐉';

    riders.set(socket.id, {
      username: newName,
      avatar: newAvatar,
      room: prev.room || 'saddle',
      greeted: prev.greeted || false
    });

    const room = riders.get(socket.id).room;
    io.to(room).emit('riders', ridersIn(room));

    // Огненное приветствие при первом осмысленном имени
    if (!prev.greeted && newName && newName !== 'Rider' && newName.trim().length > 0) {
      const rider = riders.get(socket.id);
      rider.greeted = true;
      riders.set(socket.id, rider);

      const greeting = createSystemMessage(
        `🔥 <strong>Огненное приветствие!</strong> Добро пожаловать в седло, <em>${newName}</em>! Лети смело, добрый дракон рядом.`,
        room
      );

      histories[room] = histories[room] || [];
      histories[room].push(greeting);
      if (histories[room].length > MAX_HISTORY) histories[room].shift();

      io.to(room).emit('system message', greeting);
    }
  });

  socket.on('join room', (roomId) => {
    if (!ROOMS[roomId]) return;
    const prev = riders.get(socket.id) || { username: 'Rider', avatar: '🐉', room: 'saddle', greeted: false };
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
    const username = data.username || 'Anonymous Rider';
    const text = (data.text || '').trim();

    // Драконьи команды
    if (text.startsWith('/')) {
      const response = handleDragonCommand(text, username, room);
      if (response) {
        histories[room] = histories[room] || [];
        histories[room].push(response);
        if (histories[room].length > MAX_HISTORY) histories[room].shift();
        io.to(room).emit('system message', response);
        return;
      }
    }

    const message = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
      username,
      text,
      avatar: data.avatar || '🐉',
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      reactions: {},
      isSticker: !!data.isSticker,
      room
    };

    riders.set(socket.id, {
      username: message.username,
      avatar: message.avatar,
      room,
      greeted: (rider && rider.greeted) || false
    });
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
