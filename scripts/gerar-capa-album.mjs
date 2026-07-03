import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { ROOT, SITE } from "./lib/album-shared.mjs";

const ASSETS = path.join(SITE, "assets");
const COVER_W = 768;
const COVER_H = 1024;
const MASTER_W = COVER_W * 2;
const MASTER_H = COVER_H * 2;

const FONTES = [
  path.join(ASSETS, "Capa Album.png"),
  path.join(ASSETS, "capa-usuario-original.png"),
  path.join(ASSETS, "capa-brasileirao-2026-master.png"),
];

const MASTER_OUT = path.join(ASSETS, "capa-brasileirao-2026-master.png");
const FRENTE_OUT = path.join(ASSETS, "capa-frente.png");
const HUB_OUT = path.join(ASSETS, "capa-album.png");

function localizarFonte() {
  return FONTES.find((p) => fs.existsSync(p)) ?? null;
}

export async function gerarCapaAlbum() {
  const fonte = localizarFonte();
  if (!fonte) {
    console.error(`Capa não encontrada. Coloque a arte em: ${FONTES[0]}`);
    process.exit(1);
  }

  fs.mkdirSync(ASSETS, { recursive: true });

  const master = await sharp(fonte)
    .resize(MASTER_W, MASTER_H, { fit: "cover", position: "centre" })
    .png({ compressionLevel: 9 })
    .toBuffer();

  await sharp(master).toFile(MASTER_OUT);

  await sharp(master)
    .resize(COVER_W, COVER_H, { fit: "fill" })
    .png({ compressionLevel: 9 })
    .toFile(FRENTE_OUT);

  const hubH = Math.round(512 * (COVER_H / COVER_W));
  await sharp(FRENTE_OUT)
    .resize(512, hubH, { fit: "fill" })
    .png({ compressionLevel: 9 })
    .toFile(HUB_OUT);

  console.log(`Fonte: ${path.basename(fonte)}`);
  console.log(`capa-frente.png (${COVER_W}x${COVER_H})`);
  console.log(`capa-brasileirao-2026-master.png (${MASTER_W}x${MASTER_H})`);
  console.log(`capa-album.png (hub 512x${hubH})`);
  console.log(`Salvo em: ${ASSETS}`);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  await gerarCapaAlbum();
}
