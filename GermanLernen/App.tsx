import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.9;
const CARD_HEIGHT = screenHeight * 0.6;

interface VocabularyWord {
  id: number;
  germanWord: string;
  englishTranslation: string;
  germanSentence: string;
  englishSentence: string;
}

// Sample vocabulary data
const sampleWords: VocabularyWord[] = [
  {
    id: 1,
    germanWord: 'Haus',
    englishTranslation: 'house',
    germanSentence: 'Das Haus ist sehr schön.',
    englishSentence: 'The house is very beautiful.',
  },
  {
    id: 2,
    germanWord: 'Buch',
    englishTranslation: 'book',
    germanSentence: 'Ich lese ein interessantes Buch.',
    englishSentence: 'I am reading an interesting book.',
  },
  {
    id: 3,
    germanWord: 'Wasser',
    englishTranslation: 'water',
    germanSentence: 'Ich trinke gerne kaltes Wasser.',
    englishSentence: 'I like to drink cold water.',
  },
  {
    id: 4,
    germanWord: 'Freund',
    englishTranslation: 'friend',
    germanSentence: 'Mein bester Freund wohnt in Berlin.',
    englishSentence: 'My best friend lives in Berlin.',
  },
  {
    id: 5,
    germanWord: 'Arbeit',
    englishTranslation: 'work',
    germanSentence: 'Meine Arbeit ist sehr interessant.',
    englishSentence: 'My work is very interesting.',
  },
  {
    id: 6,
    germanWord: 'Schule',
    englishTranslation: 'school',
    germanSentence: 'Die Schule beginnt um acht Uhr.',
    englishSentence: 'School starts at eight o\'clock.',
  },
  {
    id: 7,
    germanWord: 'Auto',
    englishTranslation: 'car',
    germanSentence: 'Mein Auto ist sehr schnell.',
    englishSentence: 'My car is very fast.',
  },
  {
    id: 8,
    germanWord: 'Kaffee',
    englishTranslation: 'coffee',
    germanSentence: 'Ich trinke jeden Morgen Kaffee.',
    englishSentence: 'I drink coffee every morning.',
  },
];

