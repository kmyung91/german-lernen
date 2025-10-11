import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DB = path.join(__dirname, '../assets/german-vocabulary.db');

// Curated German vocabulary with ALL required fields
// This is a high-quality starter set - we'll expand with FreeDict later
const curatedWords = [
  // Neuter nouns (das)
  {
    german: 'das Haus',
    english: 'house',
    article: 'das',
    part_of_speech: 'noun',
    german_example: 'Das Haus ist sehr schön.',
    english_example: 'The house is very beautiful.',
  },
  {
    german: 'das Buch',
    english: 'book',
    article: 'das',
    part_of_speech: 'noun',
    german_example: 'Ich lese ein interessantes Buch.',
    english_example: 'I am reading an interesting book.',
  },
  {
    german: 'das Wasser',
    english: 'water',
    article: 'das',
    part_of_speech: 'noun',
    german_example: 'Ich trinke gerne kaltes Wasser.',
    english_example: 'I like to drink cold water.',
  },
  {
    german: 'das Auto',
    english: 'car',
    article: 'das',
    part_of_speech: 'noun',
    german_example: 'Mein Auto ist sehr schnell.',
    english_example: 'My car is very fast.',
  },
  {
    german: 'das Kind',
    english: 'child',
    article: 'das',
    part_of_speech: 'noun',
    german_example: 'Das Kind spielt im Garten.',
    english_example: 'The child is playing in the garden.',
  },
  {
    german: 'das Fenster',
    english: 'window',
    article: 'das',
    part_of_speech: 'noun',
    german_example: 'Das Fenster ist offen.',
    english_example: 'The window is open.',
  },
  {
    german: 'das Zimmer',
    english: 'room',
    article: 'das',
    part_of_speech: 'noun',
    german_example: 'Das Zimmer ist sehr gemütlich.',
    english_example: 'The room is very cozy.',
  },
  {
    german: 'das Mädchen',
    english: 'girl',
    article: 'das',
    part_of_speech: 'noun',
    german_example: 'Das Mädchen singt ein Lied.',
    english_example: 'The girl is singing a song.',
  },

  // Masculine nouns (der)
  {
    german: 'der Freund',
    english: 'friend',
    article: 'der',
    part_of_speech: 'noun',
    german_example: 'Mein bester Freund wohnt in Berlin.',
    english_example: 'My best friend lives in Berlin.',
  },
  {
    german: 'der Kaffee',
    english: 'coffee',
    article: 'der',
    part_of_speech: 'noun',
    german_example: 'Ich trinke jeden Morgen Kaffee.',
    english_example: 'I drink coffee every morning.',
  },
  {
    german: 'der Hund',
    english: 'dog',
    article: 'der',
    part_of_speech: 'noun',
    german_example: 'Der Hund bellt laut.',
    english_example: 'The dog is barking loudly.',
  },
  {
    german: 'der Mann',
    english: 'man',
    article: 'der',
    part_of_speech: 'noun',
    german_example: 'Der Mann arbeitet im Büro.',
    english_example: 'The man works in the office.',
  },
  {
    german: 'der Tisch',
    english: 'table',
    article: 'der',
    part_of_speech: 'noun',
    german_example: 'Der Tisch ist aus Holz.',
    english_example: 'The table is made of wood.',
  },
  {
    german: 'der Tag',
    english: 'day',
    article: 'der',
    part_of_speech: 'noun',
    german_example: 'Der Tag ist schön und sonnig.',
    english_example: 'The day is beautiful and sunny.',
  },
  {
    german: 'der Apfel',
    english: 'apple',
    article: 'der',
    part_of_speech: 'noun',
    german_example: 'Der Apfel schmeckt sehr gut.',
    english_example: 'The apple tastes very good.',
  },

  // Feminine nouns (die)
  {
    german: 'die Arbeit',
    english: 'work',
    article: 'die',
    part_of_speech: 'noun',
    german_example: 'Meine Arbeit ist sehr interessant.',
    english_example: 'My work is very interesting.',
  },
  {
    german: 'die Schule',
    english: 'school',
    article: 'die',
    part_of_speech: 'noun',
    german_example: 'Die Schule beginnt um acht Uhr.',
    english_example: 'School starts at eight o\'clock.',
  },
  {
    german: 'die Katze',
    english: 'cat',
    article: 'die',
    part_of_speech: 'noun',
    german_example: 'Die Katze schläft auf dem Sofa.',
    english_example: 'The cat is sleeping on the sofa.',
  },
  {
    german: 'die Frau',
    english: 'woman',
    article: 'die',
    part_of_speech: 'noun',
    german_example: 'Die Frau ist Ärztin.',
    english_example: 'The woman is a doctor.',
  },
  {
    german: 'die Stadt',
    english: 'city',
    article: 'die',
    part_of_speech: 'noun',
    german_example: 'Die Stadt ist sehr groß.',
    english_example: 'The city is very large.',
  },
  {
    german: 'die Straße',
    english: 'street',
    article: 'die',
    part_of_speech: 'noun',
    german_example: 'Die Straße ist sehr lang.',
    english_example: 'The street is very long.',
  },
  {
    german: 'die Tür',
    english: 'door',
    article: 'die',
    part_of_speech: 'noun',
    german_example: 'Die Tür ist geschlossen.',
    english_example: 'The door is closed.',
  },
  {
    german: 'die Zeit',
    english: 'time',
    article: 'die',
    part_of_speech: 'noun',
    german_example: 'Die Zeit vergeht schnell.',
    english_example: 'Time flies quickly.',
  },

  // Verbs (no article)
  {
    german: 'gehen',
    english: 'to go',
    article: null,
    part_of_speech: 'verb',
    german_example: 'Ich gehe jeden Tag spazieren.',
    english_example: 'I go for a walk every day.',
  },
  {
    german: 'essen',
    english: 'to eat',
    article: null,
    part_of_speech: 'verb',
    german_example: 'Wir essen zusammen zu Abend.',
    english_example: 'We eat dinner together.',
  },
  {
    german: 'trinken',
    english: 'to drink',
    article: null,
    part_of_speech: 'verb',
    german_example: 'Er trinkt gerne Tee.',
    english_example: 'He likes to drink tea.',
  },
  {
    german: 'lesen',
    english: 'to read',
    article: null,
    part_of_speech: 'verb',
    german_example: 'Sie liest ein Buch.',
    english_example: 'She is reading a book.',
  },
  {
    german: 'schreiben',
    english: 'to write',
    article: null,
    part_of_speech: 'verb',
    german_example: 'Ich schreibe einen Brief.',
    english_example: 'I am writing a letter.',
  },
  {
    german: 'sprechen',
    english: 'to speak',
    article: null,
    part_of_speech: 'verb',
    german_example: 'Wir sprechen Deutsch.',
    english_example: 'We speak German.',
  },
  {
    german: 'sehen',
    english: 'to see',
    article: null,
    part_of_speech: 'verb',
    german_example: 'Ich sehe einen schönen Vogel.',
    english_example: 'I see a beautiful bird.',
  },
  {
    german: 'hören',
    english: 'to hear',
    article: null,
    part_of_speech: 'verb',
    german_example: 'Er hört Musik.',
    english_example: 'He is listening to music.',
  },

  // Adjectives
  {
    german: 'groß',
    english: 'big, large',
    article: null,
    part_of_speech: 'adjective',
    german_example: 'Das ist ein großes Haus.',
    english_example: 'That is a big house.',
  },
  {
    german: 'klein',
    english: 'small',
    article: null,
    part_of_speech: 'adjective',
    german_example: 'Die Katze ist klein.',
    english_example: 'The cat is small.',
  },
  {
    german: 'schön',
    english: 'beautiful',
    article: null,
    part_of_speech: 'adjective',
    german_example: 'Das Wetter ist heute schön.',
    english_example: 'The weather is beautiful today.',
  },
  {
    german: 'gut',
    english: 'good',
    article: null,
    part_of_speech: 'adjective',
    german_example: 'Das Essen schmeckt gut.',
    english_example: 'The food tastes good.',
  },
  {
    german: 'neu',
    english: 'new',
    article: null,
    part_of_speech: 'adjective',
    german_example: 'Ich habe ein neues Auto.',
    english_example: 'I have a new car.',
  },
  {
    german: 'alt',
    english: 'old',
    article: null,
    part_of_speech: 'adjective',
    german_example: 'Das ist ein altes Buch.',
    english_example: 'That is an old book.',
  },
  {
    german: 'schnell',
    english: 'fast',
    article: null,
    part_of_speech: 'adjective',
    german_example: 'Der Zug ist sehr schnell.',
    english_example: 'The train is very fast.',
  },
  {
    german: 'langsam',
    english: 'slow',
    article: null,
    part_of_speech: 'adjective',
    german_example: 'Die Schildkröte ist langsam.',
    english_example: 'The turtle is slow.',
  },
];

