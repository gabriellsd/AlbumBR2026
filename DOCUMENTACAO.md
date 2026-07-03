# Álbum Virtual Brasileirão Série A 2026 — Documentação

Documentação do estado atual do projeto (hub interativo + álbum digital estilo Panini).

---

## Visão geral

O projeto simula um álbum de figurinhas do Brasileirão 2026 no navegador:

- **Hub principal** — fundo de estádio, álbum em destaque com leque de figurinhas/pacote ao hover, trilha sonora
- **Álbum virtual** — virada de páginas (StPageFlip), capa 3D, moldura `Album Aberto.png` nas páginas de time
- **Figurinhas** — inventário tela cheia com filtros, preview ao clicar, brilho nos slots 01 e 13
- **Saquetas** — rasgar pacote em tela cheia com revelação carta a carta
- **Painel Dev** — estatísticas, reset, backup (exportar/importar), navegação rápida, áudio (`Ctrl+Shift+D`)

**URL local:** `http://localhost:8080/site/album_brasileirao_2026.html`

---

## Como executar

```bash
npm install
npm run dev
```

Na inicialização roda automaticamente os builds (capa, assets, catálogo e páginas).

Scripts auxiliares:

```bash
npm run build              # capa + assets + catálogo + páginas
npm run build:catalogo
npm run build:paginas
npm run build:capa
npm run build:assets
```

### Atalho Windows

```bash
site/abrir_album.bat
```

---

## Estrutura de pastas

```
Album BR2026/
├── archive/                   # Materiais históricos
├── assets/                    # Logos e artes globais (Verso.png, logo CBF, etc.)
├── times/                     # Fotos de elenco e artes por clube (fonte de produção)
├── scripts/
│   ├── dev.mjs                # npm run dev (servidor + rebuild)
│   ├── build.mjs              # npm run build
│   ├── rebuild.mjs            # Orquestra todos os builds
│   ├── build-catalogo.mjs
│   ├── build-paginas.mjs
│   ├── gerar-capa-album.mjs
│   ├── gerar-assets.mjs
│   └── lib/                   # Utilitários compartilhados
├── package.json
├── site/
│   ├── album_brasileirao_2026.html   # App principal
│   ├── assets/
│   │   ├── Capa Album.png              # Fonte oficial da capa (768×1024)
│   │   ├── Capa_Dura.png               # Capa 3D no hub e no flipbook
│   │   ├── Album Aberto.png            # Moldura do álbum aberto (3000×2000)
│   │   ├── capa-frente.png             # Página direita da capa no álbum
│   │   ├── capa-album.png              # Miniatura legada no hub
│   │   ├── fundo.png                   # Fundo do hub e modais tela cheia
│   │   ├── Champions of Brazil.mp3     # Trilha de fundo (loop)
│   │   ├── logo-brasileirao.png        # Placeholder no card do hub
│   │   └── Pacote Figurinha.png        # Pacote / saqueta de figurinhas
│   ├── data/
│   │   ├── catalogo.json               # Times + figurinhas válidas
│   │   ├── elencos_serie_a_2026.json   # Elenco oficial por time
│   │   └── paginas/
│   │       └── manifest.json           # Páginas, spreads e coordenadas dos slots
│   └── Times/                          # Única fonte válida no app
│       ├── Athletico Paranaense/
│       │   ├── Figurinhas/             # CAP1.png … CAP20.png
│       │   └── Paginas Album/
│       ├── Atletico Mineiro/
│       │   └── Paginas Album/          # Sem figurinhas ainda
│       └── Palmeiras/
│           ├── Figurinhas/             # SEP1.png … SEP20.png
│           └── Paginas Album/
└── DOCUMENTACAO.md                     # Este arquivo
```

---

## Times no álbum (estado atual)

| Time | Slug | Sigla figurinha | Página | Figurinhas |
|------|------|-----------------|--------|------------|
| Athletico Paranaense | `athletico-paranaense` | CAP | ✅ | 20 |
| Atlético-MG | `atletico-mg` | CAM | ✅ | 0 |
| Palmeiras | `palmeiras` | SEP | ✅ | 20 |

**Total no catálogo:** 40 figurinhas, 3 páginas de time (+ spread de capa).

> Apenas arquivos em `site/Times/*/Figurinhas/*.png` entram no catálogo. Pastas em `times/` (minúsculo) são material de produção, não usadas diretamente pelo app.

---

## Hub principal

### Fundo (`fundo.png`)

