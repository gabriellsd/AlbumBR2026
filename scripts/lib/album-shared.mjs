import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPTS_DIR = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(SCRIPTS_DIR, "../..");
export const SITE = path.join(ROOT, "site");
export const TIMES_SITE = path.join(SITE, "Times");
export const ELENCOS = path.join(SITE, "data", "elencos_serie_a_2026.json");
export const CATALOGO = path.join(SITE, "data", "catalogo.json");

export const STANDARD_SLOTS = [
  { slot: "01", x: 0.062, y: 0.178, w: 0.095, h: 0.268 },
  { slot: "02", x: 0.178, y: 0.178, w: 0.095, h: 0.268 },
  { slot: "03", x: 0.038, y: 0.348, w: 0.078, h: 0.218 },
  { slot: "04", x: 0.132, y: 0.348, w: 0.078, h: 0.218 },
  { slot: "05", x: 0.226, y: 0.348, w: 0.078, h: 0.218 },
  { slot: "06", x: 0.32, y: 0.348, w: 0.078, h: 0.218 },
  { slot: "07", x: 0.038, y: 0.518, w: 0.078, h: 0.218 },
  { slot: "08", x: 0.132, y: 0.518, w: 0.078, h: 0.218 },
  { slot: "09", x: 0.226, y: 0.518, w: 0.078, h: 0.218 },
  { slot: "10", x: 0.32, y: 0.518, w: 0.078, h: 0.218 },
  { slot: "11", x: 0.538, y: 0.178, w: 0.078, h: 0.268 },
  { slot: "12", x: 0.638, y: 0.178, w: 0.078, h: 0.268 },
  { slot: "13", x: 0.738, y: 0.168, w: 0.205, h: 0.205 },
  { slot: "14", x: 0.538, y: 0.348, w: 0.078, h: 0.218 },
  { slot: "15", x: 0.632, y: 0.348, w: 0.078, h: 0.218 },
  { slot: "16", x: 0.726, y: 0.348, w: 0.078, h: 0.218 },
  { slot: "17", x: 0.82, y: 0.348, w: 0.078, h: 0.218 },
  { slot: "18", x: 0.632, y: 0.518, w: 0.078, h: 0.218 },
  { slot: "19", x: 0.726, y: 0.518, w: 0.078, h: 0.218 },
  { slot: "20", x: 0.82, y: 0.518, w: 0.078, h: 0.218 },
];

export const FOLDER_ALIASES = {
  "atletico mineiro": "atletico-mg",
  "atletico paranaense": "athletico-paranaense",
  "athletico paranaense": "athletico-paranaense",
};

export const ATHLETICO = {
  team: "Athletico Paranaense",
  sigla: "CAP",
  tecnico: "Odair Hellmann",
  estadio: "Arena da Baixada",
  figurinhas: [
    { slot: "01", tipo: "Escudo", nome: "Escudo" },
    { slot: "02", tipo: "Técnico", nome: "Odair Hellmann" },
    { slot: "03", tipo: "Goleiro", nome: "Santos" },
    { slot: "04", tipo: "Goleiro", nome: "Mycael" },
    { slot: "05", tipo: "Atacante", nome: "Kevin Viveros" },
    { slot: "06", tipo: "Atacante", nome: "Julimar" },
    { slot: "07", tipo: "Atacante", nome: "Steven Mendoza" },
    { slot: "08", tipo: "Atacante", nome: "Renan Peixoto" },
    { slot: "09", tipo: "Lateral", nome: "Gastón Benavídez" },
    { slot: "10", tipo: "Lateral", nome: "Lucas Esquivel" },
    { slot: "11", tipo: "Lateral", nome: "Gilberto" },
    { slot: "12", tipo: "Lateral", nome: "Claudinho" },
    { slot: "13", tipo: "Estádio", nome: "Arena da Baixada (Ligga Arena)" },
    { slot: "14", tipo: "Meio-campo", nome: "Luiz Gustavo" },
    { slot: "15", tipo: "Meio-campo", nome: "Jadson" },
    { slot: "16", tipo: "Meio-campo", nome: "Juan Portilla" },
    { slot: "17", tipo: "Meio-campo", nome: "Bruno Zapelli" },
    { slot: "18", tipo: "Zagueiro", nome: "Carlos Terán" },
    { slot: "19", tipo: "Zagueiro", nome: "Arthur Dias" },
    { slot: "20", tipo: "Zagueiro", nome: "Juan Felipe Aguirre" },
  ],
};

