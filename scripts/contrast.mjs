// contrast.mjs: WCAG 2.x contrast ratio and hue helpers, no dependencies.
// CLI:  node scripts/contrast.mjs "#26221E" "#FBF9F4"     -> contrast ratio and AA verdicts
//       node scripts/contrast.mjs --hue "#653668" "#3B4CCA" -> hue/saturation of each and the hue distance of the first to the rest
import { pathToFileURL } from 'node:url';

const lin = (c) => {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lum = (h) => {
  const [r, g, b] = rgb(h).map(lin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

export const hue = (h) => {
  const [r, g, b] = rgb(h).map((v) => v / 255);
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const d = mx - mn;
  if (!d) return null;
  let x = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  x *= 60;
  return Math.round((x + 360) % 360);
};

export const sat = (h) => {
  const [r, g, b] = rgb(h).map((v) => v / 255);
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const l = (mx + mn) / 2;
  return mx === mn ? 0 : Math.round(((mx - mn) / (1 - Math.abs(2 * l - 1))) * 100);
};

export const hueDist = (a, b) => {
  const d = Math.abs(hue(a) - hue(b));
  return Math.min(d, 360 - d);
};

const isHex = (s) => /^#[0-9a-fA-F]{6}$/.test(s ?? '');

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  if (args[0] === '--hue') {
    const list = args.slice(1);
    if (list.length < 1 || !list.every(isHex)) {
      console.error('usage: node scripts/contrast.mjs --hue "#RRGGBB" ["#RRGGBB" ...]');
      process.exit(2);
    }
    const [first, ...rest] = list;
    console.log(`${first} hue ${hue(first)} sat ${sat(first)}%`);
    for (const other of rest) console.log(`vs ${other} hue ${hue(other)} distance ${hueDist(first, other)}`);
  } else if (isHex(args[0]) && isHex(args[1])) {
    const r = ratio(args[0], args[1]);
    console.log(`${args[0]} on ${args[1]}: ${r.toFixed(2)}:1  text AA ${r >= 4.5 ? 'pass' : 'FAIL'}  large/UI 3:1 ${r >= 3 ? 'pass' : 'FAIL'}`);
    if (r < 3) process.exitCode = 1;
  } else {
    console.error('usage: node scripts/contrast.mjs "#RRGGBB" "#RRGGBB"   or   --hue "#RRGGBB" ["#RRGGBB" ...]');
    process.exit(2);
  }
}