- Aplicado na classe `.stadium-bg` do `<body>`
- Também usado nos modais **tela cheia** (`pack-mode`): abrir saquetas e minhas figurinhas
- `background-size: cover`, `background-position: left top`

### Layout em leque (deck)

Por padrão o hub mostra **apenas o álbum** centralizado (elemento dominante). Ao passar o mouse no álbum:

1. As colunas **Minhas Figurinhas** (esquerda) e **Pacote** (direita) surgem de trás do álbum, com animação de leque (`rotate` + `translate`)
2. O leque permanece aberto enquanto o mouse estiver em qualquer área do hub (classe `hub-row--revealed` via JS em `mouseenter`/`mouseleave`)
3. As pills dos lados só aparecem com o leque aberto; **O Meu Álbum** fica sempre visível

Classes principais: `.hub-row--deck`, `.hub-side--left`, `.hub-side--right`, `.hub-column--album`.

### Elementos

| Área | Função |
|------|--------|
| Pilha de cromos | Até 3 figurinhas reais do inventário; abre **Minhas Figurinhas** |
| Álbum (`Capa_Dura.png`) | Capa 3D com ghosts empilhados; abre o **Álbum**; exibe % e progresso |
| Pacote (`Pacote Figurinha.png`) | Pilha 3D; abre **Abrir Pacote**; badge com saquetas restantes |
| Barra inferior | Atalhos Minhas Figurinhas / Álbum / Abrir Pacote |
| `#music-fab` | Liga/desliga trilha de fundo (acima do `#dev-fab`) |

Estado salvo em `localStorage` (`brasileirao_album_2026_state`): inventário, coladas, saquetas, time favorito. O carregamento é protegido por `try/catch` + `normalizeState()` (dados corrompidos não travam o app) e pode ser exportado/importado como arquivo `.json` (ver **Backup do progresso**).

### Música de fundo

- Arquivo: `site/assets/Champions of Brazil.mp3`
- Loop em todo o app (hub, álbum e modais)
- Fade-in ~2,8 s até **15%** de volume (`HUB_BGM_TARGET_VOLUME = 0.15`)
- Nos últimos **3,5 s** da faixa o volume desce; no loop, fade-in de novo
- Autoplay com fallback no primeiro clique se o navegador bloquear
- Controle no botão flutuante `#music-fab` e na seção **Áudio** do painel Dev

---

## Álbum virtual

### Layout do viewer

- O container `#album-spread-view` mantém **proporção fixa 3:2** (spread horizontal) o tempo todo
- Não há redimensionamento ao sair da capa — evita bugs de dimensão no PageFlip
- O flipbook ocupa 100% do container; cada página = metade da largura

### Capa integrada ao flipbook

A capa **faz parte do StPageFlip**, com a **mesma animação** das páginas dos times (`flipNext` / `flipPrev`, ~950 ms).

**Spread da capa (páginas 0 e 1):**

| Lado | Conteúdo |
|------|----------|
| Esquerda (página 0) | **Transparente** — `buildTransparentPageImage()` (sem contracapa procedural) |
| Direita (página 1) | **Capa frontal** — `capa-frente.png` (768×1024) |

**Mapa de páginas no flipbook:**

| Índice PageFlip | Conteúdo |
|-----------------|----------|
| 0–1 | Capa (contracapa + frente) |
| 2–3 | **Índice / abertura** (`Pagina_Indice.png`) |
| 4–5 | 1º time |
| 6–7 | 2º time |
| … | Demais times (2 páginas por time) |

Constantes no JS: `COVER_PAGE_COUNT = 2`, `INTRO_PAGE_COUNT = 2`, `FIRST_TEAM_PAGE = 4`, `teamIndexToPageIndex(n) = 4 + n * 2`.

- Spread de índice montado por `buildIntroPageImages()` (divide `site/assets/Pagina_Indice.png` em duas metades, igual aos times).
- `showAlbumAtIntro()` exibe o índice sem slots; `isOnIntroSpread()` detecta a zona 2–3.

**Comportamento:**

1. Ao abrir o álbum → flipbook montado em background, exibido em `turnToPage(0)` (spread da capa)
2. Botão **→** → `flipNext('top')` — mesma virada das páginas internas
3. Sequência de navegação: **Capa → Índice → 1º time → … → último time**
4. Botão central mostra **CAPA** (páginas 0–1), **ÍNDICE** (páginas 2–3) e a **sigla do time** nas demais
5. Seta **←** desabilitada só na capa; seta **→** desabilitada só no último time

