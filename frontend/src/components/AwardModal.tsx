import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import AppButton from './AppButton';
import AppInput from './AppInput';
import type { ApiError, LeaderboardEntry } from '../types';

interface Props {
  student: LeaderboardEntry | null;
  submitting: boolean;
  error: ApiError | null;
  onClose: () => void;
  onSubmit: (points: number) => void;
}

const QUICK = [5, 10, 20, -5];

export default function AwardModal({ student, submitting, error, onClose, onSubmit }: Props) {
  const { colors } = useTheme();
  const [value, setValue] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setValue('');
    setLocalError(null);
  }, [student?.studentId]);

  const submit = () => {
    const n = Number(value);
    if (!value.trim() || !Number.isInteger(n) || n === 0) {
      setLocalError('Enter a whole number other than 0 (negative to deduct).');
      return;
    }
    if (Math.abs(n) > 1000) {
      setLocalError('Points must be between -1000 and 1000.');
      return;
    }
    setLocalError(null);
    onSubmit(n);
  };

  return (
    <Modal visible={!!student} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.backdrop, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.text }]}>Award points</Text>
          {student && (
            <Text style={{ color: colors.textMuted, marginBottom: 14 }}>
              {student.name} · currently {student.points} pts (rank #{student.rank})
            </Text>
          )}

          <View style={styles.quickRow}>
            {QUICK.map((q) => (
              <Pressable
                key={q}
                onPress={() => setValue(String(q))}
                style={[
                  styles.quick,
                  {
                    backgroundColor: value === String(q) ? colors.primary : colors.surfaceAlt,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={{
                    fontWeight: '700',
                    color: value === String(q) ? colors.primaryText : q < 0 ? colors.danger : colors.text,
                  }}
                >
                  {q > 0 ? `+${q}` : q}
                </Text>
              </Pressable>
            ))}
          </View>

          <AppInput
            label="Custom points (negative to deduct)"
            value={value}
            onChangeText={setValue}
            keyboardType="numbers-and-punctuation"
            placeholder="e.g. 15"
            error={localError ?? error?.message}
          />

          <View style={styles.actions}>
            <AppButton title="Cancel" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
            <AppButton title="Submit" onPress={submit} loading={submitting} style={{ flex: 1 }} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: { padding: 20, paddingBottom: 32, borderTopLeftRadius: 22, borderTopRightRadius: 22 },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  quickRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  quick: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 4 },
});
