# German Vocabulary App - Database Implementation Plan

## Overview
Implement FreeDict German-English dictionary with SQLite storage and strict data quality requirements.

## Core Requirements
- **Source:** FreeDict German-English Dictionary (TEI XML format)
- **Storage:** SQLite database bundled with app
- **Bucket System:** 2 buckets only - `dontKnow` and `know`
- **User State:** No progress state until first interaction
- **Quality:** Strict filtering - skip any word missing core data

## Phase 1: Data Acquisition & Parsing

### Download Source
- **Format:** TEI XML (easier to parse than StarDict binary)
- **URL:** https://download.freedict.org/dictionaries/deu-eng/
- **License:** GNU GPL v3

### Data Quality Rules (STRICT)
✅ **MUST HAVE:**
- German word (headword)
- English translation
- For nouns: Article (der/die/das)
- German example sentence
- English example sentence

❌ **SKIP IF MISSING:**
- Nouns without articles
- Words without example sentences
- Words without translations

### Expected Output
- ~50-100K high-quality entries (filtered from 517K total)
- All entries meet quality requirements
- No partial data

## Phase 2: Database Design

### Schema

#### Table: `words` (static dictionary data)
```sql
CREATE TABLE words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  german TEXT NOT NULL,              -- "das Haus", "laufen", "schnell"
  english TEXT NOT NULL,              -- "house", "to run", "fast"
  article TEXT,                       -- "das", "die", "der" (NULL for non-nouns)
  part_of_speech TEXT,               -- "noun", "verb", "adjective"
  german_example TEXT NOT NULL,      -- "Das Haus ist groß."
  english_example TEXT NOT NULL,     -- "The house is big."
  pronunciation TEXT,                -- "haʊs" (optional)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_words_article ON words(article);
CREATE INDEX idx_words_pos ON words(part_of_speech);
```

#### Table: `user_progress` (user learning state)
```sql
CREATE TABLE user_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word_id INTEGER NOT NULL UNIQUE,   -- One row per word
  bucket TEXT NOT NULL CHECK(bucket IN ('dontKnow', 'know')),
  times_seen INTEGER DEFAULT 0,
  times_known INTEGER DEFAULT 0,
  last_seen TIMESTAMP,
  is_removed BOOLEAN DEFAULT 0,      -- Swipe up to remove
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (word_id) REFERENCES words(id)
);

CREATE UNIQUE INDEX idx_user_progress_word_id ON user_progress(word_id);
CREATE INDEX idx_user_progress_bucket ON user_progress(bucket);
CREATE INDEX idx_user_progress_removed ON user_progress(is_removed);
```

### Data Storage Format
- **Articles:** Store as full words ("der", "die", "das") for direct UI display
- **German words:** Include article in german field for nouns: "das Haus"
- **User state:** No rows in user_progress until first interaction
- **Database file:** Bundle as asset with app

## Phase 3: Data Processing Pipeline

### Tools & Libraries
- Node.js script in `/scripts` folder
- `xml2js` for XML parsing
- `better-sqlite3` for database creation
- Bundle resulting `.db` file in app

### Processing Steps
1. Download FreeDict TEI XML
2. Parse all entries
3. Apply strict filtering rules
4. Extract required fields:
   - German word (with article for nouns)
   - English translation
   - Article (der/die/das)
   - Part of speech
   - German example
   - English example
   - Pronunciation (if available)
5. Validate each entry
6. Insert into SQLite database
7. Create indexes
8. Output statistics

### Output Location
- Database file: `/assets/german-vocabulary.db`
- Bundle with React Native app

## Phase 4: App Integration

### Install Dependencies
```bash
npx expo install expo-sqlite
```

### App Changes

#### 1. Load Database
```typescript
import * as SQLite from 'expo-sqlite';
const db = SQLite.openDatabase('german-vocabulary.db');
```

#### 2. Update Bucket System
- Remove 3-bucket system (learning/reviewing/mastered)
- Implement 2-bucket system (dontKnow/know)
- Update UI accordingly

