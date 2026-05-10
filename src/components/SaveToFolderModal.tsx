import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, ActivityIndicator, ToastAndroid, TextInput } from 'react-native';
import { themes, getTypography } from '../theme/theme';
import { useStore } from '../store/useStore';
import { FolderIcon, Clock, Check } from 'lucide-react-native';
import { fetchOEmbedMetadata } from '../services/youtube';
import { extractYouTubeId } from '../services/shareIntent';
import { insertVideo } from '../db/repository';

interface SaveToFolderModalProps {
  visible: boolean;
  sharedUrl: string | null;
  onClose: () => void;
}

export const SaveToFolderModal = ({ visible, sharedUrl, onClose }: SaveToFolderModalProps) => {
  const { folders, loadVideosForActiveFolder, theme, setAddVideoModalVisible } = useStore();
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [manualUrl, setManualUrl] = useState('');
  
  const colors = themes[theme];
  const typography = getTypography(colors);

  // Exclude the 'Archive' folder since we only save to user folders or Watch Later
  const availableFolders = folders.filter(f => f.id !== 'sys_archive');

  useEffect(() => {
    if (visible && !selectedFolderId && availableFolders.length > 0) {
      setSelectedFolderId(availableFolders[0].id);
    }
    if (!visible) {
      setManualUrl(''); // reset when closed
    }
  }, [visible, availableFolders, selectedFolderId]);

  const handleClose = () => {
    onClose();
    setAddVideoModalVisible(false);
  };

  const handleSave = async () => {
    const targetUrl = sharedUrl || manualUrl;
    
    if (!targetUrl) {
      ToastAndroid.show('No URL provided.', ToastAndroid.SHORT);
      return;
    }
    if (!selectedFolderId) {
      ToastAndroid.show('No folder selected.', ToastAndroid.SHORT);
      return;
    }
    
    setIsSaving(true);
    try {
      const videoId = extractYouTubeId(targetUrl);
      if (!videoId) {
        ToastAndroid.show('Invalid YouTube URL.', ToastAndroid.LONG);
        throw new Error("Invalid YouTube URL");
      }

      const metadata = await fetchOEmbedMetadata(videoId);
      if (!metadata) {
        ToastAndroid.show('Could not fetch video details.', ToastAndroid.SHORT);
      }
      
      const newVideo = {
        id: videoId,
        title: metadata?.title || 'Unknown Title',
        thumbnail_url: metadata?.thumbnail_url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        channel_name: metadata?.author_name || 'Unknown Channel',
        description: '', // We get this from API later if we want
        folder_id: selectedFolderId,
        status: 'unread' as 'unread' | 'archived',
        added_at: Date.now()
      };

      await insertVideo(newVideo);
      
      // Update the active folder to the one we just saved to, so the user sees it immediately
      const { setActiveFolder } = useStore.getState();
      await setActiveFolder(selectedFolderId);
      
      ToastAndroid.show('Video Saved!', ToastAndroid.SHORT);
      handleClose();
    } catch (error) {
      console.error("Failed to save video", error);
      ToastAndroid.show('Error saving video.', ToastAndroid.LONG);
    } finally {
      setIsSaving(false);
    }
  };

  const renderFolderItem = ({ item }: any) => {
    const isSelected = selectedFolderId === item.id;
    return (
      <TouchableOpacity 
        style={[styles.folderItem, isSelected && { backgroundColor: 'rgba(164,139,113,0.1)', borderWidth: 1, borderColor: colors.highlightAccent }]} 
        onPress={() => setSelectedFolderId(item.id)}
      >
        <View style={styles.folderRow}>
          {item.id === 'sys_watchlater' ? (
            <Clock size={20} color={colors.typographyDark} />
          ) : (
            <FolderIcon size={20} color={colors.typographyDark} />
          )}
          <Text style={[typography.body, styles.folderName, { color: colors.typographyDark }]}>{item.name}</Text>
        </View>
        {isSelected && <Check size={20} color={colors.highlightAccent} />}
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.cardSurface }]}>
          <Text style={[typography.mainTitle, styles.title]}>Add Video</Text>
          <Text style={[typography.body, styles.subtitle]}>
            {sharedUrl ? 'Select a folder to save this video to.' : 'Paste a YouTube link and select a folder.'}
          </Text>

          {!sharedUrl && (
            <TextInput
              style={[
                styles.input,
                typography.body,
                { 
                  color: colors.typographyDark,
                  borderColor: 'rgba(0,0,0,0.1)',
                  backgroundColor: colors.backgroundBase
                }
              ]}
              placeholder="https://youtube.com/..."
              placeholderTextColor={colors.typographyMuted}
              value={manualUrl}
              onChangeText={setManualUrl}
              autoCapitalize="none"
              autoCorrect={false}
            />
          )}

          <FlatList
            data={availableFolders}
            renderItem={renderFolderItem}
            keyExtractor={item => item.id}
            style={styles.list}
          />

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose} disabled={isSaving}>
              <Text style={[typography.body, styles.cancelText, { color: colors.typographyDark }]}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.saveButton, 
                { backgroundColor: colors.typographyDark }, 
                (!selectedFolderId || (!sharedUrl && !manualUrl) || isSaving) && styles.saveButtonDisabled
              ]} 
              onPress={handleSave}
              disabled={!selectedFolderId || (!sharedUrl && !manualUrl) || isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={colors.cardSurface} />
              ) : (
                <Text style={[typography.body, styles.saveText, { color: colors.cardSurface }]}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
  },
  title: {
    fontSize: 20,
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  list: {
    maxHeight: 250,
    marginBottom: 20,
  },
  folderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  folderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  folderName: {
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 100,
  },
  cancelText: {
    fontWeight: '600',
  },
  saveButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 100,
    minWidth: 80,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveText: {
    fontWeight: '600',
  }
});
