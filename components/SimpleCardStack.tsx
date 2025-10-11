import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
} from 'react-native';
import { VocabularyCard } from './VocabularyCard';
import { WordCard } from '../data/sampleWords';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth - 40;
const CARD_HEIGHT = 400;

interface SimpleCardStackProps {
  words: WordCard[];
  onSwipeLeft: (word: WordCard) => void;
  onSwipeRight: (word: WordCard) => void;
  onSwipeUp: (word: WordCard) => void;
  onUndo: () => void;
}

export const SimpleCardStack: React.FC<SimpleCardStackProps> = ({
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

  const handleSwipe = (direction: 'left' | 'right' | 'up') => {
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
  };

  const handleUndo = () => {
    if (!lastSwipe) return;
    
    setCurrentIndex(lastSwipe.index);
    setLastSwipe(null);
    onUndo();
  };

  if (currentIndex >= words.length) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>All done! 🎉</Text>
          <Text style={styles.emptySubtext}>You've reviewed all the cards</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Background cards */}
      {words.slice(currentIndex, currentIndex + 3).map((word, index) => {
        const actualIndex = currentIndex + index;
        if (index === 0) return null; // Skip the current card
        
        return (
          <View
            key={actualIndex}
            style={[
              styles.cardContainer,
              {
                opacity: index === 1 ? 0.7 : 0.4,
                transform: [
                  { scale: index === 1 ? 0.95 : 0.9 },
                  { translateY: index * 10 },
                ],
              },
            ]}
          >
            <VocabularyCard word={word} />
          </View>
        );
      })}

      {/* Current card */}
      <View style={styles.cardContainer}>
        <VocabularyCard word={words[currentIndex]} />
      </View>

      {/* Action buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.learningButton]}
          onPress={() => handleSwipe('left')}
        >
          <Text style={styles.buttonText}>Still Learning</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.priorityButton]}
          onPress={() => handleSwipe('up')}
        >
          <Text style={styles.buttonText}>Priority</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.masteredButton]}
          onPress={() => handleSwipe('right')}
        >
          <Text style={styles.buttonText}>Mastered</Text>
        </TouchableOpacity>
      </View>
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
  emptyText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 100,
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 80,
    alignItems: 'center',
  },
  learningButton: {
    backgroundColor: '#ff6b6b',
  },
  priorityButton: {
    backgroundColor: '#ffd43b',
  },
  masteredButton: {
    backgroundColor: '#51cf66',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
