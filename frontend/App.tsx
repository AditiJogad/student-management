import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { store } from './src/store';
import { bootstrapAuth } from './src/store/authSlice';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import RootNavigator from './src/navigation/RootNavigator';

function Shell() {
  const { isDark } = useTheme();
  useEffect(() => {
    // restore the persisted session once, at process start
    store.dispatch(bootstrapAuth());
  }, []);
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <RootNavigator />
    </>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <SafeAreaProvider>
          <Shell />
        </SafeAreaProvider>
      </ThemeProvider>
    </Provider>
  );
}
