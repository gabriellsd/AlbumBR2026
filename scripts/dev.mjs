import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { rebuildAll } from "./rebuild.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE_PORT = Number(process.env.PORT) || 8080;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

function resolveFile(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const relative = decoded.replace(/^\/+/, "").replace(/\//g, path.sep);
  const filePath = path.resolve(ROOT, relative);
  if (!filePath.startsWith(ROOT)) return null;
  return filePath;
}

/* ==========================================================================
   Proxy de dados reais do Brasileirão (API pública da ESPN — sem chave/cota).
   O navegador chama /api/... no próprio servidor; aqui buscamos na ESPN,
   convertemos para o formato do site e devolvemos JSON (com cache de 60s).
   ========================================================================== */
const ESPN_BASE = "https://site.api.espn.com/apis";
const ESPN_LEAGUE = "bra.1"; // Brasileirão Série A
const API_CACHE = new Map();
const API_CACHE_TTL = 60_000;

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "AlbumBR2026/1.0", Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function cachedApi(key, producer) {
  const hit = API_CACHE.get(key);
  if (hit && Date.now() - hit.ts < API_CACHE_TTL) return hit.data;
  const data = await producer();
  API_CACHE.set(key, { ts: Date.now(), data });
  return data;
}

function statValue(stats, names) {
  for (const name of names) {
    const s = (stats || []).find(
      (x) => x.name === name || x.abbreviation === name || x.type === name,
    );
    if (s && s.value != null) return Number(s.value) || 0;
  }
  return 0;
}

function mapStandings(json) {
  let entries = [];
  if (json?.standings?.entries) entries = json.standings.entries;
  else if (Array.isArray(json?.children)) {
    for (const child of json.children) {
      if (child?.standings?.entries) entries = entries.concat(child.standings.entries);
    }
  }
  return entries.map((en) => {
    const stats = en.stats || [];
    const team = en.team || {};
    return {
      team: team.displayName || team.name || team.shortDisplayName || "—",
      crest: team.logos?.[0]?.href || team.logo || null,
      j: statValue(stats, ["gamesPlayed"]),
      v: statValue(stats, ["wins"]),
      e: statValue(stats, ["ties", "draws"]),
      d: statValue(stats, ["losses"]),
      gp: statValue(stats, ["pointsFor"]),
      gc: statValue(stats, ["pointsAgainst"]),
    };
  });
}

function mapMatches(json) {
  const events = json?.events || [];
  return events.map((ev) => {
    const comp = ev.competitions?.[0];
    const competitors = comp?.competitors || [];
    const home = competitors.find((c) => c.homeAway === "home") || competitors[0] || {};
    const away = competitors.find((c) => c.homeAway === "away") || competitors[1] || {};
    const type = ev.status?.type || {};
    const state = type.state;
    const showScore = type.completed || state === "in";
    let status;
    if (type.completed || state === "post") {
      status = "Encerrado";
    } else if (state === "in") {
      status = type.shortDetail || "Ao vivo";
    } else {
      const d = ev.date ? new Date(ev.date) : null;
      status = d
        ? d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
        : (type.shortDetail || "A definir");
    }
    return {
      home: home.team?.displayName || home.team?.name || "—",
      away: away.team?.displayName || away.team?.name || "—",
      homeCrest: home.team?.logo || home.team?.logos?.[0]?.href || null,
      awayCrest: away.team?.logo || away.team?.logos?.[0]?.href || null,
      hs: showScore ? Number(home.score ?? 0) : null,
      as: showScore ? Number(away.score ?? 0) : null,
      status,
    };
  });
}

function getStandings() {
  return fetchJson(`${ESPN_BASE}/v2/sports/soccer/${ESPN_LEAGUE}/standings`).then(mapStandings);
}

function getMatches() {
  return fetchJson(`${ESPN_BASE}/site/v2/sports/soccer/${ESPN_LEAGUE}/scoreboard`).then(mapMatches);
}

async function getStats() {
  const table = await cachedApi("standings", getStandings);
  if (!table.length) return [];
  const withPts = table.map((t) => ({ ...t, pts: t.v * 3 + t.e, sg: t.gp - t.gc }));
  const leader = [...withPts].sort((a, b) => b.pts - a.pts || b.sg - a.sg)[0];
  const bestAtk = [...withPts].sort((a, b) => b.gp - a.gp)[0];
  const bestDef = [...withPts].sort((a, b) => a.gc - b.gc)[0];
  const totalGoals = withPts.reduce((s, t) => s + t.gp, 0);
  const totalGames = Math.round(withPts.reduce((s, t) => s + t.j, 0) / 2);
  return [
    { icon: "fa-crown", label: "Líder", value: leader.team, hint: `${leader.pts} pontos`, crest: leader.crest },
    { icon: "fa-bullseye", label: "Melhor ataque", value: bestAtk.team, hint: `${bestAtk.gp} gols marcados`, crest: bestAtk.crest },
    { icon: "fa-shield-halved", label: "Melhor defesa", value: bestDef.team, hint: `${bestDef.gc} gols sofridos`, crest: bestDef.crest },
    { icon: "fa-futbol", label: "Gols na competição", value: String(totalGoals), hint: "Somando todos os times" },
    { icon: "fa-calendar-check", label: "Jogos disputados", value: String(totalGames), hint: "No campeonato" },
    { icon: "fa-list-ol", label: "Times na tabela", value: String(withPts.length), hint: "Série A" },
  ];
}

async function handleApi(res, urlPath) {
  try {
    let payload;
    if (urlPath === "/api/classificacao") payload = await cachedApi("standings", getStandings);
    else if (urlPath === "/api/jogos") payload = await cachedApi("scoreboard", getMatches);
    else if (urlPath === "/api/estatisticas") payload = await cachedApi("stats", getStats);
    else {
      res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ error: "endpoint desconhecido" }));
      return;
    }
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
    res.end(JSON.stringify(payload));
  } catch (err) {
    console.warn(`[api] ${urlPath} falhou:`, err.message);
    res.writeHead(502, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: String(err.message || err) }));
  }
}

