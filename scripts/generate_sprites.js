// ===== High Quality Dark Fantasy Roguelike Sprite Generator (Upgraded HD Edition) =====
// Generates 100% transparent, standalone PNG sprites for Arden, 8 Monsters, and 5 Bosses
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// --- PNG Encoder ---
function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c;
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const body = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crcBuf]);
}

function encodePNG(width, height, rgbaBuffer) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = makeChunk('IHDR', ihdrData);

  const scanlines = Buffer.alloc(height * (1 + width * 4));
  let p = 0;
  for (let y = 0; y < height; y++) {
    scanlines[p++] = 0; // Filter: None
    const rowStart = y * width * 4;
    rgbaBuffer.copy(scanlines, p, rowStart, rowStart + width * 4);
    p += width * 4;
  }
  const compressed = zlib.deflateSync(scanlines, { level: 9 });
  const idat = makeChunk('IDAT', compressed);
  const iend = makeChunk('IEND', Buffer.alloc(0));
  return Buffer.concat([sig, ihdr, idat, iend]);
}

// --- CanvasBuffer Drawing Helper ---
class CanvasBuffer {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.buf = Buffer.alloc(w * h * 4, 0); // 100% transparent initially
  }

  set(x, y, r, g, b, a = 255) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || x >= this.w || y < 0 || y >= this.h || a <= 0) return;
    const idx = (y * this.w + x) * 4;
    if (a >= 255) {
      this.buf[idx] = r;
      this.buf[idx + 1] = g;
      this.buf[idx + 2] = b;
      this.buf[idx + 3] = 255;
    } else {
      const da = this.buf[idx + 3] / 255;
      const sa = a / 255;
      const outA = sa + da * (1 - sa);
      if (outA > 0) {
        this.buf[idx] = Math.round((r * sa + this.buf[idx] * da * (1 - sa)) / outA);
        this.buf[idx + 1] = Math.round((g * sa + this.buf[idx + 1] * da * (1 - sa)) / outA);
        this.buf[idx + 2] = Math.round((b * sa + this.buf[idx + 2] * da * (1 - sa)) / outA);
        this.buf[idx + 3] = Math.round(outA * 255);
      }
    }
  }

  hex(color) {
    if (typeof color !== 'string') return [255, 255, 255, 255];
    color = color.replace('#', '');
    if (color.length === 3) {
      const r = parseInt(color[0] + color[0], 16);
      const g = parseInt(color[1] + color[1], 16);
      const b = parseInt(color[2] + color[2], 16);
      return [r, g, b, 255];
    } else if (color.length === 6) {
      const r = parseInt(color.substring(0, 2), 16);
      const g = parseInt(color.substring(2, 4), 16);
      const b = parseInt(color.substring(4, 6), 16);
      return [r, g, b, 255];
    } else if (color.length === 8) {
      const r = parseInt(color.substring(0, 2), 16);
      const g = parseInt(color.substring(2, 4), 16);
      const b = parseInt(color.substring(4, 6), 16);
      const a = parseInt(color.substring(6, 8), 16);
      return [r, g, b, a];
    }
    return [255, 255, 255, 255];
  }

  fillRect(x, y, w, h, col) {
    const [r, g, b, a] = this.hex(col);
    x = Math.round(x);
    y = Math.round(y);
    w = Math.round(w);
    h = Math.round(h);
    for (let py = y; py < y + h; py++) {
      for (let px = x; px < x + w; px++) {
        this.set(px, py, r, g, b, a);
      }
    }
  }

  fillCircle(cx, cy, radius, col) {
    const [r, g, b, a] = this.hex(col);
    cx = Math.round(cx);
    cy = Math.round(cy);
    const rSq = radius * radius;
    const rCeil = Math.ceil(radius);
    for (let dy = -rCeil; dy <= rCeil; dy++) {
      for (let dx = -rCeil; dx <= rCeil; dx++) {
        if (dx * dx + dy * dy <= rSq) {
          this.set(cx + dx, cy + dy, r, g, b, a);
        }
      }
    }
  }

  fillEllipse(cx, cy, rx, ry, col) {
    const [r, g, b, a] = this.hex(col);
    cx = Math.round(cx);
    cy = Math.round(cy);
    for (let dy = -Math.ceil(ry); dy <= Math.ceil(ry); dy++) {
      for (let dx = -Math.ceil(rx); dx <= Math.ceil(rx); dx++) {
        if ((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1.0) {
          this.set(cx + dx, cy + dy, r, g, b, a);
        }
      }
    }
  }

  strokeLine(x0, y0, x1, y1, col, thick = 1) {
    const [r, g, b, a] = this.hex(col);
    x0 = Math.round(x0); y0 = Math.round(y0);
    x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
    const dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
    let err = dx + dy, e2;
    while (true) {
      if (thick <= 1) {
        this.set(x0, y0, r, g, b, a);
      } else {
        this.fillCircle(x0, y0, thick / 2, col);
      }
      if (x0 === x1 && y0 === y1) break;
      e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }

  toPNG() {
    return encodePNG(this.w, this.h, this.buf);
  }

  save(filePath) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, this.toPNG());
  }
}

