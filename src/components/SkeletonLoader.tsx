import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useStore } from '../store/useStore';
import { themes } from '../theme/theme';

// ─── Single shimmer bone ──────────────────────────────────────────────────────

interface BoneProps {
  style?: ViewStyle;
  baseColor: string;
  highlightColor: string;
}

const Bone = ({ style, baseColor, highlightColor }: BoneProps) => {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.4, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View style={[styles.bone, { backgroundColor: baseColor }, style]}>
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: highlightColor }, animStyle]}
      />
    </View>
  );
};

// ─── Card skeleton (used in CardStack while loading) ─────────────────────────

export const CardSkeleton = () => {
  const { theme } = useStore();
  const colors = themes[theme];

  const base = theme === 'midnight' ? '#2a2a2a' : '#ddd5c8';
  const highlight = theme === 'midnight' ? '#3a3a3a' : '#ede6dc';

  return (
    <View style={[styles.card, { backgroundColor: colors.cardSurface }]}>
      {/* Thumbnail area */}
      <Bone style={styles.thumbnail} baseColor={base} highlightColor={highlight} />
      {/* Title lines */}
      <Bone style={[styles.textLine, { width: '90%', marginTop: 14 }]} baseColor={base} highlightColor={highlight} />
      <Bone style={[styles.textLine, { width: '65%', marginTop: 8 }]} baseColor={base} highlightColor={highlight} />
      {/* Channel */}
      <Bone style={[styles.textLine, { width: '45%', marginTop: 8, height: 12 }]} baseColor={base} highlightColor={highlight} />
    </View>
  );
};

// ─── Comment skeleton (used in CommentsTopSheet while loading) ────────────────

export const CommentSkeleton = () => {
  const { theme } = useStore();
  const colors = themes[theme];

  const base = theme === 'midnight' ? '#2a2a2a' : '#ddd5c8';
  const highlight = theme === 'midnight' ? '#3a3a3a' : '#ede6dc';

  return (
    <View style={styles.commentRow}>
      <Bone style={styles.avatar} baseColor={base} highlightColor={highlight} />
      <View style={styles.commentLines}>
        <Bone style={[styles.textLine, { width: '40%', marginBottom: 8 }]} baseColor={base} highlightColor={highlight} />
        <Bone style={[styles.textLine, { width: '90%' }]} baseColor={base} highlightColor={highlight} />
        <Bone style={[styles.textLine, { width: '70%', marginTop: 6 }]} baseColor={base} highlightColor={highlight} />
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  bone: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  card: {
    width: '85%',
    aspectRatio: 0.65,
    borderRadius: 24,
    padding: 12,
    alignSelf: 'center',
  },
  thumbnail: {
    width: '100%',
    height: '78%',
    borderRadius: 16,
  },
  textLine: {
    height: 16,
    borderRadius: 6,
  },
  commentRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    flexShrink: 0,
  },
  commentLines: {
    flex: 1,
  },
});
