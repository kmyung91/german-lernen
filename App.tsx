import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import Svg, { Circle } from 'react-native-svg';
import { ThemeProvider, useTheme } from './theme-context';
import { createTextStyle, createCardStyle } from './design-system';
import { Onboarding } from './components/Onboarding';
import * as Database from './database';
import type { Word, BucketType } from './database';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.9;
const CARD_HEIGHT = screenHeight * 0.6;

// POS display removed for simplicity and reliability

// Helper to get card indicator emoji
const getCardIndicatorEmoji = (bucket: string, lastSeen: number | null): string => {
  // Unreviewed words (never seen before) get white circle
  if (lastSeen === null) return '⚪';
  
  // Reviewed words get colored circles based on bucket
  if (bucket === 'dontKnow') return '🔴'; // Red circle
  if (bucket === 'learning') return '🟡'; // Yellow circle
  if (bucket === 'mastered') return '🟢'; // Green circle
  return '⚪'; // Default fallback
};

function AppContent() {
  const { designTokens, toggleTheme } = useTheme();
  
  // Safety check for design tokens
  if (!designTokens || !designTokens.colors) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
        <Text>Loading theme...</Text>
      </View>
    );
  }
  
  const styles = createStyles(designTokens);
  
  // Onboarding state - only show once
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Check if onboarding was completed - moved to after database init
  
  const handleOnboardingComplete = () => {
    try {
      Database.setOnboardingCompleted();
      setShowOnboarding(false);
    } catch (error) {
      console.log('Error saving onboarding status:', error);
      setShowOnboarding(false); // Hide anyway
    }
  };
  
  // Database state
  const [dbInitialized, setDbInitialized] = useState(false);
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [nextWord, setNextWord] = useState<Word | null>(null);
  const [bucketCounts, setBucketCounts] = useState({ dontKnow: 0, learning: 0, mastered: 0, totalReviewed: 0 });
  
  // Edit modal state
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editedWord, setEditedWord] = useState<{
    german: string;
    english: string;
    german_example: string;
    english_example: string;
    notes: string;
  } | null>(null);
  
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

  // Check onboarding status after database is initialized
  useEffect(() => {
    if (dbInitialized) {
      const checkOnboardingStatus = () => {
        try {
          const completed = Database.getOnboardingCompleted();
          setShowOnboarding(!completed);
          console.log('Onboarding status checked:', completed ? 'completed' : 'not completed');
        } catch (error) {
          console.log('Error checking onboarding status:', error);
          setShowOnboarding(true); // Show onboarding if we can't check
        }
      };
      checkOnboardingStatus();
    }
  }, [dbInitialized]);

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

  const handleOpenEditModal = () => {
    if (!currentWord) return;
    
    // Load existing notes from database
    const existingNotes = Database.getUserNotes(currentWord.id);
    
    setEditedWord({
      german: currentWord.german,
      english: currentWord.english,
      german_example: currentWord.german_example || '',
      english_example: currentWord.english_example || '',
      notes: existingNotes || '',
    });
    setIsEditModalVisible(true);
  };

  const handleSaveEdit = () => {
    if (!currentWord || !editedWord) return;
    
    try {
      // Save to user_edits and user_notes tables
      Database.updateWord(currentWord.id, {
        german: editedWord.german,
        english: editedWord.english,
        german_example: editedWord.german_example,
        english_example: editedWord.english_example,
        notes: editedWord.notes,
      });
      
      // Reload the current word with updated data (will include user edits)
      const updatedWord = Database.getWordById(currentWord.id);
      if (updatedWord) {
        setCurrentWord(updatedWord);
      }
      
      setIsEditModalVisible(false);
      setEditedWord(null);
    } catch (error) {
      console.error('Error saving edit:', error);
    }
  };

  const handleCancelEdit = () => {
    setIsEditModalVisible(false);
    setEditedWord(null);
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

  // Swipe color animations
  const swipeColorOpacity = useRef(new Animated.Value(0)).current;
  const swipeColor = useRef(new Animated.Value(0)).current; // 0=red, 1=yellow, 2=green

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX, translationY: translateY } }],
    { 
      useNativeDriver: true,
      listener: (event: any) => {
        const { translationX, translationY } = event.nativeEvent;
        
        // Calculate swipe direction and intensity
        const horizontalDistance = Math.abs(translationX);
        const verticalDistance = Math.abs(translationY);
        
        // Show color feedback when swiping
        if (horizontalDistance > 20 || verticalDistance > 20) {
          swipeColorOpacity.setValue(0.3);
          
          // Determine color based on direction
          if (translationY < -50) {
            // Up swipe - green
            swipeColor.setValue(2);
          } else if (translationX < -50) {
            // Left swipe - red
            swipeColor.setValue(0);
          } else if (translationX > 50) {
            // Right swipe - yellow
            swipeColor.setValue(1);
          }
        } else {
          // Hide color feedback when not swiping
          swipeColorOpacity.setValue(0);
        }
      }
    }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      // Reset swipe color animation
      swipeColorOpacity.setValue(0);
      
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

    // Determine bucket based on direction
    // LEFT = dontKnow (red), RIGHT = learning (yellow), UP = mastered (green)
    const isRemove = false; // UP no longer removes, it masters
    let newBucket: BucketType;
    
    if (direction === 'left') {
      newBucket = 'dontKnow';
    } else if (direction === 'right') {
      newBucket = 'learning';
    } else {
      newBucket = 'mastered';
    }
    
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
        // Word was already reviewed - restore to previous bucket
        Database.updateProgress(lastAction.wordId, lastAction.oldBucket, false);
      } else {
        // Word was unreviewed - need to "un-review" it by resetting its state
        // Set it back to dontKnow with no times_known, no last_seen
        const word = Database.getWordById(lastAction.wordId);
        if (word) {
          // Reset the word's progress to make it appear unreviewed again
          Database.resetWordProgress(lastAction.wordId);
        }
      }
      
      // Restore the specific word that was swiped (not a random next word)
      const restoredWord = Database.getWordById(lastAction.wordId);
      if (restoredWord) {
        setNextWord(currentWord); // Current word becomes next
        setCurrentWord(restoredWord); // Restored word becomes current
      }
      
      updateBucketCounts();
      
      setIsFlipped(false);
      flipAnimation.setValue(0);
    } catch (error) {
      console.error('Error undoing action:', error);
    }
  };

  // Show onboarding if first time
  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

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
          {/* Column 1: Circular progress indicator with SVG */}
          <View style={styles.progressCircleContainer}>
            {(() => {
              const size = 60;
              const strokeWidth = 5;
              const radius = (size - strokeWidth) / 2;
              const circumference = 2 * Math.PI * radius;
              
              // Calculate percentages
              const masteredPct = bucketCounts.totalReviewed > 0 
                ? bucketCounts.mastered / bucketCounts.totalReviewed 
                : 0;
              const learningPct = bucketCounts.totalReviewed > 0 
                ? bucketCounts.learning / bucketCounts.totalReviewed 
                : 0;
              const dontKnowPct = bucketCounts.totalReviewed > 0 
                ? bucketCounts.dontKnow / bucketCounts.totalReviewed 
                : 0;
              
              // Calculate stroke dash offsets for each segment
              const masteredLength = circumference * masteredPct;
              const learningLength = circumference * learningPct;
              const dontKnowLength = circumference * dontKnowPct;
              
              return (
                <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
                  <Svg width={size} height={size} style={{ position: 'absolute' }}>
                    {/* Background circle */}
                    <Circle
                      cx={size / 2}
                      cy={size / 2}
                      r={radius}
                      stroke={designTokens.colors.border}
                      strokeWidth={strokeWidth}
                      fill="none"
                    />
                    
                    {/* Red segment (don't know) - drawn first, bottom layer */}
                    {dontKnowPct > 0 && (
                      <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="#EF4444"
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeDasharray={`${dontKnowLength} ${circumference}`}
                        strokeDashoffset={-circumference * (masteredPct + learningPct)}
                        rotation="-90"
                        origin={`${size / 2}, ${size / 2}`}
                      />
                    )}
                    
                    {/* Yellow segment (learning) - middle layer */}
                    {learningPct > 0 && (
                      <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="#EAB308"
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeDasharray={`${learningLength} ${circumference}`}
                        strokeDashoffset={-circumference * masteredPct}
                        rotation="-90"
                        origin={`${size / 2}, ${size / 2}`}
                      />
                    )}
                    
                    {/* Green segment (mastered) - top layer */}
                    {masteredPct > 0 && (
                      <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="#22C55E"
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeDasharray={`${masteredLength} ${circumference}`}
                        strokeDashoffset={0}
                        rotation="-90"
                        origin={`${size / 2}, ${size / 2}`}
                      />
                    )}
                  </Svg>
                  
                  <Text style={[styles.progressPercentage, { color: '#22C55E' }]}>
                    {Math.round(masteredPct * 100)}%
                  </Text>
                </View>
              );
            })()}
          </View>
          
          {/* Column 2: Bucket breakdown (flex, left-aligned, 3 rows) */}
          <View style={styles.bucketStatsContainer}>
            <View style={styles.bucketStatsColumn}>
              <Text style={[styles.bucketText, { color: '#22C55E' }]}>
                🟢 {bucketCounts.mastered}
              </Text>
              <Text style={[styles.bucketText, { color: '#EAB308' }]}>
                🟡 {bucketCounts.learning}
              </Text>
              <Text style={[styles.bucketText, { color: '#EF4444' }]}>
                🔴 {bucketCounts.dontKnow}
              </Text>
            </View>
          </View>
          
          {/* Column 3: Undo, Edit, and Theme toggle buttons (fixed width) */}
          <View style={styles.headerActions}>
                {swipeHistory.length > 0 && (
                  <TouchableOpacity style={styles.undoButton} onPress={handleUndo}>
                    <Text style={styles.undoButtonText}>↩️</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity 
                  style={styles.editButton} 
                  onPress={handleOpenEditModal}
                >
                  <Text style={styles.editButtonText}>✏️</Text>
                </TouchableOpacity>
                
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
                  {/* Swipe color overlay */}
                  <Animated.View
                    style={[
                      styles.swipeColorOverlay,
                      {
                        opacity: swipeColorOpacity,
                        backgroundColor: swipeColor.interpolate({
                          inputRange: [0, 1, 2],
                          outputRange: ['#ff4444', '#ffaa00', '#44ff44'], // red, yellow, green
                        }),
                      },
                    ]}
                  />
                  
                  {/* Front side (German) */}
                  <View style={styles.cardSide}>
                    <Animated.View style={{ opacity: contentOpacity }}>
                      {showContent && (
                        <>
                          <Text style={styles.germanWord}>{currentWord.german}</Text>
                          {currentWord.german_example && (
                            <Text style={styles.germanSentence}>{currentWord.german_example}</Text>
                          )}
                          <Text style={styles.tapHint}>Tap to reveal translation</Text>
                        </>
                      )}
                    </Animated.View>
                  </View>
                  {/* Color indicator emoji - positioned at card bottom */}
                  <Animated.View style={[styles.bucketIndicatorContainer, { opacity: contentOpacity }]}>
                    {showContent && (
                      <Text style={styles.bucketIndicator}>{getCardIndicatorEmoji(currentWord.bucket, currentWord.last_seen)}</Text>
                    )}
                  </Animated.View>
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
                  {/* Swipe color overlay */}
                  <Animated.View
                    style={[
                      styles.swipeColorOverlay,
                      {
                        opacity: swipeColorOpacity,
                        backgroundColor: swipeColor.interpolate({
                          inputRange: [0, 1, 2],
                          outputRange: ['#ff4444', '#ffaa00', '#44ff44'], // red, yellow, green
                        }),
                      },
                    ]}
                  />
                  
                  {/* Back side (English) */}
                  <View style={styles.cardSide}>
                    <Animated.View style={{ opacity: contentOpacity }}>
                      {showContent && (
                        <>
                          <Text style={styles.englishTranslation}>{currentWord.english}</Text>
                          {currentWord.english_example && (
                            <Text style={styles.englishSentence}>{currentWord.english_example}</Text>
                          )}
                          <Text style={styles.tapHint}>Tap to flip back</Text>
                        </>
                      )}
                    </Animated.View>
                  </View>
                  {/* Color indicator emoji - positioned at card bottom */}
                  <Animated.View style={[styles.bucketIndicatorContainer, { opacity: contentOpacity }]}>
                    {showContent && (
                      <Text style={styles.bucketIndicator}>{getCardIndicatorEmoji(currentWord.bucket, currentWord.last_seen)}</Text>
                    )}
                  </Animated.View>
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          </PanGestureHandler>
        </View>

        {/* Swipe instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            ⬅️ Don't know • ⬆️ Know it • ➡️ Getting it
          </Text>
        </View>

        {/* Edit Modal */}
        <Modal
          visible={isEditModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={handleCancelEdit}
        >
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
            <View style={styles.modalContent}>
              <View style={[styles.modalHeader, { backgroundColor: designTokens.colors.surface, borderBottomColor: designTokens.colors.border }]}>
                <Text style={[styles.modalTitle, { color: designTokens.colors.textPrimary }]}>Edit Word</Text>
                <TouchableOpacity onPress={handleCancelEdit}>
                  <Text style={[styles.modalCloseButton, { color: designTokens.colors.textSecondary }]}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                {editedWord && (
                  <>
                    <Text style={[styles.modalLabel, { color: designTokens.colors.textPrimary }]}>German Word</Text>
                    <TextInput
                      style={[styles.modalInput, { 
                        backgroundColor: designTokens.colors.background, 
                        color: designTokens.colors.textPrimary,
                        borderColor: designTokens.colors.border 
                      }]}
                      value={editedWord.german}
                      onChangeText={(text) => setEditedWord({ ...editedWord, german: text })}
                      placeholder="German word"
                      placeholderTextColor={designTokens.colors.textSecondary}
                    />

                    <Text style={[styles.modalLabel, { color: designTokens.colors.textPrimary }]}>English Translation</Text>
                    <TextInput
                      style={[styles.modalInput, { 
                        backgroundColor: designTokens.colors.background, 
                        color: designTokens.colors.textPrimary,
                        borderColor: designTokens.colors.border 
                      }]}
                      value={editedWord.english}
                      onChangeText={(text) => setEditedWord({ ...editedWord, english: text })}
                      placeholder="English translation"
                      placeholderTextColor={designTokens.colors.textSecondary}
                    />

                    <Text style={[styles.modalLabel, { color: designTokens.colors.textPrimary }]}>German Example</Text>
                    <TextInput
                      style={[styles.modalInput, styles.modalTextArea, { 
                        backgroundColor: designTokens.colors.background, 
                        color: designTokens.colors.textPrimary,
                        borderColor: designTokens.colors.border 
                      }]}
                      value={editedWord.german_example}
                      onChangeText={(text) => setEditedWord({ ...editedWord, german_example: text })}
                      placeholder="German example sentence"
                      placeholderTextColor={designTokens.colors.textSecondary}
                      multiline
                      numberOfLines={3}
                    />

                    <Text style={[styles.modalLabel, { color: designTokens.colors.textPrimary }]}>English Example</Text>
                    <TextInput
                      style={[styles.modalInput, styles.modalTextArea, { 
                        backgroundColor: designTokens.colors.background, 
                        color: designTokens.colors.textPrimary,
                        borderColor: designTokens.colors.border 
                      }]}
                      value={editedWord.english_example}
                      onChangeText={(text) => setEditedWord({ ...editedWord, english_example: text })}
                      placeholder="English example sentence"
                      placeholderTextColor={designTokens.colors.textSecondary}
                      multiline
                      numberOfLines={3}
                    />

                    <Text style={[styles.modalLabel, { color: designTokens.colors.textPrimary }]}>Personal Notes (Optional)</Text>
                    <TextInput
                      style={[styles.modalInput, styles.modalTextArea, { 
                        backgroundColor: designTokens.colors.background, 
                        color: designTokens.colors.textPrimary,
                        borderColor: designTokens.colors.border 
                      }]}
                      value={editedWord.notes}
                      onChangeText={(text) => setEditedWord({ ...editedWord, notes: text })}
                      placeholder="Add your own notes, mnemonics, etc."
                      placeholderTextColor={designTokens.colors.textSecondary}
                      multiline
                      numberOfLines={4}
                    />
                  </>
                )}
              </ScrollView>

              <View style={[styles.modalFooter, { backgroundColor: designTokens.colors.surface, borderTopColor: designTokens.colors.border }]}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.modalCancelButton, { borderColor: designTokens.colors.border }]} 
                  onPress={handleCancelEdit}
                >
                  <Text style={[styles.modalButtonText, { color: designTokens.colors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.modalSaveButton, { backgroundColor: designTokens.colors.success }]} 
                  onPress={handleSaveEdit}
                >
                  <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
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
    gap: designTokens.spacing.md,
  },
  progressText: {
    fontSize: designTokens.typography.fontSize.lg,
    fontWeight: designTokens.typography.fontWeight.bold,
    color: designTokens.colors.textPrimary,
    marginBottom: designTokens.spacing.sm,
  },
  progressCircleContainer: {
    width: 60,
    height: 60,
  },
  progressRing: {
    // Inline styles in component
  },
  bucketStatsContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: designTokens.spacing.xs,
  },
  bucketStatsColumn: {
    flexDirection: 'column',
    gap: designTokens.spacing.xs,
    alignItems: 'flex-start',
  },
  bucketText: {
    fontSize: designTokens.typography.fontSize.sm,
    fontWeight: designTokens.typography.fontWeight.semibold,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: designTokens.spacing.sm,
    minWidth: 120, // Fixed width to prevent shifting (increased for edit button)
  },
  editButton: {
    padding: designTokens.spacing.sm,
    borderRadius: designTokens.borderRadius.md,
    backgroundColor: designTokens.colors.surface,
  },
  editButtonText: {
    fontSize: designTokens.typography.fontSize.lg,
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
  swipeColorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: designTokens.borderRadius.lg,
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
    marginBottom: designTokens.spacing.xs,
  },
  partOfSpeechDe: {
    fontSize: designTokens.typography.fontSize.sm,
    fontStyle: 'italic',
    color: designTokens.colors.textSecondary,
    textAlign: 'center',
    marginBottom: designTokens.spacing.md,
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
    marginBottom: designTokens.spacing.xs,
  },
  partOfSpeechEn: {
    fontSize: designTokens.typography.fontSize.sm,
    fontStyle: 'italic',
    color: designTokens.colors.textSecondary,
    textAlign: 'center',
    marginBottom: designTokens.spacing.sm,
  },
  englishDefinition: {
    fontSize: designTokens.typography.fontSize.base,
    fontStyle: 'italic',
    color: designTokens.colors.textSecondary,
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
  bucketIndicatorContainer: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  bucketIndicator: {
    fontSize: 24,
  },
  circularProgress: {
    alignItems: 'center',
    marginBottom: designTokens.spacing.md,
  },
  progressCircle: {
    // Inline styles in component
  },
  progressPercentage: {
    fontSize: designTokens.typography.fontSize.md,
    fontWeight: designTokens.typography.fontWeight.bold,
  },
  progressSubtext: {
    fontSize: designTokens.typography.fontSize.xs,
    color: designTokens.colors.textSecondary,
    marginTop: 2,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: designTokens.colors.card,
    borderTopLeftRadius: designTokens.borderRadius.xl,
    borderTopRightRadius: designTokens.borderRadius.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: designTokens.spacing.lg,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: designTokens.typography.fontSize.xl,
    fontWeight: designTokens.typography.fontWeight.bold,
  },
  modalCloseButton: {
    fontSize: designTokens.typography.fontSize['2xl'],
    padding: designTokens.spacing.xs,
  },
  modalBody: {
    padding: designTokens.spacing.lg,
  },
  modalLabel: {
    fontSize: designTokens.typography.fontSize.sm,
    fontWeight: designTokens.typography.fontWeight.semibold,
    marginBottom: designTokens.spacing.xs,
    marginTop: designTokens.spacing.md,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: designTokens.borderRadius.md,
    padding: designTokens.spacing.md,
    fontSize: designTokens.typography.fontSize.md,
  },
  modalTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: designTokens.spacing.lg,
    gap: designTokens.spacing.md,
    borderTopWidth: 1,
  },
  modalButton: {
    flex: 1,
    padding: designTokens.spacing.md,
    borderRadius: designTokens.borderRadius.md,
    alignItems: 'center',
  },
  modalCancelButton: {
    borderWidth: 1,
  },
  modalSaveButton: {
    // backgroundColor set inline
  },
  modalButtonText: {
    fontSize: designTokens.typography.fontSize.md,
    fontWeight: designTokens.typography.fontWeight.semibold,
  },
});

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}