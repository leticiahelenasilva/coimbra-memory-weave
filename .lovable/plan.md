# Refinos: passo 5, hero CTA, scroll-stack e postal pixelado

## 1. Card do passo 5 (`Editor.tsx` painel direito) — match da referência

- Cabeçalho: "sentimento" em Inter regular cinza à esquerda; à direita, badge pulsante (já feito) + nome do sentimento em **itálico serif** (`font-serif-display italic`) na cor `variant.accent`. Border-bottom suave.
- Labels "Remetente" / "Destino" em Inter regular **capitalizado** (não uppercase, sem `font-mono-ui`, sem letter-spacing). text-base, cor ink.
- Inputs maiores (h-12), rounded-2xl, border sutil `border-border`, fundo branco, fonte Inter normal.
- Botões secundários renomeados: "Salvar como imagem" e "Enviar por e-mail" (Inter, capitalizado). Mantém `variant="secondary"`, h-12, rounded-full, ícone à direita. Empilhados (não 2 colunas).
- Botão principal "Enviar para o mural" (capitalizado, send à direita), h-14, rounded-full, bg-ink.
- Abaixo: separador `─── ou fale ───` (linha cinza + texto + linha), depois `● "Enviar para o mural"` (bolinha vermelha estática + texto entre aspas).
- Padding do card aumenta para p-8 e space-y-6 entre blocos.

## 2. CTA hero "Veja o que ficou de Coimbra" (`Onboarding.tsx`)

- Sentence case (não uppercase), Inter medium, sem `font-mono-ui` nem letter-spacing.
- Cor `#946D00`. Adicionar token `--gold-deep: 41 100% 29%` em `index.css` e cor `gold-deep` em `tailwind.config.ts`.
- Underline contínuo no texto + chevron animado abaixo.

## 3. Scroll-stack nas seções "Recolha cartões" e "Sobre o projeto"

- Criar `src/components/ScrollStack.tsx` inspirado em reactbits.dev/components/scroll-stack, usando `framer-motion` (`useScroll` + `useTransform` por item). Cada `<ScrollStackItem>` fica sticky no viewport e recebe leve `scale` + `translateY` conforme o progresso, criando o efeito de empilhar cards.
- Envolver as duas seções existentes ("postcards preview" + "about / voice status") com `<ScrollStack>` contendo 2 `<ScrollStackItem>`. Conteúdo, copy e botões intactos.

## 4. Postal: flip ao clicar + hover pixelado (`Editor.tsx`)

- Remover regra CSS `.flip-card:hover .flip-inner { transform: rotateY(180deg) }` em `index.css`. Manter só `.flip-card.is-flipped`.
- Estado local `flipped` no Editor; `onClick` no wrapper do postal alterna. `e.stopPropagation()` nos campos contentEditable e nas setas para não disparar flip ao editar/navegar.
- Criar `src/components/PixelCard.tsx` + `PixelCard.css` (variante CSS+JS pura inspirada em reactbits.dev/components/pixel-card): canvas absoluto sobre o card, no `mouseenter` anima uma grade de pixels coloridos aparecendo (fade-in escalonado), no `mouseleave` desfaz. Aceita prop `color` (usa `variant.accent`). `pointer-events: none` para não bloquear clique/edição.
- Wrappar o lado **front** do postal com `<PixelCard color={variant.accent}>`. Lado back não tem o efeito.

## 5. Arquivos afetados

- `src/index.css` — adiciona `--gold-deep`; remove `:hover` flip; mantém keyframes existentes.
- `tailwind.config.ts` — registra cor `gold-deep`.
- `src/components/steps/Onboarding.tsx` — CTA hero (case/cor/estilo) + envolve as duas seções com `<ScrollStack>`.
- `src/components/steps/Editor.tsx` — refina painel direito (tipografia, labels, copy/empilhamento dos botões, separador "ou fale"), adiciona estado `flipped` + onClick, wrappa front com `<PixelCard>`.
- `src/components/ScrollStack.tsx` (novo) — scroll-stack via framer-motion.
- `src/components/PixelCard.tsx` (novo) + `src/components/PixelCard.css` (novo) — efeito pixelado no hover.

## 6. Funcionamento preservado

Gravação, detecção de emoção, swipe de variantes, envio para o mural, reconhecimento de voz e atalhos de teclado permanecem intactos. Apenas tokens, markup e wrappers de animação mudam.
