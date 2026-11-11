import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeContext';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { clearAuthError, login } from '../store/authSlice';
import AppButton from '../components/AppButton';
import AppInput from '../components/AppInput';
import type { AuthStackParamList } from '../navigation/RootNavigator';

export default function LoginScreen({ navigation }: NativeStackScreenProps<AuthStackParamList, 'Login'>) {
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((s) => s.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const submit = () => {
    if (!email.trim() || !password) {
      setLocalError('Enter your email and password');
      return;
    }
    setLocalError(null);
    dispatch(login({ email, password }));
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={[styles.logo]}>🎓</Text>
        <Text style={[styles.title, { color: colors.text }]}>Welcome back</Text>
        <Text style={[styles.sub, { color: colors.textMuted }]}>Sign in to see the leaderboard</Text>

        <AppInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoCorrect={false}
          placeholder="you@school.com"
        />
        <AppInput label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" />

        {(localError || error) && (
          <Text style={[styles.error, { color: colors.danger }]}>{localError ?? error?.message}</Text>
        )}

        <AppButton title="Sign in" onPress={submit} loading={loading} />
        <View style={{ height: 12 }} />
        <AppButton title="Create an account" variant="secondary" onPress={() => navigation.navigate('Register')} />
        <Text style={[styles.demo, { color: colors.textMuted }]}>
          Demo: teacher@school.com or aarav@school.com · password123
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 40 },
  logo: { fontSize: 52, textAlign: 'center' },
  title: { fontSize: 28, fontWeight: '800', textAlign: 'center', marginTop: 8 },
  sub: { textAlign: 'center', marginBottom: 28, marginTop: 4 },
  error: { marginBottom: 12, fontWeight: '600' },
  demo: { textAlign: 'center', marginTop: 24, fontSize: 12 },
});
