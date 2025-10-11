import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FULL_DB = path.join(__dirname, '../assets/german-vocabulary.db');
const FILTERED_DB = path.join(__dirname, '../assets/german-vocabulary-filtered.db');
const FREQUENCY_FILE = path.join(__dirname, 'german-top10000.txt');

console.log('🚀 German Vocabulary Filter (Frequency-Based)');
console.log('━'.repeat(50));

// Step 1: Load frequency list
console.log('\n📖 Loading frequency list...');
const frequencyData = fs.readFileSync(FREQUENCY_FILE, 'utf8');
const frequencyWords = new Set();

frequencyData.split('\n').forEach((line, index) => {
  if (line.trim()) {
    const word = line.split(' ')[0].toLowerCase().trim();
    frequencyWords.add(word);
    
    // Only take top 20K words
    if (index >= 20000) return;
  }
});

console.log(`✅ Loaded ${frequencyWords.size.toLocaleString()} frequency words`);

// Step 2: Open source database
console.log('\n📂 Opening source database...');
const sourceDb = new Database(FULL_DB, { readonly: true });

// Get total word count
const totalWords = sourceDb.prepare('SELECT COUNT(*) as count FROM words').get();
console.log(`📊 Total words in source database: ${totalWords.count.toLocaleString()}`);

// Step 3: Create filtered database
console.log('\n💾 Creating filtered database...');
if (fs.existsSync(FILTERED_DB)) {
  fs.unlinkSync(FILTERED_DB);
}

const filteredDb = new Database(FILTERED_DB);

// Create schema
filteredDb.exec(`
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

console.log('✅ Schema created');

// Step 4: Filter and copy words
console.log('\n🔄 Filtering words by frequency...');

const allWords = sourceDb.prepare('SELECT * FROM words').all();
const insert = filteredDb.prepare(`
  INSERT INTO words (german, english, article, part_of_speech, german_example, english_example, pronunciation)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

let matched = 0;
let skipped = 0;

const insertMany = filteredDb.transaction((words) => {
  for (const word of words) {
    // Extract the base word (remove articles, lowercase)
    let baseWord = word.german
      .replace(/^(der|die|das)\s+/i, '')
      .toLowerCase()
      .trim();
    
    // Check if it's in the frequency list
    if (frequencyWords.has(baseWord) || frequencyWords.has(word.german.toLowerCase())) {
      try {
        insert.run(
          word.german,
          word.english,
          word.article,
          word.part_of_speech,
          word.german_example,
          word.english_example,
          word.pronunciation
        );
        matched++;
        
        if (matched % 1000 === 0) {
          console.log(`  Matched ${matched.toLocaleString()} words...`);
        }
      } catch (err) {
        console.error(`Error inserting word "${word.german}":`, err.message);
      }
    } else {
      skipped++;
    }
  }
});

insertMany(allWords);

console.log('✅ Filtering complete!');

// Step 5: Statistics
console.log('\n📊 Final Statistics:');
console.log('━'.repeat(50));
console.log(`Source database: ${totalWords.count.toLocaleString()} words`);
console.log(`Frequency list: ${frequencyWords.size.toLocaleString()} words`);
console.log(`Matched: ${matched.toLocaleString()} words`);
console.log(`Skipped: ${skipped.toLocaleString()} words`);
console.log(`Match rate: ${((matched / totalWords.count) * 100).toFixed(2)}%`);
console.log('━'.repeat(50));

const filteredSize = fs.statSync(FILTERED_DB).size;
const originalSize = fs.statSync(FULL_DB).size;
console.log(`\n📦 Original size: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
console.log(`📦 Filtered size: ${(filteredSize / 1024 / 1024).toFixed(2)} MB`);
console.log(`💾 Space saved: ${((1 - filteredSize / originalSize) * 100).toFixed(1)}%`);

console.log(`\n✅ Filtered database created: ${FILTERED_DB}`);

// Close databases
sourceDb.close();
filteredDb.close();

console.log('\n🎉 Done! Replace the old database with the filtered one.');

