let currentUser = JSON.parse(sessionStorage.getItem('chat_user') || 'null');
let sessionToken = sessionStorage.getItem('chat_session_token');
let currentRoom = null;
let socket = null;

// FR-17: Automatically retry dropped WebSocket connections and restore the previous room.
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY_MS = 1000;
let reconnectAttempts = 0;
let reconnectTimer = null;
let intentionalDisconnect = false;

function clearReconnectTimer() {
  if (reconnectTimer !== null) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function scheduleReconnect() {
  if (intentionalDisconnect || !sessionToken || reconnectTimer !== null) return;

  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    showAlert('Connection lost. Please reload the page.', 'error');
    return;
  }

  reconnectAttempts += 1;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    initWebSocket();
  }, RECONNECT_DELAY_MS);
}


function initWebSocket() {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return;
  }

  if (!sessionToken) {
    showAlert('Please log in again before connecting to chat.', 'error');
    return;
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}?token=${encodeURIComponent(sessionToken)}`;

  try {
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('Connected to WebSocket server');
      // FR-17: A successful connection resets the retry counter.
      reconnectAttempts = 0;
      clearReconnectTimer();

      // FR-17: Rejoin the room that was active before the connection dropped.
      if (currentRoom && currentUser) {
        socket.send(JSON.stringify({
          type: 'join_room',
          roomId: currentRoom.id
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
          // An invalid/expired session cannot be recovered by reconnecting.
          if (data.message === 'Session expired. Please log in again.') {
            intentionalDisconnect = true;
          }
        }
      } catch (err) {
        console.error('Error parsing WS message:', err);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
      socket = null;

      // FR-17: Unexpected disconnects are retried five times.
      if (!intentionalDisconnect && sessionToken) {
        scheduleReconnect();
      }
    };
  } catch (err) {
    console.error('WebSocket connection failed:', err);
    socket = null;
    scheduleReconnect();
  }
}

function updateQuickStartVisibility(tab) {
  const quickStart = document.getElementById('quick-start');
  if (!quickStart) return;
  quickStart.classList.toggle('hidden', tab === 'chat');
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
  updateQuickStartVisibility(tab);

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

async function fetchRooms(options = {}) {
  try {
    const res = await fetch('/api/rooms');
    const data = await res.json();
    const list = document.getElementById('rooms-list');
    list.innerHTML = '';

    if (data.rooms && data.rooms.length > 0) {
      data.rooms.forEach(room => {
        const li = document.createElement('li');
        const roomName = document.createElement('span');
        roomName.className = 'room-name';
        roomName.textContent = `# ${room.name || ''}`;

        const roomDate = document.createElement('span');
        roomDate.className = 'room-date';
        roomDate.textContent = 'Click to enter';

        li.append(roomName, roomDate);
        li.onclick = () => joinRoom(room);
        list.appendChild(li);
      });

      if (options.autoJoin && data.rooms.length > 0) {
        const preferredRoom = data.rooms.find(room => String(room.name).toLowerCase() === 'general') || data.rooms[0];
        joinRoom(preferredRoom, { firstUse: true });
      }
    } else {
      list.innerHTML = '<li style="color: #8b949e; justify-content: center;">No rooms created yet</li>';
    }
  } catch (err) {
    console.error('Failed to load rooms:', err);
  }
}

function joinRoom(room, options = {}) {
  if (!currentUser) {
    showAlert('Please log in first to join a chat room!', 'error');
    switchTab('login');
    return;
  }

  currentRoom = room;
  document.getElementById('current-room-title').textContent = `# ${room.name}`;
  document.getElementById('messages-container').innerHTML = '';
  const firstMessageHint = document.getElementById('chat-first-message-hint');
  if (firstMessageHint) {
    firstMessageHint.classList.toggle('hidden', !options.firstUse);
  }
  switchTab('chat');

  initWebSocket();
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      type: 'join_room',
      roomId: room.id
    }));
  }
}

function leaveCurrentRoom() {
  // Leaving a room intentionally does not mean the WebSocket should reconnect.
  clearReconnectTimer();
  reconnectAttempts = 0;
  if (socket && socket.readyState === WebSocket.OPEN && currentRoom) {
    socket.send(JSON.stringify({ type: 'leave_room', roomId: currentRoom.id }));
  }
  currentRoom = null;
  switchTab('rooms');
}

// FR-14: render the server-provided usernames for the currently joined room.
function updateOnlineMembers(members) {
  const el = document.getElementById('online-users');
  if (!el) return;
  const safeMembers = Array.isArray(members) ? [...new Set(members.map(String))].sort((a, b) => a.localeCompare(b)) : [];
  const list = safeMembers.length > 0 ? safeMembers.join(', ') : 'None';
  el.textContent = `Online (${safeMembers.length}): ${list}`;
}

function renderMessageHistory(history) {
  const container = document.getElementById('messages-container');
  container.innerHTML = '';
  if (history && history.length > 0) {
    history.forEach(appendMessage);
  }
}

// FR-11: Displays sender username with every message
// FR-23: Displays private message badge and recipient details
function appendMessage(msg) {
  const container = document.getElementById('messages-container');
  const item = document.createElement('div');
  item.className = `message-item ${msg.isPrivate ? 'private' : ''}`;

  const isSelf = currentUser && (msg.sender === currentUser.username || msg.userId === currentUser.id);

  // SR-05 / SEC-REQ-05: never insert user-controlled text through innerHTML.
  // textContent renders HTML/script input as literal text.
  const meta = document.createElement('div');
  meta.className = 'message-meta';

  const sender = document.createElement('span');
  sender.className = `message-sender ${isSelf ? 'self' : ''}`;
  sender.textContent = String(msg.sender || '');
  meta.appendChild(sender);

  if (msg.isPrivate) {
    const badge = document.createElement('span');
    badge.className = 'badge-private';
    badge.textContent = `🔒 Private ${isSelf ? `to @${String(msg.recipient || '')}` : `from @${String(msg.sender || '')}`}`;
    meta.appendChild(badge);
  }

  const time = document.createElement('span');
  time.className = 'message-time';
  time.textContent = String(msg.timestamp || '');
  meta.appendChild(time);

  const text = document.createElement('div');
  text.className = 'message-text';
  text.textContent = String(msg.content || '');

  item.append(meta, text);
  container.appendChild(item);
  container.scrollTop = container.scrollHeight;
}

async function handleSendMessage(event) {
  event.preventDefault();
  const input = document.getElementById('message-input');
  const rawContent = input.value.trim();

  if (!rawContent) return;

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
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}`
          },
          body: JSON.stringify({
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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({ content: rawContent })
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
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`
      },
      body: JSON.stringify({ name: roomName })
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
      intentionalDisconnect = false;
      reconnectAttempts = 0;
      sessionStorage.setItem('chat_user', JSON.stringify(currentUser));
      sessionStorage.setItem('chat_session_token', sessionToken);
      usernameInput.value = '';
      passwordInput.value = '';
      setTimeout(() => {
        switchTab('rooms');
        fetchRooms({ autoJoin: true });
      }, 500);
    }
  } catch (error) {
    showAlert('Server connection error. Please try again.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Create Account';
  }
}


async function handleLogout() {
  intentionalDisconnect = true;
  clearReconnectTimer();
  reconnectAttempts = 0;
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
    if (socket) {
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close(1000, 'Logged out');
      }
      socket = null;
    }

    currentRoom = null;
    currentUser = null;
    sessionToken = null;
    sessionStorage.removeItem('chat_user');
    sessionStorage.removeItem('chat_session_token');

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
      intentionalDisconnect = false;
      reconnectAttempts = 0;
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
