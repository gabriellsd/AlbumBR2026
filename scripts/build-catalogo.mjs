import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  SITE,
  TIMES_SITE,
  detectFigPrefix,
  findSpreadImage,
  loadElencos,
  matchFolderToElenco,
  norm,
  slugify,
  webPath,
} from "./lib/album-shared.mjs";

const DATA_OUT = path.join(SITE, "data", "catalogo.json");

function parseFigurinhaFile(name) {
  const m = name.match(/^([A-Za-z]{2,4})(\d+)\.png$/i);
  if (!m) return null;
  return [m[1].toUpperCase(), String(parseInt(m[2], 10)).padStart(2, "0")];
}

function displayName(fig, sigla) {
  const nome = fig.nome ?? "";
  if (nome === "Logo.png" || nome === "Escudo" || nome === "") {
    return `Escudo ${sigla}`;
  }
  return nome;
}

export function buildCatalogo() {
  const elencos = loadElencos();
  const stickers = [];
  const teamsMeta = [];
  let sid = 1;

  if (!fs.existsSync(TIMES_SITE)) {
    fs.mkdirSync(TIMES_SITE, { recursive: true });
  }

  for (const name of fs.readdirSync(TIMES_SITE).sort()) {
    const teamDir = path.join(TIMES_SITE, name);
    if (!fs.statSync(teamDir).isDirectory()) continue;

    const figDir = path.join(teamDir, "Figurinhas");
    const paginasDir = path.join(teamDir, "Paginas Album");
    const pngs = fs.existsSync(figDir)
      ? fs.readdirSync(figDir).filter((f) => f.toLowerCase().endsWith(".png")).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
      : [];
    const hasPage = findSpreadImage(paginasDir) !== null;

    if (!pngs.length && !hasPage) continue;

    const meta = matchFolderToElenco(name, elencos);
    if (!meta) {
      console.log(`  [aviso] Sem elenco para pasta: ${name}`);
      continue;
    }

    const team = meta.team;
    const slug = slugify(team);
    const sigla = meta.sigla;
    const prefix = fs.existsSync(figDir) ? detectFigPrefix(figDir, sigla) : sigla;
    const figBySlot = Object.fromEntries((meta.figurinhas ?? []).map((f) => [f.slot, f]));

    teamsMeta.push({
      team,
      slug,
      sigla,
      tecnico: meta.tecnico ?? "",
      estadio: meta.estadio ?? "",
      folder: name,
      hasPage,
      hasFigurinhas: pngs.length > 0,
    });

    if (!pngs.length) {
      console.log(`  + ${team} (${slug}): página no álbum, sem figurinhas ainda`);
      continue;
    }

    for (const pngName of pngs) {
      const parsed = parseFigurinhaFile(pngName);
      if (!parsed) {
        console.log(`  [aviso] Ignorando arquivo: ${pngName}`);
        continue;
      }
      const [filePrefix, slot] = parsed;
      if (filePrefix !== prefix) {
        console.log(`  [aviso] Prefixo inesperado ${pngName} (esperado ${prefix})`);
      }

      const fig = figBySlot[slot] ?? { slot, tipo: "Jogador", nome: `Slot ${slot}` };
      const tipo = fig.tipo ?? "Jogador";
      const isShiny = slot === "01" || slot === "13";

      stickers.push({
        id: sid,
        code: `${sigla}${slot}`,
        name: displayName(fig, sigla),
        team: slug,
        teamName: team,
        sigla,
        slot,
        position: tipo,
        image: webPath(path.join(figDir, pngName)),
        isShiny,
      });
      sid += 1;
    }

    console.log(`  + ${team} (${slug}): ${pngs.length} figurinha(s) em site/Times`);
  }

  const catalog = {
    title: "Brasileirão Série A 2026",
    season: 2026,
    total: stickers.length,
    teams: teamsMeta,
    stickers,
    source: "site/Times",
  };

  fs.mkdirSync(path.dirname(DATA_OUT), { recursive: true });
  fs.writeFileSync(DATA_OUT, JSON.stringify(catalog, null, 2), "utf8");
  console.log(`\nCatálogo: ${stickers.length} figurinhas | ${teamsMeta.length} time(s) em site/Times`);
  console.log(`Salvo em: ${DATA_OUT}`);
  return catalog;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  console.log("Escaneando site/Times/Figurinhas/ ...");
  buildCatalogo();
}