// =========================================================================
// 1. ARDEN (플레이어 아르덴 HD 72x72)
// 초상화와 100% 동일한 은백색 샤프 헤어, 붉은 눈, 흑철/진홍 고딕 판타지 갑주, 붉은 망토
// =========================================================================
function drawArden(c, opts = {}) {
  const { anim = 'idle', frame = 0, hurt = false, death = 0 } = opts;

  let cx = 36;
  let cy = 38; // Anchor center
  let bounceY = 0;
  let legSpread = 0;
  let armAngle = 0;
  let swordX = 0, swordY = 0, swordRot = 0;
  let capeFlap = 0;
  let slashArc = false;
  let auraPower = false;

  if (anim === 'idle') {
    bounceY = (frame === 1 || frame === 2) ? 1 : 0;
    capeFlap = Math.sin(frame * 1.5) * 3;
  } else if (anim === 'walk') {
    bounceY = (frame % 2 === 1) ? 2 : 0;
    legSpread = (frame === 1) ? 5 : (frame === 3 ? -5 : 0);
    capeFlap = (frame % 2 === 1) ? 6 : 2;
    armAngle = (frame === 1) ? 4 : (frame === 3 ? -4 : 0);
  } else if (anim === 'dodge') {
    bounceY = 4;
    cx += (frame === 0 ? 4 : 8);
    capeFlap = 8;
  } else if (anim === 'attack') {
    if (frame === 0) {
      bounceY = 1;
      swordRot = -0.9;
      swordX = -6; swordY = -8;
      armAngle = -5;
    } else if (frame === 1) {
      cx += 8;
      swordRot = 1.6;
      swordX = 18; swordY = 2;
      armAngle = 8;
      slashArc = true;
    } else if (frame === 2) {
      cx += 6;
      swordRot = 1.95;
      swordX = 20; swordY = 8;
      slashArc = true;
    } else {
      cx += 2;
      swordRot = 0.6;
      swordX = 10; swordY = 4;
    }
  } else if (anim === 'skill') {
    auraPower = true;
    if (frame === 0) {
      bounceY = -3;
      swordRot = -1.6;
      swordX = 0; swordY = -16;
    } else if (frame === 1) {
      bounceY = -4;
      swordRot = -1.6;
      swordX = 0; swordY = -18;
    } else if (frame === 2) {
      bounceY = 5;
      cx += 8;
      swordRot = 1.85;
      swordX = 18; swordY = 14;
      slashArc = true;
    } else {
      bounceY = 2;
      cx += 4;
      swordRot = 0.9;
      swordX = 12; swordY = 8;
    }
  } else if (anim === 'hit') {
    cx -= (frame === 0 ? 6 : 3);
    bounceY = -2;
  } else if (anim === 'death') {
    bounceY = death * 5;
    if (death >= 2) cx += (death - 1) * 4;
  }

  cy += bounceY;

  // --- Skill Aura (Crimson Magic Burst) ---
  if (auraPower) {
    c.fillCircle(cx, cy, 26, '#ef444433');
    c.fillCircle(cx, cy - 8, 20, '#dc262655');
    c.fillRect(cx - 16, cy - 14 + (frame * 4) % 10, 3, 8, '#f87171');
    c.fillRect(cx + 14, cy - 18 + (frame * 5) % 12, 3, 9, '#fca5a5');
    c.fillRect(cx - 4, cy - 28, 4, 6, '#ffffff');
  }

  // --- Flowing Crimson Cloak / Cape ---
  if (anim !== 'death' || death < 3) {
    const capeX = cx - 10 - capeFlap;
    const capeY = cy - 6;
    c.fillRect(capeX, capeY, 10 + capeFlap, 20, '#7f1d1d');
    c.fillRect(capeX + 1, capeY + 1, 9 + capeFlap, 18, '#991b1b');
    c.fillRect(capeX + 2, capeY + 2, 7 + capeFlap, 16, '#dc2626');
    // Golden border trim on cape edge
    c.fillRect(capeX, capeY + 18, 10 + capeFlap, 2, '#f59e0b');
    c.strokeLine(capeX + 4, capeY + 4, capeX + 3, capeY + 18, '#450a0a', 1);
  }

  // --- Legs & Gothic Greaves ---
  const legY = cy + 14;
  if (anim === 'death' && death >= 2) {
    c.fillRect(cx - 12, cy + 14, 20, 8, '#0f172a');
    c.fillRect(cx - 10, cy + 16, 18, 6, '#1e293b');
    c.fillRect(cx - 6, cy + 15, 8, 3, '#475569');
  } else {
    // Left Leg
    c.fillRect(cx - 8 - legSpread, legY, 6, 14, '#0f172a');
    c.fillRect(cx - 7 - legSpread, legY + 2, 4, 10, '#1e293b');
    c.fillRect(cx - 7 - legSpread, legY + 3, 2, 6, '#475569'); // Steel shine
    c.fillRect(cx - 9 - legSpread, legY + 12, 8, 4, '#0f172a'); // Sabaton

    // Right Leg
    c.fillRect(cx + 2 + legSpread, legY, 6, 14, '#0f172a');
    c.fillRect(cx + 3 + legSpread, legY + 2, 4, 10, '#1e293b');
    c.fillRect(cx + 3 + legSpread, legY + 3, 2, 6, '#475569'); // Steel shine
    c.fillRect(cx + 1 + legSpread, legY + 12, 8, 4, '#0f172a'); // Sabaton
  }

  // --- Torso (Dark Steel & Crimson Gothic Breastplate) ---
  const torsoY = cy - 6;
  c.fillRect(cx - 9, torsoY, 18, 20, '#0f172a');
  c.fillRect(cx - 8, torsoY + 1, 16, 18, '#1e293b');
  // Crimson enameled center plate
  c.fillRect(cx - 5, torsoY + 3, 10, 10, '#991b1b');
  c.fillRect(cx - 4, torsoY + 4, 8, 8, '#dc2626');
  c.fillRect(cx - 1, torsoY + 5, 2, 6, '#ef4444');
  // Gold filigree crest & belt buckle
  c.fillRect(cx - 6, torsoY + 15, 12, 4, '#0f172a'); // Belt
  c.fillRect(cx - 3, torsoY + 15, 6, 4, '#f59e0b');
  c.fillRect(cx - 1, torsoY + 16, 2, 2, '#fef08a');

  // --- Pauldrons (Spiked Heavy Dark Shoulder Guards) ---
  c.fillRect(cx - 14, torsoY - 3, 7, 8, '#0f172a');
  c.fillRect(cx - 13, torsoY - 2, 5, 6, '#334155');
  c.fillRect(cx - 12, torsoY - 2, 3, 3, '#94a3b8');
  c.fillRect(cx + 7, torsoY - 3, 7, 8, '#0f172a');
  c.fillRect(cx + 8, torsoY - 2, 5, 6, '#334155');
  c.fillRect(cx + 9, torsoY - 2, 3, 3, '#94a3b8');

  // --- Neck & Dark Collar ---
  const headY = cy - 20;
  c.fillRect(cx - 6, headY + 11, 12, 5, '#0f172a');
  c.fillRect(cx - 5, headY + 12, 10, 3, '#dc2626'); // Crimson collar lining
  c.fillRect(cx - 5, headY + 6, 10, 8, '#fed7aa'); // Fair skin
  c.fillRect(cx - 5, headY + 10, 10, 3, '#fcd34d'); // Neck shadow

  // --- Eyes (Sharp Anime Crimson Red - Matching Portrait) ---
  if (anim === 'death' && death >= 2) {
    c.fillRect(cx - 4, headY + 7, 3, 1, '#450a0a');
    c.fillRect(cx + 1, headY + 7, 3, 1, '#450a0a');
  } else {
    // Left eye
    c.fillRect(cx - 4, headY + 6, 4, 3, '#0f172a');
    c.fillRect(cx - 3, headY + 6, 3, 2, '#ef4444');
    c.fillRect(cx - 2, headY + 6, 1, 1, '#ffffff'); // Glint
    // Right eye
    c.fillRect(cx + 1, headY + 6, 4, 3, '#0f172a');
    c.fillRect(cx + 1, headY + 6, 3, 2, '#ef4444');
    c.fillRect(cx + 2, headY + 6, 1, 1, '#ffffff');
  }

  // --- Silver-White Anime Hair (Flowing & Layered) ---
  c.fillRect(cx - 8, headY - 3, 16, 8, '#cbd5e1');
  c.fillRect(cx - 7, headY - 4, 14, 7, '#e2e8f0');
  c.fillRect(cx - 6, headY - 5, 12, 5, '#ffffff');
  // Dynamic locks framing face
  c.fillRect(cx - 9, headY + 1, 3, 8, '#e2e8f0');
  c.fillRect(cx - 10, headY + 3, 3, 6, '#cbd5e1');
  c.fillRect(cx + 6, headY + 1, 3, 8, '#e2e8f0');
  c.fillRect(cx + 7, headY + 3, 3, 6, '#cbd5e1');
  // Forehead bangs
  c.fillRect(cx - 3, headY + 2, 3, 4, '#ffffff');
  c.fillRect(cx + 1, headY + 2, 3, 3, '#ffffff');
  c.fillRect(cx - 6, headY + 1, 3, 5, '#e2e8f0');
  c.fillRect(cx + 4, headY + 1, 3, 5, '#e2e8f0');

  // --- Gauntlet & Runed Steel Broadsword ---
  const armX = cx + 9 + armAngle;
  const armY = cy + 2;

  // Steel Gauntlet
  c.fillRect(armX - 3, armY - 3, 7, 8, '#1e293b');
  c.fillRect(armX - 2, armY - 2, 5, 6, '#334155');
  c.fillRect(armX - 1, armY - 1, 3, 3, '#f59e0b');

  if (anim !== 'death' || death < 2) {
    const sBaseX = armX + swordX;
    const sBaseY = armY + swordY;
    const sLen = 26;
    const endX = sBaseX + Math.cos(swordRot - 1.57) * sLen;
    const endY = sBaseY + Math.sin(swordRot - 1.57) * sLen;

    // Crossguard (Gold + Ruby)
    const perpX = Math.cos(swordRot) * 6;
    const perpY = Math.sin(swordRot) * 6;
    c.strokeLine(sBaseX - perpX, sBaseY - perpY, sBaseX + perpX, sBaseY + perpY, '#f59e0b', 3);
    c.fillCircle(sBaseX, sBaseY, 2, '#dc2626');

    // Blade
    c.strokeLine(sBaseX, sBaseY, endX, endY, '#64748b', 4);
    c.strokeLine(sBaseX, sBaseY, endX, endY, '#e2e8f0', 3);
    c.strokeLine(sBaseX, sBaseY, endX, endY, '#ffffff', 1);

    // Pommel
    const pomX = sBaseX - Math.cos(swordRot - 1.57) * 5;
    const pomY = sBaseY - Math.sin(swordRot - 1.57) * 5;
    c.fillCircle(pomX, pomY, 2.5, '#f59e0b');

    // Attack Arc Slash Trail
    if (slashArc) {
      const arcCol = auraPower ? '#ef4444' : '#fef08a';
      const arcColGlow = auraPower ? '#dc2626' : '#f59e0b';
      for (let a = 0; a < 10; a++) {
        const rad = 28 + a * 2;
        const angle = swordRot - 1.3 + a * 0.26;
        const ax = sBaseX + Math.cos(angle) * rad;
        const ay = sBaseY + Math.sin(angle) * rad;
        c.fillCircle(ax, ay, 2.5, arcColGlow);
        c.fillCircle(ax, ay, 1.2, arcCol);
      }
    }
  }

  // --- Hit Flash ---
  if (hurt) {
    for (let py = 0; py < c.h; py++) {
      for (let px = 0; px < c.w; px++) {
        const idx = (py * c.w + px) * 4;
        if (c.buf[idx + 3] > 0) {
          c.buf[idx] = Math.min(255, c.buf[idx] + 140);
          c.buf[idx + 1] = Math.min(255, c.buf[idx + 1] + 50);
          c.buf[idx + 2] = Math.min(255, c.buf[idx + 2] + 50);
        }
      }
    }
  }
}

