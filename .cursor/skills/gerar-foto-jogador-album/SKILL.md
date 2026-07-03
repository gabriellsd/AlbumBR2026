---
name: gerar-foto-jogador-album
description: >-
  Gera foto frontal de jogador no estilo figurinha do álbum BR2026: recorta o
  rosto, gera com identidade correta e ajusta cabeça/olhar de frente. Mantém
  uniforme original. Use quando pedir jogador de frente, padronizar enquadramento,
  criar figurinha ou melhorar semelhança facial.
---

# Gerar foto frontal de jogador (álbum BR2026)

Fluxo **validado e aprovado** com Julimar (Athletico) + Vitor Roque (Palmeiras) como referência de pose.

## Resumo do fluxo

1. Recortar rosto da foto original
2. Gerar imagem com 3 referências (rosto → uniforme → pose)
3. Se o rosto ficar em ângulo, **regenerar** com prompt de cabeça frontal reforçado
4. Salvar rascunho como `<Nome>_frente.png`
5. **Finalizar:** renomear para `<Nome>.png` e apagar intermediários

## Quando usar

- Jogador em ângulo lateral e precisa ficar de frente
- Padronizar enquadramento entre times
- Priorizar semelhança facial com a foto original

## Não usar

- Composição por camada quando a camisa original está em ângulo
- Geração só com foto inteira, sem recorte de rosto

---

## Passo 1 — Recortar rosto

Recortar manualmente ou com ferramenta de edição/IA a partir de:

`times/<Time>/Jogadores do Album/<Posição>/<Nome>/<Nome>.jpg`

Salvar na pasta do jogador:

- `<Nome>_rosto_crop.png` — identidade (usar na geração)
- `<Nome>_rosto.png` — rosto com alpha (backup, opcional)

Referência de pose padrão: `times/Palmeiras/Jogadores do Album/Atacantes/Vitor Roque/Vitor Roque.png`

---

## Passo 2 — Gerar imagem

Usar `GenerateImage` com **3 referências nesta ordem**:

1. `<Nome>_rosto_crop.png` — identidade facial (prioridade máxima)
2. Foto original do jogador — uniforme e detalhes da camisa
3. Referência de pose (ex.: Vitor Roque) — enquadramento frontal, fundo preto

### Prompt final (usar este — versão aprovada)

Substituir `[NOME]` e `[TIME]`. Inclui identidade + cabeça frontal obrigatória:

```
Create a photorealistic studio portrait of Brazilian football player [NOME] from [TIME].

CRITICAL IDENTITY: Face MUST exactly match the face crop reference — same person, same facial features, skin tone, hair. Do not change identity.

CRITICAL POSE — HEAD FACING FORWARD: The head must be perfectly frontal, NOT turned or at three-quarter angle. Both ears equally visible or symmetric. Nose pointing straight at camera. Eyes looking directly into the lens. Chin level. Shoulders square to camera. Body facing forward like a passport photo. Match the straight-on frontal pose of the pose reference exactly — no head tilt, no looking over shoulder, no angled face.

Framing: waist-up medium shot, centered, arms at sides, solid black studio background, even professional lighting, Panini sticker album style. Show full torso from waist to head — do NOT crop tight on chest. Top of shorts visible at bottom. Match body scale of pose reference.

CRITICAL UNIFORM — EXACT MATCH FROM ORIGINAL PHOTO: Copy EXACTLY the same jersey, shorts and kit from the original player photo (uniform reference). Same colors, stripe pattern, collar, sleeves, logos and sponsors. Do NOT substitute a different kit or generic template.

Photorealistic sports photography. Wide panoramic aspect ratio.
```

Ajustar expressão no prompt se o usuário pedir (sorriso, sério, etc.).

### Se a 1ª geração acertar o rosto mas inclinar a cabeça

Regenerar com o **mesmo prompt final** acima. O bloco `CRITICAL POSE — HEAD FACING FORWARD` é o que corrige o olhar/ângulo sem perder a identidade.

---

## Passo 4 — Finalizar (padrão obrigatório)

Após aprovação do usuário:

1. Renomear `<Nome>_frente.png` → `<Nome>.png`
2. **Apagar** todos os intermediários
3. Manter **somente** `<Nome>.jpg` (original) e `<Nome>.png` (final)

Arquivos removidos na finalização:

- `<Nome>_frente.png` (vira `<Nome>.png`)
- `<Nome>_rosto_crop.png`
- `<Nome>_rosto.png`
- `<Nome>_rosto_test.png`
- `<Nome>_composito.png`
- `<Nome>_camiseta.png`

---

## Estrutura final da pasta

```
<Nome>/
  <Nome>.jpg   ← original (sempre manter)
  <Nome>.png   ← foto frontal finalizada
```

---

## Exemplo real (Julimar — aprovado)

```
Entrada:     times/Athletico Paranaense/.../Julimar/Julimar.jpg
Ref pose:    times/Palmeiras/.../Vitor Roque/Vitor Roque.png
Saída final: Julimar.png (+ Julimar.jpg original)
```

---

## Referência de pose

`times/Palmeiras/Jogadores do Album/Atacantes/Vitor Roque/Vitor Roque.png`
