// Emotion → tipografia + cor mapping (ref: Padrões)
export type EmotionKey =
  | "alegria" | "euforia" | "gratidao" | "serenidade" | "paixao"
  | "raiva" | "melancolia" | "medo" | "frustracao" | "saudade" | "nostalgia";

export type Variant = {
  name: string;
  bg: string;
  ink: string;
  accent: string;
  fontCls: string; // tailwind classes for the memory phrase
  fontLabel: string;
};

export type EmotionProfile = {
  key: EmotionKey;
  label: string;
  keywords: string[];
  variants: [Variant, Variant, Variant]; // 3 generated options
};

const PAPER = "hsl(60 20% 97%)";
const NIGHT = "hsl(30 10% 12%)";

export const EMOTIONS: Record<EmotionKey, EmotionProfile> = {
  alegria: {
    key: "alegria", label: "alegria",
    keywords: ["feliz","felicidade","alegr","sorri","riso","rir","sol","luz","amig","praxis","festa","brilh"],
    variants: [
      { name: "papel · sol", bg: PAPER, ink: NIGHT, accent: "hsl(54 100% 60%)", fontCls: "font-mono", fontLabel: "mono · amarelo" },
      { name: "sol · papel", bg: "hsl(54 100% 92%)", ink: NIGHT, accent: "hsl(54 100% 55%)", fontCls: "font-serif", fontLabel: "serif · sol" },
      { name: "noite · brilho", bg: NIGHT, ink: "hsl(54 100% 70%)", accent: "hsl(54 100% 60%)", fontCls: "font-mono", fontLabel: "mono · noite" },
    ],
  },
  euforia: {
    key: "euforia", label: "euforia",
    keywords: ["eufor","loucura","incrível","incrivel","explod","vibrant","intens","arrep"],
    variants: [
      { name: "rosa · pixel", bg: PAPER, ink: "hsl(320 80% 55%)", accent: "hsl(320 90% 70%)", fontCls: "font-mono", fontLabel: "pixel · rosa" },
      { name: "neon · noite", bg: NIGHT, ink: "hsl(320 95% 70%)", accent: "hsl(320 100% 65%)", fontCls: "font-mono", fontLabel: "mono · neon" },
      { name: "rosa · papel", bg: "hsl(320 60% 94%)", ink: "hsl(320 60% 25%)", accent: "hsl(320 90% 60%)", fontCls: "font-mono", fontLabel: "pixel · pastel" },
    ],
  },
  gratidao: {
    key: "gratidao", label: "gratidão",
    keywords: ["gratid","obrigad","graça","graca","abençoad","abençoa","presente","dádiva","dadiva"],
    variants: [
      { name: "água · script", bg: PAPER, ink: "hsl(175 55% 35%)", accent: "hsl(175 60% 60%)", fontCls: "font-serif italic", fontLabel: "script · água" },
      { name: "água · pastel", bg: "hsl(175 50% 92%)", ink: "hsl(175 60% 25%)", accent: "hsl(175 70% 55%)", fontCls: "font-serif italic", fontLabel: "itálico · pastel" },
      { name: "noite · água", bg: NIGHT, ink: "hsl(175 70% 75%)", accent: "hsl(175 80% 60%)", fontCls: "font-serif italic", fontLabel: "script · noite" },
    ],
  },
  serenidade: {
    key: "serenidade", label: "serenidade",
    keywords: ["seren","calm","paz","tranquil","silênc","silenc","sosseg","quietude","manhã","manha"],
    variants: [
      { name: "menta · serif", bg: PAPER, ink: "hsl(140 25% 30%)", accent: "hsl(140 50% 75%)", fontCls: "font-serif", fontLabel: "serif · menta" },
      { name: "menta · papel", bg: "hsl(140 35% 93%)", ink: "hsl(140 30% 25%)", accent: "hsl(140 50% 65%)", fontCls: "font-serif", fontLabel: "serif · pastel" },
      { name: "noite · folha", bg: NIGHT, ink: "hsl(140 50% 80%)", accent: "hsl(140 55% 65%)", fontCls: "font-serif", fontLabel: "serif · noite" },
    ],
  },
  paixao: {
    key: "paixao", label: "paixão",
    keywords: ["paix","amor","apaixon","desej","arde","fogo","beij","corpo","corac","coração"],
    variants: [
      { name: "rubro · itálico", bg: PAPER, ink: "hsl(0 75% 45%)", accent: "hsl(0 85% 60%)", fontCls: "font-serif italic", fontLabel: "itálico · rubro" },
      { name: "rubi · papel", bg: "hsl(0 50% 94%)", ink: "hsl(0 70% 35%)", accent: "hsl(0 80% 55%)", fontCls: "font-serif italic", fontLabel: "serif · rubi" },
      { name: "noite · rubro", bg: NIGHT, ink: "hsl(0 80% 65%)", accent: "hsl(0 90% 60%)", fontCls: "font-serif italic", fontLabel: "itálico · noite" },
    ],
  },
  raiva: {
    key: "raiva", label: "raiva",
    keywords: ["raiva","ódio","odio","odeio","fúria","furia","irrit","revolt","detest","nervos"],
    variants: [
      { name: "brasa · mono", bg: PAPER, ink: "hsl(14 80% 45%)", accent: "hsl(14 90% 55%)", fontCls: "font-mono font-bold", fontLabel: "mono bold · brasa" },
      { name: "brasa · papel", bg: "hsl(14 60% 93%)", ink: "hsl(14 80% 35%)", accent: "hsl(14 95% 50%)", fontCls: "font-mono font-bold", fontLabel: "mono · tijolo" },
      { name: "noite · brasa", bg: NIGHT, ink: "hsl(14 90% 60%)", accent: "hsl(14 95% 55%)", fontCls: "font-mono font-bold", fontLabel: "mono · noite" },
    ],
  },
  melancolia: {
    key: "melancolia", label: "melancolia",
    keywords: ["melanc","triste","tristeza","chuva","chor","cinza","solid","saudoso","mágoa","magoa"],
    variants: [
      { name: "anil · serif", bg: PAPER, ink: "hsl(225 60% 35%)", accent: "hsl(225 65% 60%)", fontCls: "font-serif", fontLabel: "serif · anil" },
      { name: "anil · papel", bg: "hsl(220 40% 93%)", ink: "hsl(225 60% 28%)", accent: "hsl(225 70% 55%)", fontCls: "font-serif", fontLabel: "serif · névoa" },
      { name: "noite · anil", bg: NIGHT, ink: "hsl(225 75% 75%)", accent: "hsl(225 80% 65%)", fontCls: "font-serif", fontLabel: "serif · noite" },
    ],
  },
  medo: {
    key: "medo", label: "medo",
    keywords: ["medo","assustad","assust","terror","sombra","sombri","escur","fantasma","sereia"],
    variants: [
      { name: "lilás · pixel", bg: PAPER, ink: "hsl(270 50% 50%)", accent: "hsl(270 60% 75%)", fontCls: "font-mono", fontLabel: "pixel · lilás" },
      { name: "lilás · papel", bg: "hsl(270 45% 93%)", ink: "hsl(270 50% 30%)", accent: "hsl(270 60% 60%)", fontCls: "font-mono", fontLabel: "pixel · pastel" },
      { name: "noite · lilás", bg: NIGHT, ink: "hsl(270 70% 78%)", accent: "hsl(270 75% 65%)", fontCls: "font-mono", fontLabel: "pixel · noite" },
    ],
  },
  frustracao: {
    key: "frustracao", label: "frustração",
    keywords: ["frustr","cansad","farta","farto","chato","chata","desisto","desist","aborrec"],
    variants: [
      { name: "laranja · sans", bg: PAPER, ink: "hsl(22 90% 50%)", accent: "hsl(22 95% 60%)", fontCls: "font-sans font-bold", fontLabel: "sans bold · laranja" },
      { name: "laranja · papel", bg: "hsl(22 80% 94%)", ink: "hsl(22 80% 35%)", accent: "hsl(22 95% 55%)", fontCls: "font-sans font-bold", fontLabel: "sans · pastel" },
      { name: "noite · laranja", bg: NIGHT, ink: "hsl(22 95% 65%)", accent: "hsl(22 95% 60%)", fontCls: "font-sans font-bold", fontLabel: "sans · noite" },
    ],
  },
  saudade: {
    key: "saudade", label: "saudade",
    keywords: ["saudade","saudad","fica de coimbra","memória","memoria","lembr","passado","ficou","resta"],
    variants: [
      { name: "creme · serif", bg: "hsl(40 50% 94%)", ink: "hsl(30 25% 25%)", accent: "hsl(40 60% 80%)", fontCls: "font-serif", fontLabel: "serif · creme" },
      { name: "papel · serif", bg: PAPER, ink: NIGHT, accent: "hsl(40 70% 75%)", fontCls: "font-serif", fontLabel: "serif · papel" },
      { name: "noite · creme", bg: NIGHT, ink: "hsl(40 60% 88%)", accent: "hsl(40 70% 75%)", fontCls: "font-serif", fontLabel: "serif · noite" },
    ],
  },
  nostalgia: {
    key: "nostalgia", label: "nostalgia",
    keywords: ["nostalg","antigament","quando era","outrora","velhos tempos","infânc","infanc","jardim da sereia"],
    variants: [
      { name: "rosa · script", bg: PAPER, ink: "hsl(340 35% 45%)", accent: "hsl(340 60% 80%)", fontCls: "font-serif italic", fontLabel: "script · rosa" },
      { name: "rosa · papel", bg: "hsl(340 50% 95%)", ink: "hsl(340 40% 35%)", accent: "hsl(340 70% 70%)", fontCls: "font-serif italic", fontLabel: "itálico · pastel" },
      { name: "noite · rosa", bg: NIGHT, ink: "hsl(340 60% 80%)", accent: "hsl(340 75% 70%)", fontCls: "font-serif italic", fontLabel: "script · noite" },
    ],
  },
};

export const EMOTION_ORDER: EmotionKey[] = [
  "paixao","raiva","euforia","alegria","gratidao","serenidade",
  "melancolia","medo","frustracao","nostalgia","saudade",
];

export const detectEmotion = (text: string): EmotionProfile => {
  const t = text.toLowerCase();
  let best: { key: EmotionKey; score: number } = { key: "saudade", score: 0 };
  for (const key of EMOTION_ORDER) {
    const profile = EMOTIONS[key];
    let score = 0;
    for (const kw of profile.keywords) if (t.includes(kw)) score += kw.length;
    if (score > best.score) best = { key, score };
  }
  return EMOTIONS[best.key];
};
