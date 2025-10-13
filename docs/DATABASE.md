# Database Documentation

## Overview

The app uses SQLite to store vocabulary and user progress locally on the device.

## Database Location

- **Bundled Database**: `assets/german-vocabulary.db` (read-only, included in app bundle)
- **User Database**: `{DocumentDirectory}/SQLite/german-vocabulary.db` (copied on first run, includes user progress)

## Schema

### `vocabulary` (main vocabulary table)

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PRIMARY KEY | Unique word ID |
| `german` | TEXT NOT NULL | German word (with article for nouns) |
| `english` | TEXT NOT NULL | English translation |
| `german_example` | TEXT NOT NULL | German example sentence (<60 chars) |
| `english_example` | TEXT NOT NULL | English example sentence (<60 chars) |
| `bucket` | TEXT | Learning bucket: `dontKnow`, `learning`, `mastered` |
| `last_seen` | INTEGER | Unix timestamp of last review (NULL = unreviewed) |
| `times_known` | INTEGER | Count of times user marked as "known" |
| `is_removed` | INTEGER | 1 if user swiped up to remove, 0 otherwise |
| `level` | TEXT | Word level: `A2` or `B1` |

**Initial State**:
- All words start with `bucket = 'dontKnow'`
- `last_seen = NULL` (indicates unreviewed)
- `times_known = 0`
- `is_removed = 0`

### `user_edits` (user customizations)

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PRIMARY KEY | Unique edit ID |
| `word_id` | INTEGER UNIQUE | Foreign key to `vocabulary.id` |
| `custom_german` | TEXT | User's custom German text |
| `custom_english` | TEXT | User's custom English translation |
| `custom_german_example` | TEXT | User's custom German example |
| `custom_english_example` | TEXT | User's custom English example |
| `updated_at` | INTEGER | Unix timestamp of last edit |

**Merging Logic**:
- When loading a word, `user_edits` override `vocabulary` fields
- Only non-NULL fields in `user_edits` are used
- This allows partial overrides (e.g., only editing the English translation)

### `user_notes` (personal notes)

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PRIMARY KEY | Unique note ID |
| `word_id` | INTEGER UNIQUE | Foreign key to `vocabulary.id` |
| `note` | TEXT | User's personal note |
| `updated_at` | INTEGER | Unix timestamp of last update |

## Key Operations

### `getNextWord()`

**Priority Logic**:
1. If unreviewed words exist (`last_seen IS NULL`), return one randomly
2. Otherwise, weighted random selection:
   - 70% from `dontKnow` bucket
   - 25% from `learning` bucket
   - 5% from `mastered` bucket

**SQL**:
```sql
-- Priority 1: Unreviewed
SELECT * FROM vocabulary 
WHERE last_seen IS NULL AND is_removed = 0 
ORDER BY RANDOM() LIMIT 1;

-- Priority 2: Weighted by bucket
SELECT * FROM vocabulary 
WHERE bucket = ? AND is_removed = 0 
ORDER BY RANDOM() LIMIT 1;
```

### `updateProgress(wordId, bucket, isRemove)`

Updates a word's learning state after a swipe.

**SQL**:
```sql
UPDATE vocabulary 
SET 
  bucket = ?,
  times_known = times_known + (? = 'mastered' ? 1 : 0),
  last_seen = ?,
  is_removed = ?
WHERE id = ?;
```

### `getWordById(id)`

Loads a word with user edits merged.

**SQL**:
```sql
SELECT 
  v.*,
  COALESCE(e.custom_german, v.german) as german,
  COALESCE(e.custom_english, v.english) as english,
  COALESCE(e.custom_german_example, v.german_example) as german_example,
  COALESCE(e.custom_english_example, v.english_example) as english_example
FROM vocabulary v
LEFT JOIN user_edits e ON v.id = e.word_id
WHERE v.id = ?;
```

### `getBucketCounts()`

Returns statistics for the header display.

**SQL**:
```sql
-- Count reviewed words in each bucket
SELECT COUNT(*) FROM vocabulary 
WHERE bucket = 'dontKnow' AND is_removed = 0 AND last_seen IS NOT NULL;

-- Count total reviewed words
SELECT COUNT(*) FROM vocabulary 
WHERE is_removed = 0 AND last_seen IS NOT NULL;
```

## Migrations

Migrations are run automatically on app start via `runMigrations()`.

**Migration Strategy**:
- Each migration is idempotent (safe to run multiple times)
- Uses `CREATE TABLE IF NOT EXISTS`
- Checks for existing columns before altering tables

**Current Migrations**:
1. Create `user_edits` table (if not exists)
2. Create `user_notes` table (if not exists)

## Data Quality

**Vocabulary Requirements**:
- ✅ All words have German + English translations
- ✅ All words have example sentences (both languages)
- ✅ Example sentences are < 60 characters
- ✅ No 1-word sentences
- ✅ Nouns include articles (der/die/das)

**Data Source**:
- Anki shared decks (Goethe Institute A2 + B1 Wortliste)
- Total: 2,528 words

## Backup & Updates

**User Data Persistence**:
- User progress stored in document directory
- Survives app updates (database not overwritten)
- User edits and notes persist across updates

**Caveats**:
- Vocabulary updates (new words, bug fixes) won't propagate to existing installs
- Future: Implement version-aware migrations to merge new vocabulary

## Performance

**Indexing**:
- No explicit indexes currently (small dataset, 2.5K words)
- Future: Add indexes on `bucket`, `last_seen`, `is_removed` if performance degrades

**Query Performance**:
- All queries use `LIMIT 1` or simple filters
- Expected response time: <10ms on modern devices
- No N+1 queries (single query per operation)

## Troubleshooting

**Database not found**:
- Ensure `german-vocabulary.db` exists in `assets/`
- Check `expo-asset` and `expo-file-system` are installed

**Progress not saving**:
- Check document directory is writable
- Verify `last_seen` is being updated (check with SQL query)

**User edits not showing**:
- Verify `user_edits` table exists (migration ran)
- Check `getWordById()` is merging edits correctly

