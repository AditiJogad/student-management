import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeContext';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { clearAuthError, register } from '../store/authSlice';
import AppButton from '../components/AppButton';
import AppInput from '../components/AppInput';
import type { AuthStackParamList } from '../navigation/RootNavigator';
import type { Role } from '../types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterScreen({ navigation }: NativeStackScreenProps<AuthStackParamList, 'Register'>) {
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((s) => s.auth);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('STUDENT');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const submit = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!EMAIL_RE.test(email.trim())) e.email = 'Enter a valid email';
    if (password.length < 6) e.password = 'At least 6 characters';
    setErrors(e);
    if (Object.keys(e).length) return;
    dispatch(register({ name, email, password, role }));
  };

  // server-side field errors (e.g. duplicate email) are shown inline too
  const field = (k: string) => errors[k] ?? error?.fieldErrors?.[k];

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: colors.text }]}>Create account</Text>

        <AppInput label="Full name" value={name} onChangeText={setName} error={field('name')} placeholder="Jane Doe" />
        <AppInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoCorrect={false}
          error={field('email')}
          placeholder="you@school.com"
        />
        <AppInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          error={field('password')}
          placeholder="Min. 6 characters"
        />

        <Text style={[styles.roleLabel, { color: colors.textMuted }]}>I am a</Text>
        <View style={styles.roleRow}>
          {(['STUDENT', 'TEACHER'] as Role[]).map((r) => {
            const active = role === r;
            return (
              <Pressable
                key={r}
                onPress={() => setRole(r)}
                style={[
                  styles.roleBtn,
                  {
                    backgroundColor: active ? colors.primary : colors.surface,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={{ fontWeight: '700', color: active ? colors.primaryText : colors.text }}>
                  {r === 'STUDENT' ? '🎒 Student' : '🧑‍🏫 Teacher'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {error && !error.fieldErrors && <Text style={[styles.error, { color: colors.danger }]}>{error.message}</Text>}

        <AppButton title="Sign up" onPress={submit} loading={loading} />
        <View style={{ height: 12 }} />
        <AppButton title="I already have an account" variant="secondary" onPress={() => navigation.goBack()} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 24 },
  roleLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  roleRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  roleBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  error: { marginBottom: 12, fontWeight: '600' },
});
