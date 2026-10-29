function switchTab(tab) {
  const regForm = document.getElementById('register-form');
  const loginForm = document.getElementById('login-form');
  const regTab = document.getElementById('tab-register');
  const loginTab = document.getElementById('tab-login');
  const alertBox = document.getElementById('alert-box');

  alertBox.className = 'alert hidden';

  if (tab === 'register') {
    regForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    regTab.classList.add('active');
    loginTab.classList.remove('active');
  } else {
    regForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
    regTab.classList.remove('active');
    loginTab.classList.add('active');
  }
}

function showAlert(message, type = 'error') {
  const alertBox = document.getElementById('alert-box');
  alertBox.textContent = message;
  alertBox.className = `alert ${type}`;
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
