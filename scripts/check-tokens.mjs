// check-tokens: fails when a colour literal appears outside src/theme/tokens.ts.
// Scans src/**/*.{ts,tsx,css}. Colour values must come from tokens (see CLAUDE.md "The token rule").
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SRC = join(ROOT, 'src');
const ALLOWED = ['src/theme/tokens.ts'];
const EXT = /\.(ts|tsx|css)$/;

const NAMED = [
  'black', 'white', 'red', 'green', 'blue', 'yellow', 'orange', 'purple', 'pink', 'gray', 'grey', 'brown', 'cyan', 'magenta',
  'teal', 'navy', 'maroon', 'olive', 'lime', 'aqua', 'silver', 'gold', 'indigo', 'violet', 'crimson', 'coral', 'salmon', 'tomato',
];
const named = NAMED.join('|');

const patterns = [
  { name: 'hex colour', re: /#[0-9a-fA-F]{3,8}\b/g },
  { name: 'functional colour', re: /\b(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color)\(/g },
  { name: 'named colour string', re: new RegExp(`(['"\`])(?:${named})\\1`, 'gi') },
  {
    name: 'named colour in CSS value',
    re: new RegExp(`\\b(?:color|background|background-color|border|border-color|fill|stroke|outline)\\s*:\\s*(?:${named})\\b`, 'gi'),
  },
];

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

function stripComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).replace(/(^|[^:])\/\/.*$/gm, '$1');
}

const problems = [];
for (const file of walk(SRC).filter((f) => EXT.test(f))) {
  const rel = relative(ROOT, file).split(sep).join('/');
  if (ALLOWED.includes(rel)) continue;
  const text = stripComments(readFileSync(file, 'utf8'));
  text.split('\n').forEach((line, i) => {
    for (const { name, re } of patterns) {
      re.lastIndex = 0;
      if (re.test(line)) problems.push(`${rel}:${i + 1}: ${name}: ${line.trim().slice(0, 100)}`);
    }
  });
}

if (problems.length > 0) {
  console.error(`check-tokens: ${problems.length} colour literal(s) outside tokens.ts\n${problems.join('\n')}`);
  process.exit(1);
}
console.log('check-tokens: ok (no colour literals outside src/theme/tokens.ts)');
