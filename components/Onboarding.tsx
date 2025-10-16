import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Image,
  Animated,
} from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface OnboardingProps {
  onComplete: () => void;
}

const onboardingScreens = [
  {
    title: 'Welcome to Currywort',
    subtitle: 'Learn 5000+ German words',
    description: 'Track your progress and see how many words you\'ve mastered',
  },
  {
    title: 'How to Learn',
    subtitle: 'Swipe cards based on your confidence level',
    instructions: [
      { color: '🟢', text: 'Know it', emoji: '⬆️' },
      { color: '🟡', text: 'Getting it', emoji: '➡️' },
      { color: '🔴', text: 'Don\'t know', emoji: '⬅️' },
    ],
  },
];

export function Onboarding({ onComplete }: OnboardingProps) {
  const [currentScreen, setCurrentScreen] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleNext = () => {
    if (currentScreen < onboardingScreens.length - 1) {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        const nextScreen = currentScreen + 1;
        setCurrentScreen(nextScreen);
        scrollViewRef.current?.scrollTo({
          x: nextScreen * screenWidth,
          animated: false,
        });
        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    } else {
      // Fade out before completing
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        onComplete();
      });
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
          <Animated.View key={index} style={[styles.screen, { opacity: fadeAnim }]}>
            <View style={styles.content}>
              {index === 0 && (
                <Image 
                  source={require('../assets/icon.png')} 
                  style={styles.icon}
                  resizeMode="contain"
                />
              )}
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
          </Animated.View>
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
    backgroundColor: '#00B1AC', // Teal background
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
    paddingTop: 120,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
    padding: 20,
  },
  icon: {
    width: 120,
    height: 120,
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#FFFFFF', // White text for visibility
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '500',
    textAlign: 'center',
    color: '#E0F7FA', // Light teal for contrast
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#E0F7FA', // Light teal for contrast
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
    color: '#FFFFFF', // White text for visibility
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
    color: '#E0F7FA', // Light teal for contrast
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
    backgroundColor: '#FFFFFF', // White dots on teal background
  },
  nextButton: {
    backgroundColor: '#FFFFFF', // White button on teal background
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#00B1AC', // Teal text on white button
    textAlign: 'center',
  },
});
