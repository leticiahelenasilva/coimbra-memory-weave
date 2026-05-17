# Estrutura e padrões do projeto

Este documento registra a auditoria da estrutura atual do projeto `coimbra-memory-weave` e serve como guia para criar novos arquivos, pastas e comentários de código em português.

## Visão geral

O projeto é uma aplicação frontend em React + TypeScript com Vite, Tailwind CSS, shadcn/ui, Framer Motion, Three.js/WebGL e Supabase Edge Functions. A experiência principal é um memorial digital interativo sobre Coimbra, organizado como um fluxo de etapas: onboarding, mural, gravação, análise emocional, editor de postal e confirmação de envio.

## File structure

```txt
.
├── README.md
├── assets/
│   └── postal.png
├── components.json
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
├── bun.lock
├── bun.lockb
├── postcss.config.js
├── structure.md
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── vitest.config.ts
├── public/
│   ├── favicon.ico
│   ├── placeholder.svg
│   └── robots.txt
├── src/
│   ├── App.tsx
│   ├── App.css
│   ├── index.css
│   ├── main.tsx
│   ├── vite-env.d.ts
│   ├── components/
│   │   ├── Fog.tsx
│   │   ├── NavLink.tsx
│   │   ├── PixelBlast.css
│   │   ├── PixelBlast.jsx
│   │   ├── PixelCard.css
│   │   ├── PixelCard.tsx
│   │   ├── ScrollStack.tsx
│   │   ├── Stack.css
│   │   ├── Stack.test.tsx
│   │   ├── Stack.tsx
│   │   ├── Stamp.tsx
│   │   ├── steps/
│   │   │   ├── Analyzing.tsx
│   │   │   ├── Editor.tsx
│   │   │   ├── MemoryMural.tsx
│   │   │   ├── Onboarding.tsx
│   │   │   ├── Recording.tsx
│   │   │   └── Sent.tsx
│   │   └── ui/
│   │       └── componentes shadcn/ui e Radix
│   ├── data/
│   │   ├── emotions.ts
│   │   └── memories.ts
│   ├── hooks/
│   │   ├── use-toast.ts
│   │   ├── use-mobile.tsx
│   │   ├── useHandSwipe.ts
│   │   ├── useMicAmplitude.ts
│   │   └── useSpeechRecognition.ts
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts
│   │       └── types.ts
│   ├── lib/
│   │   └── utils.ts
│   ├── pages/
│   │   ├── Index.tsx
│   │   └── NotFound.tsx
│   └── test/
│       ├── example.test.ts
│       └── setup.ts
└── supabase/
    ├── config.toml
    └── functions/
        └── detect-emotion/
            └── index.ts
```

## Responsabilidades por área

`src/main.tsx` monta a aplicação React no DOM e importa `src/index.css`.

`src/App.tsx` configura providers globais, toasts, tooltips, React Query e rotas. As rotas `/`, `/passo1` a `/passo6` apontam para `Index`, e a rota `*` aponta para `NotFound`.

`src/pages/Index.tsx` é o orquestrador do fluxo principal. Ele controla o estado da etapa atual, sincroniza rota e estado, persiste memória/emoção no `sessionStorage` e renderiza os componentes de `src/components/steps`.

`src/components/steps/` contém telas de fluxo com responsabilidade de produto: `Onboarding`, `MemoryMural`, `Recording`, `Analyzing`, `Editor` e `Sent`. Novas etapas do fluxo devem entrar aqui. O `Onboarding` usa `assets/postal.png` como imagem principal do postal animado.

`src/components/` contém componentes reutilizáveis de experiência visual e navegação, como névoa, selos, stack de scroll, stack interativo de postais, cartões pixelados e efeitos WebGL.

`src/components/ui/` contém componentes base shadcn/ui. Esses arquivos devem continuar genéricos, reaproveitáveis e sem regras específicas do memorial, exceto ajustes visuais compatíveis com o design system.

`src/data/` concentra dados e regras de domínio leves. `emotions.ts` define emoções, variantes visuais, palavras-chave e heurística local. `memories.ts` define frases-semente do mural.

`src/hooks/` concentra lógica reutilizável ligada ao navegador: reconhecimento de voz, amplitude do microfone, gesto por câmera, toast e breakpoint mobile. Hooks que interagem com APIs com suporte desigual entre browsers devem declarar tipos locais mínimos em vez de recorrer a `any`.

