import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DatabaseProvider, useDatabaseReady } from '../src/hooks/useDatabase';
import { ChildProvider } from '../src/hooks/useChild';

function AppContent() {
  const isReady = useDatabaseReady();

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <ChildProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="incident"
          options={{
            headerShown: true,
            title: 'Stress Log',
            presentation: 'modal',
          }}
        />
      </Stack>
      <StatusBar style="dark" />
    </ChildProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <DatabaseProvider>
        <AppContent />
      </DatabaseProvider>
    </GestureHandlerRootView>
  );
}