// =========================================================================
// 2. MONSTER GENERATORS (8 TYPES) - UPGRADED DETAIL & ANATOMY
// =========================================================================

// 1) Goblin (52x52): Agile, pointed bat ears with inner pink, hooked nose, jagged dagger
function drawGoblin(c, opts = {}) {
  const { anim = 'idle', frame = 0, hurt = false } = opts;
  const cx = 26, cy = 28;
  const bounce = (anim === 'walk') ? ((frame % 2) * 2) : (frame === 1 ? 1 : 0);
  const by = cy + bounce;

  // Legs & Loincloth
  c.fillRect(cx - 6, by + 8, 4, 10, '#14532d');
  c.fillRect(cx + 2, by + 8, 4, 10, '#14532d');
  c.fillRect(cx - 7, by + 2, 14, 8, '#78350f');

  // Body & Toxic Green Skin
  c.fillRect(cx - 7, by - 6, 14, 12, '#15803d');
  c.fillRect(cx - 6, by - 5, 12, 10, '#22c55e');

  // Large Pointed Bat Ears
  c.strokeLine(cx - 7, by - 14, cx - 18, by - 18, '#15803d', 3);
  c.strokeLine(cx - 7, by - 14, cx - 16, by - 17, '#f472b6', 1); // Inner pink
  c.strokeLine(cx + 7, by - 14, cx + 18, by - 18, '#15803d', 3);
  c.strokeLine(cx + 7, by - 14, cx + 16, by - 17, '#f472b6', 1);

  // Head
  c.fillRect(cx - 8, by - 18, 16, 14, '#15803d');
  c.fillRect(cx - 7, by - 17, 14, 12, '#22c55e');

  // Yellow slit eyes
  c.fillRect(cx - 5, by - 13, 4, 3, '#facc15');
  c.fillRect(cx - 4, by - 13, 2, 3, '#000000');
  c.fillRect(cx + 1, by - 13, 4, 3, '#facc15');
  c.fillRect(cx + 2, by - 13, 2, 3, '#000000');

  // Jagged Serrated Dagger
  const daggerX = cx + (anim === 'attack' ? 12 : 6);
  const daggerY = by - (anim === 'attack' ? 3 : 8);
  c.strokeLine(cx + 4, by + 2, daggerX, daggerY, '#78350f', 3);
  c.strokeLine(daggerX - 2, daggerY + 2, daggerX + 10, daggerY - 8, '#94a3b8', 2);
  c.strokeLine(daggerX - 2, daggerY + 2, daggerX + 10, daggerY - 8, '#ffffff', 1);

  if (hurt) {
    for (let i = 0; i < c.buf.length; i += 4) {
      if (c.buf[i + 3] > 0) { c.buf[i] = 255; c.buf[i + 1] = 255; c.buf[i + 2] = 255; }
    }
  }
}