`src/integrations/supabase/` guarda cliente e tipos Supabase. `client.ts` e `types.ts` têm perfil de arquivo gerado; edições manuais devem ser evitadas.

`supabase/functions/detect-emotion/` contém a Edge Function Deno que classifica a emoção via Lovable AI Gateway e devolve `{ emotion, confidence }`.

`src/test/` contém setup e testes Vitest. O teste atual é apenas um smoke test.

## Padrões de código encontrados

Importações usam alias `@/*` para arquivos dentro de `src`, configurado em `vite.config.ts`, `vitest.config.ts` e `tsconfig.app.json`.

Componentes React são majoritariamente funções exportadas por nome, com `interface Props` local quando necessário. Páginas usam export default.

O fluxo principal usa strings tipadas para etapas (`Step`) e mapas explícitos `STEP_TO_PATH` e `PATH_TO_STEP`. Qualquer nova etapa deve atualizar esses mapas e também as rotas em `src/App.tsx`.

Estado temporário da experiência fica no `sessionStorage`, com chaves prefixadas por `oqfc:`. Novas chaves devem manter esse prefixo.

Animações usam Framer Motion e classes utilitárias do Tailwind. Animações globais e utilitários de marca ficam em `src/index.css`.

O design system usa variáveis CSS HSL em `src/index.css`, expostas no Tailwind por `tailwind.config.ts`. Novas cores devem ser criadas como variáveis HSL antes de virar token Tailwind.

Componentes shadcn/ui seguem o padrão Radix + `class-variance-authority` + utilitário `cn` de `src/lib/utils.ts`.

Efeitos visuais complexos ficam isolados: Canvas em `PixelCard.tsx`, WebGL/Three.js em `PixelBlast.jsx`, CSS próprio nos arquivos `.css` correspondentes.

Hooks que acessam APIs de navegador fazem limpeza de recursos no retorno do `useEffect`, especialmente streams de microfone/câmera, timers e `requestAnimationFrame`. Falhas esperadas de APIs como Web Speech e AudioContext podem ser ignoradas pontualmente, desde que o motivo esteja explícito em comentário curto.

Tratamento de falhas favorece fallback local: se a Edge Function de emoção falhar, `Analyzing` usa `detectEmotion(memory).key`.

Textos da interface estão em português, com tom memorial/poético. Novos textos devem manter português europeu quando estiverem ligados à experiência do utilizador.

## Padrões de testes e build

Scripts principais:

```txt
npm run dev       # servidor Vite em porta 8080
npm run build     # build de produção
npm run build:dev # build em modo development
npm run lint      # ESLint
npm run test      # Vitest em modo run
npm run test:watch # Vitest em modo watch
npm run preview   # preview local do build
```

Vitest roda em `jsdom` e carrega `src/test/setup.ts`, que simula `window.matchMedia`.

Ao adicionar lógica de domínio em `src/data` ou hooks com comportamento determinístico, criar testes `*.test.ts` ou `*.test.tsx` próximos do código ou dentro de `src/test`, seguindo o padrão configurado em `vitest.config.ts`.

Estado da validação nesta auditoria:

```txt
npm run test  # passou; existe 1 teste placeholder
npm run build # passou; resta aviso de bundle JS grande
npm run lint  # passou com 7 avisos de Fast Refresh em componentes shadcn/ui
```

Antes de finalizar mudanças futuras, rode `npm run test` e `npm run build`. Rode também `npm run lint`; erros devem ser tratados no arquivo tocado, e os avisos remanescentes de Fast Refresh podem ser endereçados numa limpeza focada dos componentes shadcn/ui.

## Como criar novos arquivos e pastas

Crie novas telas de fluxo em `src/components/steps/NomeDaEtapa.tsx`. Depois atualize `Step`, `STEP_TO_PATH`, `PATH_TO_STEP` e o render condicional em `src/pages/Index.tsx`, além das rotas em `src/App.tsx`.

Crie componentes reutilizáveis de experiência em `src/components/NomeDoComponente.tsx`. Se o componente tiver CSS específico e extenso, use `src/components/NomeDoComponente.css` e importe esse CSS somente no componente.

Crie componentes base genéricos em `src/components/ui/` apenas quando forem peças reutilizáveis de design system. Não coloque lógica de domínio nessa pasta.

Crie hooks reutilizáveis em `src/hooks/useNome.ts` ou `src/hooks/useNome.tsx`. Hooks devem aceitar opções explícitas, limpar efeitos colaterais e devolver estado mínimo e nomeado.

