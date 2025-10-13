# Architecture Documentation

## Overview

German Lernen is a single-page React Native app built with Expo, using a component-driven architecture with local-first data storage.

## Tech Stack

### Core
- **React Native**: Cross-platform mobile framework
- **Expo SDK**: Development platform & build tools
- **TypeScript**: Type-safe JavaScript

### State Management
- **React Hooks**: Local component state (`useState`, `useEffect`)
- **Context API**: Theme management (`ThemeProvider`)
- **AsyncStorage**: Theme persistence

### Database
- **expo-sqlite**: SQLite database access
- **expo-file-system**: File operations (database copying)
- **expo-asset**: Bundle asset loading

### UI & Gestures
- **react-native-gesture-handler**: Pan gestures for card swiping
- **Animated API**: Card animations (swipe, flip, fade)
- **react-native-svg**: Circular progress indicator

## File Structure

```
src/
├── App.tsx                 # Main component (UI + logic)
├── database.ts             # Database operations (pure functions)
├── design-system.ts        # Design tokens
├── theme-context.tsx       # Theme provider + hook
└── assets/
    └── german-vocabulary.db
```

## Component Architecture

### `App.tsx` (Main Component)

**Responsibilities**:
- Card rendering (front/back, animations)
- Gesture handling (swipe, tap)
- State management (current word, buckets, history)
- Database initialization
- Header UI (progress, counters, buttons)
- Edit modal

**State Variables**:
```typescript
dbInitialized: boolean                  // Database ready flag
currentWord: Word | null                // Current card
nextWord: Word | null                   // Next card (pre-loaded)
bucketCounts: {                         // Header statistics
  dontKnow: number
  learning: number
  mastered: number
  totalReviewed: number
}
swipeHistory: SwipeAction[]             // For undo (last 10 actions)
isFlipped: boolean                      // Card flip state
isAnimating: boolean                    // Prevent simultaneous swipes
showContent: boolean                    // Control content fade
isEditModalVisible: boolean             // Edit modal state
editedWord: EditedWord | null           // Edit form state
```

**Animated Values**:
```typescript
translateX: Animated.Value              // Card horizontal position
translateY: Animated.Value              // Card vertical position
flipAnimation: Animated.Value           // Card flip rotation
contentOpacity: Animated.Value          // Content fade in/out
nextCardScale: Animated.Value           // Next card scale effect
nextCardTranslateX: Animated.Value      // Next card position X
nextCardTranslateY: Animated.Value      // Next card position Y
```

**Key Functions**:
- `initApp()`: Initialize database, load first words
- `loadWords()`: Load current + next word
- `updateBucketCounts()`: Refresh header statistics
- `handleSwipe(direction)`: Process card swipe
- `handleUndo()`: Restore previous state
- `flipCard()`: Toggle card front/back
- `handleOpenEditModal()`: Open edit UI
- `handleSaveEdit()`: Save user edits

### `database.ts` (Data Layer)

**Responsibilities**:
- Database initialization & migrations
- CRUD operations for vocabulary
- User edits & notes management
- Query logic (weighted selection)

**Exported Functions**:
```typescript
initDatabase(): Promise<void>
getNextWord(): Word | null
getWordById(id: number): Word | null
updateProgress(wordId, bucket, isRemove): void
getUserProgress(wordId): UserProgress | null
getBucketCounts(): BucketCounts
getTotalWordCount(): number
updateWord(wordId, edits): void
getUserNotes(wordId): string | null
resetWordProgress(wordId): void
resetProgress(): void
```

**Design Principles**:
- Pure functions (no side effects except DB writes)
- Error handling with try-catch + console.error
- Synchronous operations (SQLite is fast enough)

### `design-system.ts` (Design Tokens)

**Responsibilities**:
- Define color palettes (light/dark)
- Typography scale
- Spacing scale
- Border radius values
- Shadow styles

**Structure**:
```typescript
const lightTheme = {
  colors: { ... },
  typography: { fontSize, fontWeight, lineHeight },
  spacing: { xs, sm, md, lg, xl, 2xl },
  borderRadius: { sm, md, lg, full },
  shadows: { sm, md, lg }
}
```

**Usage**:
```typescript
const { designTokens } = useTheme();
fontSize: designTokens.typography.fontSize.lg
```

### `theme-context.tsx` (Theme Management)

**Responsibilities**:
- Provide theme tokens to components
- Toggle light/dark mode
- Persist theme preference (AsyncStorage)

**API**:
```typescript
const { designTokens, toggleTheme } = useTheme();
```

## Data Flow

