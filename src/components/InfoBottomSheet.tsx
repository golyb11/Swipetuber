import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  Pressable,
  TouchableOpacity,
  Share,
  Linking,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { themes, getTypography, getShadows } from '../theme/theme';
import { useStore } from '../store/useStore';
import { Video } from '../db/repository';
import { Share as ShareIcon } from 'lucide-react-native';

const { height } = Dimensions.get('window');
// Taller sheet so description has room to breathe
const SHEET_HEIGHT = height * 0.72;
const DISMISS_THRESHOLD = SHEET_HEIGHT * 0.25;

// ─── URL regex ────────────────────────────────────────────────────────────────
const URL_REGEX = /(https?:\/\/[^\s]+)/g;

// ─── Linkified text ───────────────────────────────────────────────────────────
const LinkifiedText = ({
  text,
  style,
  linkColor,
}: {
  text: string;
  style?: any;
  linkColor: string;
}) => {
  const parts = text.split(URL_REGEX);

  return (
    <Text style={style}>
      {parts.map((part, i) => {
        if (URL_REGEX.test(part)) {
          // Reset lastIndex after test()
          URL_REGEX.lastIndex = 0;
          return (
            <Text
              key={i}
              style={[style, { color: linkColor, textDecorationLine: 'underline' }]}
              onPress={() => Linking.openURL(part).catch(() => {})}
            >
              {part}
            </Text>
          );
        }
        return <Text key={i}>{part}</Text>;
      })}
    </Text>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

export const InfoBottomSheet = () => {
  const { activeSheet, activeVideo, closeSheet, theme } = useStore();
  const isVisible = activeSheet === 'info' && activeVideo !== null;

  const colors = themes[theme];
  const typography = getTypography(colors);
  const shadows = getShadows(colors);

  const translateY = useSharedValue(SHEET_HEIGHT);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      translateY.value = withSpring(SHEET_HEIGHT, { damping: 20, stiffness: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [isVisible]);

  // Pan gesture attached ONLY to the drag handle — scroll is unobstructed
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > DISMISS_THRESHOLD) {
        runOnJS(closeSheet)();
      } else {
        translateY.value = withSpring(0);
      }
    });

  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    pointerEvents: isVisible ? 'auto' : 'none',
  }));

  const handleShare = useCallback(async () => {
    if (!activeVideo) return;
    try {
      await Share.share({
        message: `Check out this video: https://youtube.com/watch?v=${activeVideo.id}`,
        title: activeVideo.title,
      });
    } catch (error: any) {
      console.error(error.message);
    }
  }, [activeVideo]);

  if (!activeVideo && !isVisible) return null;

  const video = activeVideo as Video;

  return (
    <>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} />
      </Animated.View>

      {/* Sheet — NOT wrapped in GestureDetector so ScrollView works freely */}
      <Animated.View
        style={[
          styles.sheet,
          { backgroundColor: colors.cardSurface, ...shadows.cardFloating },
          animatedSheetStyle,
        ]}
      >
        {/* Drag handle — only this area has the pan gesture */}
        <GestureDetector gesture={panGesture}>
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: colors.typographyMuted }]} />
          </View>
        </GestureDetector>

        {/* Scrollable content */}
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          bounces
          // Let the native scroll handler win over any parent gesture
          scrollEventThrottle={16}
        >
          {/* Header row */}
          <View style={styles.headerRow}>
            <Text
              style={[typography.mainTitle, styles.title, { flex: 1, color: colors.typographyDark }]}
              numberOfLines={4}
            >
              {video?.title}
            </Text>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <ShareIcon size={24} color={colors.typographyDark} />
            </TouchableOpacity>
          </View>

          <Text style={[typography.body, styles.channel, { color: colors.highlightAccent }]}>
            {video?.channel_name}
          </Text>

          <View style={[styles.divider, { backgroundColor: 'rgba(0,0,0,0.08)' }]} />

          {/* Description with clickable links */}
          {video?.description ? (
            <LinkifiedText
              text={video.description}
              style={[typography.body, styles.description, { color: colors.typographyDark }]}
              linkColor={colors.highlightAccent}
            />
          ) : (
            <Text style={[typography.body, styles.description, { color: colors.typographyMuted }]}>
              No description available.
            </Text>
          )}
        </ScrollView>
      </Animated.View>
    </>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 10,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    zIndex: 11,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
    // Extra hit area so the handle is easy to grab
    paddingHorizontal: 80,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    opacity: 0.4,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 48,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
  },
  shareButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  channel: {
    fontWeight: '600',
    marginBottom: 4,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
  },
});
