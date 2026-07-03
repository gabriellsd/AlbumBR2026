import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  SITE,
  TIMES_SITE,
  detectFigPrefix,
  findSpreadImage,
  loadCatalogTeams,
  matchFolderToTeam,
  webPath,
} from "./lib/album-shared.mjs";
import { slotsForImage } from "./lib/slot-detection.mjs";

const MANIFEST_OUT = path.join(SITE, "data", "paginas", "manifest.json");

async function scanTeamFolder(teamDir, teams) {
  const paginasDir = path.join(teamDir, "Paginas Album");
  const spread = findSpreadImage(paginasDir);
  if (!spread) return null;

  const meta = matchFolderToTeam(path.basename(teamDir), teams);
  if (!meta) {
    console.log(`  [aviso] Pasta sem elenco: ${path.basename(teamDir)}`);
    return null;
  }

  const { slug, team: teamName, sigla } = meta;
  const figDir = path.join(teamDir, "Figurinhas");
  const prefix = detectFigPrefix(figDir, sigla);
  let figurinhasBase = null;
  if (fs.existsSync(figDir) && fs.readdirSync(figDir).some((f) => f.toLowerCase().endsWith(".png"))) {
    figurinhasBase = webPath(path.join(figDir, prefix));
  }

  return {
    slug,
    team: teamName,
    sigla,
    folder: path.basename(teamDir),
    spread: webPath(spread),
    figurinhasBase,
    figurinhasPrefix: prefix,
    slots: await slotsForImage(spread),
    order: teamName,
  };
}

export async function buildPaginas() {
  const teams = loadCatalogTeams();
  const pages = [];

  if (!fs.existsSync(TIMES_SITE)) {
    fs.mkdirSync(TIMES_SITE, { recursive: true });
  }

  for (const name of fs.readdirSync(TIMES_SITE).sort()) {
    const teamDir = path.join(TIMES_SITE, name);
    if (!fs.statSync(teamDir).isDirectory()) continue;
    const page = await scanTeamFolder(teamDir, teams);
    if (page) {
      pages.push(page);
      console.log(`  + ${page.team} (${page.slug})`);
    }
  }

  const orderMap = Object.fromEntries(teams.map((t, i) => [t.slug, i]));
  pages.sort((a, b) => (orderMap[a.slug] ?? 999) - (orderMap[b.slug] ?? 999));

  const manifest = { version: 1, pages, total: pages.length };
  fs.mkdirSync(path.dirname(MANIFEST_OUT), { recursive: true });
  fs.writeFileSync(MANIFEST_OUT, JSON.stringify(manifest, null, 2), "utf8");
  console.log(`\nManifest: ${pages.length} página(s) -> ${MANIFEST_OUT}`);
  return manifest;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  console.log("Escaneando site/Times/ ...");
  await buildPaginas();
}
