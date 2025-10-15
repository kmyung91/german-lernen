import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface OnboardingProps {
  onComplete: () => void;
}

const onboardingScreens = [
  {
    emoji: '🇩🇪',
    title: 'Welcome to Currywort!',
    subtitle: 'Master German vocabulary with our intuitive flashcard system. No ads. No fees.',
  },
  {
    emoji: '📚',
    title: 'How to Learn',
    subtitle: 'Swipe cards based on your confidence level',
    instructions: [
      { color: '🟢', text: 'Know it', emoji: '⬆️' },
      { color: '🟡', text: 'Getting it', emoji: '➡️' },
      { color: '🔴', text: 'Don\'t know', emoji: '⬅️' },
    ],
  },
  {
    emoji: '🚀',
    title: 'Ready to Start!',
    subtitle: 'You\'ll learn 5,000+ German words with example sentences',
    description: 'Track your progress and see how many words you\'ve mastered',
  },
];

export function Onboarding({ onComplete }: OnboardingProps) {
  const [currentScreen, setCurrentScreen] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleNext = () => {
    if (currentScreen < onboardingScreens.length - 1) {
      const nextScreen = currentScreen + 1;
      setCurrentScreen(nextScreen);
      scrollViewRef.current?.scrollTo({
        x: nextScreen * screenWidth,
        animated: true,
      });
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <View style={styles.container}>
      {/* Skip button - top right */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipButtonText} allowFontScaling={true}>Skip</Text>
      </TouchableOpacity>
      
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const newIndex = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
          setCurrentScreen(newIndex);
        }}
        style={styles.scrollView}
      >
        {onboardingScreens.map((screen, index) => (
          <View key={index} style={styles.screen}>
            <View style={styles.content}>
              <Text style={styles.emoji} allowFontScaling={true}>{screen.emoji}</Text>
              <Text style={styles.title} allowFontScaling={true}>{screen.title}</Text>
              <Text style={styles.subtitle} allowFontScaling={true}>{screen.subtitle}</Text>
              
              {screen.instructions && (
                <View style={styles.instructions}>
                  {screen.instructions.map((instruction, i) => (
                    <View key={i} style={styles.instructionRow}>
                      <Text style={styles.colorEmoji} allowFontScaling={true}>{instruction.color}</Text>
                      <Text style={styles.instructionText} allowFontScaling={true}>{instruction.text}</Text>
                      <Text style={styles.swipeEmoji} allowFontScaling={true}>{instruction.emoji}</Text>
                    </View>
                  ))}
                </View>
              )}
              
              {screen.description && (
                <Text style={styles.description} allowFontScaling={true}>{screen.description}</Text>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
      
      {/* Bottom controls */}
      <View style={styles.bottomControls}>
        {/* Page indicators - centered */}
        <View style={styles.pageIndicators}>
          {onboardingScreens.map((_, index) => (
            <View
              key={index}
              style={[
                styles.pageIndicator,
                index === currentScreen && styles.pageIndicatorActive,
              ]}
            />
          ))}
        </View>
        
        {/* Next/Start button - full width */}
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText} allowFontScaling={true}>
            {currentScreen === onboardingScreens.length - 1 ? 'Start Learning' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  screen: {
    width: screenWidth,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 180,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
    padding: 20,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#333333',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    color: '#666666',
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666666',
    lineHeight: 24,
  },
  instructions: {
    marginVertical: 24,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  colorEmoji: {
    fontSize: 20,
    marginRight: 16,
  },
  instructionText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333333',
    marginRight: 16,
    width: 100,
    textAlign: 'center',
  },
  swipeEmoji: {
    fontSize: 24,
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    zIndex: 1,
  },
  skipButtonText: {
    fontSize: 16,
    color: '#666666',
  },
  bottomControls: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  pageIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  pageIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#cccccc',
    marginHorizontal: 4,
  },
  pageIndicatorActive: {
    backgroundColor: '#007AFF',
  },
  nextButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
});
