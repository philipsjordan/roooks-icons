#!/usr/bin/env node
// Checks icons.json against the icons folder. Dependency free; runs in CI and locally:
//   node scripts/validate-manifest.mjs
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const CATEGORY = /^[a-z][a-z0-9-]*$/;
const SEMVER = /^\d+\.\d+\.\d+$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const cmp = (a, b) => {
  const x = a.split('.').map(Number), y = b.split('.').map(Number);
  return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
};
const errors = [];
const fail = (msg) => errors.push(msg);

let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(path.join(root, 'icons.json'), 'utf8'));
} catch (e) {
  console.error(`Cannot read icons.json: ${e.message}`);
  process.exit(1);
}

if (!SEMVER.test(manifest.version ?? '')) fail(`version "${manifest.version}" is not semver (x.y.z)`);
if (!Array.isArray(manifest.icons) || manifest.icons.length === 0) fail('icons must be a non-empty list');

// releases: date of every release that added icons ("added" below points into this list). The website uses it
// for the "New" dot: only icons from the newest icon-adding release, for 30 days.
const releases = manifest.releases;
if (releases === null || typeof releases !== 'object' || Array.isArray(releases)) {
  fail('releases must be an object like { "0.3.0": "2026-10-05" }');
} else {
  for (const [v, d] of Object.entries(releases)) {
    if (!SEMVER.test(v)) fail(`releases: "${v}" is not semver (x.y.z)`);
    else if (SEMVER.test(manifest.version ?? '') && cmp(v, manifest.version) > 0) fail(`releases: ${v} is newer than the manifest version ${manifest.version}`);
    if (typeof d !== 'string' || !DATE.test(d) || Number.isNaN(Date.parse(d))) fail(`releases: ${v} needs a date like 2026-10-05, got "${d}"`);
  }
}

const seen = new Set();
const listed = new Set();
for (const icon of manifest.icons ?? []) {
  const id = icon?.name ?? '(no name)';
  if (!NAME.test(icon.name ?? '')) fail(`${id}: invalid name`);
  if (seen.has(icon.name)) fail(`${id}: duplicate name`);
  seen.add(icon.name);
  if (icon.file !== `${icon.name}.svg`) fail(`${id}: file must be "${icon.name}.svg", got "${icon.file}"`);
  else if (!fs.existsSync(path.join(root, 'icons', icon.file))) fail(`${id}: icons/${icon.file} does not exist`);
  listed.add(icon.file);
  if (typeof icon.displayName !== 'string' || !icon.displayName.trim()) fail(`${id}: displayName is missing`);
  if (!CATEGORY.test(icon.category ?? '')) fail(`${id}: invalid category "${icon.category}"`);
  for (const field of ['tags', 'aliases', 'keywords']) {
    const v = icon[field];
    if (!Array.isArray(v) || !v.every((s) => typeof s === 'string' && s.length > 0 && s.length <= 60 && !/[<>"\u0000-\u001f]/.test(s))) {
      fail(`${id}: ${field} must be a list of short plain strings`);
    }
  }
  if (!SEMVER.test(icon.added ?? '')) fail(`${id}: added must be the version it first shipped in (x.y.z), got "${icon.added}"`);
  else if (releases && typeof releases === 'object' && !(icon.added in releases)) fail(`${id}: added ${icon.added} has no entry in releases`);
  const extra = Object.keys(icon).filter((k) => !['name', 'displayName', 'category', 'tags', 'aliases', 'keywords', 'file', 'added'].includes(k));
  if (extra.length) fail(`${id}: unexpected field(s) ${extra.join(', ')}`);
}

// Not an error: SVGs that are not listed are simply not published on the website yet.
const unlisted = fs.readdirSync(path.join(root, 'icons')).filter((f) => f.endsWith('.svg') && !listed.has(f));

if (errors.length) {
  console.error(`${errors.length} problem(s) in icons.json:\n- ${errors.slice(0, 40).join('\n- ')}`);
  process.exit(1);
}
console.log(`icons.json is valid: version ${manifest.version}, ${manifest.icons.length} icons.`);
if (unlisted.length) console.log(`Note: ${unlisted.length} SVG(s) in icons/ are not listed in the manifest: ${unlisted.join(', ')}`);
