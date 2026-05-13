import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  interpolate,
  Extrapolation,
  runOnJS
} from 'react-native-reanimated';
import * as Linking from 'expo-linking';
import { themes, getTypography, getShadows } from '../theme/theme';
import { Video } from '../db/repository';
import { useStore } from '../store/useStore';
import { hapticLight, hapticMedium, hapticHeavy } from '../utils/haptics';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;
const CARD_HEIGHT = height * 0.65;


const SWIPE_THRESHOLD_X = 120;
const SWIPE_THRESHOLD_Y = 100;

interface SwipeableCardProps {
  video: Video;
  index: number;
  isTopCard: boolean;
}

export const SwipeableCard = ({ video, index, isTopCard }: SwipeableCardProps) => {
  const { swipeRightArchive, swipeLeftDelete, openSheet, theme } = useStore();
  const colors = themes[theme];
  const typography = getTypography(colors);
  const shadows = getShadows(colors);
  
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const onSwipeRight = () => {
    hapticHeavy();
    Linking.openURL('vnd.youtube:
      Linking.openURL('https:
    });
    swipeRightArchive(video.id);
  };

  const onSwipeLeft = () => {
    hapticMedium();
    swipeLeftDelete(video.id);
  };

  const onSwipeUp = () => {
    hapticLight();
    openSheet('info', video);
  };

  const onSwipeDown = () => {
    hapticLight();
    openSheet('comments', video);
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
      isDragging.value = true;
    })
    .onUpdate((event) => {
      translateX.value = startX.value + event.translationX;
      translateY.value = startY.value + event.translationY;
    })
    .onEnd((event) => {
      isDragging.value = false;
      
      const velocityX = event.velocityX;
      
      if (translateX.value > SWIPE_THRESHOLD_X || velocityX > 1000) {
        translateX.value = withSpring(width + 100, { velocity: velocityX });
        runOnJS(onSwipeRight)();
      } else if (translateX.value < -SWIPE_THRESHOLD_X || velocityX < -1000) {
        translateX.value = withSpring(-width - 100, { velocity: velocityX });
        runOnJS(onSwipeLeft)();
      } else if (translateY.value < -SWIPE_THRESHOLD_Y) {
        translateY.value = withSpring(0);
        translateX.value = withSpring(0);
        runOnJS(onSwipeUp)();
      } else if (translateY.value > SWIPE_THRESHOLD_Y) {
        translateY.value = withSpring(0);
        translateX.value = withSpring(0);
        runOnJS(onSwipeDown)();
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-width / 2, 0, width / 2],
      [-10, 0, 10],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotateZ: `${rotate}deg` },
      ],
      ...(isTopCard ? (isDragging.value ? shadows.cardFloating : shadows.cardTop) : {}),
    };
  });

  const rightOverlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD_X],
      [0, 0.8],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  const leftOverlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD_X, 0],
      [0.8, 0],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  const CardContent = () => (
    <Animated.View style={[styles.cardContainer, animatedStyle]}>
      <View style={[styles.cardSurface, { backgroundColor: colors.cardSurface }]}>
        <View style={styles.thumbnailContainer}>
          <Image 
            source={{ uri: video.thumbnail_url }} 
            style={styles.thumbnail} 
          />
          {video.duration ? (
            <View style={[styles.durationTag, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
              <Text style={[styles.durationText, { color: '#FFF' }]}>{video.duration}</Text>
            </View>
          ) : null}
          <Animated.View style={[styles.overlay, { backgroundColor: colors.actionArchive }, rightOverlayStyle]} />
          <Animated.View style={[styles.overlay, { backgroundColor: colors.actionDelete }, leftOverlayStyle]} />
        </View>
        <View style={styles.infoArea}>
          <Text style={[typography.mainTitle, styles.title]} numberOfLines={2}>
            {video.title}
          </Text>
          <Text style={[typography.body, styles.channelName, { color: colors.highlightAccent }]} numberOfLines={1}>
            {video.channel_name}
          </Text>
        </View>
      </View>
    </Animated.View>
  );

  if (isTopCard) {
    return (
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
          <CardContent />
        </Animated.View>
      </GestureDetector>
    );
  }

  return (
    <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
      <CardContent />
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardSurface: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    padding: 12,
  },
  thumbnailContainer: {
    width: '100%',
    height: '80%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  infoArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingTop: 8,
  },
  title: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 4,
  },
  channelName: {
    fontSize: 14,
    fontWeight: '600',
  },
  durationTag: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '600',
  }
});
