// Build a single-file copy for double-click classroom and grader access.
// The editable D3 source remains in src/; this file is a generated distribution.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const dist = join(root, 'dist');
let html = await readFile(join(dist, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/g)];
if (scripts.length !== 1) throw new Error('Expected one bundled entry script; inspect Vite output before packaging.');
const entry = scripts[0];
let js = await readFile(join(dist, entry[1].replace(/^\//, '')), 'utf8');
if (/\bimport\s*\(/.test(js) || /\bfrom\s*["']\.\//.test(js)) throw new Error('Portable entry must not depend on external modules.');
// The current dataset is small enough for Vite to inline as a data URL.
if (!js.includes('data:text/csv')) throw new Error('Dataset was not inlined; update the portable asset strategy.');
js = js.replace(/<\/script/gi, '<\\/script');
html = html.replace(entry[0], () => `<script type="module">${js}</script>`);
for (const match of [...html.matchAll(/<link\b[^>]*href="([^"]+\.css)"[^>]*>/g)]) {
  if (match[1].startsWith('https:')) continue;
  const css = await readFile(join(dist, match[1].replace(/^\//, '')), 'utf8');
  html = html.replace(match[0], () => `<style>${css}</style>`);
}
// Use the existing Georgia/Arial fallbacks so no fonts are fetched offline.
html = html.replace(/<link\b[^>]*https:\/\/fonts\.[^>]*>/g, '');
html = html.replace(/^[\t ]+$/gm, '');
if (/<(?:script|link)\b[^>]*(?:src|href)="(?:\/assets|https?:)/.test(html)) throw new Error('Unexpected external startup asset.');
const output = join(root, 'output', 'prototype', 'Food_Budget_Atlas.html');
await mkdir(join(root, 'output', 'prototype'), { recursive: true });
await writeFile(output, html);
console.log(`Portable dashboard: ${output}`);
