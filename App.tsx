import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { DrawerNavigator } from './src/navigation/DrawerNavigator';
import { StatusBar } from 'expo-status-bar';
import { initDB } from './src/db/database';
import { useStore } from './src/store/useStore';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useShareIntent } from 'expo-share-intent';
import { SaveToFolderModal } from './src/components/SaveToFolderModal';
import { ErrorBoundary } from './src/components/ErrorBoundary';

export default function App() {
  const { loadFolders, isAddVideoModalVisible, setAddVideoModalVisible } = useStore();
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();

  useEffect(() => {
    const initialize = async () => {
      await initDB();
      await loadFolders();
    };
    initialize();
  }, []);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <NavigationContainer>
          <StatusBar style="auto" />
          <DrawerNavigator />
        </NavigationContainer>
        <SaveToFolderModal 
          visible={hasShareIntent || isAddVideoModalVisible} 
          sharedUrl={hasShareIntent ? (shareIntent.value || (shareIntent as any).text || (shareIntent as any).webUrl || '') : null} 
          onClose={() => {
            if (hasShareIntent) resetShareIntent();
            setAddVideoModalVisible(false);
          }} 
        />
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