// 2) Goblin Warrior (64x64): Hunched heavy build, horned helmet, wooden heater shield, iron sword
function drawGoblinWarrior(c, opts = {}) {
  const { anim = 'idle', frame = 0, hurt = false } = opts;
  const cx = 32, cy = 34;
  const bounce = (anim === 'walk') ? ((frame % 2) * 2) : 0;
  const by = cy + bounce;

  // Armored Legs
  c.fillRect(cx - 8, by + 10, 6, 10, '#14532d');
  c.fillRect(cx + 2, by + 10, 6, 10, '#14532d');
  c.fillRect(cx - 9, by + 18, 7, 4, '#334155');
  c.fillRect(cx + 2, by + 18, 7, 4, '#334155');

  // Hunched Broad Body (Iron Chainmail)
  c.fillRect(cx - 11, by - 2, 22, 14, '#1e293b');
  c.fillRect(cx - 10, by - 1, 20, 12, '#475569');
  c.fillRect(cx - 8, by + 1, 16, 8, '#64748b');

  // Horned Iron Skullcap Helmet
  c.fillRect(cx - 11, by - 20, 22, 16, '#1e293b');
  c.fillRect(cx - 10, by - 19, 20, 14, '#475569');
  c.strokeLine(cx - 10, by - 18, cx - 18, by - 26, '#d97706', 4); // Horn Left
  c.strokeLine(cx + 10, by - 18, cx + 18, by - 26, '#d97706', 4); // Horn Right

  // Visor eye slits
  c.fillRect(cx - 6, by - 13, 5, 3, '#ef4444');
  c.fillRect(cx + 2, by - 13, 5, 3, '#ef4444');

  // Heavy Wooden Heater Shield with Iron Boss (Left Hand)
  const shX = cx - 14;
  const shY = by - 2;
  c.fillRect(shX - 6, shY - 10, 12, 20, '#78350f');
  c.strokeLine(shX - 6, shY - 10, shX + 6, shY - 10, '#475569', 2);
  c.strokeLine(shX - 6, shY + 10, shX + 6, shY + 10, '#475569', 2);
  c.fillCircle(shX, shY, 4, '#94a3b8'); // Central metal boss

  // Iron Broadsword (Right Hand)
  const swX = cx + (anim === 'attack' ? 16 : 10);
  const swY = by - (anim === 'attack' ? 4 : 12);
  c.strokeLine(cx + 8, by + 2, swX, swY, '#78350f', 3);
  c.strokeLine(swX - 4, swY + 4, swX + 12, swY - 14, '#94a3b8', 3);
  c.strokeLine(swX - 4, swY + 4, swX + 12, swY - 14, '#ffffff', 1);

  if (hurt) {
    for (let i = 0; i < c.buf.length; i += 4) {
      if (c.buf[i + 3] > 0) { c.buf[i] = 255; c.buf[i + 1] = 255; c.buf[i + 2] = 255; }
    }
  }
}

