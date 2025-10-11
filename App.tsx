import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import { ThemeProvider, useTheme } from './theme-context';
import { createTextStyle, createCardStyle } from './design-system';
import * as Database from './database';
import type { Word, BucketType } from './database';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.9;
const CARD_HEIGHT = screenHeight * 0.6;

function AppContent() {
  const { designTokens, toggleTheme } = useTheme();
  const styles = createStyles(designTokens);
  
  // Database state
  const [dbInitialized, setDbInitialized] = useState(false);
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [nextWord, setNextWord] = useState<Word | null>(null);
  const [bucketCounts, setBucketCounts] = useState({ dontKnow: 0, know: 0, total: 0 });
  
  // Animation state
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showContent, setShowContent] = useState(true);
  const [translateX] = useState(new Animated.Value(0));
  const [translateY] = useState(new Animated.Value(0));
  const [flipAnimation] = useState(new Animated.Value(0));
  const [nextCardScale] = useState(new Animated.Value(0.95));
  const [nextCardTranslateX] = useState(new Animated.Value(8));
  const [nextCardTranslateY] = useState(new Animated.Value(8));
  const [contentOpacity] = useState(new Animated.Value(1));
  
  // Undo history
  const [swipeHistory, setSwipeHistory] = useState<{
    wordId: number;
    direction: 'left' | 'right' | 'up';
    oldBucket: BucketType | null;
  }[]>([]);

  // Initialize database on app start
  useEffect(() => {
    initApp();
  }, []);

  // Load words when database is ready
  useEffect(() => {
    if (dbInitialized) {
      loadWords();
      updateBucketCounts();
    }
  }, [dbInitialized]);

  const initApp = async () => {
    try {
      await Database.initDatabase();
      setDbInitialized(true);
    } catch (error) {
      console.error('Error initializing app:', error);
    }
  };

  const loadWords = () => {
    try {
      const current = Database.getNextWord();
      const next = Database.getNextWord();
      
      setCurrentWord(current);
      setNextWord(next);
    } catch (error) {
      console.error('Error loading words:', error);
    }
  };

  const updateBucketCounts = () => {
    try {
      const counts = Database.getBucketCounts();
      setBucketCounts(counts);
    } catch (error) {
      console.error('Error updating bucket counts:', error);
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
    if (isAnimating || !currentWord) return;
    setIsAnimating(true);

    // Determine bucket and removal status
    const isRemove = direction === 'up';
    let newBucket: BucketType = direction === 'right' ? 'know' : 'dontKnow';
    
    // Get old bucket from database
    const progress = Database.getUserProgress(currentWord.id);
    const oldBucket = progress?.bucket || null;

    // Add to swipe history
    setSwipeHistory(prev => [{ 
      wordId: currentWord.id, 
      direction, 
      oldBucket: oldBucket
    }, ...prev.slice(0, 9)]);

    // Animate card swipe away
    const swipeDirection = direction === 'right' ? screenWidth : direction === 'left' ? -screenWidth : -screenHeight;
    
    // Fade out content
    Animated.timing(contentOpacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
    
    Animated.parallel([
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
      // Update database
      try {
        Database.updateProgress(currentWord.id, newBucket, isRemove);
        updateBucketCounts();
      } catch (error) {
        console.error('Error updating progress:', error);
      }

      // Move to next word
      setCurrentWord(nextWord);
      const newNext = Database.getNextWord();
      setNextWord(newNext);
      
      setIsFlipped(false);
      flipAnimation.setValue(0);
      
      // Reset positions
      translateX.setValue(0);
      translateY.setValue(0);
      nextCardScale.setValue(0.95);
      nextCardTranslateX.setValue(8);
      nextCardTranslateY.setValue(8);
      setIsAnimating(false);
      
      // Fade in content
      setShowContent(false);
      setTimeout(() => {
        setShowContent(true);
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }, 30);
    });
  };

  const handleUndo = () => {
    if (swipeHistory.length === 0 || isAnimating) return;
    
    const lastAction = swipeHistory[0];
    setSwipeHistory(prev => prev.slice(1));
    
    // Restore previous word state in database
    try {
      if (lastAction.oldBucket) {
        Database.updateProgress(lastAction.wordId, lastAction.oldBucket, false);
      }
      
      // Reload words and update counts
      loadWords();
      updateBucketCounts();
      
      setIsFlipped(false);
      flipAnimation.setValue(0);
    } catch (error) {
      console.error('Error undoing action:', error);
    }
  };

  // Show loading state while database initializes
  if (!dbInitialized || !currentWord) {
    return (
      <GestureHandlerRootView style={styles.container}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={designTokens.colors.primary} />
          <Text style={{ marginTop: 16, color: designTokens.colors.textSecondary }}>
            Loading vocabulary...
          </Text>
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
    <View style={styles.container}>
        {/* Header with progress */}
        <View style={styles.header}>
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              {bucketCounts.know} / {bucketCounts.total} words known
            </Text>
            <View style={styles.bucketStats}>
              <Text style={[styles.bucketText, { color: designTokens.colors.error }]}>
                ❓ {bucketCounts.dontKnow}
              </Text>
              <Text style={[styles.bucketText, { color: designTokens.colors.success }]}>
                ✓ {bucketCounts.know}
              </Text>
            </View>
          </View>
          
              {/* Undo button and Theme toggle */}
              <View style={styles.headerActions}>
                {swipeHistory.length > 0 && (
                  <TouchableOpacity style={styles.undoButton} onPress={handleUndo}>
                    <Text style={styles.undoButtonText}>↩️</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.themeButton} onPress={toggleTheme}>
                  <Text style={styles.themeButtonText}>🌙</Text>
                </TouchableOpacity>
              </View>
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
            <View style={[styles.card, styles.middleCard, { backgroundColor: designTokens.colors.card }]}>
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
                  { backgroundColor: designTokens.colors.card },
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
                          <Text style={styles.germanWord}>{currentWord.german}</Text>
                          <Text style={styles.germanSentence}>{currentWord.german_example}</Text>
                          <Text style={styles.tapHint}>Tap to reveal translation</Text>
                        </>
                      )}
                    </Animated.View>
                  </View>
                </TouchableOpacity>
              </Animated.View>

              {/* Back side (English) - separate card */}
              <Animated.View
                style={[
                  styles.card,
                  styles.cardBack,
                  { backgroundColor: designTokens.colors.card },
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
                          <Text style={styles.englishTranslation}>{currentWord.english}</Text>
                          <Text style={styles.englishSentence}>{currentWord.english_example}</Text>
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
            Swipe right: Know • Swipe left: Don't Know • Swipe up: Remove
          </Text>
        </View>
    </View>
    </GestureHandlerRootView>
  );
}

const createStyles = (designTokens: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designTokens.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: designTokens.spacing.lg,
    paddingTop: designTokens.spacing['3xl'],
    paddingBottom: designTokens.spacing.lg,
    backgroundColor: designTokens.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: designTokens.colors.border,
  },
  progressContainer: {
    flex: 1,
  },
  progressText: {
    fontSize: designTokens.typography.fontSize.lg,
    fontWeight: designTokens.typography.fontWeight.bold,
    color: designTokens.colors.textPrimary,
    marginBottom: designTokens.spacing.sm,
  },
  bucketStats: {
    flexDirection: 'row',
    gap: designTokens.spacing.md,
  },
  bucketText: {
    fontSize: designTokens.typography.fontSize.sm,
    fontWeight: designTokens.typography.fontWeight.semibold,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.sm,
  },
  themeButton: {
    padding: designTokens.spacing.sm,
    borderRadius: designTokens.borderRadius.md,
    backgroundColor: designTokens.colors.surface,
  },
  themeButtonText: {
    fontSize: designTokens.typography.fontSize.lg,
  },
  undoButton: {
    padding: designTokens.spacing.sm,
    borderRadius: designTokens.borderRadius.md,
    backgroundColor: designTokens.colors.surface,
  },
  undoButtonText: {
    fontSize: designTokens.typography.fontSize.lg,
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
    fontSize: designTokens.typography.fontSize['3xl'],
    fontWeight: designTokens.typography.fontWeight.bold,
    color: designTokens.colors.textPrimary,
    textAlign: 'center',
    marginBottom: designTokens.spacing.lg,
  },
  germanSentence: {
    fontSize: designTokens.typography.fontSize.lg,
    color: designTokens.colors.textPrimary,
    textAlign: 'center',
    marginBottom: designTokens.spacing.xl,
    lineHeight: designTokens.typography.lineHeight.normal * designTokens.typography.fontSize.lg,
  },
  englishTranslation: {
    fontSize: designTokens.typography.fontSize['2xl'],
    fontWeight: designTokens.typography.fontWeight.bold,
    color: designTokens.colors.textPrimary,
    textAlign: 'center',
    marginBottom: designTokens.spacing.lg,
  },
  englishSentence: {
    fontSize: designTokens.typography.fontSize.base,
    color: designTokens.colors.textPrimary,
    textAlign: 'center',
    marginBottom: designTokens.spacing.xl,
    lineHeight: designTokens.typography.lineHeight.normal * designTokens.typography.fontSize.base,
  },
  tapHint: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.7,
  },
  instructions: {
    marginTop: designTokens.spacing.xl,
    paddingHorizontal: designTokens.spacing.lg,
    paddingBottom: designTokens.spacing['2xl'],
  },
  instructionText: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.textSecondary,
    textAlign: 'center',
    lineHeight: designTokens.typography.lineHeight.normal * designTokens.typography.fontSize.sm,
  },
});

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}