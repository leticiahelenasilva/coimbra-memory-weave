# Refino visual global + novo header

## 1. Header (Onboarding.tsx) conforme a imagem

Substituir a navbar atual (pílula central com borda) por um header horizontal full-width:

- Esquerda: wordmark "O que fica de *Coimbra*" — "Coimbra" em itálico serif (Cormorant), restante em Inter regular, na cor `ink`.
- Direita (na mesma linha): links **Postais**, **Mural de memórias**, **Sobre o projeto** em Inter medium, cor `ink/80`, sem uppercase nem letter-spacing exagerado, hover apenas escurece a cor.
- À direita do tudo: CTA pílula amarela **"Fale o que fica de Coimbra"** com ícone de mic sem o círculo escuro. Sem `shadow`, sem `hover:scale`.
- Sem border, sem card, sem backdrop-blur. Padding generoso (px-10, py-6).
- Mantém o trigger de voz e o `scrollToMural` existentes.

## 2. Tipografia padrão Inter

`tailwind.config.ts` → trocar `fontFamily.serif` para uso opcional. `index.css` body já usa Inter — manter. Auditar componentes que usam `font-serif` em UI utilitária e trocar para Inter:

- Inputs do Editor (`font-serif italic` nos inputs/labels do painel direito) → Inter.
- Texto "à escuta", legendas, parágrafos do Onboarding hero secundário, labels do Sent → Inter.
- **Manter serif/artístico em**: hero `<h1>` "O que fica de Coimbra", postal (front+back), tela Analyzing (PixelBlast text), wordmark do header, marquee tipográfico das memórias.

## 3. Botões (`src/components/ui/button.tsx` + usos)

- Remover `shadow*` de todas variantes/usos (`shadow-md`, `shadow-postcard` em botões).
- Remover `transition-transform`/`hover:scale-*` de todos os botões.
- Variant `outline`: trocar `hover:bg-accent hover:text-accent-foreground` (que está roxo via lilac) por `hover:bg-muted hover:text-ink`. Idem `ghost`.
- Variant `secondary`: garantir que use cinza neutro, não lilac. Adicionar token `--secondary: 30 6% 92%` (cinza quente) e `--secondary-foreground: 30 8% 12%`. Botões secundários no app passam a usar `variant="secondary"` (preenchido cinza), não `variant="outline"`.
- Auditar `Editor.tsx` (botões "guardar png", "enviar email") → trocar `variant="outline"` por `variant="secondary"`, remover bordas custom.
- Amarelo dos botões vira: #FFFA6E

## 4. Sombras mais suaves

`index.css`:

- `--shadow-postcard`: reduzir para `0 1px 2px hsl(30 10% 50% / 0.04), 0 8px 24px -12px hsl(30 10% 30% / 0.10)`.
- `--shadow-soft`: `0 1px 4px hsl(30 10% 30% / 0.04)`.
- Remover `shadow-md` hardcoded das stacked postcards no hero (substituir por `border` sutil) e de outros locais que ainda usam `shadow-md`/`shadow-lg` Tailwind.

## 5. Hierarquia por cor sólida + mais respiro

- Trocar containers que usam `border border-border bg-card/60 backdrop-blur` por `bg-card` sólido sem borda (Editor painel direito, MemoryMural, etc.).
- Aumentar padding base de seções (px-10 py-12 → py-16 onde couber).
- Garantir que `bg-background` permaneça off-white claro e `bg-card` seja branco puro (`--card: 0 0% 100%`) para criar a hierarquia "card branco sobre fundo cinza" pedida. Ajustar `--background` para `30 6% 96%` (cinza quente claro) e `--card: 0 0% 100%`.
- Remover bordas decorativas redundantes (ex.: `border-y` de seções) onde a cor já separa.

## 6. Funcionamento

Nada de lógica é alterada: roteamento /passo1-6, fluxo de gravação, detecção de emoção, postal, mural, envio — tudo intacto. Apenas tokens, classes utilitárias e markup do header.

## Arquivos afetados

- `src/index.css` — tokens (background/card/secondary), sombras.
- `tailwind.config.ts` — (sem mudança de fonte default; Inter já é sans).
- `src/components/ui/button.tsx` — variants outline/ghost/secondary.
- `src/components/steps/Onboarding.tsx` — header novo + remover shadow-md das postcards.
- `src/components/steps/Editor.tsx` — botões secondary, remover serif italic dos inputs/labels.
- `src/components/steps/MemoryMural.tsx`, `Recording.tsx`, `Sent.tsx`, `Analyzing.tsx` — auditoria de shadow/hover/scale/serif em UI não-artística.