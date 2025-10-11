import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
} from 'react-native';
import { VocabularyCard } from './VocabularyCard';
import { WordCard } from '../data/sampleWords';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CARD_WIDTH = screenWidth - 40;
const CARD_HEIGHT = 400;
const SWIPE_THRESHOLD = screenWidth * 0.3;
const ROTATION_FACTOR = 0.1;

interface CardStackProps {
  words: WordCard[];
  onSwipeLeft: (word: WordCard) => void;
  onSwipeRight: (word: WordCard) => void;
  onSwipeUp: (word: WordCard) => void;
  onUndo: () => void;
}

export const CardStack: React.FC<CardStackProps> = ({
  words,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onUndo,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastSwipe, setLastSwipe] = useState<{
    word: WordCard;
    direction: 'left' | 'right' | 'up';
    index: number;
  } | null>(null);

  // Animated values for the current card
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const rotation = useRef(new Animated.Value(0)).current;

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      // Reset any previous animations
    },
    onPanResponderMove: (evt, gestureState) => {
      translateX.setValue(gestureState.dx);
      translateY.setValue(gestureState.dy);
      
      // Add rotation based on horizontal movement
      const rotationValue = gestureState.dx * 0.1;
      rotation.setValue(rotationValue);
    },
    onPanResponderRelease: (evt, gestureState) => {
      const { dx, dy, vx, vy } = gestureState;
      
      // Determine swipe direction based on translation and velocity
      const isSwipeLeft = dx < -SWIPE_THRESHOLD || vx < -0.5;
      const isSwipeRight = dx > SWIPE_THRESHOLD || vx > 0.5;
      const isSwipeUp = dy < -SWIPE_THRESHOLD || vy < -0.5;

      if (isSwipeLeft) {
        // Swipe left - still learning
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: -screenWidth * 1.5,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: dy,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          handleSwipeComplete('left');
        });
      } else if (isSwipeRight) {
        // Swipe right - mastered
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: screenWidth * 1.5,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: dy,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          handleSwipeComplete('right');
        });
      } else if (isSwipeUp) {
        // Swipe up - priority
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: dx,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: -screenHeight * 1.5,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          handleSwipeComplete('up');
        });
      } else {
        // Snap back to center
        Animated.parallel([
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }),
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }),
          Animated.spring(rotation, {
            toValue: 0,
            useNativeDriver: true,
          }),
        ]).start();
      }
    },
  });

  const handleSwipeComplete = (direction: 'left' | 'right' | 'up') => {
    if (currentIndex >= words.length) return;

    const currentWord = words[currentIndex];
    setLastSwipe({ word: currentWord, direction, index: currentIndex });
    
    // Call the appropriate callback
    switch (direction) {
      case 'left':
        onSwipeLeft(currentWord);
        break;
      case 'right':
        onSwipeRight(currentWord);
        break;
      case 'up':
        onSwipeUp(currentWord);
        break;
    }

    // Move to next card
    setCurrentIndex(prev => prev + 1);
    
    // Reset animated values for next card
    setTimeout(() => {
      translateX.setValue(0);
      translateY.setValue(0);
      rotation.setValue(0);
    }, 300);
  };

  const handleUndo = () => {
    if (!lastSwipe) return;
    
    setCurrentIndex(lastSwipe.index);
    setLastSwipe(null);
    onUndo();
    
    // Reset animated values
    translateX.setValue(0);
    translateY.setValue(0);
    rotation.setValue(0);
  };

  const currentCardStyle = {
    transform: [
      { translateX },
      { translateY },
      { 
        rotate: rotation.interpolate({
          inputRange: [-100, 0, 100],
          outputRange: ['-30deg', '0deg', '30deg'],
        })
      },
    ],
  };

  const getCardOpacity = (index: number) => {
    const distance = index - currentIndex;
    if (distance === 0) return 1;
    if (distance === 1) return 0.8;
    if (distance === 2) return 0.6;
    return 0;
  };

  const getCardScale = (index: number) => {
    const distance = index - currentIndex;
    if (distance === 0) return 1;
    if (distance === 1) return 0.95;
    if (distance === 2) return 0.9;
    return 0.85;
  };

  const getCardTranslateY = (index: number) => {
    const distance = index - currentIndex;
    return distance * 10; // Stack cards with 10px separation
  };

  if (currentIndex >= words.length) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          {/* You could add a "finished" state here */}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Background cards */}
      {words.slice(currentIndex, currentIndex + 3).map((word, index) => {
        const actualIndex = currentIndex + index;
        if (index === 0) return null; // Skip the current card, it's handled separately
        
        return (
          <Animated.View
            key={actualIndex}
            style={[
              styles.cardContainer,
              {
                opacity: getCardOpacity(actualIndex),
                transform: [
                  { scale: getCardScale(actualIndex) },
                  { translateY: getCardTranslateY(actualIndex) },
                ],
              },
            ]}
          >
            <VocabularyCard word={word} />
          </Animated.View>
        );
      })}

      {/* Current card with gesture handling */}
      <Animated.View 
        style={[styles.cardContainer, currentCardStyle]}
        {...panResponder.panHandlers}
      >
        <VocabularyCard word={words[currentIndex]} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContainer: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
