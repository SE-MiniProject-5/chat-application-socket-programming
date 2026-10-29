function switchTab(tab) {
  const regForm = document.getElementById('register-form');
  const loginForm = document.getElementById('login-form');
  const roomsSection = document.getElementById('rooms-section');
  const regTab = document.getElementById('tab-register');
  const loginTab = document.getElementById('tab-login');
  const roomsTab = document.getElementById('tab-rooms');
  const alertBox = document.getElementById('alert-box');

  alertBox.className = 'alert hidden';

  regForm.classList.add('hidden');
  loginForm.classList.add('hidden');
  roomsSection.classList.add('hidden');
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
        li.innerHTML = `<span class="room-name"># ${room.name}</span> <span class="room-date">ID: ${room.id}</span>`;
        list.appendChild(li);
      });
    } else {
      list.innerHTML = '<li style="color: #8b949e; justify-content: center;">No rooms created yet</li>';
    }
  } catch (err) {
    console.error('Failed to load rooms:', err);
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
      body: JSON.stringify({ name: roomName })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      // Displays "Room name already exists" if duplicate (FR-05)
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
      // Displays "Username already taken" if duplicate (FR-02)
      showAlert(data.message || 'Registration failed', 'error');
    } else {
      showAlert(`Success! Account created for "${data.user.username}". You can now log in.`, 'success');
      usernameInput.value = '';
      passwordInput.value = '';
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
      showAlert(`Welcome back, ${data.user.username}!`, 'success');
    }
  } catch (error) {
    showAlert('Server connection error. Please try again.', 'error');
  }
}