**Arquivos de capa:**

| Arquivo | Tamanho | Uso |
|---------|---------|-----|
| `Capa Album.png` | 768×1024 | **Fonte** — editar esta imagem |
| `capa-frente.png` | 768×1024 | Página direita do spread da capa |
| `capa-brasileirao-2026-master.png` | 1536×2048 | Alta resolução (2×) |
| `capa-album.png` | 512×682 | Miniatura no hub |

Para trocar a capa: substitua `site/assets/Capa Album.png` e rode `npm run build:capa`.

### Páginas dos times

- Cada time tem um **spread** PNG em `Paginas Album/` (duas páginas lado a lado)
- StPageFlip exibe metade esquerda + direita ao virar
- **`Album Aberto.png`** (3000×2000) é desenhado como **moldura** atrás das páginas de time (não na capa)
- Constantes: `ALBUM_OPEN_FRAME` + `ALBUM_OPEN_FRAME_BOOST = 3.0` — ajustam escala da moldura
- Sistema de **bleed** no PageFlip foi removido; overlay de slots ocupa 100% do wrap
- Slots vazios na arte da página mostram rótulos (ex.: CAP 5 KEVIN VIVEROS) — isso é o **template**; ao colar figurinha, a imagem cobre o slot

### Colar figurinhas

1. Obter cromos (saquetas ou Dev)
2. Com figurinha no inventário, slot compatível mostra **bola preta com +** (`.album-new-slot__orb`)
3. Clique no slot para colar
4. Figurinha colada é desenhada no canvas antes do flip (acompanha a virada de página)
5. Clique na colada abre preview; modo Dev permite descolar

### Slots

- Coordenadas em `manifest.json` (detecção automática em `scripts/build-paginas.mjs`)
- Overlay HTML sincronizado com o canvas do flipbook
- Slots só aparecem em páginas de time (não na capa)

### Navegação e áudio

- Setas anterior / próxima (PageFlip unificado)
- Índice de times (sigla no botão central; **CAPA** na capa)
- Atalho Dev: ir direto para página de um time
- **Álbum silencioso** — sem efeitos sonoros ao abrir/fechar modal, virar páginas, colar/descolar ou notificações com o álbum aberto; hub, saquetas e inventário continuam com som de UI
- A trilha `Champions of Brazil.mp3` toca também com o álbum aberto (volume global controlado por `#music-fab`)

### Inicialização e performance

- `openAlbumView()` destrói e remonta o flipbook a cada abertura do modal
- `prepareAlbumBookInBackground()` pré-carrega spreads e monta o livro com `initAlbumBook({ startAtCover: true })`
- Upgrade de imagens compostas (`runAlbumBookUpgrade`) só roda se houver figurinhas coladas e **não** estiver na capa
- `syncAlbumBookDimensions()` usa `requestAnimationFrame` para evitar syncs duplicados

### Nitidez em telas de alta densidade (DPR)

O StPageFlip 2.0.7 dimensiona o canvas em **pixels CSS (1×)** e nunca usa `devicePixelRatio`, então em telas 2×/3× as páginas ficavam borradas. Correção:

- `patchAlbumCanvasDpr()` embrulha o `resizeCanvas` da UI do PageFlip; `applyAlbumCanvasDpr()` aumenta o buffer do canvas para o `devicePixelRatio` (até 3×) e aplica `ctx.setTransform(dpr, …)`.
- O layout do StPageFlip usa `offsetWidth/offsetHeight` (px CSS), então **só a nitidez muda** — posições e tamanhos ficam idênticos.
- Reaplicado no init, nos upgrades ao colar, no resize e no sync de dimensões.
- As metades dos spreads são re-salvas em **JPEG 0.96** (`getHalfImageUrl` / `buildCompositedHalfImage`) para reduzir artefatos.

> A **página de índice** (`Pagina_Indice.png`, 1024×682) tem resolução menor que os spreads dos times (~3000×2000); melhora com o DPR, mas para igualar totalmente é preciso reexportar a arte em alta.

---

## Catálogo (`scripts/build-catalogo.mjs`)

- Lê apenas `site/Times/*/Figurinhas/*.png`
- Cruza com elenco em `site/data/elencos_serie_a_2026.json`
- Athletico tem elenco embutido no script (CAP01–CAP20)
- Palmeiras usa prefixo **SEP** nas figurinhas (não PAL)
- **Figurinhas brilhantes:** apenas slots **01** (escudo) e **13** (estádio) — `isShiny = slot === "01" || slot === "13"`
- IDs inválidos no `localStorage` são filtrados ao carregar

