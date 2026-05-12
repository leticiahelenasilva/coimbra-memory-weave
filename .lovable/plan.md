## Alterações planejadas

### 1. Tirar "fala agora" (Recording.tsx)
Remover o placeholder italic "fala agora" enquanto não há transcrição. Mantém apenas "O que fica de Coimbra é…" + cursor piscante sutil.

### 2. Microfone direto ao entrar (Onboarding.tsx + Index.tsx)
- No `Index.tsx`, inicializar com `armed=true` desde o `onboarding`. Pedir permissão automaticamente ao montar (chamando `getUserMedia` uma vez para forçar prompt do navegador) e ativar `useSpeechRecognition` imediatamente.
- O botão preto do header passa a ser apenas indicador visual de status (mic já ativo). O trigger "o que fica de Coimbra" continua a saltar para gravação.
- Se o utilizador negar a permissão, mostrar fallback "ativar microfone" no header.

### 3. Otimizar reconhecimento de voz (useSpeechRecognition.ts)
- Reduzir latência: emitir transcript intermédio mais agressivamente (já é interim, mas garantir que `setInterim` aciona render imediato sem batching).
- Adicionar `maxAlternatives = 1` e re-iniciar o reconhecedor mais rapidamente em `onend` (debounce 100ms em vez de imediato para evitar loops).
- Detectar erro `network` / `audio-capture` e tentar reiniciar uma vez.
- Usar `lang="pt-PT"` mas adicionar fallback `pt-BR` se `pt-PT` falhar com `language-not-supported`.
- Garantir que o estado `interim` é limpo apenas quando chega um `final`, evitando "flicker" que parece atraso.

### 4. Análise semântica de emoção via Gemini (nova edge function)
- Ativar Lovable Cloud (necessário para edge functions).
- **Importante**: o Lovable AI Gateway já dá acesso a `google/gemini-3-flash-preview` sem o utilizador precisar de chave própria. Vou usar isto por defeito (mais simples, sem expor secret). Se mesmo assim o utilizador preferir uma chave Gemini própria, posso alternar — confirmar abaixo.
- Criar `supabase/functions/detect-emotion/index.ts` que recebe `{ text }`, chama Gemini com structured output (`Output.object` com schema `{ emotion: enum dos 11 EmotionKey, confidence: number }`) e devolve a chave.
- Em `Editor.tsx`: substituir `detectEmotion(text)` síncrono por chamada à edge function via `supabase.functions.invoke('detect-emotion', ...)`. Enquanto carrega, usar a detecção por keywords atual como placeholder. Sem nenhum novo elemento de UI — só as variantes/cores já definidas em `EMOTIONS` mudam quando a resposta chega.
- Manter `detectEmotion` keyword-based como fallback offline.

### 5. Postal editável no card + contraste acessível (Editor.tsx + emotions.ts)
- No card frontal: tornar o texto da memória `contentEditable` (com `suppressContentEditableWarning`), mantendo o prefixo "o que fica de Coimbra é" não-editável. Sincroniza com `cleanedMemory` em estado local.
- Tornar editáveis também (no verso): remetente e destino directamente sobre as linhas pontilhadas — manter os inputs do painel lateral em sync.
- Auditoria de contraste em `EMOTIONS`: revisar pares ink/bg e accent/ink que falham WCAG AA (4.5:1 para texto normal, 3:1 para texto grande). Casos a ajustar:
  - `gratidao` ink `hsl(175 55% 35%)` sobre paper — borderline; escurecer.
  - `medo` accent `hsl(270 60% 75%)` como destaque/sublinhado — clarear o accent ou escurecer ink para o highlight ler bem.
  - `frustracao` `hsl(22 90% 50%)` sobre paper — borderline para texto pequeno; escurecer ink no fundo claro.
  - `nostalgia` ink `hsl(340 35% 45%)` — escurecer ligeiramente.
  - Variantes "noite" — verificar accent vs ink.
- O `accent` usado como background do highlight da memória passa a ter opacidade maior (e.g. `99` em vez de `55`) ou ink contrastante quando o accent é claro demais.

### Detalhes técnicos
- Edge function usa `createLovableAiGatewayProvider` + `generateText` com `Output.object` e `google/gemini-3-flash-preview`.
- Schema Zod: `z.object({ emotion: z.enum([...EMOTION_KEYS]), confidence: z.number().min(0).max(1) })`.
- Sem alteração de fluxo entre passos.

### Ficheiros tocados
- `src/components/steps/Recording.tsx`
- `src/components/steps/Onboarding.tsx`
- `src/pages/Index.tsx`
- `src/hooks/useSpeechRecognition.ts`
- `src/components/steps/Editor.tsx`
- `src/data/emotions.ts`
- `supabase/functions/detect-emotion/index.ts` (novo)
- `supabase/functions/_shared/ai-gateway.ts` (novo, helper)

### Confirmação necessária
Para a detecção semântica, vou usar **Lovable AI Gateway com Gemini 3 Flash** (sem precisar pedir chave Gemini ao utilizador, já vem incluído). Se preferires mesmo usar a tua própria chave Gemini, diz e troco para `add_secret` + `GEMINI_API_KEY`.