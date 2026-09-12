const socket = io();

const messagesEl = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const usernameInput = document.getElementById('username');
const sendBtn = document.getElementById('send-btn');
const themeToggle = document.getElementById('theme-toggle');
const soundToggle = document.getElementById('sound-toggle');
const avatarBtn = document.getElementById('avatar-btn');
const avatarMenu = document.getElementById('avatar-menu');
const reactionPicker = document.getElementById('reaction-picker');
const ridersPanel = document.getElementById('riders-panel');
const typingLine = document.getElementById('typing-line');
const onlineText = document.getElementById('online-text');
const stickerBtn = document.getElementById('sticker-btn');
const stickerPanel = document.getElementById('sticker-panel');
const cavesEl = document.getElementById('caves');

let currentAvatar = localStorage.getItem('dragonAvatar') || '🐉';
let currentTheme = localStorage.getItem('dragonTheme') || 'dark';
let soundEnabled = localStorage.getItem('dragonSound') !== 'off';
let currentRoom = localStorage.getItem('dragonRoom') || 'saddle';
let activeMessageId = null;
let typingTimeout = null;
const typingRiders = new Map();

document.documentElement.setAttribute('data-theme', currentTheme);
themeToggle.textContent = currentTheme === 'dark' ? '🌙' : '☀️';
soundToggle.textContent = soundEnabled ? '🔊' : '🔇';
avatarBtn.textContent = currentAvatar;
setActiveCave(currentRoom);

let audioCtx = null;

function playMessageSound() {
  if (!soundEnabled) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioCtx.currentTime;
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now);
    osc2.frequency.setValueAtTime(659.25, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.15, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(audioCtx.destination);
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.5);
    osc2.stop(now + 0.5);
  } catch (e) {}
}

soundToggle.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  localStorage.setItem('dragonSound', soundEnabled ? 'on' : 'off');
  soundToggle.textContent = soundEnabled ? '🔊' : '🔇';
  if (soundEnabled) playMessageSound();
});

themeToggle.addEventListener('click', () => {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);
  localStorage.setItem('dragonTheme', currentTheme);
  themeToggle.textContent = currentTheme === 'dark' ? '🌙' : '☀️';
});

avatarBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  avatarMenu.classList.toggle('hidden');
  stickerPanel.classList.add('hidden');
});

avatarMenu.querySelectorAll('button').forEach(btn => {
  btn.addEventListener('click', () => {
    currentAvatar = btn.dataset.avatar;
    avatarBtn.textContent = currentAvatar;
    localStorage.setItem('dragonAvatar', currentAvatar);
    avatarMenu.classList.add('hidden');
    emitIdentify();
  });
});

usernameInput.addEventListener('change', emitIdentify);
usernameInput.addEventListener('blur', emitIdentify);

function emitIdentify() {
  socket.emit('identify', { username: getMyName(), avatar: currentAvatar });
}

function setActiveCave(roomId) {
  currentRoom = roomId;
  localStorage.setItem('dragonRoom', roomId);
  cavesEl.querySelectorAll('.cave-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.room === roomId);
  });
}

cavesEl.querySelectorAll('.cave-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const room = btn.dataset.room;
    if (room === currentRoom) return;
    typingRiders.clear();
    typingLine.classList.add('hidden');
    socket.emit('join room', room);
  });
});

stickerBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  stickerPanel.classList.toggle('hidden');
  avatarMenu.classList.add('hidden');
  reactionPicker.classList.add('hidden');
});

stickerPanel.querySelectorAll('button').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const sticker = btn.dataset.sticker;
    socket.emit('chat message', {
      username: getMyName(),
      text: sticker,
      avatar: currentAvatar,
      isSticker: true
    });
    stickerPanel.classList.add('hidden');
  });
});

document.addEventListener('click', () => {
  avatarMenu.classList.add('hidden');
  reactionPicker.classList.add('hidden');
  stickerPanel.classList.add('hidden');
});

function addWelcome() {
  const welcome = document.createElement('div');
  welcome.className = 'welcome';
  welcome.innerHTML = '🐉 <strong>Добро пожаловать в пещеру!</strong><br>Садись в седло, выбери пещеру и лети со мной...';
  messagesEl.appendChild(welcome);
}

function clearMessages() {
  messagesEl.innerHTML = '';
  addWelcome();
}

addWelcome();

