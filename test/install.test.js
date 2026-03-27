const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const { mergeHooks, removeHooks, hasClaudeNotifyHooks } = require('../src/install.js');

describe('install - mergeHooks', () => {
  test('adds hooks to empty settings', () => {
    const result = mergeHooks({});
    assert.ok(result.hooks.Stop);
    assert.ok(result.hooks.Notification);
    assert.strictEqual(result.hooks.Stop.length, 1);
    assert.strictEqual(result.hooks.Notification.length, 1);
  });

  test('preserves existing hooks when merging', () => {
    const existing = {
      hooks: {
        Stop: [{ matcher: '', hooks: [{ type: 'command', command: 'echo done' }] }],
      },
      permissions: { allow: ['Bash'] },
    };
    const result = mergeHooks(existing);
    assert.strictEqual(result.hooks.Stop.length, 2);
    assert.strictEqual(result.hooks.Stop[0].hooks[0].command, 'echo done');
    assert.deepStrictEqual(result.permissions, { allow: ['Bash'] });
  });

  test('does not duplicate if already installed', () => {
    const withOurs = mergeHooks({});
    const result = mergeHooks(withOurs);
    assert.strictEqual(result.hooks.Stop.length, 1);
    assert.strictEqual(result.hooks.Notification.length, 1);
  });
});

describe('install - removeHooks', () => {
  test('removes claude-notify hooks', () => {
    const withOurs = mergeHooks({});
    const result = removeHooks(withOurs);
    assert.strictEqual(result.hooks.Stop.length, 0);
    assert.strictEqual(result.hooks.Notification.length, 0);
  });

  test('preserves other hooks when removing', () => {
    const existing = {
      hooks: {
        Stop: [
          { matcher: '', hooks: [{ type: 'command', command: 'echo done' }] },
        ],
      },
    };
    const merged = mergeHooks(existing);
    const result = removeHooks(merged);
    assert.strictEqual(result.hooks.Stop.length, 1);
    assert.strictEqual(result.hooks.Stop[0].hooks[0].command, 'echo done');
  });
});

describe('install - hasClaudeNotifyHooks', () => {
  test('returns false for empty settings', () => {
    assert.strictEqual(hasClaudeNotifyHooks({}), false);
  });

  test('returns true when hooks are present', () => {
    const withOurs = mergeHooks({});
    assert.strictEqual(hasClaudeNotifyHooks(withOurs), true);
  });
});
