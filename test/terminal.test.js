const { test, describe } = require('node:test');
const assert = require('node:assert');

describe('terminal', () => {
  test('detectTerminal returns a known terminal or "unknown"', () => {
    const { detectTerminal } = require('../src/terminal.js');
    const result = detectTerminal();
    const valid = ['iTerm2', 'Terminal.app', 'Warp', 'kitty', 'Alacritty', 'unknown'];
    assert.ok(valid.includes(result), `Got unexpected terminal: ${result}`);
  });

  test('buildFocusScript returns valid AppleScript string', () => {
    const { buildFocusScript } = require('../src/terminal.js');
    const script = buildFocusScript('iTerm2', '/Users/test/project');
    assert.ok(script.includes('iTerm'));
    assert.ok(typeof script === 'string');
  });

  test('buildFocusScript handles Terminal.app', () => {
    const { buildFocusScript } = require('../src/terminal.js');
    const script = buildFocusScript('Terminal.app', '/Users/test/project');
    assert.ok(script.includes('Terminal'));
  });

  test('buildFocusScript falls back for unknown terminals', () => {
    const { buildFocusScript } = require('../src/terminal.js');
    const script = buildFocusScript('unknown', '/Users/test/project');
    assert.ok(typeof script === 'string');
  });

  test('shortenPath replaces homedir with ~', () => {
    const { shortenPath } = require('../src/terminal.js');
    const os = require('os');
    const result = shortenPath(os.homedir() + '/Desktop/project');
    assert.ok(result.startsWith('~/'));
  });
});
