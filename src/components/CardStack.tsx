import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useStore } from '../store/useStore';
import { SwipeableCard } from './SwipeableCard';
import { CardSkeleton } from './SkeletonLoader';
import { themes, getShadows } from '../theme/theme';

export const CardStack = () => {
  const {
    videos,
    theme,
    activeFolderId,
    youtubeToken,
    nextPageToken,
    fetchWatchLater,
    isLoadingVideos,
  } = useStore();

  const colors = themes[theme];
  const shadows = getShadows(colors);


  useEffect(() => {
    if (
      activeFolderId === 'sys_watchlater' &&
      youtubeToken &&
      nextPageToken &&
      !isLoadingVideos &&
      videos.length < 5
    ) {
      fetchWatchLater(true);
    }
  }, [videos.length, activeFolderId, youtubeToken, nextPageToken, isLoadingVideos]);


  if (isLoadingVideos && videos.length === 0) {
    return (
      <View style={styles.container}>
        <CardSkeleton />
      </View>
    );
  }


  const stackVideos = videos.slice(0, 3);
  const reversedStack = [...stackVideos].reverse();

  return (
    <View style={styles.container}>
      {reversedStack.map((video, idx) => {
        const logicalIndex = stackVideos.length - 1 - idx;
        const isTopCard = logicalIndex === 0;

        let scale = 1;
        let translateY = 0;
        let shadowStyle = {};

        if (logicalIndex === 0) {
          scale = 1;
          translateY = 0;
          shadowStyle = shadows.cardTop;
        } else if (logicalIndex === 1) {
          scale = 0.95;
          translateY = -20;
          shadowStyle = shadows.stackMiddle;
        } else if (logicalIndex === 2) {
          scale = 0.9;
          translateY = -40;
          shadowStyle = shadows.stackBottom;
        }

        return (
          <View
            key={video.id}
            style={[
              StyleSheet.absoluteFillObject,
              {
                transform: [{ translateY }, { scale }],
                zIndex: stackVideos.length - logicalIndex,
              },
              shadowStyle,
            ]}
          >
            <SwipeableCard video={video} index={logicalIndex} isTopCard={isTopCard} />
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
