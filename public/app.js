let currentUser = JSON.parse(sessionStorage.getItem('chat_user') || 'null');
let sessionToken = sessionStorage.getItem('chat_session_token');
let currentRoom = null;
let socket = null;

function initWebSocket() {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return;
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  // SR-02: the server refuses socket connections that do not carry a valid session token.
  if (!sessionToken) {
    forceLogin('Please log in to chat.');
    return;
  }
  const wsUrl = `${protocol}//${window.location.host}/?token=${encodeURIComponent(sessionToken)}`;

  try {
    socket = new WebSocket(wsUrl);
    let opened = false;

    socket.onopen = () => {
      opened = true;
      console.log('Connected to WebSocket server');
      if (currentRoom && currentUser) {
        socket.send(JSON.stringify({
          type: 'join_room',
          roomId: currentRoom.id,
          user: currentUser,
          token: sessionToken
        }));
      }
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'chat_message') {
          appendMessage(data);
        } else if (data.type === 'private_message') {
          // FR-23: Private message received
          appendMessage(data);
        } else if (data.type === 'presence') {
          updateOnlineMembers(data.members);
        } else if (data.type === 'room_joined') {
          updateOnlineMembers(data.members);
          renderMessageHistory(data.history);
        } else if (data.type === 'error') {
          showAlert(data.message, 'error');
        }
      } catch (err) {
        console.error('Error parsing WS message:', err);
      }
    };

    socket.onclose = (event) => {
      console.log('WebSocket disconnected');
      socket = null;
      // Refused at the handshake (never opened) or closed by the server as an invalid/expired session:
      // the token is no longer good, so send the person back to the login page (UC-10 step 4a).
      if (!currentUser) return;
      if (!opened || event.code === 1008) {
        forceLogin('Your session has expired. Please log in again.');
      }
    };
  } catch (err) {
    console.error('WebSocket connection failed:', err);
  }
}

function switchTab(tab) {
  const regForm = document.getElementById('register-form');
  const loginForm = document.getElementById('login-form');
  const roomsSection = document.getElementById('rooms-section');
  const chatSection = document.getElementById('chat-section');
  const regTab = document.getElementById('tab-register');
  const loginTab = document.getElementById('tab-login');
  const roomsTab = document.getElementById('tab-rooms');
  const alertBox = document.getElementById('alert-box');

  alertBox.className = 'alert hidden';

  regForm.classList.add('hidden');
  loginForm.classList.add('hidden');
  roomsSection.classList.add('hidden');
  chatSection.classList.add('hidden');
  regTab.classList.remove('active');
  loginTab.classList.remove('active');
  roomsTab.classList.remove('active');

  document.getElementById('logout-btn').classList.toggle('hidden', !currentUser || tab === 'register' || tab === 'login');

  if (tab === 'register') {
    regForm.classList.remove('hidden');
    regTab.classList.add('active');
  } else if (tab === 'login') {
    loginForm.classList.remove('hidden');
    loginTab.classList.add('active');
  } else if (tab === 'rooms') {
    roomsSection.classList.remove('hidden');
    roomsTab.classList.add('active');
    fetchRooms();
  } else if (tab === 'chat') {
    chatSection.classList.remove('hidden');
    roomsTab.classList.add('active');
  }
}

function showAlert(message, type = 'error') {
  const alertBox = document.getElementById('alert-box');
  alertBox.textContent = message;
  alertBox.className = `alert ${type}`;
}

async function fetchRooms() {
  try {
    const res = await fetch('/api/rooms');
    const data = await res.json();
    const list = document.getElementById('rooms-list');
    list.innerHTML = '';

    if (data.rooms && data.rooms.length > 0) {
      data.rooms.forEach(room => {
        const li = document.createElement('li');
        const name = document.createElement('span');
        name.className = 'room-name';
        name.textContent = `# ${room.name}`;
        const action = document.createElement('span');
        action.className = 'room-date';
        action.textContent = 'Click to enter';
        li.append(name, action);
        li.onclick = () => joinRoom(room);
        list.appendChild(li);
      });
    } else {
      list.innerHTML = '<li style="color: #8b949e; justify-content: center;">No rooms created yet</li>';
    }
  } catch (err) {
    console.error('Failed to load rooms:', err);
  }
}

