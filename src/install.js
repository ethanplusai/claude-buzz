const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execSync } = require('node:child_process');
const { writeConfig, DEFAULT_BASE, getTerminalNotifierPath } = require('./config.js');
const { detectTerminal } = require('./terminal.js');

const CLAUDE_SETTINGS = path.join(os.homedir(), '.claude', 'settings.json');
const HOOK_MARKER = 'claude-buzz notify';

const TERMINAL_NOTIFIER_URL =
  'https://github.com/julienXX/terminal-notifier/releases/download/2.0.0/terminal-notifier-2.0.0.zip';

function resolveCliPath() {
  // Hooks run in a minimal shell without NVM/profile loaded.
  // We need the absolute path to the claude-buzz binary.
  try {
    return execSync('which claude-buzz', { encoding: 'utf8' }).trim();
  } catch {
    return 'claude-buzz'; // fallback
  }
}

function makeHookEntry() {
  const cliPath = resolveCliPath();
  return {
    matcher: '',
    hooks: [
      {
        type: 'command',
        command: `${cliPath} notify`,
        timeout: 10,
      },
    ],
  };
}

function isOurHook(entry) {
  return entry?.hooks?.some((h) => h.command?.endsWith('claude-buzz notify') || h.command?.endsWith('claude-notify notify'));
}

function mergeHooks(settings) {
  const result = { ...settings };
  if (!result.hooks) result.hooks = {};

  for (const event of ['Stop', 'Notification']) {
    if (!result.hooks[event]) result.hooks[event] = [];
    const alreadyInstalled = result.hooks[event].some(isOurHook);
    if (!alreadyInstalled) {
      result.hooks[event].push(makeHookEntry());
    }
  }

  return result;
}

function removeHooks(settings) {
  const result = { ...settings };
  if (!result.hooks) return result;

  for (const event of ['Stop', 'Notification']) {
    if (result.hooks[event]) {
      result.hooks[event] = result.hooks[event].filter((entry) => !isOurHook(entry));
    }
  }

  return result;
}

function hasClaudeNotifyHooks(settings) {
  if (!settings?.hooks) return false;
  return ['Stop', 'Notification'].some((event) =>
    settings.hooks[event]?.some(isOurHook)
  );
}

function readSettings() {
  try {
    return JSON.parse(fs.readFileSync(CLAUDE_SETTINGS, 'utf8'));
  } catch {
    return {};
  }
}

function writeSettings(settings) {
  fs.mkdirSync(path.dirname(CLAUDE_SETTINGS), { recursive: true });
  fs.writeFileSync(CLAUDE_SETTINGS, JSON.stringify(settings, null, 2) + '\n');
}

async function downloadTerminalNotifier() {
  const binDir = path.join(DEFAULT_BASE, 'bin');
  const tnPath = getTerminalNotifierPath();

  if (fs.existsSync(tnPath)) return;

  fs.mkdirSync(binDir, { recursive: true });
  const zipPath = path.join(binDir, 'terminal-notifier.zip');

  console.log('  Downloading terminal-notifier...');
  execSync(`curl -sL "${TERMINAL_NOTIFIER_URL}" -o "${zipPath}"`, { stdio: 'pipe' });
  execSync(`unzip -qo "${zipPath}" -d "${binDir}"`, { stdio: 'pipe' });
  fs.unlinkSync(zipPath);
  fs.chmodSync(tnPath, 0o755);
  console.log('  Downloaded terminal-notifier.');
}

async function install() {
  const pkg = require('../package.json');
  console.log(`\n  claude-notify v${pkg.version}\n`);

  const existing = readSettings();
  const alreadyInstalled = hasClaudeNotifyHooks(existing);
  if (alreadyInstalled) {
    console.log('  Already installed! Hooks are active.');
    console.log('  Run "claude-buzz status" to check, or "claude-buzz uninstall" to remove.\n');
    return;
  }

  await downloadTerminalNotifier();

  const terminal = detectTerminal();
  console.log(`  Detected terminal: ${terminal}`);

  const merged = mergeHooks(existing);
  writeSettings(merged);
  console.log('  Added Stop hook... done');
  console.log('  Added Notification hook... done');

  writeConfig({ debounceSeconds: 5, sound: true, terminal }, DEFAULT_BASE);

  const { sendTestNotification } = require('./notify.js');
  await sendTestNotification();

  console.log('\n  You\'re all set. You\'ll get notified when Claude needs you.');
  console.log('  Run "claude-buzz uninstall" to remove.\n');
}

async function uninstall() {
  const existing = readSettings();
  const cleaned = removeHooks(existing);
  writeSettings(cleaned);
  console.log('  Removed hooks from Claude Code settings.');

  fs.rmSync(DEFAULT_BASE, { recursive: true, force: true });
  console.log('  Removed ~/.claude-notify/');
  console.log('  Uninstalled successfully.\n');
}

async function status() {
  const pkg = require('../package.json');
  const settings = readSettings();
  const installed = hasClaudeNotifyHooks(settings);
  const config = installed ? require('./config.js').readConfig() : null;

  console.log(`\n  claude-notify v${pkg.version}`);
  console.log(`  Status: ${installed ? '✓ Active' : '✗ Not installed'}`);
  if (config) {
    console.log(`  Debounce: ${config.debounceSeconds}s`);
    console.log(`  Sound: ${config.sound ? 'on' : 'off'}`);
    console.log(`  Terminal: ${config.terminal || 'auto-detect'}`);
  }
  console.log('');
}

module.exports = {
  mergeHooks,
  removeHooks,
  hasClaudeNotifyHooks,
  install,
  uninstall,
  status,
};
