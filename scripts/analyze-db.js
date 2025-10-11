import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '../assets/german-vocabulary.db');
const db = new Database(DB_PATH);

// Sample analysis
console.log('📊 Database Analysis\n');

// Total words
const total = db.prepare('SELECT COUNT(*) as count FROM words').get();
console.log(`Total words: ${total.count.toLocaleString()}`);

// By part of speech
console.log('\n📝 By Part of Speech:');
const byPos = db.prepare(`
  SELECT part_of_speech, COUNT(*) as count 
  FROM words 
  GROUP BY part_of_speech 
  ORDER BY count DESC
`).all();
byPos.forEach(row => {
  console.log(`  ${row.part_of_speech || 'unknown'}: ${row.count.toLocaleString()}`);
});

// By article
console.log('\n🔤 By Article (nouns only):');
const byArticle = db.prepare(`
  SELECT article, COUNT(*) as count 
  FROM words 
  WHERE part_of_speech = 'noun'
  GROUP BY article 
  ORDER BY count DESC
`).all();
byArticle.forEach(row => {
  console.log(`  ${row.article || 'none'}: ${row.count.toLocaleString()}`);
});

// Word length distribution
console.log('\n📏 By Word Length:');
const byLength = db.prepare(`
  SELECT 
    CASE 
      WHEN LENGTH(REPLACE(REPLACE(REPLACE(german, 'der ', ''), 'die ', ''), 'das ', '')) <= 5 THEN '1-5 chars'
      WHEN LENGTH(REPLACE(REPLACE(REPLACE(german, 'der ', ''), 'die ', ''), 'das ', '')) <= 10 THEN '6-10 chars'
      WHEN LENGTH(REPLACE(REPLACE(REPLACE(german, 'der ', ''), 'die ', ''), 'das ', '')) <= 15 THEN '11-15 chars'
      WHEN LENGTH(REPLACE(REPLACE(REPLACE(german, 'der ', ''), 'die ', ''), 'das ', '')) <= 20 THEN '16-20 chars'
      ELSE '21+ chars'
    END as length_range,
    COUNT(*) as count
  FROM words
  GROUP BY length_range
  ORDER BY length_range
`).all();
byLength.forEach(row => {
  console.log(`  ${row.length_range}: ${row.count.toLocaleString()}`);
});

// Sample very long words
console.log('\n❌ Examples of LONG words (21+ chars):');
const longWords = db.prepare(`
  SELECT german, LENGTH(REPLACE(REPLACE(REPLACE(german, 'der ', ''), 'die ', ''), 'das ', '')) as len
  FROM words
  WHERE LENGTH(REPLACE(REPLACE(REPLACE(german, 'der ', ''), 'die ', ''), 'das ', '')) > 20
  ORDER BY len DESC
  LIMIT 10
`).all();
longWords.forEach(row => {
  console.log(`  ${row.german} (${row.len} chars)`);
});

// Sample short, common words
console.log('\n✅ Examples of SHORT words (1-5 chars):');
const shortWords = db.prepare(`
  SELECT german
  FROM words
  WHERE LENGTH(REPLACE(REPLACE(REPLACE(german, 'der ', ''), 'die ', ''), 'das ', '')) <= 5
  LIMIT 20
`).all();
shortWords.forEach(row => {
  console.log(`  ${row.german}`);
});

// Words with spaces (compounds/phrases)
const withSpaces = db.prepare(`
  SELECT COUNT(*) as count
  FROM words
  WHERE german LIKE '% %' AND german NOT LIKE 'der %' AND german NOT LIKE 'die %' AND german NOT LIKE 'das %'
`).get();
console.log(`\n🔗 Multi-word entries (excluding articles): ${withSpaces.count.toLocaleString()}`);

// Sample multi-word entries
console.log('\n❌ Examples of multi-word entries:');
const multiWord = db.prepare(`
  SELECT german
  FROM words
  WHERE (german LIKE '% %' AND german NOT LIKE 'der %' AND german NOT LIKE 'die %' AND german NOT LIKE 'das %')
  LIMIT 10
`).all();
multiWord.forEach(row => {
  console.log(`  ${row.german}`);
});

db.close();
