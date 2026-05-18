## Mudança

No `src/components/steps/Editor.tsx`, na renderização do `PostcardFront`, remover a prop `showEditHint`. Isso oculta o texto pequeno "✎ clica no texto para editar" exibido abaixo da memória no passo 5.

Nenhuma outra alteração: o `PostcardFront` já trata `showEditHint` como opcional (default `false`), então a dica simplesmente não aparece.