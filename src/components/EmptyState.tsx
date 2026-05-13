import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { useStore } from '../store/useStore';
import { themes, getTypography } from '../theme/theme';

export const EmptyState = () => {
  const { theme } = useStore();
  const colors = themes[theme];
  const typography = getTypography(colors);

  const handleOpenYouTube = () => {
    Linking.openURL('vnd.youtube:
      Linking.openURL('https:
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundBase }]}>
      <Text style={[styles.text, typography.body, { color: colors.typographyDark }]}>You have watched everything.</Text>
      <TouchableOpacity style={[styles.button, { backgroundColor: colors.typographyDark }]} onPress={handleOpenYouTube} activeOpacity={0.8}>
        <Text style={[styles.buttonText, typography.body, { color: colors.cardSurface }]}>Open YouTube</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  text: {
    fontWeight: '600',
    fontSize: 18,
    marginBottom: 20,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 100,
  },
  buttonText: {
    fontWeight: '600',
    fontSize: 16,
  }
});
