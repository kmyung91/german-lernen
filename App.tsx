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
    germanWord: 'das Haus',
    englishTranslation: 'house',
    germanSentence: 'Das Haus ist sehr schön.',
    englishSentence: 'The house is very beautiful.',
  },
  {
    id: 2,
    germanWord: 'das Buch',
    englishTranslation: 'book',
    germanSentence: 'Ich lese ein interessantes Buch.',
    englishSentence: 'I am reading an interesting book.',
  },
  {
    id: 3,
    germanWord: 'das Wasser',
    englishTranslation: 'water',
    germanSentence: 'Ich trinke gerne kaltes Wasser.',
    englishSentence: 'I like to drink cold water.',
  },
  {
    id: 4,
    germanWord: 'der Freund',
    englishTranslation: 'friend',
    germanSentence: 'Mein bester Freund wohnt in Berlin.',
    englishSentence: 'My best friend lives in Berlin.',
  },
  {
    id: 5,
    germanWord: 'die Arbeit',
    englishTranslation: 'work',
    germanSentence: 'Meine Arbeit ist sehr interessant.',
    englishSentence: 'My work is very interesting.',
  },
  {
    id: 6,
    germanWord: 'die Schule',
    englishTranslation: 'school',
    germanSentence: 'Die Schule beginnt um acht Uhr.',
    englishSentence: 'School starts at eight o\'clock.',
  },
  {
    id: 7,
    germanWord: 'das Auto',
    englishTranslation: 'car',
    germanSentence: 'Mein Auto ist sehr schnell.',
    englishSentence: 'My car is very fast.',
  },
  {
    id: 8,
    germanWord: 'der Kaffee',
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
  const [swipeHistory, setSwipeHistory] = useState<{wordId: number, direction: string, wordIndex: number, oldBucket: 'learning' | 'reviewing' | 'mastered'}[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [wordStates, setWordStates] = useState<{[key: number]: 'learning' | 'reviewing' | 'mastered'}>({});
  const [showContent, setShowContent] = useState(true);
  const [contentOpacity] = useState(new Animated.Value(1));

  const currentWord = sampleWords[currentWordIndex];
  const nextWordIndex = (currentWordIndex + 1) % sampleWords.length;
  const nextWord = sampleWords[nextWordIndex];

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

    // Store the old bucket for later use
    const oldBucket = wordStates[currentWord.id] || 'learning';

    // Add to swipe history for undo (but don't update state yet)
    setSwipeHistory(prev => [{ 
      wordId: currentWord.id, 
      direction, 
      wordIndex: currentWordIndex,
      oldBucket: oldBucket
    }, ...prev.slice(0, 9)]);

    // Animate card swipe away and next card forward
    const swipeDirection = direction === 'right' ? screenWidth : direction === 'left' ? -screenWidth : -screenHeight;
    
    // Hide content and fade out when animation starts
    Animated.timing(contentOpacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
    
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
      // NOW update the word state after animation completes
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
      
      // Hide content for next card, then show it with fade-in
      setShowContent(false);
      setTimeout(() => {
        setShowContent(true);
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }, 30);
      
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
            <View style={[styles.card, styles.middleCard, { backgroundColor: '#FFFFFF' }]}>
              <View style={styles.cardSide}>
                <Animated.View style={{ opacity: contentOpacity }}>
                  {/* Next card should always be blank */}
                </Animated.View>
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
                  { backgroundColor: '#FFFFFF' },
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
                  {/* Front side (German) */}
                  <View style={styles.cardSide}>
                    <Animated.View style={{ opacity: contentOpacity }}>
                      {showContent && (
                        <>
                          <Text style={styles.germanWord}>{currentWord.germanWord}</Text>
                          <Text style={styles.germanSentence}>{currentWord.germanSentence}</Text>
                          <Text style={styles.tapHint}>Tap to reveal translation</Text>
                        </>
                      )}
                    </Animated.View>
                  </View>
                  <Animated.View style={[styles.bottomEmoji, { opacity: contentOpacity }]}>
                    <Text style={styles.bucketEmoji}>{getBucketEmoji(currentWord.id)}</Text>
                  </Animated.View>
                </TouchableOpacity>
              </Animated.View>

              {/* Back side (English) - separate card */}
              <Animated.View
                style={[
                  styles.card,
                  styles.cardBack,
                  { backgroundColor: '#FFFFFF' },
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
                  {/* Back side (English) */}
                  <View style={styles.cardSide}>
                    <Animated.View style={{ opacity: contentOpacity }}>
                      {showContent && (
                        <>
                          <Text style={styles.englishTranslation}>{currentWord.englishTranslation}</Text>
                          <Text style={styles.englishSentence}>{currentWord.englishSentence}</Text>
                          <Text style={styles.tapHint}>Tap to flip back</Text>
                        </>
                      )}
                    </Animated.View>
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
  middleCard: {
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
  bottomEmoji: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
  },
  bucketEmoji: {
    fontSize: 24,
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
    color: '#000000',
    textAlign: 'center',
    marginBottom: 20,
  },
  germanSentence: {
    fontSize: 18,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  englishTranslation: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 20,
  },
  englishSentence: {
    fontSize: 16,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  tapHint: {
    fontSize: 14,
    color: '#000000',
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.6,
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