### Initialization
```
App Start
  ↓
initApp()
  ↓
Database.initDatabase()
  ├─ Copy database to document directory
  ├─ Run migrations (user_edits, user_notes)
  └─ Return initialized DB
  ↓
loadWords()
  ├─ Database.getNextWord() → currentWord
  └─ Database.getNextWord() → nextWord
  ↓
updateBucketCounts()
  └─ Database.getBucketCounts() → header stats
  ↓
Render UI (dbInitialized = true)
```

### Card Swipe Flow
```
User swipes card
  ↓
PanGestureHandler (onGestureEvent)
  ↓
Animated.event(translateX, translateY)
  ↓
onHandlerStateChange (END)
  ↓
handleSwipe(direction)
  ├─ Add to swipeHistory (for undo)
  ├─ Animate card off-screen
  ├─ Fade out content
  ├─ Database.updateProgress(bucket, isRemove)
  ├─ setCurrentWord(nextWord)
  ├─ setNextWord(Database.getNextWord())
  ├─ updateBucketCounts()
  ├─ Reset animations
  └─ Fade in content (30ms delay)
```

### Undo Flow
```
User taps Undo
  ↓
handleUndo()
  ├─ Get last action from swipeHistory
  ├─ Remove from history
  ├─ Check if word was previously reviewed
  │   ├─ YES: Database.updateProgress(oldBucket)
  │   └─ NO: Database.resetWordProgress()
  ├─ Load word by ID
  ├─ setCurrentWord(restoredWord)
  ├─ setNextWord(oldCurrentWord)
  └─ updateBucketCounts()
```

### Edit Flow
```
User taps Edit
  ↓
handleOpenEditModal()
  ├─ Load current word data
  ├─ Load existing notes (Database.getUserNotes)
  └─ Open modal
  ↓
User edits fields
  ↓
User taps Save
  ↓
handleSaveEdit()
  ├─ Database.updateWord(wordId, edits)
  ├─ Reload current word (with edits merged)
  └─ Close modal
```

## Animation Strategy

### Card Swipe
- **Pan Gesture**: Tracks finger movement (translateX, translateY)
- **Threshold**: 120px horizontal or 100px vertical
- **Direction Detection**: Based on final position
- **Animation**: Parallel (translate + fade)
- **Duration**: 300ms ease-out

### Card Flip
- **Trigger**: Tap on card
- **Animation**: RotateY (0deg → 180deg)
- **Duration**: 300ms
- **Interpolation**: Front (0-90), Back (90-180)

### Content Fade
- **Purpose**: Hide content during transitions (prevents flashing)
- **Timing**: Fade out (instant) → Swipe (300ms) → Delay (30ms) → Fade in (200ms)
- **Total**: ~530ms per swipe

### Card Stack Effect
- **Next Card**: Scaled (0.95) + Offset (8px, 8px)
- **On Swipe**: Animates to full scale + center position
- **Purpose**: Depth perception

## Performance Considerations

### Database
- ✅ Queries use `LIMIT 1` (no full table scans)
- ✅ Synchronous operations (SQLite is fast)
- ✅ No N+1 queries
- ⚠️ No indexes (not needed for 2.5K words)

### Rendering
- ✅ Only 2 cards rendered (current + next)
- ✅ Animations use `useNativeDriver` (runs on UI thread)
- ✅ No unnecessary re-renders (useEffect dependencies optimized)
- ⚠️ Edit modal re-renders entire component (acceptable for infrequent use)

### Memory
- ✅ Swipe history limited to 10 actions
- ✅ Only 2 words in memory (current + next)
- ✅ Database connection singleton
- ⚠️ AsyncStorage loads theme on every app start (small payload)

## Error Handling

### Database Errors
- All database operations wrapped in try-catch
- Errors logged to console (`console.error`)
- Graceful degradation (return null, skip operation)

### UI Errors
- Loading state during database initialization
- No error boundary (React Native doesn't support it well)
- Future: Add error screen for critical failures

## Testing Strategy (Not Implemented Yet)

### Unit Tests
- Database operations (`database.ts`)
- Theme utilities (`design-system.ts`)

### Integration Tests
- Card swipe flow (gesture → state → database)
- Undo functionality
- Edit flow

### E2E Tests
- Full user journey (onboarding → swipe 10 cards → undo → edit)
- Theme toggle
- Progress persistence

## Future Improvements

### Architecture
- [ ] Split `App.tsx` into smaller components
- [ ] Extract gesture logic to custom hook
- [ ] Add error boundary
- [ ] Implement state machine for card animations

### Performance
- [ ] Add database indexes (if needed)
- [ ] Lazy load edit modal
- [ ] Virtualize card stack (if expanding to 3+ cards)

### Testing
- [ ] Add Jest + React Native Testing Library
- [ ] Add Detox for E2E tests
- [ ] Add TypeScript strict mode

### Observability
- [ ] Add analytics (Expo Analytics or custom)
- [ ] Add crash reporting (Sentry)
- [ ] Add performance monitoring

