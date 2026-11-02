const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.join(__dirname, '..');
const files = [
  'scripts/nr02-login-benchmark.js',
  'scripts/nr05-soak-test.js'
];

describe('NR-02 / NR-05 / NR-08 verification tooling', () => {
  for (const relativePath of files) {
    it(`TC-NR08: ${relativePath} has valid Node.js syntax`, () => {
      const result = spawnSync(process.execPath, ['--check', path.join(root, relativePath)], { encoding: 'utf8' });
      assert.equal(result.status, 0, result.stderr || result.stdout);
    });
  }

  it('TC-NR02: login benchmark measures login and room-list latency against the 2-second p95 target', () => {
    const source = fs.readFileSync(path.join(root, files[0]), 'utf8');
    assert.match(source, /\/api\/login/);
    assert.match(source, /\/api\/rooms/);
    assert.match(source, /p95/);
    assert.match(source, /p95 <= 2000/);
  });

  it('TC-NR05: endurance harness defaults to 20 users and 120 minutes', () => {
    const source = fs.readFileSync(path.join(root, files[1]), 'utf8');
    assert.match(source, /Number\(process\.env\.USERS \|\| 20\)/);
    assert.match(source, /Number\(process\.env\.DURATION_MINUTES \|\| 120\)/);
    assert.match(source, /new WebSocket/);
    assert.match(source, /process\.memoryUsage/);
  });

  it('TC-NR02: successful login no longer waits an artificial 600 ms before showing rooms', () => {
    const source = fs.readFileSync(path.join(root, 'public/app.js'), 'utf8');
    assert.doesNotMatch(source, /setTimeout\(\(\) => switchTab\('rooms'\), 600\)/);
    assert.match(source, /switchTab\('rooms'\);/);
  });

  it('TC-NR08: setup and architecture documentation are linked from the README', () => {
    const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
    assert.match(readme, /docs\/ARCHITECTURE\.md/);
    assert.match(readme, /npm ci/);
    assert.match(readme, /npm start/);
  });
});
