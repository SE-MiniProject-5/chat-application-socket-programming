# NR-06: First-use success

## Requirement
At least 4 of 5 first-time users should be able to register, join a room, and send a message within 3 minutes without instructions.

## Implementation
- Added a visible three-step Quick Start guide on the landing screen.
- The production database automatically provides a ready-to-use `General` room.
- After successful registration, the application opens the room list and automatically joins `General` (or the first available room).
- The chat view displays a direct first-message hint: “Type your first message below and press Send.”
- Existing test/in-memory databases are not seeded, preserving deterministic unit tests.

## Usability acceptance test
Run five fresh browser sessions and, without giving users instructions, ask each user to complete:
1. Create an account.
2. Join the available room.
3. Send a message.

Record completion time and whether the task was completed without facilitator help. The NR-06 target is **4/5 users completing within 3 minutes**.

## Automated verification
`tests/nr06_first_use_success.test.js` verifies the default room, isolated test database behavior, the three-step onboarding copy, and automatic room entry after registration.