// 3) Skeleton Warrior (64x64): Ivory bone anatomy, cyan eye fire, tattered tabard, claymore
function drawSkeletonWarrior(c, opts = {}) {
  const { anim = 'idle', frame = 0, hurt = false } = opts;
  const cx = 32, cy = 34;
  const bounce = (anim === 'walk') ? ((frame % 2) * 2) : 0;
  const by = cy + bounce;

  // Ivory Bone Legs
  c.fillRect(cx - 6, by + 10, 3, 14, '#f1f5f9');
  c.fillRect(cx + 3, by + 10, 3, 14, '#f1f5f9');
  c.fillRect(cx - 8, by + 22, 6, 2, '#cbd5e1');
  c.fillRect(cx + 2, by + 22, 6, 2, '#cbd5e1');

  // Pelvis & Spine
  c.fillRect(cx - 5, by + 6, 10, 4, '#cbd5e1');
  c.fillRect(cx - 1, by - 4, 3, 10, '#f1f5f9');

  // Ribcage
  c.fillRect(cx - 8, by - 6, 16, 8, '#e2e8f0');
  c.fillRect(cx - 4, by - 5, 8, 6, '#0f172a'); // Hollow inside

  // Tattered dark blue heraldic tabard
  c.fillRect(cx - 6, by, 12, 10, '#1e293b');
  c.fillRect(cx - 4, by + 1, 8, 8, '#334155');

  // Skull
  c.fillRect(cx - 7, by - 22, 14, 14, '#e2e8f0');
  c.fillRect(cx - 6, by - 21, 12, 12, '#f8fafc');
  c.fillRect(cx - 5, by - 11, 10, 4, '#cbd5e1'); // Jaw & teeth

  // Cyan Soul Flame Eye Sockets
  c.fillRect(cx - 5, by - 17, 4, 4, '#0f172a');
  c.fillRect(cx - 4, by - 16, 3, 3, '#06b6d4');
  c.fillRect(cx - 4, by - 16, 1, 1, '#ffffff');

  c.fillRect(cx + 1, by - 17, 4, 4, '#0f172a');
  c.fillRect(cx + 1, by - 16, 3, 3, '#06b6d4');
  c.fillRect(cx + 2, by - 16, 1, 1, '#ffffff');

  // Notched Claymore
  const clX = cx + (anim === 'attack' ? 16 : 8);
  const clY = by - (anim === 'attack' ? 6 : 14);
  c.strokeLine(cx + 6, by + 2, clX, clY, '#64748b', 4);
  c.strokeLine(clX - 6, clY + 6, clX + 16, clY - 18, '#94a3b8', 3);
  c.strokeLine(clX - 6, clY + 6, clX + 16, clY - 18, '#ffffff', 1);

  if (hurt) {
    for (let i = 0; i < c.buf.length; i += 4) {
      if (c.buf[i + 3] > 0) { c.buf[i] = 255; c.buf[i + 1] = 255; c.buf[i + 2] = 255; }
    }
  }
}

// 4) Skeleton Archer (64x64): Ranger cowl, green soul eyes, recurve warbow, arrow
function drawSkeletonArcher(c, opts = {}) {
  const { anim = 'idle', frame = 0, hurt = false } = opts;
  const cx = 32, cy = 34;
  const bounce = (anim === 'walk') ? ((frame % 2) * 2) : 0;
  const by = cy + bounce;

  // Legs
  c.fillRect(cx - 6, by + 10, 3, 14, '#f1f5f9');
  c.fillRect(cx + 3, by + 10, 3, 14, '#f1f5f9');

  // Torso / Quiver Strap
  c.fillRect(cx - 6, by - 6, 12, 12, '#1e293b');
  c.fillRect(cx - 5, by - 5, 10, 10, '#334155');

  // Dark Ranger Hood / Cowl
  c.fillRect(cx - 10, by - 22, 20, 18, '#1e293b');
  c.fillRect(cx - 9, by - 21, 18, 16, '#334155');
  c.fillRect(cx - 6, by - 16, 12, 10, '#0f172a'); // Shadow in hood

  // Glowing Green Soul Eyes
  c.fillRect(cx - 4, by - 13, 3, 3, '#10b981');
  c.fillRect(cx + 2, by - 13, 3, 3, '#10b981');

  // Recurve Warbow
  const bowX = cx + (anim === 'attack' ? 14 : 8);
  const bowY = by - 2;
  c.strokeLine(bowX, bowY - 18, bowX + 5, bowY, '#78350f', 3);
  c.strokeLine(bowX + 5, bowY, bowX, bowY + 18, '#78350f', 3);
  c.strokeLine(bowX, bowY - 18, bowX - (anim === 'attack' ? 8 : 2), bowY, '#cbd5e1', 1);
  c.strokeLine(bowX - (anim === 'attack' ? 8 : 2), bowY, bowX, bowY + 18, '#cbd5e1', 1);

  // Arrow
  c.strokeLine(bowX - 10, bowY, bowX + 16, bowY, '#e2e8f0', 2);
  c.fillCircle(bowX + 16, bowY, 2, '#10b981');

  if (hurt) {
    for (let i = 0; i < c.buf.length; i += 4) {
      if (c.buf[i + 3] > 0) { c.buf[i] = 255; c.buf[i + 1] = 255; c.buf[i + 2] = 255; }
    }
  }
}

// 5) Slime (52x48): Translucent jelly, core nucleus, glossy specular shine
function drawSlime(c, opts = {}) {
  const { anim = 'idle', frame = 0, hurt = false } = opts;
  const cx = 26, cy = 30;
  let sx = 1.0, sy = 1.0;
  if (anim === 'walk') {
    sx = (frame % 2 === 0) ? 1.25 : 0.85;
    sy = (frame % 2 === 0) ? 0.82 : 1.2;
  } else if (anim === 'attack') {
    sx = 0.75; sy = 1.4;
  }

  const rx = 16 * sx;
  const ry = 13 * sy;

  // Jelly Body
  c.fillEllipse(cx, cy, rx, ry, '#15803d');
  c.fillEllipse(cx, cy - 2, rx - 3, ry - 3, '#22c55e');
  c.fillEllipse(cx, cy - 3, rx - 5, ry - 5, '#4ade80');

  // Nucleus Core & Bubbles
  c.fillCircle(cx, cy + 1, 6, '#166534');
  c.fillCircle(cx, cy, 4, '#86efac');
  c.fillCircle(cx - 6, cy - 3, 2, '#86efac');
  c.fillCircle(cx + 5, cy + 2, 1.5, '#86efac');

  // Specular Highlight
  c.fillEllipse(cx - rx * 0.4, cy - ry * 0.5, rx * 0.35, ry * 0.25, '#ffffff');

  // Cute / Dangerous Eyes
  c.fillCircle(cx - 6, cy - 2, 3, '#ffffff');
  c.fillCircle(cx - 5.5, cy - 2, 1.5, '#0f172a');
  c.fillCircle(cx + 5, cy - 2, 3, '#ffffff');
  c.fillCircle(cx + 5.5, cy - 2, 1.5, '#0f172a');

  if (hurt) {
    for (let i = 0; i < c.buf.length; i += 4) {
      if (c.buf[i + 3] > 0) { c.buf[i] = 255; c.buf[i + 1] = 255; c.buf[i + 2] = 255; }
    }
  }
}