function createDatabase() {
  console.log('💾 Creating SQLite database...');
  
  // Remove existing database
  if (fs.existsSync(OUTPUT_DB)) {
    fs.unlinkSync(OUTPUT_DB);
  }

  // Ensure assets directory exists
  const assetsDir = path.dirname(OUTPUT_DB);
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  const db = new Database(OUTPUT_DB);

  // Create schema
  db.exec(`
    CREATE TABLE words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      german TEXT NOT NULL,
      english TEXT NOT NULL,
      article TEXT,
      part_of_speech TEXT,
      german_example TEXT NOT NULL,
      english_example TEXT NOT NULL,
      pronunciation TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX idx_words_article ON words(article);
    CREATE INDEX idx_words_pos ON words(part_of_speech);

    CREATE TABLE user_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      word_id INTEGER NOT NULL UNIQUE,
      bucket TEXT NOT NULL CHECK(bucket IN ('dontKnow', 'know')),
      times_seen INTEGER DEFAULT 0,
      times_known INTEGER DEFAULT 0,
      last_seen TIMESTAMP,
      is_removed BOOLEAN DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (word_id) REFERENCES words(id)
    );

    CREATE UNIQUE INDEX idx_user_progress_word_id ON user_progress(word_id);
    CREATE INDEX idx_user_progress_bucket ON user_progress(bucket);
    CREATE INDEX idx_user_progress_removed ON user_progress(is_removed);
  `);

  console.log('✅ Schema created!');
  return db;
}

