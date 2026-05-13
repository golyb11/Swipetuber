import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  Pressable,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { ThumbsUp } from 'lucide-react-native';
import { themes, getTypography, getShadows } from '../theme/theme';
import { useStore } from '../store/useStore';
import { CommentSkeleton } from './SkeletonLoader';

const { height } = Dimensions.get('window');
const SHEET_HEIGHT = height * 0.65;
const DISMISS_THRESHOLD = SHEET_HEIGHT * 0.3;

export const CommentsTopSheet = () => {
  const { activeSheet, activeVideo, closeSheet, theme, comments, isLoadingComments } =
    useStore();
  const isVisible = activeSheet === 'comments' && activeVideo !== null;

  const colors = themes[theme];
  const typography = getTypography(colors);
  const shadows = getShadows(colors);

  const translateY = useSharedValue(-SHEET_HEIGHT);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      translateY.value = withSpring(-SHEET_HEIGHT, { damping: 20, stiffness: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [isVisible]);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY < 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY < -DISMISS_THRESHOLD) {
        runOnJS(closeSheet)();
      } else {
        translateY.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    pointerEvents: isVisible ? 'auto' : 'none',
  }));

  if (!activeVideo && !isVisible) return null;


  const renderSkeleton = () => (
    <View>
      {[0, 1, 2, 3, 4].map((i) => (
        <CommentSkeleton key={i} />
      ))}
    </View>
  );


  const renderComment = ({ item }: { item: any }) => (
    <View style={styles.commentContainer}>
      <View style={[styles.avatar, { backgroundColor: colors.backgroundBase }]}>
        <Text style={[typography.mainTitle, styles.avatarText, { color: colors.highlightAccent }]}>
          {item.author.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.commentContent}>
        <Text
          style={[typography.body, styles.commentAuthor, { color: colors.typographyDark }]}
        >
          {item.author}
        </Text>
        <Text style={[typography.body, styles.commentText, { color: colors.typographyDark }]}>
          {item.text}
        </Text>
        {item.likeCount > 0 && (
          <View style={styles.likeRow}>
            <ThumbsUp size={12} color={colors.typographyMuted} />
            <Text style={[typography.body, styles.likeCount, { color: colors.typographyMuted }]}>
              {item.likeCount}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <>
      {}
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} />
      </Animated.View>

      {}
      <Animated.View
        style={[
          styles.sheet,
          { backgroundColor: colors.cardSurface, ...shadows.cardFloating },
          animatedStyle,
        ]}
      >
        {}
        <GestureDetector gesture={panGesture}>
          <View style={styles.header}>
            <View style={[styles.handle, { backgroundColor: colors.typographyMuted }]} />
            <Text style={[typography.mainTitle, styles.title]}>Comments</Text>
          </View>
        </GestureDetector>

        {isLoadingComments ? (
          renderSkeleton()
        ) : (
          <FlatList
            data={comments}
            renderItem={renderComment}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => (
              <View style={[styles.divider, { backgroundColor: 'rgba(0,0,0,0.05)' }]} />
            )}
            ListEmptyComponent={
              <Text
                style={[
                  typography.body,
                  { textAlign: 'center', marginTop: 32, color: colors.typographyMuted },
                ]}
              >
                No comments available.
              </Text>
            }
          />
        )}
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 10,
  },
  sheet: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    zIndex: 11,
  },
  header: {
    paddingTop: 56,
    paddingHorizontal: 24,
    paddingBottom: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    opacity: 0.4,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    alignSelf: 'flex-start',
  },
  list: {
    padding: 24,
    paddingBottom: 40,
  },
  commentContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 16,
  },
  commentContent: {
    flex: 1,
  },
  commentAuthor: {
    fontWeight: '600',
    marginBottom: 4,
    fontSize: 13,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  likeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  likeCount: {
    fontSize: 12,
  },
  divider: {
    height: 1,
    marginBottom: 16,
  },
});