// 6) Bat (52x48): Scalloped bat wings with finger joints, purple body, red eyes
function drawBat(c, opts = {}) {
  const { anim = 'idle', frame = 0, hurt = false } = opts;
  const cx = 26, cy = 26;
  const flap = (anim === 'walk' || anim === 'attack') ? (frame % 3) : (frame % 2);

  let wingY = cy - 4;
  if (flap === 0) wingY -= 7;
  else if (flap === 2) wingY += 6;

  // Wings
  c.fillRect(cx - 20, wingY, 16, 9, '#312e81');
  c.fillRect(cx - 18, wingY + 1, 12, 7, '#4c1d95');
  c.strokeLine(cx - 4, cy, cx - 20, wingY, '#6b21a8', 2);

  c.fillRect(cx + 4, wingY, 16, 9, '#312e81');
  c.fillRect(cx + 6, wingY + 1, 12, 7, '#4c1d95');
  c.strokeLine(cx + 4, cy, cx + 20, wingY, '#6b21a8', 2);

  // Body
  c.fillCircle(cx, cy, 7, '#1e1b4b');
  c.fillCircle(cx, cy, 5, '#312e81');

  // Ears
  c.fillRect(cx - 5, cy - 10, 3, 5, '#4c1d95');
  c.fillRect(cx + 2, cy - 10, 3, 5, '#4c1d95');

  // Red Eyes & Fangs
  c.fillRect(cx - 4, cy - 2, 2, 2, '#ef4444');
  c.fillRect(cx + 2, cy - 2, 2, 2, '#ef4444');
  c.fillRect(cx - 2, cy + 3, 1, 2, '#ffffff');
  c.fillRect(cx + 1, cy + 3, 1, 2, '#ffffff');

  if (hurt) {
    for (let i = 0; i < c.buf.length; i += 4) {
      if (c.buf[i + 3] > 0) { c.buf[i] = 255; c.buf[i + 1] = 255; c.buf[i + 2] = 255; }
    }
  }
}

// 7) Dark Mage (64x68): Flowing occult robes with gold runes, void hood, staff with void orb
function drawDarkMage(c, opts = {}) {
  const { anim = 'idle', frame = 0, hurt = false } = opts;
  const cx = 32, cy = 34;
  const hoverY = Math.sin((frame + (anim === 'walk' ? 2 : 0)) * 1.5) * 3;
  const by = cy + hoverY;

  // Floating dark energy aura at base
  c.fillEllipse(cx, by + 20, 14, 5, '#3b076455');

  // Flowing Violet Robes
  c.fillRect(cx - 12, by, 24, 20, '#0f0b24');
  c.fillRect(cx - 10, by + 1, 20, 18, '#1e1b4b');
  c.fillRect(cx - 8, by + 2, 16, 16, '#312e81');
  // Gold arcane runic hem
  c.fillRect(cx - 10, by + 18, 20, 3, '#f59e0b');

  // Hooded Cowl
  c.fillRect(cx - 11, by - 20, 22, 20, '#0f0b24');
  c.fillRect(cx - 10, by - 19, 20, 18, '#1e1b4b');
  c.fillRect(cx - 7, by - 16, 14, 12, '#000000'); // Void face

  // Piercing Magenta Eyes
  c.fillRect(cx - 5, by - 11, 4, 3, '#c084fc');
  c.fillRect(cx - 4, by - 11, 2, 2, '#ffffff');
  c.fillRect(cx + 1, by - 11, 4, 3, '#c084fc');
  c.fillRect(cx + 2, by - 11, 2, 2, '#ffffff');

  // Elder-wood Staff & Levitating Void Orb
  const staffX = cx + (anim === 'attack' ? 16 : 10);
  const staffY = by - 10;
  c.strokeLine(staffX, by + 18, staffX, staffY, '#451a03', 3);
  c.fillCircle(staffX, staffY - 2, 5, '#e2e8f0'); // Dragon skull top

  const orbY = staffY - 10 + (Math.sin(frame * 2) * 3);
  c.fillCircle(staffX, orbY, 6, '#7c3aed');
  c.fillCircle(staffX, orbY, 3, '#c084fc');
  c.fillCircle(staffX, orbY, 1.5, '#ffffff');

  if (hurt) {
    for (let i = 0; i < c.buf.length; i += 4) {
      if (c.buf[i + 3] > 0) { c.buf[i] = 255; c.buf[i + 1] = 255; c.buf[i + 2] = 255; }
    }
  }
}

