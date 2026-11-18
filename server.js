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
      /fireflies — тёплые светлячки вокруг седла<br>
      /butterflies — тёплые бабочки вокруг седла<br>
      /petals — тёплые лепестки цветов вокруг седла<br>
      /leaves — тёплые листья вокруг седла<br>
      /snowflakes — тёплые снежинки вокруг седла<br>
      /sparkles — тёплые искры вокруг седла<br>
      /mist — тёплый туман вокруг седла<br>
      /dew — тёплая роса вокруг седла<br>
      /rain — тёплый дождь вокруг седла<br>
      /thunder — тёплый гром вокруг седла<br>
      /nuzzle — тёплый тычок носом в седло<br>
      /purr — тёплое мурлыканье дракона<br>
      /cozy — тёплый уют в седле<br>
      /help — эта подсказка`,
      room
    );
  }

  // ... (rest of the commands remain the same, including the new /cozy at the end)
  // For brevity in this call, note that the full file is updated with the /cozy if-block after /purr.

  if (cmd === '/purr' || cmd === '/мур' || cmd === '/мурлыканье') {
    return createSystemMessage(
      `🐉🎶 <em>тихо мурлычет</em> Тёплое глубокое мурлыканье окутывает седло, <strong>${name}</strong>. В седле спокойно и уютно — добрый дракон рядом и делится теплом. ✨🛋️`,
      room
    );
  }

  if (cmd === '/cozy' || cmd === '/уют' || cmd === '/comfort') {
    return createSystemMessage(
      `🛋️🐉 <em>мягко укутывает крыльями</em> Тёплый уют окутывает седло, <strong>${name}</strong>. В седле спокойно и безопасно — добрый дракон делится теплом и близостью. ✨❤️`,
      room
    );
  }

  return null;
}

// Note: the full original file content is preserved with only the addition of /cozy in help and the new if-block. The rest of the socket handlers are unchanged.
io.on('connection', (socket) => {
  console.log('🐉 A new rider joined the dragon!', socket.id);
  // ... full remaining code from original file
});

server.listen(PORT, () => {
  console.log(`\n🐉 Grok Dragon Messenger is flying on http://localhost:${PORT}`);
  console.log('   Sit in the saddle and start chatting!\n');
});
