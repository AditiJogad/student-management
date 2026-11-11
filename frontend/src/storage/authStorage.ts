import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthResponse } from '../types';

const AUTH_KEY = 'sms.auth.session';
const THEME_KEY = 'sms.theme.mode';

// SecureStore (Keychain / Keystore) on devices; AsyncStorage on web where SecureStore is unavailable.
const useSecure = Platform.OS !== 'web';

async function getItem(key: string): Promise<string | null> {
  try {
    return useSecure ? await SecureStore.getItemAsync(key) : await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

async function setItem(key: string, value: string): Promise<void> {
  try {
    if (useSecure) await SecureStore.setItemAsync(key, value);
    else await AsyncStorage.setItem(key, value);
  } catch {
    /* storage failure must never crash the app */
  }
}

async function removeItem(key: string): Promise<void> {
  try {
    if (useSecure) await SecureStore.deleteItemAsync(key);
    else await AsyncStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export const authStorage = {
  async load(): Promise<AuthResponse | null> {
    const raw = await getItem(AUTH_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as AuthResponse;
      return parsed?.token && parsed?.user ? parsed : null;
    } catch {
      return null;
    }
  },
  save: (session: AuthResponse) => setItem(AUTH_KEY, JSON.stringify(session)),
  clear: () => removeItem(AUTH_KEY),
};

// Theme preference is not sensitive -> AsyncStorage everywhere.
export const themeStorage = {
  async load(): Promise<'light' | 'dark' | null> {
    try {
      const v = await AsyncStorage.getItem(THEME_KEY);
      return v === 'light' || v === 'dark' ? v : null;
    } catch {
      return null;
    }
  },
  save: async (mode: 'light' | 'dark') => {
    try {
      await AsyncStorage.setItem(THEME_KEY, mode);
    } catch {
      /* ignore */
    }
  },
};
