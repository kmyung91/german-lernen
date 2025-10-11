import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { WordCard } from '../data/sampleWords';

interface VocabularyCardProps {
  word: WordCard;
  onFlip?: () => void;
}

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = screenWidth - 40;
const cardHeight = 400;

export const VocabularyCard: React.FC<VocabularyCardProps> = ({ word, onFlip }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const flipAnimation = new Animated.Value(0);

  const handleFlip = () => {
    const toValue = isFlipped ? 0 : 1;
    
    Animated.timing(flipAnimation, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    setIsFlipped(!isFlipped);
    onFlip?.();
  };

  const frontInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const frontAnimatedStyle = {
    transform: [{ rotateY: frontInterpolate }],
  };

  const backAnimatedStyle = {
    transform: [{ rotateY: backInterpolate }],
  };

  return (
    <View style={styles.container}>
      {/* Front of card (German) */}
      <Animated.View style={[styles.card, styles.frontCard, frontAnimatedStyle]}>
        <TouchableOpacity style={styles.cardContent} onPress={handleFlip}>
          <View style={styles.wordContainer}>
            <Text style={styles.germanWord}>{word.germanWord}</Text>
          </View>
          <View style={styles.sentenceContainer}>
            <Text style={styles.germanSentence}>{word.germanSentence}</Text>
          </View>
          <View style={styles.hintContainer}>
            <Text style={styles.hintText}>Tap to reveal translation</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Back of card (English) */}
      <Animated.View style={[styles.card, styles.backCard, backAnimatedStyle]}>
        <TouchableOpacity style={styles.cardContent} onPress={handleFlip}>
          <View style={styles.wordContainer}>
            <Text style={styles.englishWord}>{word.englishTranslation}</Text>
          </View>
          <View style={styles.sentenceContainer}>
            <Text style={styles.englishSentence}>{word.englishSentence}</Text>
          </View>
          <View style={styles.hintContainer}>
            <Text style={styles.hintText}>Tap to see German again</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: cardWidth,
    height: cardHeight,
  },
  card: {
    position: 'absolute',
    width: cardWidth,
    height: cardHeight,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    backfaceVisibility: 'hidden',
  },
  frontCard: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  backCard: {
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#bbdefb',
  },
  cardContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  wordContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  germanWord: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
  },
  englishWord: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1976d2',
    textAlign: 'center',
  },
  sentenceContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  germanSentence: {
    fontSize: 18,
    color: '#34495e',
    textAlign: 'center',
    lineHeight: 26,
  },
  englishSentence: {
    fontSize: 18,
    color: '#1565c0',
    textAlign: 'center',
    lineHeight: 26,
  },
  hintContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  hintText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
});
