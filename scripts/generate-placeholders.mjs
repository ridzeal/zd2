import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { deflateSync } from 'zlib';

const ASSETS_DIR = join(import.meta.dirname, '..', 'public', 'assets');

// Minimal PNG generator
function crc32(buf) {
  let c = 0xffffffff;
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let v = n;
    for (let k = 0; k < 8; k++) v = v & 1 ? 0xedb88320 ^ (v >>> 1) : v >>> 1;
    table[n] = v;
  }
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeData = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeData));
  return Buffer.concat([len, typeData, crc]);
}

function createPNG(width, height, pixels) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; ihdrData[11] = 0; ihdrData[12] = 0;

  // Raw image data with filter bytes
  const rawData = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + width * 4)] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const dstIdx = y * (1 + width * 4) + 1 + x * 4;
      rawData[dstIdx] = pixels[srcIdx];
      rawData[dstIdx + 1] = pixels[srcIdx + 1];
      rawData[dstIdx + 2] = pixels[srcIdx + 2];
      rawData[dstIdx + 3] = pixels[srcIdx + 3];
    }
  }

  // Compress raw data
  const deflated = deflateSync(rawData);

  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdrData),
    pngChunk('IDAT', deflated),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function solidColor(w, h, r, g, b, a = 255) {
  const pixels = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    pixels[i * 4] = r;
    pixels[i * 4 + 1] = g;
    pixels[i * 4 + 2] = b;
    pixels[i * 4 + 3] = a;
  }
  return pixels;
}

function grassTile(w, h, baseR, baseG, baseB) {
  const pixels = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const noise = ((x * 7 + y * 13) % 5) * 3;
      pixels[i] = Math.min(255, baseR + noise);
      pixels[i + 1] = Math.min(255, baseG + noise);
      pixels[i + 2] = Math.min(255, baseB + noise);
      pixels[i + 3] = 255;
    }
  }
  return pixels;
}

function pathTile(w, h) {
  const pixels = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const noise = ((x * 11 + y * 7) % 4) * 5;
      pixels[i] = Math.min(255, 196 + noise);
      pixels[i + 1] = Math.min(255, 166 + noise);
      pixels[i + 2] = Math.min(255, 106 + noise);
      pixels[i + 3] = 255;
    }
  }
  return pixels;
}

function buildingSprite(w, h, roofR, roofG, roofB, wallR, wallG, wallB) {
  const pixels = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const cx = w / 2, cy = h / 2;

      // Roof (top triangle-ish)
      if (y < cy - 4 && Math.abs(x - cx) < (cy - y) * 0.8) {
        pixels[i] = roofR; pixels[i+1] = roofG; pixels[i+2] = roofB; pixels[i+3] = 255;
      }
      // Wall (bottom rectangle)
      else if (y >= cy - 4 && y < h - 2 && x > 4 && x < w - 4) {
        const shade = x < cx ? 0 : -20;
        pixels[i] = Math.max(0, wallR + shade);
        pixels[i+1] = Math.max(0, wallG + shade);
        pixels[i+2] = Math.max(0, wallB + shade);
        pixels[i+3] = 255;
      }
      // Door
      else if (y >= cy + 2 && y < h - 4 && Math.abs(x - cx) < 3) {
        pixels[i] = 60; pixels[i+1] = 30; pixels[i+2] = 15; pixels[i+3] = 255;
      }
      // Transparent
      else {
        pixels[i+3] = 0;
      }
    }
  }
  return pixels;
}

function charSprite(w, h, r, g, b) {
  const pixels = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const cx = w / 2;

      // Head (circle at top)
      const headDist = Math.sqrt((x - cx) ** 2 + (y - 4) ** 2);
      if (headDist < 3) {
        pixels[i] = r; pixels[i+1] = g; pixels[i+2] = b; pixels[i+3] = 255;
      }
      // Body (rectangle below)
      else if (y >= 7 && y < h - 2 && Math.abs(x - cx) < 2) {
        pixels[i] = r; pixels[i+1] = g; pixels[i+2] = b; pixels[i+3] = 255;
      }
      else {
        pixels[i+3] = 0;
      }
    }
  }
  return pixels;
}

function treeSprite(w, h) {
  const pixels = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const cx = w / 2;

      // Trunk
      if (y > h * 0.5 && Math.abs(x - cx) < 2) {
        pixels[i] = 100; pixels[i+1] = 70; pixels[i+2] = 40; pixels[i+3] = 255;
      }
      // Canopy (circle)
      else if (Math.sqrt((x - cx) ** 2 + (y - h * 0.35) ** 2) < w * 0.4) {
        pixels[i] = 45; pixels[i+1] = 120; pixels[i+2] = 30; pixels[i+3] = 255;
      }
      else {
        pixels[i+3] = 0;
      }
    }
  }
  return pixels;
}

function flowerSprite(w, h, r, g, b) {
  const pixels = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const cx = w / 2, cy = h / 2;

      if (Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) < 2) {
        pixels[i] = r; pixels[i+1] = g; pixels[i+2] = b; pixels[i+3] = 255;
      } else if (Math.abs(x - cx) < 1 && y > cy && y < h - 1) {
        pixels[i] = 40; pixels[i+1] = 100; pixels[i+2] = 20; pixels[i+3] = 255;
      } else {
        pixels[i+3] = 0;
      }
    }
  }
  return pixels;
}

