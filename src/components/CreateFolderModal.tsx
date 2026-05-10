import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useStore } from '../store/useStore';
import { themes, getTypography } from '../theme/theme';

interface CreateFolderModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CreateFolderModal = ({ visible, onClose }: CreateFolderModalProps) => {
  const { addFolder, theme } = useStore();
  const [folderName, setFolderName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const colors = themes[theme];
  const typography = getTypography(colors);

  const handleSave = async () => {
    const trimmed = folderName.trim();
    if (!trimmed) return;
    
    setIsSaving(true);
    await addFolder(trimmed);
    setIsSaving(false);
    setFolderName('');
    onClose();
  };

  const handleClose = () => {
    setFolderName('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.cardSurface }]}>
          <Text style={[typography.mainTitle, styles.title]}>Create Folder</Text>
          <Text style={[typography.body, styles.subtitle]}>Enter a name for your new folder.</Text>

          <TextInput
            style={[styles.input, { 
              borderColor: colors.highlightAccent,
              color: colors.typographyDark,
              backgroundColor: colors.backgroundBase
            }]}
            placeholder="Folder name"
            placeholderTextColor={colors.typographyMuted}
            value={folderName}
            onChangeText={setFolderName}
            autoFocus
            maxLength={30}
          />

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose} disabled={isSaving}>
              <Text style={[typography.body, styles.cancelText]}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.saveButton, { backgroundColor: colors.typographyDark }, (!folderName.trim() || isSaving) && styles.saveButtonDisabled]} 
              onPress={handleSave}
              disabled={!folderName.trim() || isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={colors.cardSurface} />
              ) : (
                <Text style={[typography.body, styles.saveText, { color: colors.cardSurface }]}>Create</Text>
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
    fontSize: 16,
    marginBottom: 24,
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
