import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to strip HTML tags
function stripHTML(str) {
  return str.replace(/<[^>]*>/g, '').trim();
}

// Parse A2 deck
function parseA2Deck(apkgFile) {
  console.log('\n📘 Parsing A2 Deck...');
  const zip = new AdmZip(apkgFile);
  const tempDir = path.join(__dirname, 'temp_a2_' + Date.now());
  zip.extractAllTo(tempDir, true);
  
  const dbPath = path.join(tempDir, 'collection.anki2');
  const db = new Database(dbPath);
  
  const rows = db.prepare('SELECT flds FROM notes').all();
  const words = [];
  
  for (const row of rows) {
    const fields = row.flds.split('\x1f').map(stripHTML);
    
    const germanWord = fields[0];
    const englishTranslation = fields[1];
    
    // Get first example pair under 60 chars
    let germanExample = null;
    let englishExample = null;
    
    for (let i = 6; i < fields.length; i += 2) {
      const de = fields[i];
      const en = fields[i + 1];
      if (de && en && de.length <= 60 && en.length <= 60) {
        germanExample = de;
        englishExample = en;
        break;
      }
    }
    
    // Skip if no valid examples
    if (!germanExample || !englishExample) continue;
    
    words.push({
      german: germanWord,
      english: englishTranslation,
      german_example: germanExample,
      english_example: englishExample,
      level: 'A2'
    });
  }
  
  db.close();
  fs.rmSync(tempDir, { recursive: true, force: true });
  
  console.log(`   ✅ Extracted ${words.length} words`);
  return words;
}

// Parse B1 deck
function parseB1Deck(apkgFile) {
  console.log('\n📗 Parsing B1 Deck...');
  const zip = new AdmZip(apkgFile);
  const tempDir = path.join(__dirname, 'temp_b1_' + Date.now());
  zip.extractAllTo(tempDir, true);
  
  const dbPath = path.join(tempDir, 'collection.anki2');
  const db = new Database(dbPath);
  
  const rows = db.prepare('SELECT flds FROM notes').all();
  const words = [];
  
  for (const row of rows) {
    const fields = row.flds.split('\x1f').map(stripHTML);
    
    const germanWordFull = fields[0];
    const englishTranslation = fields[1];
    const germanWord = fields[2] || germanWordFull.split(',')[0].trim();
    
    // Get first example pair under 60 chars
    let germanExample = null;
    let englishExample = null;
    
    for (let i = 6; i < fields.length; i += 2) {
      const de = fields[i];
      const en = fields[i + 1];
      if (de && en && de.length > 0 && de.length <= 60 && en.length <= 60 && !de.includes('[sound:')) {
        germanExample = de;
        englishExample = en;
        break;
      }
    }
    
    // Skip if no valid examples
    if (!germanExample || !englishExample) continue;
    
    words.push({
      german: germanWord,
      english: englishTranslation,
      german_example: germanExample,
      english_example: englishExample,
      level: 'B1'
    });
  }
  
  db.close();
  fs.rmSync(tempDir, { recursive: true, force: true });
  
  console.log(`   ✅ Extracted ${words.length} words`);
  return words;
}

// Create SQLite database
function createDatabase(words, outputPath) {
  console.log('\n📊 Creating SQLite database...');
  
  if (fs.existsSync(outputPath)) {
    fs.unlinkSync(outputPath);
  }
  
  const db = new Database(outputPath);
  
  db.exec(`
    CREATE TABLE vocabulary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      german TEXT NOT NULL,
      english TEXT NOT NULL,
      german_example TEXT NOT NULL,
      english_example TEXT NOT NULL,
      bucket TEXT DEFAULT 'dontKnow',
      last_seen INTEGER,
      times_known INTEGER DEFAULT 0,
      is_removed INTEGER DEFAULT 0,
      level TEXT
    );
    
    CREATE INDEX idx_bucket ON vocabulary(bucket);
    CREATE INDEX idx_is_removed ON vocabulary(is_removed);
    CREATE INDEX idx_level ON vocabulary(level);
  `);
  
  const insert = db.prepare(`
    INSERT INTO vocabulary (
      german, english, german_example, english_example, level
    ) VALUES (?, ?, ?, ?, ?)
  `);
  
  for (const word of words) {
    insert.run(
      word.german,
      word.english,
      word.german_example,
      word.english_example,
      word.level
    );
  }
  
  db.close();
  
  console.log(`   ✅ Database created: ${outputPath}`);
  console.log(`   📝 Total words: ${words.length}`);
  
  const stats = words.reduce((acc, w) => {
    acc[w.level] = (acc[w.level] || 0) + 1;
    return acc;
  }, {});
  
  console.log(`   📊 A2: ${stats.A2 || 0} words`);
  console.log(`   📊 B1: ${stats.B1 || 0} words`);
}

// Main
async function main() {
  console.log('🚀 Building Clean German Vocabulary Database');
  console.log('━'.repeat(80));
  
  const a2Path = path.join(__dirname, 'A2_Wortliste_Goethe_vocab_sentenses_audio_translation.apkg');
  const b1Path = path.join(__dirname, 'B1_Wortliste_DTZ_Goethe_vocabsentensesaudiotranslation.apkg');
  const outputPath = path.join(__dirname, '..', 'assets', 'german-vocabulary.db');
  
  const a2Words = parseA2Deck(a2Path);
  const b1Words = parseB1Deck(b1Path);
  
  const allWords = [...a2Words, ...b1Words];
  
  // Remove duplicates (keep A2 version if duplicate)
  const uniqueWords = [];
  const seen = new Set();
  
  for (const word of allWords) {
    const key = word.german.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      uniqueWords.push(word);
    }
  }
  
  console.log(`\n🔍 Removed ${allWords.length - uniqueWords.length} duplicates`);
  
  createDatabase(uniqueWords, outputPath);
  
  console.log('\n✅ All done!');
}

main().catch(console.error);

