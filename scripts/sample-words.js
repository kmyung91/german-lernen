import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, '../assets/german-vocabulary.db');
const db = new Database(DB_PATH);

console.log('🎲 Random Sample of 30 Words:\n');

const sample = db.prepare(`
  SELECT german, english, part_of_speech 
  FROM words 
  ORDER BY RANDOM() 
  LIMIT 30
`).all();

sample.forEach((word, i) => {
  console.log(`${i + 1}. ${word.german} → ${word.english} (${word.part_of_speech || 'unknown'})`);
});

db.close();