function joinRoom(room) {
  if (!currentUser) {
    showAlert('Please log in first to join a chat room!', 'error');
    switchTab('login');
    return;
  }

  currentRoom = room;
  document.getElementById('current-room-title').textContent = `# ${room.name}`;
  document.getElementById('messages-container').innerHTML = '';
  switchTab('chat');

  initWebSocket();
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      type: 'join_room',
      roomId: room.id,
      user: currentUser,
      token: sessionToken
    }));
  }
}

function leaveCurrentRoom() {
  if (socket && socket.readyState === WebSocket.OPEN && currentRoom) {
    socket.send(JSON.stringify({ type: 'leave_room', roomId: currentRoom.id }));
  }
  currentRoom = null;
  switchTab('rooms');
}

function updateOnlineMembers(members) {
  const el = document.getElementById('online-users');
  if (!el) return;
  const list = members && members.length > 0 ? members.join(', ') : 'None';
  el.textContent = `Online (${members.length}): ${list}`;
}

function renderMessageHistory(history) {
  const container = document.getElementById('messages-container');
  container.innerHTML = '';
  renderedMessageKeys.clear();
  if (history && history.length > 0) {
    history.forEach(message => appendMessage({
      ...message,
      timestamp: message.timestamp || message.createdAt || message.created_at || ''
    }));
  }
}

// FR-11: Displays sender username with every message
// FR-23: Displays private message badge and recipient details
// NR-03: every message is shown exactly once, in server-received order.
// Key = kind + server id (room messages and private messages have separate id spaces).
const renderedMessageKeys = new Set();

function messageKey(msg) {
  const id = msg.id !== null && msg.id !== undefined ? msg.id : msg.seq;
  if (id === null || id === undefined) return null;
  return `${msg.isPrivate ? 'pm' : 'room'}:${id}`;
}