---

## Páginas (`scripts/build-paginas.mjs`)

- Escaneia `site/Times/*/Paginas Album/*.png`
- Detecta slots brancos na imagem e mapeia para CAP01–20 (layout padrão dupla)
- Se a detecção falhar, usa template `STANDARD_SLOTS`
- Gera `data/paginas/manifest.json`

**Arquivo do Athletico:** `Padinas Clube Athletico Paranaense.png` (grafia “Padinas” no nome do arquivo).

---

## Saquetas e inventário

- Estado inicial: 3 saquetas, inventário vazio
- Rasgar saqueta: animação + 5 cromos aleatórios do catálogo
- Countdown para “novas saquetas” (timer no hub)
- **Resetar álbum** (Dev): zera `pasted` e `inventory`

### Modal Minhas Figurinhas (`#modal-meus-cromos`)

Layout **tela cheia** (mesmo padrão de `#modal-abrir-saquetas`):

- Fundo `fundo.png`, botão voltar (`album-back-btn`), sem bordas ou caixa modal
- Ativa `pack-mode` no `#modal-container`

**Grid de figurinhas**

- Células grandes (~15rem mínimo), só imagem + contador `xN` se repetida
- Clique abre **preview ampliado** (`#inventory-card-preview`) — mesmo efeito do álbum
- **Brilhantes (01 e 13):** inclinação 3D + brilho holográfico ao passar o mouse; slot **13** (estádio) não inclina, só brilho
- Comuns: sem efeito de hover

**Filtros** (`inventoryFilters` + `renderInventoryGrid()`)

| Recurso | Opções |
|---------|--------|
| Busca | Nome, código, time, posição |
| Tipo (chips) | Todos, Brilhantes, Comuns, Repetidas, Jogadores, Goleiros, Atacantes, Laterais, Meio-campo, Zagueiros, Técnico, Escudo, Estádio |
| Time | Select dinâmico (só times no inventário) |
| Ordenação | Nome A–Z, Por time, Por número, Repetidas primeiro |
| Contador | `N tipo(s) · M cópia(s)` |

Funções: `setInventoryFilterType`, `setInventoryTeam`, `setInventorySearch`, `setInventorySort`, `filterInventory`, `populateInventoryTeamFilter`.

---

## Painel Dev (`#dev-fab`)

- Atalho: `Ctrl+Shift+D`
- `z-index` acima do modal do álbum
- Estatísticas: % álbum, coladas, inventário, saquetas
- Ações: reset álbum, rebuild páginas, ir para time, remover repetidas
- **Backup do progresso** — Exportar/Importar (ver seção abaixo)
- **Páginas (em breve)** — botões que abrem Classificação, Jogos e Estatísticas (via `devOpenPage()`, que fecha o painel e chama `openModal()`)

### Backup do progresso

Protege o progresso contra limpeza do navegador / troca de máquina.

| Ação | Função | Comportamento |
|------|--------|---------------|
| Exportar | `exportProgress()` | Baixa `album-brasileirao-2026-backup-AAAA-MM-DD.json` com `{ app, version, exportedAt, state }` |
| Importar | `triggerImportProgress()` + `importProgress()` | Lê o `.json`, valida, pede confirmação e substitui o estado (`normalizeState()`), depois remonta o álbum |

- `defaultState()` centraliza o estado inicial (usado no load, reset e import).
- Arquivo inválido/corrompido é rejeitado com aviso, sem quebrar o progresso atual.

---

## Páginas informativas (Classificação, Jogos, Estatísticas)

Três telas tela cheia (mesmo padrão `pack-mode` + `fundo.png` + botão voltar) com **dados reais** do Brasileirão Série A. Acessíveis pelo painel Dev.

| Modal | Título | Conteúdo |
|-------|--------|----------|
| `#modal-classificacao` | Classificação | Tabela (P, J, V, E, D, GP, GC, SG) ordenada por pontos → saldo; faixas de zona (Libertadores/Sula/Rebaixamento) + legenda |
| `#modal-jogos` | Jogos | Cards mandante × visitante; placar quando jogado, data/hora PT-BR quando futuro |
| `#modal-estatisticas` | Estatísticas | Cards: líder, melhor ataque/defesa, gols na competição, jogos disputados, nº de times |

### Fonte de dados — API pública da ESPN (via proxy)

