import path from "node:path";
import sharp from "sharp";
import { STANDARD_SLOTS } from "./album-shared.mjs";

const CARD_FRAME_PAD_X = 0.12;
const CARD_FRAME_PAD_Y = 0.08;
const STADIUM_SLOT = "13";

function findWhiteRegions(white, h, w) {
  const visited = new Uint8Array(h * w);
  const regions = [];

  function flood(sy, sx) {
    const stack = [[sy, sx]];
    const ys = [];
    const xs = [];
    while (stack.length) {
      const [cy, cx] = stack.pop();
      if (cy < 0 || cx < 0 || cy >= h || cx >= w) continue;
      const idx = cy * w + cx;
      if (visited[idx] || !white[idx]) continue;
      visited[idx] = 1;
      ys.push(cy);
      xs.push(cx);
      stack.push([cy + 1, cx], [cy - 1, cx], [cy, cx + 1], [cy, cx - 1]);
    }
    if (ys.length < 800) return null;
    const x0 = Math.min(...xs);
    const x1 = Math.max(...xs);
    const y0 = Math.min(...ys);
    const y1 = Math.max(...ys);
    const bw = x1 - x0 + 1;
    const bh = y1 - y0 + 1;
    if (bw * bh < w * h * 0.004) return null;
    const aspect = bh ? bw / bh : 1;
    if (aspect > 3.5 || aspect < 0.25) return null;
    return {
      x: x0 / w,
      y: y0 / h,
      w: bw / w,
      h: bh / h,
      aspect,
      cx: (x0 + x1) / 2 / w,
      cy: (y0 + y1) / 2 / h,
    };
  }

  const step = 4;
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const idx = y * w + x;
      if (white[idx] && !visited[idx]) {
        const region = flood(y, x);
        if (region) regions.push(region);
      }
    }
  }

  regions.sort((a, b) => b.w * b.h - a.w * a.h);
  const kept = [];
  for (const r of regions) {
    let overlap = false;
    for (const k of kept) {
      const ix = Math.max(0, Math.min(r.x + r.w, k.x + k.w) - Math.max(r.x, k.x));
      const iy = Math.max(0, Math.min(r.y + r.h, k.y + k.h) - Math.max(r.y, k.y));
      if (ix * iy > 0.45 * Math.min(r.w * r.h, k.w * k.h)) {
        overlap = true;
        break;
      }
    }
    if (!overlap) kept.push(r);
  }
  return kept;
}

function rowsByCy(portrait) {
  const top = portrait.filter((r) => r.cy < 0.3).sort((a, b) => a.x - b.x);
  const mid = portrait.filter((r) => r.cy >= 0.3 && r.cy < 0.58).sort((a, b) => a.x - b.x);
  const bot = portrait.filter((r) => r.cy >= 0.58).sort((a, b) => a.x - b.x);
  return [top, mid, bot];
}

function leftRight(row) {
  return [
    row.filter((r) => r.cx < 0.48),
    row.filter((r) => r.cx >= 0.48),
  ];
}

function assignAlbumSlots(regions) {
  if (regions.length < 18) return null;
  const landscape = regions.filter((r) => r.aspect > 1.05);
  const portrait = regions.filter((r) => r.aspect <= 1.05);
  if (portrait.length < 17) return null;

  const [top, mid, bot] = rowsByCy(portrait);
  if (!top.length || !mid.length || !bot.length) return null;

  const slots = {};
  const [left0, right0] = leftRight(top);
  left0.slice(0, 2).forEach((r, i) => {
    slots[String(i + 1).padStart(2, "0")] = r;
  });
  right0.slice(0, 2).forEach((r, i) => {
    slots[String(11 + i).padStart(2, "0")] = r;
  });

  if (landscape.length) {
    slots["13"] = landscape.reduce((a, b) => (a.w * a.h >= b.w * b.h ? a : b));
  }

  const [left1, right1] = leftRight(mid);
  left1.slice(0, 4).forEach((r, i) => {
    slots[String(3 + i).padStart(2, "0")] = r;
  });
  right1.slice(0, 4).forEach((r, i) => {
    slots[String(14 + i).padStart(2, "0")] = r;
  });

  const [left2, right2] = leftRight(bot);
  left2.slice(0, 4).forEach((r, i) => {
    slots[String(7 + i).padStart(2, "0")] = r;
  });
  let playerBottom = right2.filter((r) => r.cx >= 0.63).sort((a, b) => a.x - b.x);
  if (playerBottom.length < 3) {
    playerBottom = right2.filter((r) => r.cx >= 0.55).sort((a, b) => a.x - b.x).slice(-3);
  }
  playerBottom.slice(0, 3).forEach((r, i) => {
    slots[String(18 + i).padStart(2, "0")] = r;
  });

  if (Object.keys(slots).length < 20) return null;
  return slots;
}

function expandRegionToCardFrame(region) {
  let { x, y, w, h } = region;
  const px = w * CARD_FRAME_PAD_X;
  const py = h * CARD_FRAME_PAD_Y;
  x = Math.max(0, x - px);
  y = Math.max(0, y - py);
  w = Math.min(1 - x, w + 2 * px);
  h = Math.min(1 - y, h + 2 * py);
  return { ...region, x, y, w, h };
}

function regionToSlot(region) {
  const slotId = region.slot ?? "";
  const expanded = slotId && slotId !== STADIUM_SLOT ? expandRegionToCardFrame(region) : region;
  return {
    slot: expanded.slot,
    x: Math.round(expanded.x * 10000) / 10000,
    y: Math.round(expanded.y * 10000) / 10000,
    w: Math.round(expanded.w * 10000) / 10000,
    h: Math.round(expanded.h * 10000) / 10000,
  };
}

function applySlotExpansion(slots) {
  return slots.map((s) => regionToSlot({ ...s }));
}

export async function detectSlotsFromImage(imagePath) {
  try {
    const { data, info } = await sharp(imagePath)
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const { width: w, height: h } = info;
    const white = new Uint8Array(w * h);
    for (let i = 0, p = 0; i < white.length; i++, p += 3) {
      white[i] = data[p] > 235 && data[p + 1] > 235 && data[p + 2] > 235 ? 1 : 0;
    }
    const regions = findWhiteRegions(white, h, w);
    const assigned = assignAlbumSlots(regions);
    if (!assigned) return null;

    const result = [];
    for (let num = 1; num <= 20; num++) {
      const key = String(num).padStart(2, "0");
      if (!assigned[key]) return null;
      result.push(regionToSlot({ ...assigned[key], slot: key }));
    }
    return result;
  } catch {
    return null;
  }
}

export async function slotsForImage(imagePath) {
  const detected = await detectSlotsFromImage(imagePath);
  if (detected) return detected;
  console.log(`  [aviso] Slots não detectados em ${path.basename(imagePath)}, usando template padrão`);
  return applySlotExpansion(STANDARD_SLOTS.map((s) => ({ ...s })));
}