#### 3. Query Words
```sql
-- Get next word (prioritize dontKnow, exclude removed)
SELECT w.*, up.bucket, up.times_seen 
FROM words w
LEFT JOIN user_progress up ON w.id = up.word_id
WHERE (up.bucket = 'dontKnow' OR up.bucket IS NULL)
  AND (up.is_removed = 0 OR up.is_removed IS NULL)
ORDER BY RANDOM()
LIMIT 1;
```

#### 4. Save Progress
```sql
-- After swipe left (don't know)
INSERT INTO user_progress (word_id, bucket, times_seen, last_seen)
VALUES (?, 'dontKnow', 1, CURRENT_TIMESTAMP)
ON CONFLICT(word_id) DO UPDATE SET
  bucket = 'dontKnow',
  times_seen = times_seen + 1,
  last_seen = CURRENT_TIMESTAMP,
  updated_at = CURRENT_TIMESTAMP;

-- After swipe right (know)
INSERT INTO user_progress (word_id, bucket, times_seen, times_known, last_seen)
VALUES (?, 'know', 1, 1, CURRENT_TIMESTAMP)
ON CONFLICT(word_id) DO UPDATE SET
  bucket = 'know',
  times_seen = times_seen + 1,
  times_known = times_known + 1,
  last_seen = CURRENT_TIMESTAMP,
  updated_at = CURRENT_TIMESTAMP;

-- After swipe up (remove)
INSERT INTO user_progress (word_id, bucket, times_seen, is_removed, last_seen)
VALUES (?, 'dontKnow', 1, 1, CURRENT_TIMESTAMP)
ON CONFLICT(word_id) DO UPDATE SET
  is_removed = 1,
  updated_at = CURRENT_TIMESTAMP;
```

#### 5. UI Updates
- Update swipe instructions: "Swipe right: Know • Swipe left: Don't Know • Swipe up: Remove"
- Remove 3-bucket emoji system (🔴🟡🟢)
- Simplify to 2-bucket system
- Update stats display

### TypeScript Types
```typescript
interface Word {
  id: number;
  german: string;           // "das Haus"
  english: string;          // "house"
  article: string | null;   // "das" or null for non-nouns
  part_of_speech: string;   // "noun", "verb", etc.
  german_example: string;   // "Das Haus ist groß."
  english_example: string;  // "The house is big."
  pronunciation?: string;   // "haʊs"
}

interface UserProgress {
  word_id: number;
  bucket: 'dontKnow' | 'know';
  times_seen: number;
  times_known: number;
  last_seen: string;
  is_removed: boolean;
}
```

## Data Display Format

### Card Front (German Side)
```
das Haus
[german example sentence]
```

### Card Back (English Side)
```
house
[english example sentence]
```

### Article Display
- Nouns: Show with article ("das Haus", "die Katze", "der Hund")
- Verbs: Show without article ("laufen", "gehen")
- Adjectives: Show without article ("schnell", "groß")

## Success Metrics

### Data Quality
- ✅ All entries have required fields
- ✅ All nouns have articles
- ✅ All entries have example sentences
- ✅ No partial/incomplete entries

### App Performance
- ✅ Database loads quickly on app start
- ✅ Random word queries < 50ms
- ✅ Progress updates are instant
- ✅ Smooth user experience

### User Experience
- ✅ Clear two-bucket system
- ✅ Articles displayed for all nouns
- ✅ Example sentences help learning
- ✅ Remove feature works correctly

## Future Enhancements (Not in Current Scope)
- Word frequency rankings
- Spaced repetition algorithm
- "Bring back removed cards" feature
- Search/browse all words
- Export/import progress
- Statistics dashboard

## License Compliance
- Include FreeDict attribution in app
- Provide GNU GPL v3 license
- Mention in credits/about section

---

**Document Version:** 1.0  
**Last Updated:** 2025-10-11  
**Status:** Ready for implementation

