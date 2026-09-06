const socket = io();

const messagesEl = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const usernameInput = document.getElementById('username');
const sendBtn = document.getElementById('send-btn');

// Add welcome message
function addWelcome() {
  const welcome = document.createElement('div');
  welcome.className = 'welcome';
  welcome.innerHTML = '🐉 <strong>Welcome, rider!</strong><br>Sit in the saddle and start chatting with the dragon...';
  messagesEl.appendChild(welcome);
}

addWelcome();

// Render a single message
function addMessage(msg, isOwn = false) {
  const div = document.createElement('div');
  div.className = `message ${isOwn ? 'own' : 'other'}`;

  div.innerHTML = `
    <div class="meta">
      <span class="name">${escapeHtml(msg.username)}</span>
      <span class="time">${msg.time}</span>
    </div>
    <div class="text">${escapeHtml(msg.text)}</div>
  `;

  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Send message
function sendMessage() {
  const text = messageInput.value.trim();
  const username = usernameInput.value.trim() || 'Rider';

  if (!text) return;

  socket.emit('chat message', { username, text });
  messageInput.value = '';
  messageInput.focus();
}

// Events
sendBtn.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendMessage();
  }
});

// Receive history
socket.on('history', (history) => {
  history.forEach(msg => {
    const isOwn = msg.username === (usernameInput.value.trim() || 'Rider');
    addMessage(msg, isOwn);
  });
});

// Receive new messages
socket.on('chat message', (msg) => {
  const isOwn = msg.username === (usernameInput.value.trim() || 'Rider');
  addMessage(msg, isOwn);
});

// Focus on message input
messageInput.focus();
