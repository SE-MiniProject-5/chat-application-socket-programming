# SR-05 — Input validation and plain-text rendering

## Requirement

Validate the type and length of every client-supplied security-relevant field — username, password, room name and message text — and render user-supplied text as plain text so HTML/script content is displayed rather than executed.

## Implementation

- `src/validation.js` centralizes validation rules:
  - Username: 3–20 characters, letters/numbers/underscore only.
  - Password: 8–64 characters.
  - Room name: 3–30 characters.
  - Message text: 1–500 characters.
- Registration and login use the shared username/password validators.
- Room creation uses the shared room-name validator.
- Room and private messages use the shared message validator.
- Private-message recipients are validated as usernames.
- WebSocket and HTTP paths pass untrusted fields through the same server-side validation services.
- `public/app.js` uses DOM `textContent` for room names, sender names, timestamps, private-message labels and message bodies.
- User-controlled values are no longer inserted into `innerHTML`.

## Verification

`tests/sr05_input_validation.test.js` covers:

1. Username type, format and length validation.
2. Password type and length validation.
3. Room-name type and length validation.
4. Message type and length validation.
5. Registration/login rejection of invalid fields.
6. Room/message rejection of invalid input.
7. Literal rendering of `<script>`/HTML-like message text through `textContent`.

## Expected security behavior

A message such as:

```text
<script>alert('XSS')</script>
```

is displayed literally as text in the chat UI and is not interpreted as executable HTML/JavaScript.
