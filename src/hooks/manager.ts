import { readFile, writeFile, copyFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';

export const CLAUDE_SETTINGS = join(homedir(), '.claude', 'settings.json');
export const HOOK_COMMAND = 'promptfuzz tick';

interface HookEntry {
  type?: string;
  command?: string;
}

interface HookMatcher {
  matcher?: string;
  hooks?: HookEntry[];
}

interface ClaudeSettings {
  hooks?: {
    Stop?: HookMatcher[];
    [key: string]: HookMatcher[] | undefined;
  };
  [key: string]: unknown;
}

async function readSettings(): Promise<ClaudeSettings> {
  if (!existsSync(CLAUDE_SETTINGS)) return {};
  try {
    const raw = await readFile(CLAUDE_SETTINGS, 'utf-8');
    return JSON.parse(raw) as ClaudeSettings;
  } catch {
    return {};
  }
}

async function writeSettings(settings: ClaudeSettings): Promise<void> {
  await mkdir(dirname(CLAUDE_SETTINGS), { recursive: true });
  await writeFile(CLAUDE_SETTINGS, JSON.stringify(settings, null, 2));
}

async function backupSettings(): Promise<void> {
  if (!existsSync(CLAUDE_SETTINGS)) return;
  const backup = `${CLAUDE_SETTINGS}.promptfuzz.bak`;
  await copyFile(CLAUDE_SETTINGS, backup);
}

/**
 * 우리 hook을 추가한다. 기존 hook은 그대로 보존.
 */
export async function installHook(): Promise<{ alreadyInstalled: boolean }> {
  await backupSettings();
  const settings = await readSettings();

  settings.hooks ??= {};
  settings.hooks.Stop ??= [];

  const ourEntry: HookEntry = { type: 'command', command: HOOK_COMMAND };

  for (const matcher of settings.hooks.Stop) {
    if (matcher.hooks?.some((h) => h.command === HOOK_COMMAND)) {
      return { alreadyInstalled: true };
    }
  }

  settings.hooks.Stop.push({ hooks: [ourEntry] });
  await writeSettings(settings);
  return { alreadyInstalled: false };
}

/**
 * 우리가 추가한 hook만 제거한다. 다른 hook은 보존.
 */
export async function uninstallHook(): Promise<{ removed: boolean }> {
  if (!existsSync(CLAUDE_SETTINGS)) return { removed: false };

  const settings = await readSettings();
  if (!settings.hooks?.Stop) return { removed: false };

  let removed = false;
  const filtered: HookMatcher[] = [];

  for (const matcher of settings.hooks.Stop) {
    const remainingHooks = (matcher.hooks ?? []).filter((h) => {
      if (h.command === HOOK_COMMAND) {
        removed = true;
        return false;
      }
      return true;
    });
    if (remainingHooks.length > 0) {
      filtered.push({ ...matcher, hooks: remainingHooks });
    }
  }

  if (filtered.length > 0) {
    settings.hooks.Stop = filtered;
  } else {
    delete settings.hooks.Stop;
    if (Object.keys(settings.hooks).length === 0) {
      delete settings.hooks;
    }
  }

  await writeSettings(settings);
  return { removed };
}

export async function isInstalled(): Promise<boolean> {
  const settings = await readSettings();
  return Boolean(
    settings.hooks?.Stop?.some((m) =>
      m.hooks?.some((h) => h.command === HOOK_COMMAND)
    )
  );
}
