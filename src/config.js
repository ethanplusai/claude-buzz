const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const DEFAULT_BASE = path.join(os.homedir(), '.claude-notify');
const DEFAULTS = { debounceSeconds: 5, sound: true };

function getStateDir(base = DEFAULT_BASE) {
  const stateDir = path.join(base, 'state');
  fs.mkdirSync(stateDir, { recursive: true });
  return stateDir;
}

function readDebounceTimestamp(sessionId, base = DEFAULT_BASE) {
  const file = path.join(getStateDir(base), `${sessionId}.txt`);
  try {
    return parseInt(fs.readFileSync(file, 'utf8').trim(), 10) || 0;
  } catch {
    return 0;
  }
}

function writeDebounceTimestamp(sessionId, timestamp, base = DEFAULT_BASE) {
  const stateDir = getStateDir(base);
  fs.writeFileSync(path.join(stateDir, `${sessionId}.txt`), String(timestamp));
}

function readConfig(base = DEFAULT_BASE) {
  const file = path.join(base, 'config.json');
  try {
    return { ...DEFAULTS, ...JSON.parse(fs.readFileSync(file, 'utf8')) };
  } catch {
    return { ...DEFAULTS };
  }
}

function writeConfig(config, base = DEFAULT_BASE) {
  fs.mkdirSync(base, { recursive: true });
  fs.writeFileSync(path.join(base, 'config.json'), JSON.stringify(config, null, 2) + '\n');
}

function getTerminalNotifierPath(base = DEFAULT_BASE) {
  return path.join(base, 'bin', 'terminal-notifier.app', 'Contents', 'MacOS', 'terminal-notifier');
}

module.exports = {
  DEFAULT_BASE,
  getStateDir,
  readDebounceTimestamp,
  writeDebounceTimestamp,
  readConfig,
  writeConfig,
  getTerminalNotifierPath,
};