- **Sem chave, sem cota declarada.** Liga: `bra.1` (Série A).
- O navegador **não** chama a ESPN direto (evita CORS e não expõe nada). Ele chama o **próprio servidor** (`scripts/dev.mjs`), que busca na ESPN, converte para o formato do site e devolve JSON. Cache em memória de **60 s** e timeout de **8 s**.

| Endpoint local | Origem ESPN | Retorno |
|----------------|-------------|---------|
| `/api/classificacao` | `.../v2/sports/soccer/bra.1/standings` | `[{ team, crest, j, v, e, d, gp, gc }]` |
| `/api/jogos` | `.../site/v2/sports/soccer/bra.1/scoreboard` | `[{ home, away, homeCrest, awayCrest, hs, as, status }]` |
| `/api/estatisticas` | derivado da classificação | `[{ icon, label, value, hint, crest }]` |

### Comportamento no front (`album_brasileirao_2026.html`)

- `renderClassificacao()`, `renderJogos()`, `renderEstatisticas()` são **assíncronas**: mostram "Carregando…", buscam via `loadInfoJson()` e, em caso de falha (offline / sem servidor), caem nos **dados de exemplo** embutidos (`classificacaoData`, `jogosData`, `estatisticasData`).
- **Escudos reais:** `infoTeamCrest(name, cls, logo)` renderiza `<img>` do escudo da ESPN; se a imagem falhar, `infoCrestFallback()` troca pelas iniciais do time.
- **Escudos no índice do álbum:** `ensureTeamCrests()` monta um mapa `slug → escudo` a partir de `/api/classificacao` (casando por nome normalizado + `ESPN_NAME_ALIASES`); `buildAlbumIndex()` mostra o escudo ao lado de cada time e recarrega quando os escudos chegam. Offline: some o escudo, mantém o texto.
- Os endpoints `/api/*` só existem com o **servidor rodando** (`npm run dev`). Abrindo o HTML solto, as páginas usam os dados de exemplo.

---

## Scripts auxiliares

| Script | Função |
|--------|--------|
| `scripts/gerar-capa-album.mjs` | Exporta capa 768×1024 a partir de `Capa Album.png` |
| `scripts/gerar-assets.mjs` | Assets do hub (logo; pacote é arte fixa em `Pacote Figurinha.png`) |
| `scripts/build-catalogo.mjs` | Gera `site/data/catalogo.json` |
| `scripts/build-paginas.mjs` | Gera `site/data/paginas/manifest.json` |
| `scripts/dev.mjs` | Servidor + rebuild + **proxy `/api/*`** (dados ESPN) |

Skill Cursor: `.cursor/skills/gerar-foto-jogador-album/SKILL.md` — fluxo para fotos frontais de jogadores (produção em `times/`).

---

## Decisões de design (histórico)

1. **Só `site/Times`** — sem placeholders nem imagens de `times/` no app
2. **Capa no flipbook** — spread duplo (página transparente + frente) como páginas 0–1; mesma animação StPageFlip que os times
3. **Capa à direita** — arte principal (`capa-frente.png` / `Capa_Dura.png`) na metade direita; metade esquerda transparente
4. **Spread fixo 3:2** — container não muda de tamanho entre capa e páginas internas
5. **Capa 768×1024 (3:4)** — arte em `Capa Album.png` e exibição 3D com `Capa_Dura.png` no hub
6. **Sem verso físico** — metade esquerda da capa é transparente; `Verso.png` não é usado no virtual
7. **Slot “figurinha nova”** — bola preta com + branco (~44% do slot), fundo transparente
8. **Flip sincronizado** — figurinhas coladas compostas no canvas antes do StPageFlip
9. **Fundo do hub** — `fundo.png` substitui gradiente verde antigo
10. **Álbum mudo** — interações do modal do álbum não disparam `playSound()`
11. **Hub em leque** — só o álbum visível; laterais surgem ao hover e fecham ao sair do hub
12. **Brilhantes fixos** — escudo (01) e estádio (13) por time; sem estrelas ou slots 05/17
13. **Inventário imersivo** — modal sem chrome; filtros combináveis e preview ao clique
14. **Moldura do álbum aberto** — `Album Aberto.png` com boost 3.0; sem bleed nas páginas do flip
15. **Dados reais via proxy** — Classificação/Jogos/Estatísticas vêm da API pública da ESPN através do servidor (`/api/*`); front tem fallback offline e escudos reais
16. **Colar sem piscar** — figurinha colada aparece na hora pelo overlay (`<img>`); a recomposição do canvas (`updateFromImages`) é mascarada por um "print" do canvas (`showAlbumBookMask()`)
17. **Nitidez por DPR** — canvas do flipbook renderizado no `devicePixelRatio` (patch em `resizeCanvas`), pois o StPageFlip só usa 1× por padrão; metades em JPEG 0.96
18. **Progresso à prova de falhas** — carregamento com `try/catch` + `normalizeState()` e backup exportar/importar em `.json`

