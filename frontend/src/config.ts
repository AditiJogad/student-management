import { Platform } from 'react-native';
import Constants from 'expo-constants';

const PORT = 8080;

/**
 * Resolution order:
 *  1. EXPO_PUBLIC_API_URL (explicit, e.g. http://192.168.1.10:8080 or an ngrok tunnel URL)
 *  2. The host Expo's dev server runs on (works for a phone on the same Wi-Fi, zero config)
 *  3. Android emulator loopback alias / localhost
 */
function resolveBaseUrl(): string {
  const explicit = process.env.EXPO_PUBLIC_API_URL;
  if (explicit) return explicit.replace(/\/+$/, '');

  const hostUri = Constants.expoConfig?.hostUri; // e.g. "192.168.1.10:8081"
  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:${PORT}`;
  }
  return Platform.OS === 'android' ? `http://10.0.2.2:${PORT}` : `http://localhost:${PORT}`;
}

export const API_BASE_URL = resolveBaseUrl();
