import Database from 'better-sqlite3';
import xml2js from 'xml2js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

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
    noExamples: 0,
    nounWithoutArticle: 0,
    missingRequiredData: 0,
  },
  inserted: 0,
};

// Parse XML
async function parseXML() {
  console.log('📖 Parsing TEI XML file...');
  console.log(`📁 File: ${TEI_XML_FILE}`);
  
  if (!fs.existsSync(TEI_XML_FILE)) {
    throw new Error(`TEI XML file not found: ${TEI_XML_FILE}`);
  }
  
  const stats = fs.statSync(TEI_XML_FILE);
  console.log(`📊 File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log('⏳ This may take a few minutes...');
  
  const xml = fs.readFileSync(TEI_XML_FILE, 'utf8');
  console.log('✅ File loaded into memory');
  console.log('🔄 Parsing XML structure...');
  
  const parser = new xml2js.Parser();
  const result = await parser.parseStringPromise(xml);
  console.log('✅ XML parsed!');
  return result;
}

// Extract article from German word or grammar info
function extractArticle(entry) {
  // Try to find article in form element
  if (entry.form) {
    for (const form of entry.form) {
      if (form.orth && form.orth[0]) {
        const orth = form.orth[0];
        if (typeof orth === 'string') {
          const match = orth.match(/^(der|die|das)\s+/i);
          if (match) {
            return match[1].toLowerCase();
          }
        }
      }
    }
  }

  // Try to find in gramGrp
  if (entry.gramGrp) {
    for (const grp of entry.gramGrp) {
      if (grp.gen && grp.gen[0]) {
        const gen = grp.gen[0].toLowerCase();
        if (gen === 'm' || gen === 'masc' || gen === 'masculine') return 'der';
        if (gen === 'f' || gen === 'fem' || gen === 'feminine') return 'die';
        if (gen === 'n' || gen === 'neut' || gen === 'neuter') return 'das';
      }
    }
  }

  return null;
}

// Extract part of speech
function extractPartOfSpeech(entry) {
  if (entry.gramGrp) {
    for (const grp of entry.gramGrp) {
      if (grp.pos && grp.pos[0]) {
        const pos = grp.pos[0].toLowerCase();
        // Normalize common POS tags
        if (pos.includes('noun') || pos === 'n') return 'noun';
        if (pos.includes('verb') || pos === 'v') return 'verb';
        if (pos.includes('adj')) return 'adjective';
        if (pos.includes('adv')) return 'adverb';
        return pos;
      }
    }
  }
  return null;
}

// Extract examples
function extractExamples(sense) {
  const examples = [];
  
  if (sense.cit) {
    for (const cit of sense.cit) {
      if (cit.$.type === 'example' || cit.$.type === 'trans') {
        const quote = cit.quote ? cit.quote[0] : null;
        if (quote && typeof quote === 'string') {
          examples.push(quote.trim());
        }
      }
    }
  }

  return examples;
}

// Extract translation
function extractTranslation(sense) {
  if (sense.trans) {
    for (const trans of sense.trans) {
      if (trans.tr) {
        for (const tr of trans.tr) {
          if (typeof tr === 'string') {
            return tr.trim();
          }
        }
      }
    }
  }
  
  // Try cit with type translation
  if (sense.cit) {
    for (const cit of sense.cit) {
      if (cit.$.type === 'trans' && cit.quote) {
        const quote = cit.quote[0];
        if (typeof quote === 'string') {
          return quote.trim();
        }
      }
    }
  }

  return null;
}

// Process entry
function processEntry(entry) {
  stats.total++;

  // Extract German word (headword)
  let germanWord = null;
  if (entry.form && entry.form[0] && entry.form[0].orth && entry.form[0].orth[0]) {
    germanWord = entry.form[0].orth[0];
    if (typeof germanWord !== 'string') {
      germanWord = null;
    } else {
      germanWord = germanWord.trim();
    }
  }

  if (!germanWord) {
    stats.skipped.missingRequiredData++;
    return null;
  }

  // Extract POS
  const partOfSpeech = extractPartOfSpeech(entry);
  
  // Extract article (for nouns)
  let article = extractArticle(entry);
  
  // If it's a noun but no article found, skip it
  if (partOfSpeech === 'noun' && !article) {
    stats.skipped.nounWithoutArticle++;
    return null;
  }

  // Process senses to find translation and examples
  if (!entry.sense || entry.sense.length === 0) {
    stats.skipped.noTranslation++;
    return null;
  }

  const sense = entry.sense[0]; // Use first sense

  // Extract translation
  const englishTranslation = extractTranslation(sense);
  if (!englishTranslation) {
    stats.skipped.noTranslation++;
    return null;
  }

  // Extract examples
  const examples = extractExamples(sense);
  if (examples.length < 2) {
    // Need at least German and English example
    stats.skipped.noExamples++;
    return null;
  }

  const germanExample = examples[0];
  const englishExample = examples[1];

  // Add article to German word if it's a noun
  if (article && partOfSpeech === 'noun' && !germanWord.match(/^(der|die|das)\s+/i)) {
    germanWord = `${article} ${germanWord}`;
  }

  stats.processed++;

  return {
    german: germanWord,
    english: englishTranslation,
    article: article,
    part_of_speech: partOfSpeech,
    german_example: germanExample,
    english_example: englishExample,
    pronunciation: null, // Will implement if data is available
  };
}

// Create database
function createDatabase() {
  console.log('💾 Creating database...');
  
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
  console.log(`💿 Inserting ${words.length} words into database...`);

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
      } catch (err) {
        console.error(`Error inserting word "${word.german}":`, err.message);
      }
    }
  });

  insertMany(words);
  console.log('✅ Words inserted!');
}

// Main processing function
async function processData(parsedXML) {
  console.log('🔄 Processing entries...');

  const entries = parsedXML.TEI.text[0].body[0].entry;
  console.log(`Found ${entries.length} total entries`);

  const validWords = [];

  for (const entry of entries) {
    const word = processEntry(entry);
    if (word) {
      validWords.push(word);
    }

    // Progress indicator
    if (stats.total % 10000 === 0) {
      console.log(`Processed ${stats.total} entries, found ${validWords.length} valid words...`);
    }
  }

  console.log('✅ Processing complete!');
  return validWords;
}

// Print statistics
function printStats() {
  console.log('\n📊 Statistics:');
  console.log('━'.repeat(50));
  console.log(`Total entries processed: ${stats.total}`);
  console.log(`Valid words found: ${stats.processed}`);
  console.log(`Words inserted: ${stats.inserted}`);
  console.log('\nSkipped:');
  console.log(`  - No translation: ${stats.skipped.noTranslation}`);
  console.log(`  - No examples: ${stats.skipped.noExamples}`);
  console.log(`  - Noun without article: ${stats.skipped.nounWithoutArticle}`);
  console.log(`  - Missing required data: ${stats.skipped.missingRequiredData}`);
  console.log('━'.repeat(50));
  
  const successRate = ((stats.inserted / stats.total) * 100).toFixed(2);
  console.log(`Success rate: ${successRate}%`);
  console.log(`\n✅ Database created: ${OUTPUT_DB}`);
}

// Main function
async function main() {
  console.log('🚀 German Vocabulary Database Builder');
  console.log('━'.repeat(50));
  console.log('📚 Processing FreeDict German-English Dictionary');
  console.log('━'.repeat(50));
  console.log();

  try {
    // Step 1: Parse XML
    const parsedXML = await parseXML();

    // Step 2: Process entries
    const validWords = await processData(parsedXML);

    // Step 3: Create database and insert words
    const db = createDatabase();
    insertWords(db, validWords);
    db.close();

    // Step 4: Print statistics
    printStats();

    console.log('\n🎉 Success! Database is ready to use.');
  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