await rebuildAll();

const server = http.createServer((req, res) => {
  const urlPath = req.url?.split("?")[0] ?? "/";

  if (urlPath.startsWith("/api/")) {
    handleApi(res, urlPath);
    return;
  }

  const filePath = resolveFile(urlPath === "/" ? "/site/album_brasileirao_2026.html" : urlPath);
  if (!filePath || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { "Content-Type": MIME[ext] ?? "application/octet-stream" });
  fs.createReadStream(filePath).pipe(res);
});

function startServer(port) {
  return new Promise((resolve, reject) => {
    const onError = (err) => {
      if (err.code === "EADDRINUSE") {
        if (process.env.PORT) {
          reject(
            new Error(
              `Porta ${port} em uso. Feche o servidor anterior ou defina outra: PORT=8081 npm run dev`,
            ),
          );
          return;
        }
        if (port >= BASE_PORT + 10) {
          reject(new Error(`Nenhuma porta livre entre ${BASE_PORT} e ${port}.`));
          return;
        }
        console.warn(`Porta ${port} em uso — tentando ${port + 1}...`);
        startServer(port + 1).then(resolve).catch(reject);
        return;
      }
      reject(err);
    };

    server.once("error", onError);
    server.listen(port, "127.0.0.1", () => {
      server.removeListener("error", onError);
      resolve(port);
    });
  });
}

startServer(BASE_PORT)
  .then((port) => {
    const appUrl = `http://localhost:${port}/site/album_brasileirao_2026.html`;
    console.log(`\nÁlbum Virtual: ${appUrl}\n`);
  })
  .catch((err) => {
    console.error(`\nErro ao iniciar servidor: ${err.message}\n`);
    process.exit(1);
  });
