# Project Summary

## What We Built

A minimal, aesthetic iOS flashcard app for learning German vocabulary (A2-B1 level) with:
- Swipe-based card interface (left/right/up gestures)
- 3-bucket learning system (Don't know, Getting it, Know it)
- Smart prioritization (unreviewed words first)
- Undo functionality
- Edit flow (customize any word + add notes)
- Dark/light mode
- Progress tracking
- Offline-first (100% local storage)
- Persistent user data (survives app updates)

## Tech Stack

- **React Native + Expo** (iOS native via expo-dev-client)
- **TypeScript** (type-safe development)
- **SQLite** (local database, 2,528 words)
- **React Native Gesture Handler** (card swiping)
- **Animated API** (smooth animations)
- **AsyncStorage** (theme persistence)

## Key Files

| File | Purpose | Lines |
|------|---------|-------|
| `App.tsx` | Main UI + logic | ~1,085 |
| `database.ts` | SQLite operations | ~472 |
| `design-system.ts` | Design tokens | ~150 |
| `theme-context.tsx` | Theme provider | ~80 |
| `assets/german-vocabulary.db` | Vocabulary (2,528 words) | N/A |

## Vocabulary Database

**Source**: Anki shared decks (Goethe Institute A2 + B1 Wortliste)

**Stats**:
- 2,528 total words
- 100% have translations
- 100% have example sentences (<60 chars)
- Nouns include articles (der/die/das)
- Split: A2 (unknown) + B1 (unknown)

**Schema**:
- `vocabulary` - Main word data + learning progress
- `user_edits` - User customizations (persists across updates)
- `user_notes` - Personal notes (persists across updates)

## Development Journey

### Phase 1: UI/UX Perfection (Days 1-3)
- Built card swiping with smooth animations
- Fixed card flashing issues (blank card approach)
- Implemented 3-bucket system
- Added undo functionality
- Polished header layout

### Phase 2: Database Strategy (Days 4-6)
- Evaluated FreeDict (abandoned - too complex)
- Tried Tatoeba integration (abandoned - data mismatch)
- Settled on Anki decks (high quality, accurate)
- Built database processing pipeline

### Phase 3: User Customization (Day 7)
- Implemented edit flow (modal-based)
- Added user notes feature
- Created migration system for schema updates
- Separated user data from base vocabulary

### Phase 4: Polish & Refinement (Day 8)
- Fixed undo edge cases
- Added white circle for unreviewed words
- Implemented smart prioritization
- Cleaned up codebase
- Documented everything

## Key Decisions

### Why Anki decks over FreeDict?
- **Quality**: Curated by Goethe Institute
- **Accuracy**: Translations + examples already validated
- **Simplicity**: SQLite format (easier to parse than TEI XML)
- **Trust**: Widely used in language learning community

### Why SQLite over JSON?
- **Performance**: Fast queries, efficient storage
- **Flexibility**: Complex queries (weighted selection, filtering)
- **Scalability**: Handles 10K+ words easily
- **Standard**: Built-in support via expo-sqlite

### Why local-first over cloud sync?
- **Privacy**: No user accounts, no data collection
- **Offline**: Works 100% offline (perfect for learners)
- **Simplicity**: No backend, no auth, no sync conflicts
- **Cost**: Free to run (no server costs)

### Why 3 buckets instead of 2?
- **UX**: More nuanced learning progression
- **Motivation**: "Getting it" feels better than "Don't know"
- **Algorithm**: Weighted selection works better with 3 levels

### Why React Native over Swift?
- **Speed**: Faster development with hot reload
- **Flexibility**: Easy to add features, iterate on UI
- **Cross-platform**: Could port to Android easily
- **Ecosystem**: Rich library ecosystem (gesture handler, sqlite, etc.)

## Challenges Overcome

### 1. Card Flashing During Swipes
**Problem**: Previous card's content briefly visible during transition

**Solution**: Blank card approach - fade out content before swipe, fade in after

**Impact**: Smooth, glitch-free animations

### 2. Undo Restoring Wrong Card
**Problem**: Undo loaded a random card instead of the previously swiped one

**Solution**: Store word ID in swipe history, load by ID instead of `getNextWord()`

**Impact**: Reliable undo functionality

### 3. Data Quality Issues (FreeDict)
**Problem**: Missing examples, inaccurate translations, complex parsing

**Solution**: Switched to Anki decks (higher quality, simpler parsing)

**Impact**: 2,528 high-quality words with accurate data

### 4. User Edits Persistence
**Problem**: How to allow edits without losing them on app updates?

**Solution**: Separate `user_edits` and `user_notes` tables, merged at query time

**Impact**: User customizations survive app updates

### 5. Card Re-appearing Multiple Times
**Problem**: Just-reviewed cards randomly appearing again

**Solution**: Prioritize unreviewed words first, then weighted selection

**Impact**: Predictable, fair learning experience

## What's Left for Production

### Must Have (P0)
- [ ] App icon + splash screen
- [ ] Onboarding tutorial (3-4 screens)
- [ ] Statistics screen (progress charts)
- [ ] Haptic feedback
- [ ] Physical device testing
- [ ] Privacy policy

### Should Have (P1)
- [ ] Settings screen (reset, export)
- [ ] Error handling + empty states
- [ ] App Store metadata

### Nice to Have (P2)
- [ ] Achievements/badges
- [ ] Daily notifications
- [ ] Audio pronunciation
- [ ] Widget support

## Metrics

**Development Time**: ~8 days
**Lines of Code**: ~2,000 (excluding scripts)
**Database Size**: ~8MB
**Words**: 2,528
**Commits**: TBD
**Dependencies**: 12 (expo + react native + minimal extras)

## Lessons Learned

1. **Perfect the core first**: Spent 3 days on card animations, worth it
2. **Data quality matters**: Switching to Anki saved weeks of parsing work
3. **User data separation**: Separate tables for user edits = future-proof
4. **Documentation as you go**: Would have been harder to document after
5. **Local-first is powerful**: No backend complexity, instant performance

## Future Vision

### v0.2 - Production (2 weeks)
- App Store ready
- Basic analytics
- Settings screen

### v0.3 - Enhanced Learning (1 month)
- Statistics + insights
- Achievements
- Spaced repetition

### v0.4 - Community (2 months)
- Custom word sets
- Import/export
- Multiple languages

### v1.0 - Platform (3 months)
- Cloud sync (optional)
- Android version
- Widget support
- Audio pronunciation

## Acknowledgments

- **Vocabulary**: Goethe Institute Anki decks
- **Framework**: Expo team
- **Inspiration**: Duolingo, Anki, Quizlet
- **Design**: Minimal, aesthetic, frictionless

