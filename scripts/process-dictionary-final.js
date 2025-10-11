import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sax from 'sax';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const TEI_XML_FILE = path.join(__dirname, 'deu-eng/deu-eng.tei');
const OUTPUT_DB = path.join(__dirname, '../assets/german-vocabulary.db');

// Statistics
const stats = {
  total: 0,
  processed: 0,
  skipped: {
    noTranslation: 0,
    nounWithoutArticle: 0,
    missingRequiredData: 0,
  },
  inserted: 0,
};

// Current entry being parsed
let currentEntry = null;
let currentPath = [];
let currentText = '';
let validWords = [];

// Template for generating example sentences
function generateExamples(german, english, article, partOfSpeech) {
  let germanExample, englishExample;
  
  if (partOfSpeech === 'noun' && article) {
    // Generate noun examples
    const nounOnly = german.replace(/^(der|die|das)\s+/, '');
    if (article === 'der') {
      germanExample = `${german} ist hier.`;
      englishExample = `The ${english} is here.`;
    } else if (article === 'die') {
      germanExample = `${german} ist schön.`;
      englishExample = `The ${english} is beautiful.`;
    } else {
      germanExample = `${german} ist wichtig.`;
      englishExample = `The ${english} is important.`;
    }
  } else if (partOfSpeech === 'verb') {
    germanExample = `Ich ${german}.`;
    englishExample = `I ${english}.`;
  } else if (partOfSpeech === 'adjective') {
    germanExample = `Das ist ${german}.`;
    englishExample = `That is ${english}.`;
  } else {
    // Default template
    germanExample = `${german}`;
    englishExample = `${english}`;
  }
  
  return { germanExample, englishExample };
}

// Extract article from entry
function extractArticle(entry) {
  // Check grammar info
  if (entry.gender) {
    const gen = entry.gender.toLowerCase();
    if (gen === 'm' || gen === 'masc' || gen === 'masculine') return 'der';
    if (gen === 'f' || gen === 'fem' || gen === 'feminine') return 'die';
    if (gen === 'n' || gen === 'neut' || gen === 'neuter') return 'das';
  }
  
  return null;
}

// Process completed entry
function processEntry(entry) {
  stats.total++;
  
  // Progress indicator
  if (stats.total % 10000 === 0) {
    console.log(`📊 Processed ${stats.total} entries, found ${stats.processed} valid words...`);
  }
  
  // Must have German word and at least one English translation
  if (!entry.german || entry.translations.length === 0) {
    stats.skipped.missingRequiredData++;
    return;
  }
  
  // Use first translation
  const english = entry.translations[0];
  
  // Extract article
  const article = extractArticle(entry);
  
  // Skip nouns without article
  if (entry.partOfSpeech === 'noun' && !article) {
    stats.skipped.nounWithoutArticle++;
    return;
  }
  
  // Add article to German word if it's a noun and doesn't have one
  let germanWord = entry.german.trim();
  if (article && entry.partOfSpeech === 'noun' && !germanWord.match(/^(der|die|das)\s+/i)) {
    germanWord = `${article} ${germanWord}`;
  }
  
  // Use existing examples or generate them
  let germanExample, englishExample;
  if (entry.germanExample && entry.englishExample) {
    germanExample = entry.germanExample;
    englishExample = entry.englishExample;
  } else {
    const generated = generateExamples(germanWord, english, article, entry.partOfSpeech);
    germanExample = generated.germanExample;
    englishExample = generated.englishExample;
  }
  
  stats.processed++;
  
  validWords.push({
    german: germanWord,
    english: english.trim(),
    article: article,
    part_of_speech: entry.partOfSpeech || null,
    german_example: germanExample,
    english_example: englishExample,
    pronunciation: entry.pronunciation || null,
  });
}

