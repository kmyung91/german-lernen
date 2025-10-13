# German Lernen 🇩🇪

A minimal, aesthetic iOS flashcard app for learning German vocabulary (A2-B1 level) with a focus on tech vocabulary and frictionless learning.

## Features ✨

- **📇 Flashcard Learning**: Swipe-based card interface with smooth animations
- **🎯 3-Bucket System**: 
  - ⬅️ Don't know (Red 🔴)
  - ➡️ Getting it (Yellow 🟡)
  - ⬆️ Know it (Green 🟢)
- **⚪ Smart Priority**: Unreviewed words shown first, then weighted by difficulty
- **↩️ Undo**: Made a mistake? Undo your last action
- **✏️ Edit & Notes**: Customize translations and add personal notes
- **🌙 Dark Mode**: Automatic theme switching with persistence
- **📊 Progress Tracking**: Visual progress indicator and bucket statistics
- **💾 Offline-First**: All data stored locally, works completely offline
- **🔄 Persistent Progress**: Your learning progress survives app updates

## Tech Stack 🛠️

- **Framework**: React Native (Expo)
- **Language**: TypeScript
- **Database**: SQLite (expo-sqlite)
- **Storage**: Expo FileSystem
- **Gestures**: react-native-gesture-handler
- **Icons**: react-native-svg
- **State**: React Hooks + AsyncStorage

## Project Structure 📁

```
german-lernen-v4.5/
├── App.tsx                 # Main app component (card UI, gestures, state)
├── database.ts             # SQLite database operations
├── design-system.ts        # Design tokens (colors, typography, spacing)
├── theme-context.tsx       # Theme provider (light/dark mode)
├── assets/
│   ├── german-vocabulary.db    # Production vocabulary database (2,528 words)
│   ├── icon.png                # App icon
│   ├── splash-icon.png         # Splash screen
│   └── adaptive-icon.png       # Android adaptive icon
├── scripts/                # Database build scripts (not included in app)
│   ├── parse-anki-clean.js     # Parses Anki decks → SQLite
│   └── package.json            # Script dependencies
└── DATABASE_PLAN.md        # Database strategy documentation
```

## Database Schema 📊

### `vocabulary` table (main word data)
```sql
CREATE TABLE vocabulary (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  german TEXT NOT NULL,              -- German word (e.g., "der Hund")
  english TEXT NOT NULL,             -- English translation (e.g., "dog")
  german_example TEXT NOT NULL,      -- German example sentence
  english_example TEXT NOT NULL,     -- English example sentence
  bucket TEXT DEFAULT 'dontKnow',    -- Learning bucket (dontKnow/learning/mastered)
  last_seen INTEGER,                 -- Timestamp of last review
  times_known INTEGER DEFAULT 0,     -- Number of times marked as "known"
  is_removed INTEGER DEFAULT 0,      -- 1 if user swiped up to remove
  level TEXT                         -- A2 or B1
);
```

### `user_edits` table (user customizations)
```sql
CREATE TABLE user_edits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word_id INTEGER NOT NULL UNIQUE,   -- Reference to vocabulary.id
  custom_german TEXT,                -- User's custom German text
  custom_english TEXT,               -- User's custom English text
  custom_german_example TEXT,        -- User's custom German example
  custom_english_example TEXT,       -- User's custom English example
  updated_at INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (word_id) REFERENCES vocabulary(id)
);
```

### `user_notes` table (personal notes)
```sql
CREATE TABLE user_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word_id INTEGER NOT NULL UNIQUE,   -- Reference to vocabulary.id
  note TEXT,                         -- User's personal note
  updated_at INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (word_id) REFERENCES vocabulary(id)
);
```

## Data Source 📚

**Vocabulary**: Anki shared decks from Goethe Institute
- [A2 Wortliste](https://ankiweb.net/shared/info/1386119660)
- B1 Wortliste (DTZ Goethe)

**Total Words**: 2,528 German words with accurate translations and example sentences

**Quality Criteria**:
- ✅ All words have German-English translations
- ✅ All words have example sentences (both German & English)
- ✅ Example sentences are short (<60 characters)
- ✅ No 1-word sentences
- ✅ Nouns include articles (der/die/das)

## Learning Algorithm 🧠

**Priority System**:
1. **Unreviewed words first** (⚪ white circle) - shown until all words are reviewed once
2. **Weighted selection** (after all words reviewed):
   - 70% from "Don't know" bucket (🔴 red)
   - 25% from "Getting it" bucket (🟡 yellow)
   - 5% from "Know it" bucket (🟢 green)

This ensures:
- New learners see all vocabulary systematically
- Review focuses on difficult words
- Mastered words still appear occasionally for retention

## Development 🔧

### Prerequisites
- Node.js (v18+)
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Xcode) or physical iPhone

### Setup
```bash
# Install dependencies
npm install

# Start development server
npx expo start

# Run on iOS simulator
npx expo start --ios
```

### Database Scripts
```bash
cd scripts
npm install

# Build database from Anki decks
# (Place .apkg files in scripts/ first)
npm run build
```

## Design System 🎨

### Colors
**Light Mode**:
- Background: `#F5F5F5`
- Surface: `#FFFFFF`
- Text: `#1A1A1A`
- Primary: `#2563EB`

**Dark Mode**:
- Background: `#1A1A1A`
- Surface: `#2D2D2D`
- Text: `#F5F5F5`
- Primary: `#3B82F6`

### Typography
- **Font Sizes**: `xs` (12) → `sm` (14) → `md` (16) → `lg` (18) → `xl` (24) → `2xl` (32)
- **Font Weights**: Regular (400), Medium (500), Semibold (600), Bold (700)

### Spacing
- **Scale**: `xs` (4) → `sm` (8) → `md` (16) → `lg` (24) → `xl` (32) → `2xl` (48)

## User Data Persistence 💾

**What persists across app updates:**
- ✅ Learning progress (bucket, times_known, last_seen)
- ✅ User edits (custom translations)
- ✅ Personal notes
- ✅ Theme preference (light/dark)

**How it works:**
- Database copied to document directory on first install
- Subsequent updates keep existing user data
- Migrations run automatically to add new features

## Known Limitations ⚠️

- iOS only (Android support possible via Expo)
- No cloud sync (local device only)
- No audio pronunciation (yet)
- No spaced repetition algorithm (just weighted random)
- No statistics/analytics screen (yet)

## Roadmap 🗺️

### Phase 1: Production Ready
- [ ] App icon + splash screen
- [ ] Onboarding tutorial
- [ ] Statistics screen
- [ ] Haptic feedback
- [ ] Physical device testing
- [ ] Error handling

### Phase 2: Enhanced Features
- [ ] Settings screen (reset progress, export data)
- [ ] Review history
- [ ] Achievements/badges
- [ ] Daily notifications
- [ ] Widget support

### Phase 3: Advanced
- [ ] Audio pronunciation (TTS or real audio)
- [ ] Spaced repetition algorithm
- [ ] Cloud backup/sync
- [ ] Multiple language support

## License 📄

This project uses vocabulary data from Anki shared decks (Goethe Institute). Please respect the original creators' licenses.

## Credits 👏

- **Vocabulary Data**: Goethe Institute Anki decks
- **Framework**: Expo & React Native
- **Database**: SQLite
- **Icons**: System emojis

---

**Built with ❤️ for German language learners**
