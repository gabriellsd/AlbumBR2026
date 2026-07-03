import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { ROOT, SITE } from "./lib/album-shared.mjs";

const SITE_ASSETS = path.join(SITE, "assets");
const LOGO_SRC = path.join(ROOT, "assets", "Logo_Brasileirao_Serie_A_2026.png");

async function copyLogo() {
  fs.mkdirSync(SITE_ASSETS, { recursive: true });
  if (!fs.existsSync(LOGO_SRC)) return;
  await sharp(LOGO_SRC)
    .resize(400, 400, { fit: "inside", withoutEnlargement: false })
    .png()
    .toFile(path.join(SITE_ASSETS, "logo-brasileirao.png"));
  console.log("logo-brasileirao.png");
}

async function capaAlbumFallback() {
  const out = path.join(SITE_ASSETS, "capa-album.png");
  if (fs.existsSync(out)) return;

  const layers = [
    {
      input: Buffer.from(
        `<svg width="512" height="640"><rect width="512" height="640" fill="#00371e"/><ellipse cx="430" cy="50" rx="140" ry="130" fill="#b4141e"/><ellipse cx="50" cy="610" rx="130" ry="130" fill="#d4af37"/></svg>`,
      ),
      top: 0,
      left: 0,
    },
  ];

  if (fs.existsSync(LOGO_SRC)) {
    const logo = await sharp(LOGO_SRC).resize(320, 320, { fit: "inside" }).png().toBuffer();
    layers.push({ input: logo, top: 140, left: Math.floor((512 - 320) / 2) });
  }

  const base = sharp({
    create: { width: 512, height: 640, channels: 4, background: { r: 0, g: 55, b: 30, alpha: 1 } },
  }).composite(layers);

  await base.png().toFile(out);
  console.log("capa-album.png (fallback)");
}

async function prepareAlbumAbertoSpread() {
  const src = path.join(SITE_ASSETS, "Album Aberto.png");
  if (!fs.existsSync(src)) return;

  const tmp = path.join(SITE_ASSETS, ".Album_Aberto_tmp.png");
  await sharp(src)
    .trim({ threshold: 20 })
    .resize(3000, 2000, { fit: "fill" })
    .png()
    .toFile(tmp);
  fs.renameSync(tmp, src);
  console.log("Album Aberto.png (recorte do miolo + 3000x2000)");
}

export async function gerarAssets() {
  await copyLogo();
  await prepareAlbumAbertoSpread();
  const packPath = path.join(SITE_ASSETS, "Pacote Figurinha.png");
  if (fs.existsSync(packPath)) {
    console.log("Pacote Figurinha.png (arte do usuário — mantido)");
  } else {
    console.warn("Aviso: coloque Pacote Figurinha.png em site/assets/");
  }
  if (!fs.existsSync(path.join(SITE_ASSETS, "capa-frente.png"))) {
    await capaAlbumFallback();
  }
  console.log("Assets do hub gerados em", SITE_ASSETS);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  await gerarAssets();
}
