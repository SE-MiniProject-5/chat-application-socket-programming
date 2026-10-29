let currentUser = JSON.parse(sessionStorage.getItem('chat_user') || 'null');
let currentRoom = null;
let socket = null;

function initWebSocket() {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return;
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}`;

  try {
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('Connected to WebSocket server');
      if (currentRoom && currentUser) {
        socket.send(JSON.stringify({
          type: 'join_room',
          roomId: currentRoom.id,
          user: currentUser
        }));
      }
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'chat_message') {
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

    socket.onclose = () => {
      console.log('WebSocket disconnected');
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
        li.innerHTML = `<span class="room-name"># ${room.name}</span> <span class="room-date">Click to enter</span>`;
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
      user: currentUser
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
  if (history && history.length > 0) {
    history.forEach(appendMessage);
  }
}

// FR-11: Displays sender username with every message
function appendMessage(msg) {
  const container = document.getElementById('messages-container');
  const item = document.createElement('div');
  item.className = 'message-item';

  const isSelf = currentUser && (msg.sender === currentUser.username || msg.userId === currentUser.id);

  item.innerHTML = `
    <div class="message-meta">
      <span class="message-sender ${isSelf ? 'self' : ''}">${escapeHtml(msg.sender)}</span>
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
  const content = input.value.trim();

  if (!content || !currentRoom) return;

  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      type: 'send_message',
      roomId: currentRoom.id,
      content: content
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
          content: content
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
      sessionStorage.setItem('chat_user', JSON.stringify(currentUser));
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
      showAlert(data.message || 'Login failed', 'error');
    } else {
      currentUser = data.user;
      sessionStorage.setItem('chat_user', JSON.stringify(currentUser));
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