// Create directories
const dirs = ['terrain', 'buildings', 'characters', 'decorations', 'ui'];
for (const d of dirs) {
  const p = join(ASSETS_DIR, d);
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

// Terrain tiles (32x32)
const terrain = [
  ['grass-1.png', () => grassTile(32, 32, 74, 140, 63)],
  ['grass-2.png', () => grassTile(32, 32, 61, 122, 50)],
  ['grass-3.png', () => grassTile(32, 32, 69, 133, 56)],
  ['path-h.png', () => pathTile(32, 32)],
  ['path-v.png', () => pathTile(32, 32)],
  ['path-cross.png', () => pathTile(32, 32)],
  ['path-corner.png', () => pathTile(32, 32)],
];
for (const [name, gen] of terrain) {
  writeFileSync(join(ASSETS_DIR, 'terrain', name), createPNG(32, 32, gen()));
  console.log(`Created terrain/${name}`);
}

// Buildings (64x64)
const buildings = [
  ['building-shop.png', 74, 158, 255, 180, 160, 130],
  ['building-inn.png', 139, 90, 43, 220, 190, 140],
  ['building-smithy.png', 90, 50, 30, 160, 120, 90],
  ['building-arena.png', 200, 170, 50, 180, 160, 130],
  ['building-entrance.png', 100, 60, 140, 140, 120, 100],
  ['building-library.png', 26, 160, 140, 180, 170, 150],
  ['building-temple.png', 230, 160, 50, 200, 180, 150],
];
for (const [name, rr, rg, rb, wr, wg, wb] of buildings) {
  writeFileSync(join(ASSETS_DIR, 'buildings', name), createPNG(64, 64, buildingSprite(64, 64, rr, rg, rb, wr, wg, wb)));
  console.log(`Created buildings/${name}`);
}

// Characters (16x16) — 4 frames x 4 directions = 64 frames wide
const chars = [
  ['char-warrior.png', 231, 76, 60],
  ['char-mage.png', 52, 152, 219],
  ['char-thief.png', 46, 204, 113],
  ['char-cleric.png', 243, 156, 18],
  ['char-paladin.png', 241, 196, 15],
  ['char-necromancer.png', 142, 68, 173],
];
for (const [name, r, g, b] of chars) {
  // 64 frames (16 per direction x 4 directions), each 16x16
  const frameW = 16, frameH = 16;
  const totalW = frameW * 16; // 16 frames wide
  const totalH = frameH * 4;  // 4 rows (directions)
  const pixels = Buffer.alloc(totalW * totalH * 4);

  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 16; col++) {
      const framePixels = charSprite(frameW, frameH, r, g, b);
      // Copy frame into the spritesheet
      for (let fy = 0; fy < frameH; fy++) {
        for (let fx = 0; fx < frameW; fx++) {
          const srcI = (fy * frameW + fx) * 4;
          const dstX = col * frameW + fx;
          const dstY = row * frameH + fy;
          const dstI = (dstY * totalW + dstX) * 4;
          pixels[dstI] = framePixels[srcI];
          pixels[dstI + 1] = framePixels[srcI + 1];
          pixels[dstI + 2] = framePixels[srcI + 2];
          pixels[dstI + 3] = framePixels[srcI + 3];
        }
      }
    }
  }
  writeFileSync(join(ASSETS_DIR, 'characters', name), createPNG(totalW, totalH, pixels));
  console.log(`Created characters/${name}`);
}

// Decorations
const decos = [
  ['deco-tree1.png', 32, 48, treeSprite],
  ['deco-tree2.png', 32, 48, treeSprite],
  ['deco-bush.png', 16, 16, (w, h) => {
    const p = Buffer.alloc(w * h * 4);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (Math.sqrt((x - 8) ** 2 + (y - 8) ** 2) < 6) {
        p[i] = 40; p[i+1] = 110; p[i+2] = 25; p[i+3] = 255;
      } else { p[i+3] = 0; }
    }
    return p;
  }],
  ['deco-flower-red.png', 8, 8, (w, h) => flowerSprite(w, h, 220, 50, 50)],
  ['deco-flower-yellow.png', 8, 8, (w, h) => flowerSprite(w, h, 240, 200, 50)],
  ['deco-rock.png', 16, 16, (w, h) => {
    const p = Buffer.alloc(w * h * 4);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (Math.sqrt((x - 8) ** 2 + ((y - 10) * 0.6) ** 2) < 5) {
        p[i] = 140; p[i+1] = 140; p[i+2] = 140; p[i+3] = 255;
      } else { p[i+3] = 0; }
    }
    return p;
  }],
];
for (const [name, w, h, gen] of decos) {
  writeFileSync(join(ASSETS_DIR, 'decorations', name), createPNG(w, h, gen(w, h)));
  console.log(`Created decorations/${name}`);
}

console.log('\nDone! All placeholder assets generated.');
