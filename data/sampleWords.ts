export interface WordCard {
  id: string;
  germanWord: string;
  germanSentence: string;
  englishTranslation: string;
  englishSentence: string;
  bucket: 'learning' | 'reviewing' | 'mastered';
}

export const sampleWords: WordCard[] = [
  {
    id: '1',
    germanWord: 'Haus',
    germanSentence: 'Das Haus ist sehr schön.',
    englishTranslation: 'house',
    englishSentence: 'The house is very beautiful.',
    bucket: 'learning'
  },
  {
    id: '2',
    germanWord: 'Buch',
    germanSentence: 'Ich lese ein interessantes Buch.',
    englishTranslation: 'book',
    englishSentence: 'I am reading an interesting book.',
    bucket: 'learning'
  },
  {
    id: '3',
    germanWord: 'Wasser',
    germanSentence: 'Kann ich bitte ein Glas Wasser haben?',
    englishTranslation: 'water',
    englishSentence: 'Can I please have a glass of water?',
    bucket: 'learning'
  },
  {
    id: '4',
    germanWord: 'Freund',
    germanSentence: 'Mein bester Freund kommt heute zu Besuch.',
    englishTranslation: 'friend',
    englishSentence: 'My best friend is coming to visit today.',
    bucket: 'learning'
  },
  {
    id: '5',
    germanWord: 'Arbeit',
    germanSentence: 'Die Arbeit macht mir Spaß.',
    englishTranslation: 'work',
    englishSentence: 'I enjoy the work.',
    bucket: 'learning'
  },
  {
    id: '6',
    germanWord: 'Zeit',
    germanSentence: 'Wir haben keine Zeit zu verlieren.',
    englishTranslation: 'time',
    englishSentence: 'We have no time to lose.',
    bucket: 'learning'
  },
  {
    id: '7',
    germanWord: 'Stadt',
    germanSentence: 'Berlin ist eine große Stadt.',
    englishTranslation: 'city',
    englishSentence: 'Berlin is a big city.',
    bucket: 'learning'
  },
  {
    id: '8',
    germanWord: 'Auto',
    germanSentence: 'Das Auto ist sehr schnell.',
    englishTranslation: 'car',
    englishSentence: 'The car is very fast.',
    bucket: 'learning'
  },
  {
    id: '9',
    germanWord: 'Schule',
    germanSentence: 'Die Schule beginnt um acht Uhr.',
    englishTranslation: 'school',
    englishSentence: 'School starts at eight o\'clock.',
    bucket: 'learning'
  },
  {
    id: '10',
    germanWord: 'Essen',
    germanSentence: 'Das Essen schmeckt sehr gut.',
    englishTranslation: 'food',
    englishSentence: 'The food tastes very good.',
    bucket: 'learning'
  }
];
