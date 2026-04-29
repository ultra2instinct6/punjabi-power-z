/* Load the legacy IIFE data files in a Node test (they assign to window.*). */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import vm from 'node:vm';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..', '..');

export function loadGameGlobals() {
  const sandbox = {
    window: {},
    console,
  };
  sandbox.window.window = sandbox.window;
  vm.createContext(sandbox);

  for (const rel of [
    'src/config/tuning.data.js',
    'src/data/deck.data.js',
    'src/data/medicine-bank.data.js',
  ]) {
    const code = readFileSync(resolve(root, rel), 'utf8');
    vm.runInContext(code, sandbox, { filename: rel });
  }

  return {
    PPZ_CONFIG: sandbox.window.PPZ_CONFIG,
    PPZ_DECK: sandbox.window.PPZ_DECK,
    MEDICINE_BANK: sandbox.window.MEDICINE_BANK,
    MEDICINE_TOPICS: sandbox.window.MEDICINE_TOPICS,
  };
}