---

## Dependências

- **Node.js 18+** — servidor, builds e scripts (`npm install`)
- **sharp** — processamento de imagens nos builds
- **Navegador** — app é HTML/CSS/JS estático
- **CDN** — StPageFlip (`page-flip@2.0.7`), Tailwind, Font Awesome

```bash
npm install
```

---

## Problemas conhecidos / próximos passos

- **Atlético-MG** — página existe, figurinhas ainda não em `site/Times/Atletico Mineiro/Figurinhas/`
- **Contracapa** — opcional adicionar PNG dedicado (`capa-verso.png`) no lugar da página transparente
- **Detecção de slots** — se colagem desalinhar, ajustar coordenadas em `manifest.json` ou melhorar `detect_slots_from_image`
- **Novos times** — adicionar pasta em `site/Times/`, rodar builds, recarregar o site

---

## Checklist: adicionar um time

1. Criar `site/Times/<Nome>/Paginas Album/<spread>.png`
2. Gerar 20 figurinhas em `site/Times/<Nome>/Figurinhas/<SIGLA>1.png` … `20.png`
3. Garantir entrada no elenco (`site/data/elencos_serie_a_2026.json`)
4. Rodar `npm run build`
5. Testar no álbum: slots, colagem, flip capa → time → capa

---

## Checklist: trocar a capa

1. Salvar nova arte como `site/assets/Capa Album.png` (768×1024 recomendado)
2. `npm run build:capa`
3. Recarregar o site com **Ctrl+F5**

---

## Referência rápida — funções JS do álbum

| Função / constante | Papel |
|--------------------|--------|
| `COVER_PAGE_COUNT` | Número de páginas da capa no flipbook (2) |
| `ALBUM_OPEN_FRAME` / `ALBUM_OPEN_FRAME_BOOST` | Moldura `Album Aberto.png` atrás das páginas de time |
| `buildCoverPageImages()` | Monta `[página transparente, capa-frente]` para o PageFlip |
| `buildTransparentPageImage()` | Canvas PNG vazio para a metade esquerda da capa |
| `isOnCoverSpread()` | `true` se índice atual &lt; 2 |
| `teamIndexToPageIndex(n)` | Converte índice do time → índice no flipbook |
| `openAlbumView()` | Abre modal e prepara flipbook na capa |
| `changeAlbumPage(±1)` | Delega virada ao PageFlip |
| `syncAlbumPageFromFlip(i)` | Atualiza slots, label CAPA/sigla e estado |
| `openStickerPreview()` | Preview ampliado (álbum e inventário) |
| `initHubDeckReveal()` | Leque do hub: `hub-row--revealed` |
| `renderInventoryGrid()` | Grid + filtros do inventário |
| `initHubBgm()` / `toggleHubBgm()` | Trilha de fundo e botão `#music-fab` |
| `renderClassificacao()` / `renderJogos()` / `renderEstatisticas()` | Páginas informativas (fetch `/api/*` + fallback) |
| `infoTeamCrest()` / `infoCrestFallback()` | Escudo real com fallback para iniciais |
| `showAlbumBookMask()` / `hideAlbumBookMask()` | Máscara anti-piscada no recompor do flipbook |
| `patchAlbumCanvasDpr()` / `applyAlbumCanvasDpr()` | Renderiza o canvas do flipbook no `devicePixelRatio` (nitidez) |
| `defaultState()` / `normalizeState()` | Estado inicial padrão e saneamento de estado carregado/importado |
| `exportProgress()` / `importProgress()` | Backup do progresso em `.json` (exportar/importar) |

---

*Última atualização: julho de 2026 — nitidez das páginas em telas de alta densidade (canvas em `devicePixelRatio`, JPEG 0.96) e backup do progresso (exportar/importar `.json` + carregamento à prova de corrupção); páginas Classificação/Jogos/Estatísticas com dados reais da ESPN (proxy `/api/*`), escudos reais, colagem sem piscar, inventário tela cheia com filtros, brilhantes 01/13, moldura Album Aberto, trilha Champions of Brazil.*