function insertWords(db, words) {
  console.log(`💿 Inserting ${words.length} words...`);

  const insert = db.prepare(`
    INSERT INTO words (german, english, article, part_of_speech, german_example, english_example, pronunciation)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((words) => {
    for (const word of words) {
      insert.run(
        word.german,
        word.english,
        word.article,
        word.part_of_speech,
        word.german_example,
        word.english_example,
        word.pronunciation || null
      );
    }
  });

  insertMany(words);
  console.log('✅ Words inserted!');
}

function main() {
  console.log('🚀 Building German Vocabulary Database');
  console.log('━'.repeat(50));
  console.log();

  try {
    const db = createDatabase();
    insertWords(db, curatedWords);
    db.close();

    console.log('\n📊 Statistics:');
    console.log('━'.repeat(50));
    console.log(`Total words: ${curatedWords.length}`);
    console.log(`  - Nouns: ${curatedWords.filter(w => w.part_of_speech === 'noun').length}`);
    console.log(`  - Verbs: ${curatedWords.filter(w => w.part_of_speech === 'verb').length}`);
    console.log(`  - Adjectives: ${curatedWords.filter(w => w.part_of_speech === 'adjective').length}`);
    console.log(`  - With articles: ${curatedWords.filter(w => w.article).length}`);
    console.log('━'.repeat(50));
    console.log(`\n✅ Database created: ${OUTPUT_DB}`);
    console.log('\n🎉 Success! Database is ready to use.');
    console.log('\n📝 Note: This is an initial curated set.');
    console.log('   We can expand with FreeDict data later.');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();

