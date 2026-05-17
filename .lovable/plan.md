# Backend — guardar memórias e postais

Backend via Lovable Cloud (sem autenticação de utilizadores). Permite gravar memórias enviadas, classificadas por sentimento, e exibir um carrossel curado de postais aprovados na home.

## 1. Base de dados

Tabela única `postcards` (pública, RLS restritivo):

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | `gen_random_uuid()` |
| `memory` | text | obrigatório, 1–600 chars |
| `emotion` | text | uma das 11 chaves de `emotions.ts` |
| `confidence` | numeric(3,2) | 0–1, da IA |
| `language` | text | ex. `pt`, detetado pela IA |
| `sender` | text | opcional, ≤80 chars |
| `recipient` | text | opcional, ≤80 chars |
| `status` | text | `pending` \| `approved` \| `rejected`, default `pending` |
| `featured` | boolean | default `false` — destaque manual |
| `ip_hash` | text | SHA-256(IP + salt secreto), nunca o IP em claro |
| `created_at` | timestamptz | default `now()` |

Índices: `(status, featured, created_at desc)`, `(ip_hash, created_at)`.

**RLS:**
- `SELECT`: público, apenas linhas com `status = 'approved'`, e apenas colunas seguras (via view `public_postcards` que esconde `ip_hash`, `status`, `confidence`, `language`).
- `INSERT`/`UPDATE`/`DELETE`: bloqueados ao público. Toda escrita passa por edge functions com service role.

## 2. Edge functions

**`submit-postcard`** (público, sem JWT)
1. Valida payload com Zod (`memory`, `sender?`, `recipient?`).
2. Calcula `ip_hash` a partir do `x-forwarded-for` + secret `IP_HASH_SALT`.
3. Rate limit permissivo: rejeita se houver ≥10 inserts do mesmo `ip_hash` na última hora (consulta direta à tabela).
4. Chama Lovable AI (Gemini flash) com structured output → `{ emotion, confidence, language }`. Fallback para `detect-emotion` local se falhar.
5. Insere com `status='pending'`. Devolve `{ id }`.

**`detect-emotion`** — já existe, mantém-se para o passo 4 visual.

**Sem UI de admin:** moderação é feita direto na tabela via Lovable Cloud (aprovar = `status='approved'`, destacar = `featured=true`).

## 3. Carrossel — curadoria "featured + rotativo"

Endpoint de leitura: query direta do client à view `public_postcards` (RLS deixa passar só aprovados).

Lógica no front (`Onboarding.tsx`, secção "Recolha cartões"):
1. Busca todos os `featured=true` (limite 8), ordenados por `created_at desc`.
2. Busca os 12 mais recentes não-featured.
3. Mistura: featured primeiro, depois rotação dos recentes. Total ~12–16 postais no carrossel.
4. Cada slide renderiza o mesmo componente de postal do passo 5/6, com a paleta da emoção e a memória.

Estado vazio: mostra os `EMOTION_SEEDS` existentes como fallback.

## 4. Integração no fluxo existente

- **Passo 5 (`Editor.tsx`)**: ao clicar "Enviar para o mural", chama `submit-postcard` em vez do estado local. Mantém `setExtraMemories` para feedback imediato na sessão atual.
- **Passo 6 (`Sent.tsx`)**: mostra mensagem "a tua memória foi recebida e ficará no mural após aprovação".
- **`MemoryMural.tsx`**: passa a buscar memórias aprovadas reais + seeds como fundo.
- **`Onboarding.tsx`**: nova secção carrossel usa dados reais.

## 5. Secrets necessários

- `IP_HASH_SALT` — string aleatória para salting (pediremos via add_secret).
- `LOVABLE_API_KEY` — já existe.

## 6. Privacidade

- IP nunca guardado em claro, só hash com salt server-side.
- View pública não expõe `ip_hash`, `status`, `confidence` nem `language`.
- Sem cookies, sem tracking.

## 7. Ordem de implementação

1. Migration: tabela `postcards` + view `public_postcards` + RLS + índices.
2. Pedir secret `IP_HASH_SALT`.
3. Edge function `submit-postcard`.
4. Front: hook `usePostcards()` para leitura, integração no `Editor` (envio) e `Onboarding` (carrossel).
5. Atualizar `Sent` e `MemoryMural` para refletir estado real.

Confirma para avançar — depois da aprovação peço o `IP_HASH_SALT` e crio a migration.
