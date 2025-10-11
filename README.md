# German Vocabulary Learning App

A minimal, aesthetic iOS app for learning German vocabulary through smooth card interactions.

## Features Implemented

### ✅ Core Card Interactions
- **Tap to flip**: German word/sentence → English translation
- **Swipe right**: Mark as mastered (🟢)
- **Swipe left**: Still learning (🟡) 
- **Swipe up**: High priority learning (🔴)
- **Undo button**: Reverse the last swipe action

### ✅ Smooth Animations
- Card flip animation with 3D rotation effect
- Smooth swipe gestures using `react-native-deck-swiper`
- Visual feedback with overlay labels during swiping
- Stack of cards with depth effect

### ✅ Clean UI/UX
- Minimal, premium aesthetic
- Clear visual hierarchy
- Responsive card design
- Simple mastered word counter
- Disabled state for undo button when no actions to undo

### ✅ Sample Data
- 10 German vocabulary words with example sentences
- Proper TypeScript interfaces
- Ready for full dataset integration

## Technical Stack
- **Framework**: Expo + React Native + TypeScript
- **Card Swiping**: `react-native-deck-swiper`
- **Animations**: React Native Animated API
- **State Management**: React hooks (useState, useRef)

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Open on iOS simulator or device using Expo Go app

## Next Steps
- [ ] Integrate full ManyThings.org dataset
- [ ] Add local SQLite database for persistence
- [ ] Implement smart word appearance algorithm
- [ ] Add progress tracking and analytics
- [ ] Polish animations and micro-interactions

## Card Interaction Flow
1. User sees German word and sentence
2. Taps card to reveal English translation
3. Swipes in desired direction to categorize word
4. Can undo last action if needed
5. Seamless endless scrolling experience
