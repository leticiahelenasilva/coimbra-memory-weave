import type { EmotionKey } from "./emotions";

// Seed phrases grouped by emotion — used by the Mural marquee and floaters.
export const EMOTION_SEEDS: { text: string; emotion: EmotionKey }[] = [
  // alegria
  { text: "as capas a voar na Praça ao sol", emotion: "alegria" },
  { text: "rir alto no Penedo da Saudade", emotion: "alegria" },
  { text: "o gelado partilhado no Choupal", emotion: "alegria" },
  // euforia
  { text: "primeira queima das fitas", emotion: "euforia" },
  { text: "tunas a passar à meia-noite", emotion: "euforia" },
  { text: "gritar o nome dela na Sé Velha", emotion: "euforia" },
  // gratidão
  { text: "café no Santa Cruz com avó", emotion: "gratidao" },
  { text: "a casa que me abriu a porta", emotion: "gratidao" },
  { text: "obrigado, cidade, por tudo", emotion: "gratidao" },
  // serenidade
  { text: "o silêncio da Biblioteca Joanina", emotion: "serenidade" },
  { text: "a sombra fresca dos plátanos", emotion: "serenidade" },
  { text: "manhã calma sobre o Mondego", emotion: "serenidade" },
  // paixão
  { text: "promessas debaixo das amendoeiras", emotion: "paixao" },
  { text: "um beijo na escadaria monumental", emotion: "paixao" },
  { text: "o coração arde por Coimbra", emotion: "paixao" },
  // raiva
  { text: "tenho uma relação amor/ódio com o 34", emotion: "raiva" },
  { text: "odiei subir aquela colina à pressa", emotion: "raiva" },
  // melancolia
  { text: "uma carta nunca enviada", emotion: "melancolia" },
  { text: "as escadas monumentais à chuva", emotion: "melancolia" },
  { text: "chorar baixinho na Rua Larga", emotion: "melancolia" },
  // medo
  { text: "as sombras do Jardim da Sereia", emotion: "medo" },
  { text: "o último autocarro para casa", emotion: "medo" },
  // frustração
  { text: "tropeçar outra vez na calçada", emotion: "frustracao" },
  { text: "o exame que nunca acabou", emotion: "frustracao" },
  // saudade
  { text: "o cheiro do Mondego ao amanhecer", emotion: "saudade" },
  { text: "voltar — sempre voltar", emotion: "saudade" },
  { text: "uma despedida na estação velha", emotion: "saudade" },
  { text: "o riso dela no jardim da Sereia", emotion: "saudade" },
  // nostalgia
  { text: "o eco de um fado às três da manhã", emotion: "nostalgia" },
  { text: "o sino da Cabra a contar as horas", emotion: "nostalgia" },
  { text: "o vermelho dos telhados ao pôr-do-sol", emotion: "nostalgia" },
  { text: "ler poesia em voz baixa", emotion: "nostalgia" },
];

// Backwards-compatible flat list
export const SEED_MEMORIES: string[] = EMOTION_SEEDS.map((s) => s.text);
