import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useStore } from '../store/useStore';
import { themes, getTypography } from '../theme/theme';
import { Folder as FolderIcon, Clock, Archive, Plus, RefreshCw, Moon, Sun, LogOut, Filter } from 'lucide-react-native';
import { Folder } from '../db/repository';
import { CreateFolderModal } from '../components/CreateFolderModal';
import { GoogleSignin } from '../services/auth';

export const CustomDrawerContent = (props: any) => {
  const { folders, activeFolderId, setActiveFolder, removeFolder, theme, toggleTheme, youtubeToken, setYoutubeToken, logout, hideLongVideos, toggleDurationFilter } = useStore();
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const _userInfo = await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();
      await setYoutubeToken(tokens.accessToken);
    } catch (error) {
      console.error('Google Sign-In error:', error);
    }
  };

  const colors = themes[theme];
  const typography = getTypography(colors);

  const systemFolders = folders.filter(f => f.is_system === 1);
  const userFolders = folders.filter(f => f.is_system === 0);

  const handleLongPress = (item: Folder) => {
    if (item.is_system === 1) return;
    
    Alert.alert(
      "Delete Folder",
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => removeFolder(item.id) 
        }
      ]
    );
  };

  const renderFolderItem = ({ item }: { item: Folder }) => {
    const isActive = item.id === activeFolderId;
    let IconComponent = FolderIcon;
    
    if (item.id === 'sys_watchlater') IconComponent = Clock;
    if (item.id === 'sys_archive') IconComponent = Archive;

    return (
      <TouchableOpacity 
        style={[styles.itemContainer, isActive && { backgroundColor: colors.backgroundBase, shadowColor: colors.shadowBase, elevation: 1 }]} 
        onPress={() => {
          setActiveFolder(item.id);
          props.navigation.closeDrawer();
        }}
        onLongPress={() => handleLongPress(item)}
        activeOpacity={0.7}
      >
        <IconComponent 
          size={20} 
          color={isActive ? colors.typographyDark : colors.typographyMuted} 
          strokeWidth={isActive ? 2.5 : 2}
        />
        <Text style={[typography.body, styles.itemText, isActive && styles.activeText, { color: isActive ? colors.typographyDark : colors.typographyMuted }]}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <DrawerContentScrollView {...props} style={[styles.container, { backgroundColor: colors.drawerBackground }]} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[typography.mainTitle, styles.title]}>SWIPETUBER</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[typography.body, styles.sectionTitle]}>Your Folders</Text>
            <TouchableOpacity hitSlop={10} onPress={() => setIsCreateModalVisible(true)}>
              <Plus size={18} color={colors.typographyMuted} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={userFolders}
            renderItem={renderFolderItem}
            keyExtractor={item => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.list}
          />
        </View>

        <View style={styles.section}>
          <Text style={[typography.body, styles.sectionTitle, { marginBottom: 12, paddingHorizontal: 8 }]}>System</Text>
          <View style={styles.list}>
            {systemFolders.map(folder => (
              <React.Fragment key={folder.id}>
                {renderFolderItem({ item: folder })}
              </React.Fragment>
            ))}
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.syncButton, { backgroundColor: colors.highlightAccent, marginTop: 0, marginBottom: 20 }]} 
          onPress={() => {
            props.navigation.closeDrawer();
            useStore.getState().setAddVideoModalVisible(true);
          }}
        >
          <Plus size={18} color={colors.cardSurface} />
          <Text style={[typography.body, styles.syncText, { color: colors.cardSurface }]}>Add Video Manually</Text>
        </TouchableOpacity>
        
        <View style={{ flex: 1 }} />
        
        <TouchableOpacity style={[styles.syncButton, { backgroundColor: 'rgba(0,0,0,0.05)' }]} onPress={toggleTheme}>
          {theme === 'savanna' ? <Moon size={18} color={colors.typographyDark} /> : <Sun size={18} color={colors.typographyDark} />}
          <Text style={[typography.body, styles.syncText, { color: colors.typographyDark }]}>
            {theme === 'savanna' ? 'Midnight Theme' : 'Savanna Theme'}
          </Text>
        </TouchableOpacity>

        {/* Toggle Duration Filter */}
        {youtubeToken && activeFolderId === 'sys_watchlater' && (
          <TouchableOpacity style={[styles.syncButton, { backgroundColor: hideLongVideos ? colors.highlightAccent : 'rgba(0,0,0,0.05)' }]} onPress={toggleDurationFilter}>
            <Filter size={18} color={hideLongVideos ? colors.cardSurface : colors.typographyDark} />
            <Text style={[typography.body, styles.syncText, { color: hideLongVideos ? colors.cardSurface : colors.typographyDark }]}>
              {hideLongVideos ? 'Show All Videos' : 'Hide > 15 mins'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Sync Google Account / Sign Out Button */}
        {youtubeToken ? (
          <TouchableOpacity style={[styles.syncButton, { backgroundColor: 'rgba(255,50,50,0.1)' }]} onPress={logout}>
            <LogOut size={18} color="#FF3B30" />
            <Text style={[typography.body, styles.syncText, { color: '#FF3B30' }]}>Sign Out</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.syncButton, { backgroundColor: 'rgba(0,0,0,0.05)' }]} onPress={handleGoogleSignIn}>
            <RefreshCw size={18} color={colors.typographyDark} />
            <Text style={[typography.body, styles.syncText, { color: colors.typographyDark }]}>Sync Google Account</Text>
          </TouchableOpacity>
        )}
      </DrawerContentScrollView>

      <CreateFolderModal 
        visible={isCreateModalVisible} 
        onClose={() => setIsCreateModalVisible(false)} 
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingTop: 40,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 40,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 22,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  sectionTitle: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  list: {
    gap: 4,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 12,
  },
  itemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  activeText: {
    fontWeight: '600',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 10,
  },
  syncText: {
    fontWeight: '600',
  }
});
