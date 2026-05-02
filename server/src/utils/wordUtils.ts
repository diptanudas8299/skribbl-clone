export const WORD_LIST: Record<string, string[]> = {
  animals: [
    'elephant', 'giraffe', 'penguin', 'dolphin', 'kangaroo',
    'cheetah', 'octopus', 'butterfly', 'crocodile', 'flamingo',
    'zebra', 'panda', 'koala', 'parrot', 'jaguar',
  ],
  objects: [
    'umbrella', 'telescope', 'bicycle', 'backpack', 'calculator',
    'microphone', 'compass', 'lantern', 'hammer', 'scissors',
    'calendar', 'thermometer', 'magnifying glass', 'stapler', 'envelope',
  ],
  food: [
    'pizza', 'spaghetti', 'watermelon', 'sushi', 'hamburger',
    'pancake', 'avocado', 'broccoli', 'strawberry', 'popcorn',
    'donut', 'taco', 'cheesecake', 'mango', 'pretzel',
  ],
  actions: [
    'swimming', 'jumping', 'dancing', 'sleeping', 'climbing',
    'laughing', 'cooking', 'painting', 'singing', 'running',
    'fishing', 'reading', 'skateboarding', 'skydiving', 'surfing',
  ],
  places: [
    'library', 'volcano', 'lighthouse', 'aquarium', 'castle',
    'airport', 'stadium', 'museum', 'waterfall', 'igloo',
    'pyramid', 'submarine', 'treehouse', 'windmill', 'cave',
  ],
};

export const ALL_WORDS = Object.values(WORD_LIST).flat();

export function getRandomWords(count: number, customWords?: string[]): string[] {
  const pool = customWords && customWords.length > 0
    ? [...customWords, ...ALL_WORDS]
    : ALL_WORDS;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function isCorrectGuess(guess: string, word: string): boolean {
  return guess.trim().toLowerCase() === word.trim().toLowerCase();
}

export function generateHint(word: string, revealedCount: number): string {
  const chars = word.split('');
  const letterIndices = chars
    .map((c, i) => (c !== ' ' ? i : -1))
    .filter(i => i !== -1);

  const toReveal = new Set<number>();
  const shuffled = [...letterIndices].sort(() => Math.random() - 0.5);
  shuffled.slice(0, revealedCount).forEach(i => toReveal.add(i));

  return chars
    .map((c, i) => {
      if (c === ' ') return ' ';
      if (toReveal.has(i)) return c;
      return '_';
    })
    .join(' ');
}
