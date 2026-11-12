/**
 * Shrinks every JPG under client/public/images to web size.
 * Run from the client folder:  node scripts/optimize-images.mjs
 * Hero photos → max 1600px wide, all others → max 1000px wide, JPEG quality 80.
 * A file is only overwritten when the new version is smaller. Safe to run again.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve('public/images');
const HERO_WIDTH = 1600;
const DEFAULT_WIDTH = 1000;

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (/\.jpe?g$/i.test(entry.name)) yield full;
  }
}

const kb = (bytes) => `${Math.round(bytes / 1024)} KB`;
let before = 0;
let after = 0;

for await (const file of walk(ROOT)) {
  const input = await readFile(file);
  const isHero = file.includes(`${path.sep}hero${path.sep}`);
  const output = await sharp(input)
    .rotate() // keep the photo the right way up
    .resize({ width: isHero ? HERO_WIDTH : DEFAULT_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();

  before += input.length;
  const name = path.relative(ROOT, file);
  if (output.length < input.length) {
    await writeFile(file, output);
    after += output.length;
    console.log(`✔ ${name}  ${kb(input.length)} → ${kb(output.length)}`);
  } else {
    after += input.length;
    console.log(`= ${name}  already small`);
  }
}

console.log(`\nTotal: ${(before / 1048576).toFixed(1)} MB → ${(after / 1048576).toFixed(1)} MB`);
