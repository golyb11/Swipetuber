import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { themes, getTypography } from '../theme/theme';
import { useStore } from '../store/useStore';
import { EmptyState } from '../components/EmptyState';
import { CardStack } from '../components/CardStack';
import { InfoBottomSheet } from '../components/InfoBottomSheet';
import { CommentsTopSheet } from '../components/CommentsTopSheet';
import { Menu, RefreshCw, RotateCcw } from 'lucide-react-native';

export const HomeScreen = ({ navigation }: any) => {
  const { videos, isInitializing, theme, lastSwipedVideo, undoSwipe, loadVideosForActiveFolder, youtubeToken, activeFolderId, fetchWatchLater } = useStore();
  const colors = themes[theme];
  const typography = getTypography(colors);

  if (isInitializing) {
    return <View style={[styles.container, { backgroundColor: colors.backgroundBase }]} />;
  }

  // Hard refresh: clear cache then reload from scratch
  const handleRefresh = () => {
    if (youtubeToken && activeFolderId === 'sys_watchlater') {
      // fetchWatchLater with loadMore=false already resets videos & nextPageToken
      fetchWatchLater(false);
    } else {
      loadVideosForActiveFolder();
    }
  };

  const renderUndoSnackbar = () => {
    if (!lastSwipedVideo) return null;
    
    return (
      <View style={[styles.snackbar, { backgroundColor: colors.typographyDark }]}>
        <Text style={[typography.body, styles.snackbarText, { color: colors.cardSurface }]} numberOfLines={1}>
          Swiped "{lastSwipedVideo.title}"
        </Text>
        <TouchableOpacity style={styles.undoButton} onPress={undoSwipe}>
          <RotateCcw size={16} color={colors.highlightAccent} />
          <Text style={[typography.body, styles.undoText, { color: colors.highlightAccent }]}>UNDO</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderTopControls = () => (
    <>
      <TouchableOpacity 
        style={styles.menuButton} 
        onPress={() => navigation.openDrawer()}
      >
        <Menu size={24} color={colors.typographyDark} />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.syncButton} 
        onPress={handleRefresh}
      >
        <RefreshCw size={24} color={colors.typographyDark} />
      </TouchableOpacity>
    </>
  );

  if (!videos || videos.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.backgroundBase }]}>
        {renderTopControls()}
        <EmptyState />
        {renderUndoSnackbar()}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundBase }]}>
      {renderTopControls()}
      
      <CardStack />
      
      {renderUndoSnackbar()}
      
      <InfoBottomSheet />
      <CommentsTopSheet />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  menuButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 100,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 20,
  },
  syncButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 100,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 20,
  },
  snackbar: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 10,
    zIndex: 1000,
  },
  snackbarText: {
    flex: 1,
    marginRight: 12,
  },
  undoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  undoText: {
    fontWeight: '600',
    fontSize: 14,
  }
});
