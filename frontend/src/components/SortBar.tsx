import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import type { Direction, SortBy } from '../types';

interface Props {
  sortBy: SortBy;
  direction: Direction;
  onChange: (sortBy: SortBy, direction: Direction) => void;
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { backgroundColor: active ? colors.primary : colors.surface, borderColor: active ? colors.primary : colors.border },
      ]}
    >
      <Text style={{ color: active ? colors.primaryText : colors.text, fontWeight: '600', fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

/** Server-side sort controls: the choice is sent to the API as sortBy/direction params. */
export default function SortBar({ sortBy, direction, onChange }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <Text style={{ color: colors.textMuted, fontSize: 13 }}>Sort:</Text>
      <Chip label="Points" active={sortBy === 'points'} onPress={() => onChange('points', direction)} />
      <Chip label="Name" active={sortBy === 'name'} onPress={() => onChange('name', direction)} />
      <View style={{ flex: 1 }} />
      <Chip
        label={direction === 'desc' ? '↓ Desc' : '↑ Asc'}
        active={false}
        onPress={() => onChange(sortBy, direction === 'desc' ? 'asc' : 'desc')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingBottom: 10 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
});
