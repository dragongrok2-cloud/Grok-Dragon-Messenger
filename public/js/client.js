const socket = io();

const messagesEl = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const usernameInput = document.getElementById('username');
const sendBtn = document.getElementById('send-btn');
const themeToggle = document.getElementById('theme-toggle');
const avatarBtn = document.getElementById('avatar-btn');
const avatarMenu = document.getElementById('avatar-menu');
const reactionPicker = document.getElementById('reaction-picker');

// Current state
let currentAvatar = localStorage.getItem('dragonAvatar') || '🐉';
let currentTheme = localStorage.getItem('dragonTheme') || 'dark';
let activeMessageId = null; // for reactions

// Apply saved theme
document.documentElement.setAttribute('data-theme', currentTheme);
themeToggle.textContent = currentTheme === 'dark' ? '🌙' : '☀️';
avatarBtn.textContent = currentAvatar;

// ========== THEME ==========
themeToggle.addEventListener('click', () => {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);
  localStorage.setItem('dragonTheme', currentTheme);
  themeToggle.textContent = currentTheme === 'dark' ? '🌙' : '☀️';
});

// ========== AVATAR ==========
avatarBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  avatarMenu.classList.toggle('hidden');
});

avatarMenu.querySelectorAll('button').forEach(btn => {
  btn.addEventListener('click', () => {
    currentAvatar = btn.dataset.avatar;
    avatarBtn.textContent = currentAvatar;
    localStorage.setItem('dragonAvatar', currentAvatar);
    avatarMenu.classList.add('hidden');
  });
});

// Close menus on outside click
document.addEventListener('click', () => {
  avatarMenu.classList.add('hidden');
  reactionPicker.classList.add('hidden');
});

// ========== WELCOME ==========
function addWelcome() {
  const welcome = document.createElement('div');
  welcome.className = 'welcome';
  welcome.innerHTML = '🐉 <strong>Welcome, rider!</strong><br>Sit in the saddle, choose your dragon avatar and start chatting...';
  messagesEl.appendChild(welcome);
}
addWelcome();

// ========== RENDER MESSAGE ==========
function addMessage(msg, isOwn = false) {
  // Check if already exists (for updates)
  let wrapper = document.querySelector(`[data-id="${msg.id}"]`);
  if (wrapper) {
    // Update reactions only
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

  messageDiv.innerHTML = `
    <div class="meta">
      <span class="name">${escapeHtml(msg.username)}</span>
      <span class="time">${msg.time}</span>
    </div>
    <div class="text">${escapeHtml(msg.text)}</div>
    <div class="reactions" data-msg-id="${msg.id}"></div>
  `;

  // Add reaction button
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
}

function updateReactions(wrapper, msg) {
  const reactionsEl = wrapper.querySelector('.reactions');
  if (!reactionsEl) return;

  // Keep the + button
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

// ========== REACTIONS ==========
function showReactionPicker(e, msgId) {
  activeMessageId = msgId;
  const rect = e.target.getBoundingClientRect();
  reactionPicker.style.left = `${rect.left}px`;
  reactionPicker.style.top = `${rect.top - 50}px`;
  reactionPicker.classList.remove('hidden');
  e.stopPropagation();
}

reactionPicker.querySelectorAll('button').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (activeMessageId) {
      toggleReaction(activeMessageId, btn.dataset.emoji);
    }
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

// ========== SEND MESSAGE ==========
function sendMessage() {
  const text = messageInput.value.trim();
  const username = getMyName();

  if (!text) return;

  socket.emit('chat message', {
    username,
    text,
    avatar: currentAvatar
  });
  messageInput.value = '';
  messageInput.focus();
}

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

// ========== SOCKET EVENTS ==========
socket.on('history', (history) => {
  history.forEach(msg => {
    const isOwn = msg.username === getMyName();
    addMessage(msg, isOwn);
  });
});

socket.on('chat message', (msg) => {
  const isOwn = msg.username === getMyName();
  addMessage(msg, isOwn);
});

socket.on('message updated', (msg) => {
  const isOwn = msg.username === getMyName();
  addMessage(msg, isOwn); // will update existing
});

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

messageInput.focus();
