## Ajustes — O que fica de Coimbra

### 1. Microfone não escreve a frase
Causa provável: o hook `useSpeechRecognition` recria a instância sempre que `enabled` muda (a dependência `enabled` está no `useEffect` que cria o objeto), o que apaga o reconhecedor mid-stream. Além disso, mais de um componente (Onboarding + Recording/Editor) instanciam reconhecedores simultâneos — a Web Speech API só permite um por vez, então o segundo falha silenciosamente.

Fix em `src/hooks/useSpeechRecognition.ts`:
- Separar a criação do `SpeechRecognition` (depende apenas de `lang`) do start/stop (depende de `enabled`).
- Garantir cleanup robusto via `onend` sem auto-restart agressivo.
- Adicionar `console.warn` em `onerror` para diagnóstico.

### 2. Remover a tela "passo 03 / à escuta / ativar microfone"
- Eliminar os estados `idle` e `armed` de `Recording.tsx`. Ao montar, o componente já entra direto no modo "a gravar" (transcrição em tempo real, barra de amplitude, botão "guardar memória").
- Em `Onboarding.tsx`: detectar "o que fica de Coimbra" e chamar `onVoiceTrigger()` → `Index.tsx` passa para `recording`, que agora é a tela de captura imediata (igual à image-3).
- Garantir que o SR do Onboarding é desligado (setArmed(false) + reset) antes da navegação, para libertar o microfone para a tela de gravação.

### 3. Frase exibida durante a gravação
- O texto principal passa a ter sempre o prefixo fixo "O que fica de Coimbra é…" seguido da transcrição em tempo real (com itálico/serif a destacar a parte falada). O prefixo nunca desaparece, mesmo quando ainda não há transcrição.
- Ao "guardar memória", continuamos a passar apenas a parte falada (limpa via `cleanMemory`) para o editor — o cartão final continua a montar a frase completa sem duplicação.

### 4. Comando "enviar para o mural" no editor não funciona
- O reconhecedor está provavelmente bloqueado por uma instância anterior (ver #1). Após o fix do hook, validar.
- Tornar a deteção mais tolerante: normalizar acentos e aceitar variantes ("enviar para o mural", "enviar pro mural", "envia para o mural", "manda para o mural"). Regex: `/envi[ae]r?\s+(para|pro|p'ro)\s+o?\s*mural/`.
- Adicionar feedback visual: um pequeno indicador "à escuta · diz 'enviar para o mural'" com ponto pulsante quando o SR está ativo.

### 5. Frases do mural rolante (agrupadas por emoção)
- Substituir o array `SEED_MEMORIES` em `src/data/memories.ts` por uma nova lista tipada `EMOTION_SEEDS: { text: string; emotion: EmotionKey }[]` com 3–4 frases curtas por emoção (alegria, euforia, gratidão, serenidade, paixão, raiva, melancolia, medo, frustração, saudade, nostalgia) — total ~30–35 frases poéticas inspiradas em Coimbra.
- Manter export `SEED_MEMORIES` (derivado, só os textos) para compatibilidade com `MemoryMural.tsx`.
- Em `Onboarding.tsx`, o marquee passa a colorir cada frase com a cor/tipografia da sua emoção (usando `EMOTIONS[key]`): fundo `accent` translúcido + `fontCls`. Isto cria coerência visual com o editor.

### Ficheiros a tocar
```text
src/hooks/useSpeechRecognition.ts   (refactor — fix mic)
src/components/steps/Recording.tsx  (remover idle/armed; auto-start; prefixo fixo)
src/components/steps/Onboarding.tsx (marquee colorido por emoção; desligar SR ao navegar)
src/components/steps/Editor.tsx     (regex mais tolerante para "enviar para o mural"; indicador visual)
src/data/memories.ts                (novo EMOTION_SEEDS + SEED_MEMORIES derivado)
```

Sem mudanças de fluxo no `Index.tsx`.
