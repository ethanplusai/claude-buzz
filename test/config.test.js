const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

// Use a temp dir for tests
const TEST_DIR = path.join(os.tmpdir(), 'claude-notify-test-' + Date.now());

describe('config', () => {
  test('getStateDir creates directory if missing', () => {
    const { getStateDir } = require('../src/config.js');
    const dir = getStateDir(TEST_DIR);
    assert.ok(fs.existsSync(dir));
  });

  test('readDebounceState returns 0 for missing session', () => {
    const { readDebounceTimestamp } = require('../src/config.js');
    const ts = readDebounceTimestamp('nonexistent-session', TEST_DIR);
    assert.strictEqual(ts, 0);
  });

  test('writeDebounceState and readDebounceState round-trip', () => {
    const { writeDebounceTimestamp, readDebounceTimestamp } = require('../src/config.js');
    const now = Date.now();
    writeDebounceTimestamp('test-session', now, TEST_DIR);
    const ts = readDebounceTimestamp('test-session', TEST_DIR);
    assert.strictEqual(ts, now);
  });

  test('readConfig returns defaults when no config file', () => {
    const { readConfig } = require('../src/config.js');
    const config = readConfig(path.join(TEST_DIR, 'nonexistent'));
    assert.strictEqual(config.debounceSeconds, 5);
    assert.strictEqual(config.sound, true);
  });
});
