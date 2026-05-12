## 1. Contraste AA do texto realçado (Editor.tsx)

O `<span>` com a frase editável usa um gradiente onde o `accent` (ex.: rosa neon `hsl(320 100% 65%)` para *euforia*) cobre o texto, mas a cor do texto continua a ser `variant.ink` (rosa escuro), o que falha WCAG AA — visível na imagem ("Tudo de bom que eu fiz Bêbado" sobre rosa).

Correções:
- Em vez do gradiente meio-fundo, aplicar o accent como **bloco de fundo sólido** (100%) atrás da frase, e usar uma **ink de alto contraste calculada por variante**.
- Adicionar a cada `Variant` em `src/data/emotions.ts` um campo opcional `highlightInk` (cor do texto quando o fundo é `accent`). Para variantes "noite" / accents claros, `highlightInk` será `NIGHT` (#1c…); para accents escuros, será `PAPER`. Auditar todas as 33 variantes garantindo contraste ≥ 4.5:1.
- No `Editor.tsx`, trocar o `linear-gradient(...)` por `background: variant.accent` e `color: variant.highlightInk ?? variant.bg`. Manter o mesmo `padding` para preservar o "marker" estético.
- Aplicar a mesma regra ao "selo PT'26" no canto (mesmo problema accent/ink).

## 2. Tela de carregamento entre Recording → Editor

Novo step `analyzing` que corre **antes** de `editor`, durante o qual a emoção é detetada **uma só vez** e fixada.

### Fluxo
- `Recording.onComplete(text)` → `setStep("analyzing")` (em vez de `"editor"`).
- Novo componente `src/components/steps/Analyzing.tsx`:
  - Recebe `memory` e `onDone(emotionKey)`.
  - Ao montar: chama `supabase.functions.invoke("detect-emotion", …)`. Em paralelo corre um timer mínimo de ~3.5s (para a animação respirar). Quando ambos terminam, chama `onDone(emotion)`.
  - Em caso de erro/timeout (>8s), faz fallback para `detectEmotion(text)` heurístico.
- `Index.tsx` guarda `emotionKey` no estado e passa-o para `Editor` como prop fixa.
- `Editor.tsx`: remover o `useEffect` que invoca `detect-emotion`; passar a receber `initialEmotion: EmotionKey` via props e usá-lo como estado inicial **sem reagir a mudanças de texto** (a emoção fica trancada, como pedido).

### Visual da tela (referência: imagem 5 — quadrado escuro com gradiente radial de pontos halftone)
- Fundo `bg-ink` (quase preto) ocupando o ecrã todo.
- Centro: cartão arredondado grande com **padrão halftone animado** (pontos cuja densidade/opacidade pulsam em onda radial) — implementado via SVG inline + `<motion.circle>` com `animate` em `opacity`/`r` decalado por índice, ou Canvas 2D com requestAnimationFrame se mais fluido. Sem libs novas — usar framer-motion já existente.
- Glow sutil radial atrás do cartão a mudar de cor lentamente (mapeado a 3-4 hues neutros).
- No meio do cartão, frases que rodam (cross-fade a cada ~1.4s):
  1. "identificando sentimento"
  2. "cuidando da sua memória"
  3. "gerando postal"
- Tipografia: `font-mono-ui text-xs uppercase tracking-[0.3em]` para o eyebrow + `font-serif italic` grande para a frase rotativa.
- Pequena barra de progresso indeterminada na base do cartão.

## 3. Navegação por URL (/passo1 … /passo4)

`App.tsx` continua single-route. Em vez de adicionar rotas múltiplas, usar **um parâmetro de rota opcional** mapeado para o estado `step` em `Index.tsx`.

- Adicionar rotas em `App.tsx`: `/`, `/passo1`, `/passo2`, `/passo3`, `/passo4`, `/passo5` → todas renderizam `<Index />`.
- `Index.tsx` lê `useLocation()`/`useParams()` e mapeia:
  - `/` ou `/passo1` → `onboarding`
  - `/passo2` → `mural`
  - `/passo3` → `recording`
  - `/passo4` → `analyzing` (se faltar texto, redireciona para `/passo3`)
  - `/passo5` → `editor` (se faltar texto/emoção, redireciona para `/passo3`)
- Cada transição interna chama `navigate("/passoN")` em vez de só `setStep`. Um `useEffect` sincroniza URL ↔ estado para que recarregar a página mantenha o passo (com fallback gracioso quando faltam dados).
- Memória/emoção persistem em `sessionStorage` para que `/passo5` recarregado consiga reconstruir o estado mínimo durante edições/testes.

> Nota: como pediste "passo1…passo4", uso `passo4` para a tela de loading e `passo5` para o editor. Se preferires manter só 4 passos visíveis, posso esconder o loading da numeração e usar `/passo4` direto para o editor — confirma se quiseres essa variante.

## Ficheiros tocados
- `src/data/emotions.ts` — adiciona `highlightInk` por variante; ajustes de contraste.
- `src/components/steps/Editor.tsx` — usa `highlightInk`, fundo sólido; remove auto-detect; aceita `initialEmotion`.
- `src/components/steps/Analyzing.tsx` — **novo**, animação halftone + frases rotativas + chamada à edge function.
- `src/pages/Index.tsx` — novo step `analyzing`, guarda `emotionKey`, sincroniza com URL.
- `src/App.tsx` — rotas `/passo1`..`/passo5`.
