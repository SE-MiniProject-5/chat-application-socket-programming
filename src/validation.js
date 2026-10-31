/**
 * Central input validation for SR-05 / SEC-REQ-05.
 *
 * The server is the trust boundary: values received from a client are
 * validated for type, length, and expected format before they are used.
 */

const USERNAME_MIN = 3;
const USERNAME_MAX = 20;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 64;
const ROOM_NAME_MIN = 3;
const ROOM_NAME_MAX = 30;
const MESSAGE_MIN = 1;
const MESSAGE_MAX = 500;

const USERNAME_PATTERN = /^[A-Za-z0-9_]+$/;

function validateUsername(username) {
  if (typeof username !== 'string') {
    return { valid: false, message: 'Username must be a valid string' };
  }

  const cleanUsername = username.trim();
  if (
    cleanUsername.length < USERNAME_MIN ||
    cleanUsername.length > USERNAME_MAX ||
    !USERNAME_PATTERN.test(cleanUsername)
  ) {
    return {
      valid: false,
      message: `Username must be ${USERNAME_MIN}-${USERNAME_MAX} characters long and contain only letters, numbers, and underscores`
    };
  }

  return { valid: true, cleanUsername };
}

function validatePassword(password) {
  if (typeof password !== 'string') {
    return { valid: false, message: 'Password must be a valid string' };
  }

  if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
    return {
      valid: false,
      message: `Password must be between ${PASSWORD_MIN} and ${PASSWORD_MAX} characters long`
    };
  }

  return { valid: true };
}

function validateRoomName(name) {
  if (typeof name !== 'string') {
    return { valid: false, message: 'Room name must be a valid string' };
  }

  const cleanName = name.trim();
  if (cleanName.length < ROOM_NAME_MIN || cleanName.length > ROOM_NAME_MAX) {
    return {
      valid: false,
      message: `Room name must be between ${ROOM_NAME_MIN} and ${ROOM_NAME_MAX} characters`
    };
  }

  return { valid: true, cleanName };
}

function validateMessageText(content) {
  if (typeof content !== 'string') {
    return { valid: false, message: 'Message content must be a valid string' };
  }

  const cleanContent = content.trim();
  if (cleanContent.length < MESSAGE_MIN || cleanContent.length > MESSAGE_MAX) {
    return {
      valid: false,
      message: `Message must be between ${MESSAGE_MIN} and ${MESSAGE_MAX} characters`
    };
  }

  return { valid: true, cleanContent };
}

module.exports = {
  USERNAME_MIN,
  USERNAME_MAX,
  PASSWORD_MIN,
  PASSWORD_MAX,
  ROOM_NAME_MIN,
  ROOM_NAME_MAX,
  MESSAGE_MIN,
  MESSAGE_MAX,
  validateUsername,
  validatePassword,
  validateRoomName,
  validateMessageText
};