export default function App() {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [wordsMastered, setWordsMastered] = useState(0);
  const [bucketCounts, setBucketCounts] = useState({ learning: 8, reviewing: 0, mastered: 0 });
  const [translateX] = useState(new Animated.Value(0));
  const [translateY] = useState(new Animated.Value(0));
  const [flipAnimation] = useState(new Animated.Value(0));
  const [nextCardScale] = useState(new Animated.Value(0.95));
  const [nextCardTranslateX] = useState(new Animated.Value(8));
  const [nextCardTranslateY] = useState(new Animated.Value(8));
  const [swipeHistory, setSwipeHistory] = useState<{wordId: number, direction: string, wordIndex: number}[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [wordStates, setWordStates] = useState<{[key: number]: 'learning' | 'reviewing' | 'mastered'}>({});

  const currentWord = sampleWords[currentWordIndex];
  const nextWordIndex = (currentWordIndex + 1) % sampleWords.length;
  const nextWord = sampleWords[nextWordIndex];
  const thirdWordIndex = (currentWordIndex + 2) % sampleWords.length;
  const thirdWord = sampleWords[thirdWordIndex];

  // Load saved state on app start
  useEffect(() => {
    loadSavedState();
  }, []);

  const loadSavedState = async () => {
    try {
      const savedState = await AsyncStorage.getItem('germanAppState');
      if (savedState) {
        const state = JSON.parse(savedState);
        setCurrentWordIndex(state.currentWordIndex || 0);
        setWordsMastered(state.wordsMastered || 0);
        setBucketCounts(state.bucketCounts || { learning: 8, reviewing: 0, mastered: 0 });
        setWordStates(state.wordStates || {});
        setSwipeHistory(state.swipeHistory || []);
      }
    } catch (error) {
      console.log('Error loading saved state:', error);
    }
  };

  const saveState = async () => {
    try {
      const state = {
        currentWordIndex,
        wordsMastered,
        bucketCounts,
        wordStates,
        swipeHistory,
      };
      await AsyncStorage.setItem('germanAppState', JSON.stringify(state));
    } catch (error) {
      console.log('Error saving state:', error);
    }
  };

  const flipCard = () => {
    const toValue = isFlipped ? 0 : 1;
    Animated.timing(flipAnimation, {
      toValue,
      duration: 400,
      useNativeDriver: true,
    }).start();
    setIsFlipped(!isFlipped);
  };

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX, translationY: translateY } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX, translationY, velocityX, velocityY } = event.nativeEvent;
      
      const swipeThreshold = 100;
      const velocityThreshold = 500;
      
      if (Math.abs(translationX) > Math.abs(translationY)) {
        // Horizontal swipe
        if (translationX > swipeThreshold || velocityX > velocityThreshold) {
          // Swipe right - mastered
          handleSwipe('right');
        } else if (translationX < -swipeThreshold || velocityX < -velocityThreshold) {
          // Swipe left - still learning
          handleSwipe('left');
        } else {
          resetCardPosition();
        }
      } else {
        // Vertical swipe
        if (translationY < -swipeThreshold || velocityY < -velocityThreshold) {
          // Swipe up - high priority learning
          handleSwipe('up');
        } else {
          resetCardPosition();
        }
      }
    }
  };

  const resetCardPosition = () => {
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSwipe = (direction: 'left' | 'right' | 'up') => {
    if (isAnimating) return;
    setIsAnimating(true);

    let newBucket: 'learning' | 'reviewing' | 'mastered';
    
    switch (direction) {
      case 'right':
        newBucket = 'mastered';
        break;
      case 'left':
        newBucket = 'reviewing';
        break;
      case 'up':
        newBucket = 'learning';
        break;
      default:
        newBucket = 'learning';
    }

    // Add to swipe history for undo
    setSwipeHistory(prev => [{ 
      wordId: currentWord.id, 
      direction, 
      wordIndex: currentWordIndex,
      oldBucket: wordStates[currentWord.id] || 'learning'
    }, ...prev.slice(0, 9)]);

    // Update word state
    const oldBucket = wordStates[currentWord.id] || 'learning';
    setWordStates(prev => ({
      ...prev,
      [currentWord.id]: newBucket
    }));

    // Update bucket counts properly
    setBucketCounts(prev => {
      const newCounts = { ...prev };
      newCounts[oldBucket] = Math.max(0, newCounts[oldBucket] - 1);
      newCounts[newBucket] = newCounts[newBucket] + 1;
      return newCounts;
    });

    // Update mastered count
    if (newBucket === 'mastered' && oldBucket !== 'mastered') {
      setWordsMastered(prev => prev + 1);
    } else if (oldBucket === 'mastered' && newBucket !== 'mastered') {
      setWordsMastered(prev => Math.max(0, prev - 1));
    }

    // Animate card swipe away and next card forward
    const swipeDirection = direction === 'right' ? screenWidth : direction === 'left' ? -screenWidth : -screenHeight;
    
    Animated.parallel([
      // Current card swipes away
      Animated.timing(translateX, {
        toValue: direction === 'up' ? 0 : swipeDirection,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: direction === 'up' ? swipeDirection : 0,
        duration: 300,
        useNativeDriver: true,
      }),
      // Next card moves to center
      Animated.timing(nextCardScale, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(nextCardTranslateX, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(nextCardTranslateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Move to next word
      const newIndex = (currentWordIndex + 1) % sampleWords.length;
      setCurrentWordIndex(newIndex);
      setIsFlipped(false);
      flipAnimation.setValue(0);
      
      // Reset positions
      translateX.setValue(0);
      translateY.setValue(0);
      nextCardScale.setValue(0.95);
      nextCardTranslateX.setValue(8);
      nextCardTranslateY.setValue(8);
      setIsAnimating(false);
      
      // Save state
      saveState();
    });
  };

  const handleUndo = () => {
    if (swipeHistory.length === 0 || isAnimating) return;
    
    const lastAction = swipeHistory[0];
    setSwipeHistory(prev => prev.slice(1));
    
    // Restore previous word state
    setWordStates(prev => ({
      ...prev,
      [lastAction.wordId]: lastAction.oldBucket
    }));
    
    // Restore previous bucket counts
    const currentBucket = wordStates[lastAction.wordId] || 'learning';
    setBucketCounts(prev => {
      const newCounts = { ...prev };
      newCounts[currentBucket] = Math.max(0, newCounts[currentBucket] - 1);
      newCounts[lastAction.oldBucket] = newCounts[lastAction.oldBucket] + 1;
      return newCounts;
    });
    
    // Restore mastered count
    if (currentBucket === 'mastered' && lastAction.oldBucket !== 'mastered') {
      setWordsMastered(prev => Math.max(0, prev - 1));
    } else if (lastAction.oldBucket === 'mastered' && currentBucket !== 'mastered') {
      setWordsMastered(prev => prev + 1);
    }
    
    // Go back to previous word
    setCurrentWordIndex(lastAction.wordIndex);
    setIsFlipped(false);
    flipAnimation.setValue(0);
    
    // Save state
    saveState();
  };

  const getBucketColor = (wordId: number) => {
    const bucket = wordStates[wordId] || 'learning';
    switch (bucket) {
      case 'learning':
        return '#FF6B6B';
      case 'reviewing':
        return '#FFD93D';
      case 'mastered':
        return '#6BCF7F';
      default:
        return '#E0E0E0';
    }
  };

  const getBucketEmoji = (wordId: number) => {
    const bucket = wordStates[wordId] || 'learning';
    switch (bucket) {
      case 'learning':
        return '🔴';
      case 'reviewing':
        return '🟡';
      case 'mastered':
        return '🟢';
      default:
        return '⚪';
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
    <View style={styles.container}>
        {/* Header with progress */}
        <View style={styles.header}>
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              {wordsMastered} / {sampleWords.length} words mastered
            </Text>
            <View style={styles.bucketStats}>
              <Text style={[styles.bucketText, { color: '#FF6B6B' }]}>
                🔴 {bucketCounts.learning}
              </Text>
              <Text style={[styles.bucketText, { color: '#FFD93D' }]}>
                🟡 {bucketCounts.reviewing}
              </Text>
              <Text style={[styles.bucketText, { color: '#6BCF7F' }]}>
                🟢 {bucketCounts.mastered}
              </Text>
            </View>
          </View>
          
          {/* Undo button */}
          {swipeHistory.length > 0 && (
            <TouchableOpacity style={styles.undoButton} onPress={handleUndo}>
              <Text style={styles.undoButtonText}>↶ Undo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Card Deck */}
        <View style={styles.cardContainer}>
          {/* Third card (back of deck) */}
          <View style={[styles.cardWrapper, styles.thirdCard]}>
            <View style={[styles.card, styles.backCard, { backgroundColor: getBucketColor(thirdWord.id) }]}>
              <View style={styles.bucketIndicator}>
                <Text style={styles.bucketEmoji}>{getBucketEmoji(thirdWord.id)}</Text>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.germanWord}>{thirdWord.germanWord}</Text>
                <Text style={styles.germanSentence}>{thirdWord.germanSentence}</Text>
              </View>
            </View>
          </View>

          {/* Second card (next card) */}
          <Animated.View 
            style={[
              styles.cardWrapper, 
              styles.secondCard,
              {
                transform: [
                  { translateX: nextCardTranslateX },
                  { translateY: nextCardTranslateY },
                  { scale: nextCardScale },
                ],
              }
            ]}
          >
            <View style={[styles.card, styles.middleCard, { backgroundColor: getBucketColor(nextWord.id) }]}>
              <View style={styles.bucketIndicator}>
                <Text style={styles.bucketEmoji}>{getBucketEmoji(nextWord.id)}</Text>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.germanWord}>{nextWord.germanWord}</Text>
                <Text style={styles.germanSentence}>{nextWord.germanSentence}</Text>
              </View>
            </View>
          </Animated.View>

          {/* Current card (top card) */}
          <PanGestureHandler
            onGestureEvent={onGestureEvent}
            onHandlerStateChange={onHandlerStateChange}
          >
            <Animated.View
              style={[
                styles.cardWrapper,
                styles.topCard,
                {
                  transform: [
                    { translateX },
                    { translateY },
                  ],
                },
              ]}
            >
              <Animated.View
                style={[
                  styles.card,
                  { backgroundColor: getBucketColor(currentWord.id) },
                  {
                    transform: [{
                      rotateY: flipAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '180deg'],
                      }),
                    }],
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.cardTouchable}
                  onPress={flipCard}
                  activeOpacity={0.9}
                >
                  {/* Bucket indicator */}
                  <View style={styles.bucketIndicator}>
                    <Text style={styles.bucketEmoji}>{getBucketEmoji(currentWord.id)}</Text>
                  </View>

                  {/* Front side (German) */}
                  <View style={styles.cardSide}>
                    <Text style={styles.germanWord}>{currentWord.germanWord}</Text>
                    <Text style={styles.germanSentence}>{currentWord.germanSentence}</Text>
                    <Text style={styles.tapHint}>Tap to reveal translation</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>

              {/* Back side (English) - separate card */}
              <Animated.View
                style={[
                  styles.card,
                  styles.cardBack,
                  { backgroundColor: getBucketColor(currentWord.id) },
                  {
                    transform: [{
                      rotateY: flipAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['180deg', '360deg'],
                      }),
                    }],
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.cardTouchable}
                  onPress={flipCard}
                  activeOpacity={0.9}
                >
                  {/* Bucket indicator */}
                  <View style={styles.bucketIndicator}>
                    <Text style={styles.bucketEmoji}>{getBucketEmoji(currentWord.id)}</Text>
                  </View>

                  {/* Back side (English) */}
                  <View style={styles.cardSide}>
                    <Text style={styles.englishTranslation}>{currentWord.englishTranslation}</Text>
                    <Text style={styles.englishSentence}>{currentWord.englishSentence}</Text>
                    <Text style={styles.tapHint}>Tap to flip back</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          </PanGestureHandler>
        </View>

        {/* Swipe instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            Swipe right: Mastered • Swipe left: Learning • Swipe up: Priority
          </Text>
        </View>
    </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  progressContainer: {
    flex: 1,
  },
  progressText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  bucketStats: {
    flexDirection: 'row',
    gap: 15,
  },
  bucketText: {
    fontSize: 14,
    fontWeight: '600',
  },
  undoButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  undoButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cardWrapper: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  topCard: {
    zIndex: 3,
  },
  secondCard: {
    zIndex: 2,
  },
  thirdCard: {
    zIndex: 1,
    transform: [{ translateX: 16 }, { translateY: 16 }, { scale: 0.9 }],
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    padding: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  backCard: {
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  middleCard: {
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  bucketIndicator: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  bucketEmoji: {
    fontSize: 24,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardSide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBack: {
    position: 'absolute',
    top: 0,
    left: 0,
    backfaceVisibility: 'hidden',
  },
  germanWord: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  germanSentence: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  englishTranslation: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  englishSentence: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  tapHint: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  instructions: {
    marginTop: 30,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});