// 8) Orc (72x72): Massive mountain brute, tusks, spiked pauldron, double-bitted battleaxe
function drawOrc(c, opts = {}) {
  const { anim = 'idle', frame = 0, hurt = false } = opts;
  const cx = 36, cy = 38;
  const bounce = (anim === 'walk') ? ((frame % 2) * 3) : (frame === 1 ? 1 : 0);
  const by = cy + bounce;

  // Heavy Boots & Legs
  c.fillRect(cx - 12, by + 14, 10, 14, '#14532d');
  c.fillRect(cx + 2, by + 14, 10, 14, '#14532d');
  c.fillRect(cx - 13, by + 24, 11, 4, '#451a03');
  c.fillRect(cx + 2, by + 24, 11, 4, '#451a03');

  // Massive Muscular Torso
  c.fillRect(cx - 16, by - 8, 32, 22, '#14532d');
  c.fillRect(cx - 14, by - 7, 28, 20, '#15803d');
  c.fillRect(cx - 12, by - 4, 11, 8, '#16a34a');
  c.fillRect(cx + 1, by - 4, 11, 8, '#16a34a');

  // Leather Harness
  c.strokeLine(cx - 14, by - 8, cx + 12, by + 12, '#78350f', 4);

  // Spiked Iron Pauldron
  c.fillRect(cx - 20, by - 12, 10, 12, '#1e293b');
  c.fillRect(cx - 19, by - 11, 8, 10, '#475569');
  c.strokeLine(cx - 18, by - 11, cx - 24, by - 17, '#cbd5e1', 3);

  // Head & Tusks
  c.fillRect(cx - 12, by - 26, 24, 18, '#14532d');
  c.fillRect(cx - 11, by - 25, 22, 16, '#15803d');
  // Red eyes under heavy brow
  c.fillRect(cx - 7, by - 19, 5, 3, '#ef4444');
  c.fillRect(cx + 2, by - 19, 5, 3, '#ef4444');
  // Massive White Tusks
  c.fillRect(cx - 8, by - 13, 4, 6, '#fef08a');
  c.fillRect(cx + 4, by - 13, 4, 6, '#fef08a');
  c.fillRect(cx - 8, by - 15, 3, 3, '#ffffff');
  c.fillRect(cx + 5, by - 15, 3, 3, '#ffffff');

  // Double-bitted Battleaxe
  const axeX = cx + (anim === 'attack' ? 22 : 14);
  const axeY = by - (anim === 'attack' ? 10 : 16);
  c.strokeLine(cx + 10, by + 8, axeX, axeY, '#78350f', 5);
  // Axe Head
  c.fillRect(axeX - 3, axeY - 12, 16, 24, '#1e293b');
  c.fillRect(axeX, axeY - 10, 12, 20, '#475569');
  c.fillRect(axeX + 10, axeY - 8, 4, 16, '#cbd5e1'); // Sharp edge
  c.fillRect(axeX + 12, axeY - 6, 2, 12, '#ffffff');

  if (hurt) {
    for (let i = 0; i < c.buf.length; i += 4) {
      if (c.buf[i + 3] > 0) { c.buf[i] = 255; c.buf[i + 1] = 255; c.buf[i + 2] = 255; }
    }
  }
}

// =========================================================================
// 3. BOSSES (5 MAJOR BOSSES)
// =========================================================================
function drawGoblinKing(c) {
  const cx = 64, cy = 64;
  c.fillRect(cx - 36, cy - 24, 72, 70, '#0f172a');
  c.fillRect(cx - 32, cy - 20, 64, 62, '#1e293b');
  c.fillCircle(cx - 30, cy + 12, 8, '#cbd5e1');
  c.fillCircle(cx + 30, cy + 12, 8, '#cbd5e1');
  c.fillRect(cx - 26, cy - 10, 52, 50, '#991b1b');
  c.fillRect(cx - 24, cy - 8, 48, 46, '#dc2626');
  c.fillCircle(cx, cy + 10, 20, '#15803d');
  c.fillCircle(cx, cy + 10, 16, '#22c55e');
  c.fillCircle(cx, cy - 14, 16, '#15803d');
  c.fillRect(cx - 18, cy - 34, 36, 14, '#f59e0b');
  c.strokeLine(cx, cy - 34, cx, cy - 46, '#f59e0b', 4);
  c.strokeLine(cx + 32, cy + 24, cx + 32, cy - 24, '#f59e0b', 5);
}

function drawCursedKnight(c) {
  const cx = 64, cy = 64;
  c.fillCircle(cx, cy, 50, '#450a0a33');
  c.fillRect(cx - 22, cy - 8, 44, 38, '#0f172a');
  c.fillRect(cx - 20, cy - 6, 40, 34, '#1e293b');
  c.strokeLine(cx - 12, cy + 2, cx, cy + 18, '#dc2626', 3);
  c.strokeLine(cx + 12, cy + 2, cx, cy + 18, '#dc2626', 3);
  c.fillRect(cx - 16, cy - 36, 32, 28, '#0f172a');
  c.fillRect(cx - 8, cy - 24, 16, 3, '#ef4444');
  const bladeX = cx + 38;
  c.strokeLine(bladeX, cy + 42, bladeX, cy - 54, '#0f172a', 7);
  c.strokeLine(bladeX, cy + 40, bladeX, cy - 52, '#ef4444', 3);
}

function drawAbyssWitch(c) {
  const cx = 64, cy = 60;
  for (let i = 0; i < 4; i++) {
    const ang = (i * Math.PI / 2) + 0.3;
    const gx = cx + Math.cos(ang) * 44;
    const gy = cy + Math.sin(ang) * 36;
    c.fillCircle(gx, gy, 8, '#7c3aed');
    c.fillCircle(gx, gy, 3, '#ffffff');
  }
  c.fillRect(cx - 24, cy, 48, 54, '#0f0b24');
  c.fillRect(cx - 20, cy + 2, 40, 50, '#1e1b4b');
  c.fillCircle(cx, cy - 24, 12, '#f8fafc');
  c.fillCircle(cx, cy + 6, 14, '#581c87');
  c.fillCircle(cx, cy + 6, 6, '#ffffff');
}

