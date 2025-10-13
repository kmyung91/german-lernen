# TODO

## Priority 1: Production Ready

- [ ] **App Icon** - Design and implement app icon (1024x1024)
- [ ] **Splash Screen** - Custom splash screen with branding
- [ ] **Onboarding Tutorial** - First-time user guide (3-4 screens)
- [ ] **Statistics Screen** - Progress charts, streaks, time spent
- [ ] **Haptic Feedback** - Vibration on swipes (iOS haptics)
- [ ] **Physical Device Testing** - Test on real iPhone
- [ ] **Error Handling** - Graceful error screens, fallbacks
- [ ] **Empty States** - What happens when all cards removed?
- [ ] **Privacy Policy** - Required for App Store
- [ ] **App Store Metadata** - Screenshots, description, keywords

## Priority 2: User Experience Polish

- [ ] **Settings Screen**
  - [ ] Reset all progress
  - [ ] Export data (JSON or CSV)
  - [ ] Adjust bucket weights (advanced)
  - [ ] Toggle notifications
  - [ ] About page (version, credits, license)

- [ ] **Review History**
  - [ ] List of all reviewed words
  - [ ] Filter by bucket
  - [ ] Sort by last_seen, times_known
  - [ ] Search functionality

- [ ] **Better Edit UX**
  - [ ] Keyboard shortcuts (return = save)
  - [ ] Validation (non-empty fields)
  - [ ] Undo edits
  - [ ] Preview changes before saving

- [ ] **Accessibility**
  - [ ] VoiceOver support
  - [ ] Dynamic type sizes
  - [ ] High contrast mode
  - [ ] Screen reader friendly

## Priority 3: Enhanced Features

- [ ] **Achievements/Badges**
  - [ ] 10/50/100/500/1000 words reviewed
  - [ ] 7/30/100 day streak
  - [ ] Perfect day (no "don't know")
  - [ ] Speed demon (50 cards in 5 minutes)

- [ ] **Daily Notifications**
  - [ ] Reminder to practice (customizable time)
  - [ ] Streak reminder
  - [ ] Motivational messages

- [ ] **Widget Support**
  - [ ] Today widget (word count, streak)
  - [ ] Lock screen widget (iOS 16+)
  - [ ] Interactive widget (quick review)

- [ ] **Audio Pronunciation**
  - [ ] TTS (iOS built-in, free)
  - [ ] Real audio recordings (expensive, complex)
  - [ ] Toggle on/off in settings

- [ ] **Spaced Repetition**
  - [ ] Replace weighted random with SR algorithm
  - [ ] Track review intervals
  - [ ] Optimize for long-term retention

## Priority 4: Code Quality

- [ ] **Split App.tsx**
  - [ ] Extract Card component
  - [ ] Extract Header component
  - [ ] Extract EditModal component
  - [ ] Extract gesture logic to hook

- [ ] **Testing**
  - [ ] Unit tests (database.ts)
  - [ ] Integration tests (swipe flow)
  - [ ] E2E tests (Detox)

- [ ] **Performance**
  - [ ] Add database indexes
  - [ ] Measure animation performance
  - [ ] Profile memory usage

- [ ] **Error Tracking**
  - [ ] Integrate Sentry or Bugsnag
  - [ ] Add analytics (Expo Analytics)
  - [ ] Performance monitoring

## Priority 5: Advanced Features

- [ ] **Cloud Sync** (requires backend)
  - [ ] User accounts
  - [ ] Progress sync across devices
  - [ ] Backup to cloud

- [ ] **Level Filtering**
  - [ ] Toggle A2 vs B1 words
  - [ ] Custom word sets
  - [ ] Import custom vocabulary

- [ ] **Multiple Languages**
  - [ ] Spanish, French, Italian
  - [ ] Shared codebase
  - [ ] Different databases per language

- [ ] **Gamification**
  - [ ] Points/XP system
  - [ ] Leaderboards (requires backend)
  - [ ] Daily challenges

## Bugs & Issues

- [ ] None currently known

## Documentation

- [x] README.md - Project overview
- [x] CHANGELOG.md - Version history
- [x] docs/DATABASE.md - Database schema + operations
- [x] docs/ARCHITECTURE.md - Technical architecture
- [ ] docs/DESIGN.md - Design decisions, UI/UX rationale
- [ ] docs/DEPLOYMENT.md - Build & release process
- [ ] docs/CONTRIBUTING.md - For future contributors

## Chores

- [ ] Clean up scripts/ folder (remove unused files)
- [ ] Remove backup databases from assets/
- [ ] Remove unused components (CardStack, VocabularyCard)
- [ ] Remove legacy data/ folder
- [ ] Add LICENSE file
- [ ] Set up GitHub Actions (CI/CD)
- [ ] Configure Dependabot (dependency updates)

