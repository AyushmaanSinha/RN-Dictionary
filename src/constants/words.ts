export interface WordItem {
  word: string;
  type: string;
  definition: string;
  example: string;
}

export interface TrendingItem {
  word: string;
  type: string;
  phonetic: string;
  poeticDesc: string;
}

export interface VocabItem extends WordItem {
  icon: string;
}

export const WOTD_LIST: WordItem[] = [
  {
    word: "Serendipity",
    type: "Noun",
    definition: "The occurrence of events by chance in a happy or beneficial way.",
    example: "We found the charming little restaurant by pure serendipity."
  },
  {
    word: "Equanimity",
    type: "Noun",
    definition: "Mental calmness, composure, and evenness of temper, especially in a difficult situation.",
    example: "She accepted both the good news and bad news with equanimity."
  },
  {
    word: "Mellifluous",
    type: "Adjective",
    definition: "Sweet or musical; pleasant to hear.",
    example: "The singer had a mellifluous voice that captivated the audience."
  },
  {
    word: "Alacrity",
    type: "Noun",
    definition: "Brisk and cheerful readiness.",
    example: "She accepted the job offer with alacrity."
  },
  {
    word: "Luminous",
    type: "Adjective",
    definition: "Full of or shedding light; bright or shining.",
    example: "The luminous stars filled the night sky."
  },
  {
    word: "Solitude",
    type: "Noun",
    definition: "The state or situation of being alone.",
    example: "She savored the solitude of her early morning walks."
  }
];

export const TRENDING_POOL: TrendingItem[] = [
  { word: "Ephemeral", type: "Adjective", phonetic: "/ɪˈfɛm(ə)r(ə)l/", poeticDesc: "A brief spark in the expanse of time." },
  { word: "Synergy", type: "Noun", phonetic: "/ˈsɪnədʒi/", poeticDesc: "The harmony of parts creating a greater whole." },
  { word: "Ubiquitous", type: "Adjective", phonetic: "/juːˈbɪkwɪtəs/", poeticDesc: "Present everywhere, like the wind." },
  { word: "Ineffable", type: "Adjective", phonetic: "/ɪnˈɛfəb(ə)l/", poeticDesc: "Too sacred or vast to be spoken." },
  { word: "Cacophony", type: "Noun", phonetic: "/kəˈkɒfəni/", poeticDesc: "A wild, chaotic collision of voices." },
  { word: "Resilient", type: "Adjective", phonetic: "/rɪˈzɪlɪənt/", poeticDesc: "Bending like steel, yet never breaking." },
  { word: "Pragmatic", type: "Adjective", phonetic: "/præɡˈmætɪk/", poeticDesc: "Anchored in the reality of the present." },
  { word: "Magnanimous", type: "Adjective", phonetic: "/mæɡˈnænɪməs/", poeticDesc: "A noble heart rising above the storm." },
  { word: "Obfuscate", type: "Verb", phonetic: "/ˈɒbfʌskeɪt/", poeticDesc: "To shroud the clear in mystery and shadow." },
  { word: "Mellifluous", type: "Adjective", phonetic: "/mɪˈlɪflʊəs/", poeticDesc: "Flowing like honey, sweet to the ear." },
  { word: "Solitude", type: "Noun", phonetic: "/ˈsɒlɪtjuːd/", poeticDesc: "The peaceful sanctuary of being alone." },
  { word: "Luminous", type: "Adjective", phonetic: "/ˈluːmɪnəs/", poeticDesc: "Radiating soft, persistent light." }
];

export const VOCAB_WORDS: VocabItem[] = [
  {
    word: "Luminous",
    type: "Adjective",
    definition: "Full of or shedding light; bright or shining.",
    example: "The luminous dial on his watch glowed in the dark.",
    icon: "sunny-sharp"
  },
  {
    word: "Cacophony",
    type: "Noun",
    definition: "A harsh, discordant mixture of sounds.",
    example: "A cacophony of car horns woke us up early in the morning.",
    icon: "musical-notes-sharp"
  },
  {
    word: "Pernicious",
    type: "Adjective",
    definition: "Having a harmful effect, especially in a gradual or subtle way.",
    example: "Social media can sometimes have a pernicious influence on young minds.",
    icon: "warning-sharp"
  },
  {
    word: "Alacrity",
    type: "Noun",
    definition: "Brisk and cheerful readiness.",
    example: "She accepted the job offer with alacrity.",
    icon: "flash-sharp"
  },
  {
    word: "Garrulous",
    type: "Adjective",
    definition: "Excessively talkative, especially on trivial matters.",
    example: "The garrulous passenger next to me did not stop talking for the entire flight.",
    icon: "chatbubbles-sharp"
  },
  {
    word: "Mellifluous",
    type: "Adjective",
    definition: "Sweet or musical; pleasant to hear.",
    example: "The singer had a mellifluous voice that captivated the audience.",
    icon: "water-sharp"
  },
  {
    word: "Equanimity",
    type: "Noun",
    definition: "Mental calmness, composure, and evenness of temper in a difficult situation.",
    example: "She accepted both the good news and bad news with equal equanimity.",
    icon: "fitness-sharp"
  },
  {
    word: "Fastidious",
    type: "Adjective",
    definition: "Very attentive to and concerned about accuracy and detail.",
    example: "He is fastidious about keeping his desk organized.",
    icon: "eye-sharp"
  }
];

export const LOCAL_WORDS: string[] = Array.from(
  new Set([
    ...TRENDING_POOL.map((w) => w.word),
    ...WOTD_LIST.map((w) => w.word),
    ...VOCAB_WORDS.map((w) => w.word)
  ])
);