function drawAncientDragon(c) {
  const cx = 80, cy = 84;
  c.fillRect(cx - 68, cy - 52, 56, 44, '#0f172a');
  c.fillRect(cx + 12, cy - 52, 56, 44, '#0f172a');
  c.fillEllipse(cx, cy + 6, 32, 26, '#0f172a');
  c.fillRect(cx - 16, cy - 4, 32, 28, '#7c2d12');
  c.fillRect(cx - 12, cy - 2, 24, 24, '#ea580c');
  c.fillRect(cx - 8, cy, 16, 20, '#fbbf24');
  c.fillRect(cx - 18, cy - 48, 36, 24, '#0f172a');
  c.strokeLine(cx - 14, cy - 44, cx - 36, cy - 64, '#451a03', 6);
  c.strokeLine(cx + 14, cy - 44, cx + 36, cy - 64, '#451a03', 6);
}

function drawVoidLord(c) {
  const cx = 80, cy = 80;
  for (let t = 0; t < 8; t++) {
    const ang = t * Math.PI / 4;
    const tx = cx + Math.cos(ang) * 58;
    const ty = cy + Math.sin(ang) * 58;
    c.strokeLine(cx, cy, tx, ty, '#1e1b4b', 8);
    c.fillCircle(tx, ty, 4, '#d946ef');
  }
  c.fillCircle(cx, cy, 38, '#030712');
  c.fillCircle(cx, cy, 18, '#581c87');
  c.fillCircle(cx, cy, 8, '#c084fc');
  c.fillCircle(cx, cy, 4, '#ffffff');
}

// =========================================================================
// MAIN GENERATOR EXECUTION
// =========================================================================
function generateAllSprites() {
  console.log('Generating high-quality standalone dark fantasy sprite assets...');

  // 1. Arden (Player Warrior 72x72)
  const ardenActions = [
    { anim: 'idle', count: 4 },
    { anim: 'walk', count: 4 },
    { anim: 'dodge', count: 2 },
    { anim: 'attack', count: 4 },
    { anim: 'skill', count: 4 },
    { anim: 'hit', count: 2 },
    { anim: 'death', count: 4 }
  ];

  for (const act of ardenActions) {
    for (let f = 0; f < act.count; f++) {
      const c = new CanvasBuffer(72, 72);
      drawArden(c, {
        anim: act.anim,
        frame: f,
        hurt: act.anim === 'hit',
        death: act.anim === 'death' ? f : 0
      });
      c.save(`assets/characters/arden/${act.anim}_${f}.png`);
    }
  }

  // NOTE: We preserve the restored authentic Arden portrait in assets/ui/hud_portrait.png and assets/characters/arden/portrait.png!
  console.log('Preserved restored high-definition Arden portrait.');

  // Legacy mappings for immediate compatibility
  const legacyArden = [
    { src: 'assets/characters/arden/idle_0.png', dest: 'assets/characters/player_idle.png' },
    { src: 'assets/characters/arden/walk_1.png', dest: 'assets/characters/player_walk.png' },
    { src: 'assets/characters/arden/attack_1.png', dest: 'assets/characters/player_attack.png' },
    { src: 'assets/characters/arden/skill_1.png', dest: 'assets/characters/player_skill1.png' },
    { src: 'assets/characters/arden/skill_2.png', dest: 'assets/characters/player_skill2.png' },
    { src: 'assets/characters/arden/hit_0.png', dest: 'assets/characters/player_hit.png' },
    { src: 'assets/characters/arden/death_3.png', dest: 'assets/characters/player_death.png' }
  ];
  for (const l of legacyArden) {
    fs.copyFileSync(l.src, l.dest);
  }

  // 2. Monsters (8 Types)
  const monsterDefs = [
    { id: 'goblin', w: 52, h: 52, draw: drawGoblin, legacyName: 'goblin.png' },
    { id: 'goblin_warrior', w: 64, h: 64, draw: drawGoblinWarrior, legacyName: 'goblin_warrior.png' },
    { id: 'skeleton_warrior', w: 64, h: 64, draw: drawSkeletonWarrior, legacyName: 'skeleton_warrior.png' },
    { id: 'skeleton_archer', w: 64, h: 64, draw: drawSkeletonArcher, legacyName: 'skeleton_archer.png' },
    { id: 'slime', w: 52, h: 48, draw: drawSlime, legacyName: 'slime.png' },
    { id: 'bat', w: 52, h: 48, draw: drawBat, legacyName: 'bat.png' },
    { id: 'dark_mage', w: 64, h: 68, draw: drawDarkMage, legacyName: 'mage.png' },
    { id: 'orc', w: 72, h: 72, draw: drawOrc, legacyName: 'orc.png' }
  ];

  for (const m of monsterDefs) {
    const states = [
      { anim: 'idle', count: 2 },
      { anim: 'walk', count: 4 },
      { anim: 'attack', count: 3 },
      { anim: 'hit', count: 2 },
      { anim: 'death', count: 3 }
    ];

    for (const st of states) {
      for (let f = 0; f < st.count; f++) {
        const c = new CanvasBuffer(m.w, m.h);
        m.draw(c, {
          anim: st.anim,
          frame: f,
          hurt: st.anim === 'hit'
        });
        c.save(`assets/enemies/${m.id}/${st.anim}_${f}.png`);
      }
    }

    const defCanvas = new CanvasBuffer(m.w, m.h);
    m.draw(defCanvas, { anim: 'idle', frame: 0 });
    defCanvas.save(`assets/enemies/${m.legacyName}`);
  }

  // 3. Bosses (5 Major Bosses)
  const bossDefs = [
    { id: 'goblin_king', w: 128, h: 128, draw: drawGoblinKing },
    { id: 'cursed_knight', w: 128, h: 128, draw: drawCursedKnight },
    { id: 'abyss_witch', w: 128, h: 128, draw: drawAbyssWitch },
    { id: 'ancient_dragon', w: 160, h: 160, draw: drawAncientDragon },
    { id: 'void_lord', w: 160, h: 160, draw: drawVoidLord }
  ];

  for (const b of bossDefs) {
    const c = new CanvasBuffer(b.w, b.h);
    b.draw(c);
    c.save(`assets/bosses/${b.id}.png`);
  }

  console.log('All upgraded sprites generated successfully!');
}

generateAllSprites();
