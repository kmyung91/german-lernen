# Currywort - German Learning App

A sophisticated React Native flashcard app for learning German vocabulary with spaced repetition and dual-side mastery tracking.

## 🎯 Features

### Core Learning
- **5000+ German Words**: Comprehensive vocabulary database
- **Dual-Side Mastery**: Track progress for both German→English and English→German
- **Spaced Repetition**: Hybrid algorithm balancing new words with review
- **Visual Feedback**: Color-coded swipe gestures with smooth animations

### User Experience
- **Smooth Onboarding**: Teal-themed welcome flow with fade transitions
- **Theme Support**: Light (teal) and dark (gray) modes
- **Custom Fonts**: Inter font family for modern typography
- **Elegant Modals**: Fade animations for add/edit functionality

### Progress Tracking
- **Real-time Stats**: Circular progress indicator with mastery percentages
- **Bucket System**: Visual breakdown of learning levels (🔴 Don't Know, 🟡 Learning, 🟢 Mastered)
- **Undo Functionality**: Reverse last action with visual feedback
- **Custom Flashcards**: Add your own vocabulary entries

## 🎨 Design System

### Colors
- **Primary**: `#00B1AC` (Teal)
- **Primary Light**: `#33C1BC` (Lighter teal)
- **Primary Dark**: `#008B87` (Darker teal)

### Typography
- **Font Family**: Inter (Regular, Medium, Bold)
- **Hierarchy**: Clear size and weight distinctions

### Animations
- **Swipe Feedback**: Distance-based opacity with smooth fade-out
- **Card Transitions**: Smooth flip animations
- **Modal Animations**: Elegant fade-in/fade-out
- **Onboarding**: Smooth transitions between screens

## 🧠 Learning Algorithm

### Hybrid Spaced Repetition
1. **85% Unreviewed Words**: Prioritizes new vocabulary
2. **10% Due Words**: Time-based intervals for review
   - Don't Know: 1 day
   - Learning: 3 days  
   - Mastered: 1 week
3. **5% Random Review**: Maintains long-term retention

### Dual-Side Mastery
- **German Mastery**: Tracks German→English proficiency
- **English Mastery**: Tracks English→German proficiency
- **Independent Progress**: Each side progresses separately

## 📊 Data Collection

### Word-Level Data
- `id`: Unique identifier
- `german`: German word/phrase
- `english`: English translation
- `german_example`: German example sentence
- `english_example`: English example sentence
- `level`: Difficulty level (A1, A2, B1, B2, C1, C2)

### Progress Tracking
- `last_seen`: Timestamp of last review
- `times_known`: Count of correct answers
- `bucket`: Current learning stage
- `german_mastery`: German→English proficiency level
- `english_mastery`: English→German proficiency level
- `is_removed`: Soft delete flag

### User Customizations
- `user_edits`: Custom word modifications
- `user_notes`: Personal notes per word
- `app_settings`: Theme preferences, onboarding status

## 🛠 Technical Stack

- **Framework**: React Native with Expo
- **Database**: SQLite with expo-sqlite
- **Animations**: React Native Animated API + react-native-gesture-handler
- **Fonts**: @expo-google-fonts/inter
- **State Management**: React Context (Theme)
- **Storage**: AsyncStorage for settings

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npx expo start

# Run on iOS
npx expo run:ios

# Run on Android
npx expo run:android
```

## 📱 Build & Deploy

```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to App Store
eas submit --platform ios
```

## 🔮 Future Enhancements

### Progress Analytics
- **Learning Streaks**: Daily/weekly consistency tracking
- **Mastery Timeline**: Progress over time visualization
- **Weak Areas**: Identify challenging word categories
- **Study Sessions**: Session length and frequency analysis
- **Retention Curves**: Long-term memory retention patterns

### Advanced Features
- **Categories**: Organize words by topic/theme
- **Difficulty Adjustment**: Dynamic difficulty based on performance
- **Social Features**: Share progress, compete with friends
- **Offline Sync**: Cloud backup and sync across devices
- **Audio**: Pronunciation guides and audio examples

---

*Built with ❤️ for German language learners*