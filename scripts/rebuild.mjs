import { gerarCapaAlbum } from "./gerar-capa-album.mjs";
import { gerarAssets } from "./gerar-assets.mjs";
import { buildCatalogo } from "./build-catalogo.mjs";
import { buildPaginas } from "./build-paginas.mjs";

export async function rebuildAll() {
  console.log("[build] gerar-capa-album");
  await gerarCapaAlbum();
  console.log("[build] gerar-assets");
  await gerarAssets();
  console.log("[build] build-catalogo");
  buildCatalogo();
  console.log("[build] build-paginas");
  await buildPaginas();
}