Crie dados de domínio em `src/data/nome.ts`. Prefira tipos exportados, objetos `as const` quando útil e funções puras para regras heurísticas.

Crie integrações externas em `src/integrations/<servico>/`. Separe cliente, tipos e helpers. Arquivos gerados devem ter comentário no topo indicando que não devem ser editados manualmente.

Crie funções Supabase em `supabase/functions/<nome-da-funcao>/index.ts`. A função deve responder `OPTIONS`, usar `corsHeaders`, validar payload, retornar JSON e ter fallback ou erro explícito.

Crie testes como `*.test.ts` ou `*.test.tsx`, cobrindo principalmente regras puras, hooks críticos e regressões de fluxo.

Evite criar pastas novas na raiz sem necessidade. A raiz deve permanecer reservada para configuração, documentação, `src`, `public` e `supabase`.

## Regras de estilo para novos arquivos

Use TypeScript para novos arquivos React sempre que possível. `PixelBlast.jsx` é exceção técnica por ser um componente WebGL com `@ts-nocheck`; novas exceções precisam de justificativa clara.

Use `@/` para imports internos em vez de caminhos relativos longos.

Mantenha componentes de etapa focados no fluxo daquela etapa. Extraia funções puras, cálculos de cor, parsing e lógica de navegador para helpers ou hooks quando começarem a crescer.

Preserve acessibilidade básica: textos `sr-only` quando necessários, botões reais para ações, `aria-hidden` em elementos puramente decorativos e foco previsível.

Não edite `src/integrations/supabase/types.ts` manualmente. Atualize-o por geração Supabase quando o schema mudar.

Não coloque segredos no código. A Edge Function deve ler chaves por `Deno.env`, e o frontend deve usar apenas variáveis públicas `VITE_*`.

## Agente de comentários em português

O agente de comentários deve revisar código novo ou alterado e comentar em português somente quando o comentário ajudar a entender uma decisão, uma regra de domínio, um fallback ou uma integração com API do navegador.

Comentários recomendados:

```ts
// Mantém a etapa sincronizada com a URL para suportar voltar/avançar do navegador.
// Fallback local quando a classificação remota não responde a tempo.
// Liberta o stream imediatamente; a Web Speech API abre a própria captura depois.
```

Comentários a evitar:

```ts
// Incrementa i.
// Renderiza botão.
// Define variável.
```

O agente deve manter os comentários curtos, objetivos e em português. Comentários existentes em inglês podem ser convertidos quando o arquivo for tocado por uma mudança relevante, mas não é necessário editar arquivos apenas para traduzir comentários.

Ao revisar, o agente deve priorizar:

1. Fluxo e estado em `src/pages/Index.tsx`.
2. Efeitos colaterais e limpeza em `src/hooks/`.
3. Fallbacks de emoção em `src/components/steps/Analyzing.tsx` e `src/data/emotions.ts`.
4. Acessibilidade e responsividade em componentes visuais.
5. Fronteiras entre UI genérica (`src/components/ui`) e lógica de produto (`src/components/steps`, `src/data`).

## Observações da auditoria

`src/App.css` parece conter CSS padrão do template Vite e não é importado pelo fluxo atual. Se não houver uso planejado, pode ser removido em uma limpeza futura.

Há `package-lock.json`, `bun.lock` e `bun.lockb` no repositório. É recomendável escolher um gerenciador de pacotes principal para reduzir divergência de lockfile.

O teste atual é apenas demonstrativo. Para aumentar confiança, os primeiros testes úteis devem cobrir `detectEmotion`, parsing de HSL/contraste no editor e guardas de navegação do fluxo.

A configuração TypeScript está permissiva (`strict: false`, `noImplicitAny: false`). Novos arquivos devem ainda assim evitar `any`. Para APIs do navegador sem tipos completos no ambiente, prefira interfaces locais pequenas, como nos hooks de voz e microfone.

O `@import` de fontes em `src/index.css` foi movido para antes das diretivas Tailwind. O build atual ainda avisa sobre bundle grande, principalmente esperado pelo uso de Three.js/postprocessing, mas vale acompanhar se novas dependências pesadas forem adicionadas.

O lint atual não tem erros. Restam avisos de Fast Refresh em alguns componentes shadcn/ui que exportam componentes e constantes no mesmo arquivo; corrigir isso exige uma limpeza própria para separar exports compartilhados sem mexer no comportamento.