// Parse XML with SAX (streaming)
function parseXMLStreaming() {
  return new Promise((resolve, reject) => {
    console.log('📖 Parsing TEI XML file (streaming)...');
    console.log(`📁 File: ${TEI_XML_FILE}`);
    
    if (!fs.existsSync(TEI_XML_FILE)) {
      reject(new Error(`TEI XML file not found: ${TEI_XML_FILE}`));
      return;
    }
    
    const fileStats = fs.statSync(TEI_XML_FILE);
    console.log(`📊 File size: ${(fileStats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log('⏳ This will take several minutes...\n');
    
    const saxStream = sax.createStream(true, { trim: true, normalize: true });
    const fileStream = fs.createReadStream(TEI_XML_FILE, { encoding: 'utf8' });
    
    saxStream.on('opentag', (node) => {
      currentPath.push(node.name);
      
      // Start of new entry
      if (node.name === 'entry') {
        currentEntry = {
          german: null,
          gender: null,
          partOfSpeech: null,
          translations: [],
          germanExample: null,
          englishExample: null,
          pronunciation: null,
          inExample: false,
          inTranslation: false,
          inSense: false,
          exampleDepth: 0,
        };
      }
      
      // Track context
      if (currentEntry) {
        if (node.name === 'sense') {
          currentEntry.inSense = true;
        }
        if (node.name === 'cit' && node.attributes.type === 'example') {
          currentEntry.inExample = true;
          currentEntry.exampleDepth++;
        }
        if (node.name === 'cit' && node.attributes.type === 'trans' && currentEntry.inExample) {
          currentEntry.inTranslation = true;
        }
      }
      
      currentText = '';
    });
    
    saxStream.on('text', (text) => {
      if (currentEntry && text) {
        currentText += text;
      }
    });
    
    saxStream.on('closetag', (tagName) => {
      if (currentEntry) {
        const text = currentText.trim();
        
        // Capture German headword
        if (tagName === 'orth' && !currentEntry.german && text) {
          currentEntry.german = text;
        }
        
        // Capture gender
        if (tagName === 'gen' && text) {
          currentEntry.gender = text;
        }
        
        // Capture part of speech
        if (tagName === 'pos' && text && !currentEntry.partOfSpeech) {
          const pos = text.toLowerCase();
          if (pos.includes('noun') || pos === 'n') currentEntry.partOfSpeech = 'noun';
          else if (pos.includes('verb') || pos === 'v') currentEntry.partOfSpeech = 'verb';
          else if (pos.includes('adj')) currentEntry.partOfSpeech = 'adjective';
          else if (pos.includes('adv')) currentEntry.partOfSpeech = 'adverb';
          else currentEntry.partOfSpeech = pos;
        }
        
        // Capture pronunciation
        if (tagName === 'pron' && text) {
          currentEntry.pronunciation = text;
        }
        
        // Capture examples
        if (tagName === 'quote' && text) {
          if (currentEntry.inExample && !currentEntry.inTranslation && !currentEntry.germanExample) {
            // German example (first quote in example cit)
            currentEntry.germanExample = text;
          } else if (currentEntry.inExample && currentEntry.inTranslation && !currentEntry.englishExample) {
            // English translation of example
            currentEntry.englishExample = text;
          } else if (!currentEntry.inExample && currentEntry.inSense && currentEntry.translations.length < 3) {
            // Translation (in sense but not in example)
            // Only take first 3 translations
            currentEntry.translations.push(text);
          }
        }
        
        // End of contexts
        if (tagName === 'cit') {
          if (currentEntry.inExample) {
            currentEntry.exampleDepth--;
            if (currentEntry.exampleDepth === 0) {
              currentEntry.inExample = false;
            }
          }
          currentEntry.inTranslation = false;
        }
        
        if (tagName === 'sense') {
          currentEntry.inSense = false;
        }
        
        // End of entry - process it
        if (tagName === 'entry') {
          processEntry(currentEntry);
          currentEntry = null;
        }
      }
      
      currentPath.pop();
      currentText = '';
    });
    
    saxStream.on('error', (error) => {
      reject(error);
    });
    
    saxStream.on('end', () => {
      console.log('\n✅ XML parsing complete!');
      resolve();
    });
    
    fileStream.pipe(saxStream);
  });
}

// Create database
function createDatabase() {
  console.log('\n💾 Creating database...');
  
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

  console.log('✅ Database schema created!');
  return db;
}

// Insert words into database
function insertWords(db, words) {
  console.log(`\n💿 Inserting ${words.length.toLocaleString()} words into database...`);

  const insert = db.prepare(`
    INSERT INTO words (german, english, article, part_of_speech, german_example, english_example, pronunciation)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((words) => {
    for (const word of words) {
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
        stats.inserted++;
        
        if (stats.inserted % 5000 === 0) {
          console.log(`  Inserted ${stats.inserted.toLocaleString()} words...`);
        }
      } catch (err) {
        console.error(`Error inserting word "${word.german}":`, err.message);
      }
    }
  });

  insertMany(words);
  console.log('✅ Words inserted!');
}

// Print statistics
function printStats() {
  console.log('\n📊 Final Statistics:');
  console.log('━'.repeat(50));
  console.log(`Total entries processed: ${stats.total.toLocaleString()}`);
  console.log(`Valid words found: ${stats.processed.toLocaleString()}`);
  console.log(`Words inserted: ${stats.inserted.toLocaleString()}`);
  console.log('\nSkipped:');
  console.log(`  - No translation: ${stats.skipped.noTranslation.toLocaleString()}`);
  console.log(`  - Noun without article: ${stats.skipped.nounWithoutArticle.toLocaleString()}`);
  console.log(`  - Missing required data: ${stats.skipped.missingRequiredData.toLocaleString()}`);
  console.log('━'.repeat(50));
  
  const successRate = ((stats.inserted / stats.total) * 100).toFixed(2);
  console.log(`Success rate: ${successRate}%`);
  console.log(`\n✅ Database created: ${OUTPUT_DB}`);
  
  const dbSize = fs.statSync(OUTPUT_DB).size;
  console.log(`📦 Database size: ${(dbSize / 1024 / 1024).toFixed(2)} MB`);
}

// Main function
async function main() {
  console.log('🚀 German Vocabulary Database Builder (Final Version)');
  console.log('━'.repeat(50));
  console.log('📚 Processing FreeDict German-English Dictionary');
  console.log('⚙️  Strategy: Extract translations + generate examples');
  console.log('━'.repeat(50));
  console.log();

  try {
    // Step 1: Parse XML (streaming)
    await parseXMLStreaming();

    // Step 2: Create database and insert words
    const db = createDatabase();
    insertWords(db, validWords);
    db.close();

    // Step 3: Print statistics
    printStats();

    console.log('\n🎉 Success! Database is ready to use.');
  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

