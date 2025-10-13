# Database Build Scripts

This directory contains scripts for building the vocabulary database from Anki decks.

## Overview

The production database (`assets/german-vocabulary.db`) is built from curated Anki decks using these scripts.

## Quick Start

```bash
cd scripts
npm install

# Download Anki decks (if not present):
# 1. Visit: https://ankiweb.net/shared/info/1386119660
# 2. Download both A2 and B1 decks
# 3. Place .apkg files in this directory

# Expected files:
# - A2_Wortliste_Goethe_vocab_sentenses_audio_translation.apkg (65MB)
# - B1_Wortliste_DTZ_Goethe_vocabsentensesaudiotranslation.apkg (215MB)

# Build database
npm run build

# Output: german-vocabulary.db (copy to ../assets/)
```

## Download Links

**A2 Wortliste**: https://ankiweb.net/shared/info/1386119660
**B1 Wortliste**: (Included in same deck or search "B1 Wortliste DTZ Goethe" on AnkiWeb)

**Note**: The `.apkg` files are large (280MB total) and not included in the repo. Download them as needed.

## Main Script

### `parse-anki-clean.js`

**Purpose**: Parse Anki `.apkg` files and build SQLite database

**Process**:
1. Extract `.apkg` (ZIP archive) to temp directory
2. Read Anki SQLite database (`collection.anki2`)
3. Parse card data (German word, English translation, examples)
4. Filter for quality (sentences <60 chars, no 1-word sentences)
5. Build vocabulary database with schema

**Output**: `german-vocabulary.db` (2,528 words)

**Usage**:
```bash
node parse-anki-clean.js
```

## Legacy Scripts (Not Used)

These scripts were used during development but are no longer needed:

- `process-dictionary.js` - Parse FreeDict XML (abandoned, too complex)
- `process-dictionary-streaming.js` - Streaming XML parser (abandoned)
- `add-tatoeba-examples.js` - Integrate Tatoeba sentences (replaced by Anki)
- `filter-by-frequency.js` - Filter by frequency list (not needed with Anki)
- `improve-examples.js` - Improve example quality (not needed with Anki)
- `fix-final-issues.js` - Fix data issues (integrated into main script)
- `build-initial-db.js` - Build sample DB (no longer needed)

**Why abandoned FreeDict?**
- Complex TEI XML parsing
- Missing example sentences for most words
- Required multiple data sources (FreeDict + Tatoeba)
- Lower accuracy vs Anki decks

**Why chose Anki?**
- High-quality, curated vocabulary
- Already includes accurate translations + examples
- Trusted source (Goethe Institute)
- Simpler parsing (SQLite format)

## Database Schema

See `docs/DATABASE.md` for full schema documentation.

**Tables**:
- `vocabulary` - Main word data (German, English, examples, learning state)
- `user_edits` - User customizations (created at runtime)
- `user_notes` - Personal notes (created at runtime)

## Data Quality Rules

**Inclusion Criteria**:
- ✅ German word present
- ✅ English translation present
- ✅ German example sentence present (<60 chars)
- ✅ English example sentence present (<60 chars)
- ✅ No 1-word sentences
- ✅ Nouns include articles (der/die/das)

**Exclusion Criteria**:
- ❌ Missing translations
- ❌ Missing examples
- ❌ Example sentences too long (>60 chars)
- ❌ 1-word sentences
- ❌ Duplicate words

## File Structure

```
scripts/
├── README.md                               # This file
├── package.json                            # Dependencies
├── parse-anki-clean.js                     # Main build script (USED)
├── A2_Wortliste_*.apkg                     # Input: A2 Anki deck
├── B1_Wortliste_*.apkg                     # Input: B1 Anki deck
├── german-vocabulary.db                    # Output: Production DB
│
└── [legacy]/                               # Not used (kept for reference)
    ├── process-dictionary.js
    ├── process-dictionary-streaming.js
    ├── add-tatoeba-examples.js
    ├── filter-by-frequency.js
    ├── improve-examples.js
    ├── fix-final-issues.js
    ├── build-initial-db.js
    └── ... (various test/analysis scripts)
```

## Dependencies

```json
{
  "better-sqlite3": "^11.8.1",  // SQLite driver (Node.js)
  "adm-zip": "^0.5.16"          // Unzip .apkg files
}
```

## Troubleshooting

**Error: Cannot find Anki files**
- Ensure `.apkg` files are in `scripts/` directory
- Check filenames match expected patterns

**Error: Database already exists**
- Delete `german-vocabulary.db` and re-run

**Words missing from output**
- Check data quality filters (sentence length, etc.)
- Review console output for skipped words

## Updating Vocabulary

To rebuild the database with updated Anki decks:

1. Download new `.apkg` files
2. Place in `scripts/` directory
3. Run `npm run build`
4. Copy output to `../assets/german-vocabulary.db`
5. Test app with new database
6. Commit to git

**Note**: App updates won't overwrite user progress (see `docs/DATABASE.md`)

## Contributing

When modifying scripts:
1. Test with full dataset (2.5K words)
2. Verify data quality (spot-check 20-30 random words)
3. Check database file size (<10MB)
4. Update this README if process changes