export const STAR_NAMES = new Set([
  "neymar", "gabigol", "pedro", "bruno henrique", "lucas paqueta", "giorgian arrascaeta",
  "vitor roque", "gustavo gomez", "andreas pereira", "hulk", "thiago silva", "memphis depay",
  "yuri alberto", "kaio jorge", "gerson", "alan patrick", "kevin viveros", "julimar",
]);

export function norm(s) {
  return s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function slugify(team) {
  return norm(team).replace(/ /g, "-");
}

export function webPath(absPath) {
  const rel = path.relative(ROOT, absPath).split(path.sep).join("/");
  return `/${rel.split("/").map((p) => encodeURIComponent(p)).join("/")}`;
}

export function loadElencos() {
  const teams = JSON.parse(fs.readFileSync(ELENCOS, "utf8"));
  return [ATHLETICO, ...teams];
}

export function detectFigPrefix(figDir, sigla) {
  if (!fs.existsSync(figDir)) return sigla;
  const counts = {};
  for (const name of fs.readdirSync(figDir)) {
    const m = name.match(/^([A-Za-z]{2,4})\d+\.png$/i);
    if (m) {
      const p = m[1].toUpperCase();
      counts[p] = (counts[p] || 0) + 1;
    }
  }
  const keys = Object.keys(counts);
  if (!keys.length) return sigla;
  return keys.reduce((a, b) => (counts[a] >= counts[b] ? a : b));
}

export function findSpreadImage(paginasDir) {
  if (!fs.existsSync(paginasDir)) return null;
  const pngs = fs
    .readdirSync(paginasDir)
    .filter((f) => f.toLowerCase().endsWith(".png"))
    .map((f) => {
      const full = path.join(paginasDir, f);
      return { full, mtime: fs.statSync(full).mtimeMs };
    })
    .sort((a, b) => b.mtime - a.mtime);
  return pngs[0]?.full ?? null;
}

export function matchFolderToElenco(folderName, elencos) {
  const fn = norm(folderName);
  if (FOLDER_ALIASES[fn]) {
    const slug = FOLDER_ALIASES[fn];
    return elencos.find((t) => slugify(t.team) === slug) ?? null;
  }
  for (const t of elencos) {
    if (norm(t.team) === fn) return t;
  }
  for (const t of elencos) {
    const tn = norm(t.team);
    if (fn.includes(tn) || tn.includes(fn)) return t;
    if (fn.split(" ").includes(t.sigla.toLowerCase())) return t;
  }
  return null;
}

export function matchFolderToTeam(folderName, teams) {
  const fn = norm(folderName);
  if (FOLDER_ALIASES[fn]) {
    const slug = FOLDER_ALIASES[fn];
    return teams.find((t) => t.slug === slug) ?? null;
  }
  for (const t of teams) {
    if (norm(t.team) === fn) return t;
  }
  for (const t of teams) {
    const tn = norm(t.team);
    if (fn.includes(tn) || tn.includes(fn)) return t;
    if (fn.split(" ").includes(t.sigla.toLowerCase())) return t;
  }
  return null;
}

export function loadCatalogTeams() {
  if (fs.existsSync(CATALOGO)) {
    const data = JSON.parse(fs.readFileSync(CATALOGO, "utf8"));
    if (data.teams?.length) return data.teams;
  }
  return loadElencos().map((t) => ({
    team: t.team,
    slug: slugify(t.team),
    sigla: t.sigla,
  }));
}