function addMessage(msg, isOwn = false) {
  let wrapper = document.querySelector(`[data-id="${msg.id}"]`);
  if (wrapper) {
    updateReactions(wrapper, msg);
    return;
  }

  wrapper = document.createElement('div');
  wrapper.className = `message-wrapper ${isOwn ? 'own' : 'other'}`;
  wrapper.dataset.id = msg.id;

  const avatar = document.createElement('div');
  avatar.className = 'avatar';
  avatar.textContent = msg.avatar || '🐉';

  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${isOwn ? 'own' : 'other'}`;
  if (msg.isSticker) messageDiv.classList.add('sticker-msg');

  const textContent = msg.isSticker
    ? `<div class="sticker-text">${escapeHtml(msg.text)}</div>`
    : `<div class="text">${escapeHtml(msg.text)}</div>`;

  messageDiv.innerHTML = `
    <div class="meta">
      <span class="name">${escapeHtml(msg.username)}</span>
      <span class="time">${msg.time}</span>
    </div>
    ${textContent}
    <div class="reactions" data-msg-id="${msg.id}"></div>
  `;

  const addBtn = document.createElement('button');
  addBtn.className = 'add-reaction-btn';
  addBtn.textContent = '+';
  addBtn.title = 'Add reaction';
  addBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    showReactionPicker(e, msg.id);
  });

  messageDiv.querySelector('.reactions').appendChild(addBtn);
  wrapper.appendChild(avatar);
  wrapper.appendChild(messageDiv);
  messagesEl.appendChild(wrapper);

  updateReactions(wrapper, msg);
  messagesEl.scrollTop = messagesEl.scrollHeight;

  if (!isOwn) playMessageSound();
}

function updateReactions(wrapper, msg) {
  const reactionsEl = wrapper.querySelector('.reactions');
  if (!reactionsEl) return;
  const addBtn = reactionsEl.querySelector('.add-reaction-btn');
  reactionsEl.innerHTML = '';

  if (msg.reactions) {
    Object.entries(msg.reactions).forEach(([emoji, users]) => {
      if (users.length === 0) return;
      const btn = document.createElement('button');
      btn.className = 'reaction';
      if (users.includes(getMyName())) btn.classList.add('active');
      btn.innerHTML = `${emoji} <span class="reaction-count">${users.length}</span>`;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleReaction(msg.id, emoji);
      });
      reactionsEl.appendChild(btn);
    });
  }
  if (addBtn) reactionsEl.appendChild(addBtn);
}

function getMyName() {
  return usernameInput.value.trim() || 'Rider';
}

function showReactionPicker(e, msgId) {
  activeMessageId = msgId;
  const rect = e.target.getBoundingClientRect();
  reactionPicker.style.left = `${Math.min(rect.left, window.innerWidth - 280)}px`;
  reactionPicker.style.top = `${rect.top - 55}px`;
  reactionPicker.classList.remove('hidden');
  e.stopPropagation();
}

reactionPicker.querySelectorAll('button').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (activeMessageId) toggleReaction(activeMessageId, btn.dataset.emoji);
    reactionPicker.classList.add('hidden');
  });
});

function toggleReaction(msgId, emoji) {
  socket.emit('toggle reaction', {
    messageId: msgId,
    emoji,
    username: getMyName()
  });
}

function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;
  socket.emit('chat message', {
    username: getMyName(),
    text,
    avatar: currentAvatar
  });
  socket.emit('typing', { username: getMyName(), avatar: currentAvatar, isTyping: false });
  messageInput.value = '';
  messageInput.focus();
}

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

messageInput.addEventListener('input', () => {
  socket.emit('typing', { username: getMyName(), avatar: currentAvatar, isTyping: true });
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit('typing', { username: getMyName(), avatar: currentAvatar, isTyping: false });
  }, 1200);
});

socket.on('connect', () => {
  emitIdentify();
  socket.emit('join room', currentRoom);
});

socket.on('room', (roomId) => {
  setActiveCave(roomId);
});

socket.on('history', (history) => {
  clearMessages();
  (history || []).forEach(msg => addMessage(msg, msg.username === getMyName()));
});

socket.on('chat message', (msg) => {
  addMessage(msg, msg.username === getMyName());
});

socket.on('message updated', (msg) => {
  addMessage(msg, msg.username === getMyName());
});

socket.on('riders', (list) => {
  ridersPanel.innerHTML = '';
  (list || []).forEach(r => {
    const chip = document.createElement('span');
    chip.className = 'rider-chip';
    chip.title = r.username || 'Rider';
    chip.innerHTML = `<span class="rider-avatar">${r.avatar || '🐉'}</span>`;
    ridersPanel.appendChild(chip);
  });
  if (onlineText) {
    const count = (list || []).length;
    onlineText.textContent = count === 1 ? '1 in saddle' : `${count} in saddle`;
  }
});

socket.on('typing', (data) => {
  if (!data) return;
  if (data.username === getMyName()) return;
  if (data.isTyping) {
    typingRiders.set(data.username, data.avatar);
  } else {
    typingRiders.delete(data.username);
  }
  if (typingRiders.size === 0) {
    typingLine.classList.add('hidden');
    typingLine.textContent = '';
  } else {
    const names = Array.from(typingRiders.keys()).join(', ');
    typingLine.classList.remove('hidden');
    typingLine.textContent = `🐉 ${names} печатает на спине дракона...`;
  }
});

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

messageInput.focus();