function appendMessage(msg) {
  const container = document.getElementById('messages-container');

  // NR-03: drop duplicates (e.g. REST response + WebSocket broadcast, or history + live overlap)
  const key = messageKey(msg);
  if (key) {
    if (renderedMessageKeys.has(key)) return;
    renderedMessageKeys.add(key);
  }

  const item = document.createElement('div');
  item.className = `message-item ${msg.isPrivate ? 'private' : ''}`;
  if (msg.seq !== null && msg.seq !== undefined) item.dataset.seq = String(msg.seq);
  if (key) item.dataset.key = key;

  const isSelf = currentUser && (msg.sender === currentUser.username || msg.userId === currentUser.id);
  const privateBadge = msg.isPrivate 
    ? `<span class="badge-private">🔒 Private ${isSelf ? `to @${escapeHtml(msg.recipient)}` : `from @${escapeHtml(msg.sender)}`}</span>` 
    : '';

  item.innerHTML = `
    <div class="message-meta">
      <span class="message-sender ${isSelf ? 'self' : ''}">${escapeHtml(msg.sender)}</span>
      ${privateBadge}
      <span class="message-time">${msg.timestamp || ''}</span>
    </div>
    <div class="message-text">${escapeHtml(msg.content)}</div>
  `;

  container.appendChild(item);
  container.scrollTop = container.scrollHeight;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function handleSendMessage(event) {
  event.preventDefault();
  const input = document.getElementById('message-input');
  const rawContent = input.value.trim();

  if (!rawContent) return;
  if (rawContent.length > 500) {
    showAlert('Message must be between 1 and 500 characters', 'error');
    return;
  }

  // FR-23: Detect private whisper command (/w <username> <message> or /dm <username> <message>)
  const dmMatch = rawContent.match(/^\/(?:w|dm)\s+([A-Za-z0-9_]+)\s+(.+)$/i);
  if (dmMatch) {
    const recipient = dmMatch[1];
    const dmContent = dmMatch[2];

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'send_private_message',
        recipient: recipient,
        content: dmContent
      }));
      input.value = '';
    } else {
      try {
        const res = await fetch('/api/messages/private', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderId: currentUser ? currentUser.id : null,
            senderUsername: currentUser ? currentUser.username : 'Anonymous',
            recipientUsername: recipient,
            content: dmContent
          })
        });
        const data = await res.json();
        if (data.success) {
          appendMessage(data.data);
          input.value = '';
        } else {
          showAlert(data.message, 'error');
        }
      } catch (err) {
        showAlert('Failed to send private message', 'error');
      }
    }
    return;
  }

  // Regular room chat message
  if (!currentRoom) {
    showAlert('Please join a room or use /w <username> <message> to send a private message', 'error');
    return;
  }

  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      type: 'send_message',
      roomId: currentRoom.id,
      content: rawContent
    }));
    input.value = '';
  } else {
    // Fallback to HTTP
    try {
      const res = await fetch(`/api/rooms/${currentRoom.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser ? currentUser.id : null,
          username: currentUser ? currentUser.username : 'Anonymous',
          content: rawContent
        })
      });
      const data = await res.json();
      if (data.success) {
        appendMessage(data.data);
        input.value = '';
      } else {
        showAlert(data.message, 'error');
      }
    } catch (err) {
      showAlert('Failed to send message', 'error');
    }
  }
}

async function handleCreateRoom(event) {
  event.preventDefault();

  const nameInput = document.getElementById('room-name');
  const submitBtn = document.getElementById('create-room-btn');
  const roomName = nameInput.value.trim();

  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating...';

  try {
    const response = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: roomName,
        created_by: currentUser ? currentUser.id : null
      })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      showAlert(data.message || 'Failed to create room', 'error');
    } else {
      showAlert(`Room "${data.room.name}" created successfully!`, 'success');
      nameInput.value = '';
      fetchRooms();
    }
  } catch (error) {
    showAlert('Server connection error. Please try again.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Create Room';
  }
}

async function handleRegister(event) {
  event.preventDefault();

  const usernameInput = document.getElementById('reg-username');
  const passwordInput = document.getElementById('reg-password');
  const submitBtn = document.getElementById('reg-submit-btn');

  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  submitBtn.disabled = true;
  submitBtn.textContent = 'Registering...';

  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      showAlert(data.message || 'Registration failed', 'error');
    } else {
      showAlert(`Success! Account created for "${data.user.username}". You can now log in.`, 'success');
      currentUser = data.user;
      sessionToken = data.token;
      sessionStorage.setItem('chat_user', JSON.stringify(currentUser));
      sessionStorage.setItem('chat_session_token', sessionToken);
      usernameInput.value = '';
      passwordInput.value = '';
      setTimeout(() => switchTab('rooms'), 800);
    }
  } catch (error) {
    showAlert('Server connection error. Please try again.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Create Account';
  }
}


function clearLocalSession() {
  if (socket) {
    const s = socket;
    socket = null;
    s.onclose = null;
    if (s.readyState === WebSocket.OPEN || s.readyState === WebSocket.CONNECTING) {
      s.close(1000, 'Logged out');
    }
  }

  currentRoom = null;
  currentUser = null;
  sessionToken = null;
  sessionStorage.removeItem('chat_user');
  sessionStorage.removeItem('chat_session_token');
}

// SR-02: drop local credentials and show the login page when the server rejects our session.
function forceLogin(message) {
  clearLocalSession();
  switchTab('login');
  showAlert(message, 'error');
}

async function handleLogout() {
  const logoutButton = document.getElementById('logout-btn');
  logoutButton.disabled = true;

  try {
    if (sessionToken) {
      await fetch('/api/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: sessionToken })
      });
    }
  } catch (error) {
    console.error('Logout request failed:', error);
  } finally {
    // Always clear this browser's local session and disconnect its socket.
    clearLocalSession();

    document.getElementById('login-form').reset();
    switchTab('login');
    showAlert('You have been logged out successfully.', 'success');
    logoutButton.disabled = false;
  }
}

async function handleLogin(event) {
  event.preventDefault();

  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      // FR-20: Display "Invalid username or password" without revealing which was wrong
      showAlert(data.message || 'Invalid username or password', 'error');
    } else {
      currentUser = data.user;
      sessionToken = data.token;
      sessionStorage.setItem('chat_user', JSON.stringify(currentUser));
      sessionStorage.setItem('chat_session_token', sessionToken);
      showAlert(`Welcome back, ${data.user.username}!`, 'success');
      setTimeout(() => switchTab('rooms'), 600);
    }
  } catch (error) {
    showAlert('Server connection error. Please try again.', 'error');
  }
}

if (currentUser) {
  initWebSocket();
}
