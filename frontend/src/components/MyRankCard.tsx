import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import type { LeaderboardEntry } from '../types';

/** Student-only summary: personal score + standing among all peers. */
export default function MyRankCard({ entry, total }: { entry: LeaderboardEntry | null; total: number }) {
  const { colors } = useTheme();
  if (!entry) return null;
  return (
    <View style={[styles.card, { backgroundColor: colors.primary }]}>
      <View style={styles.col}>
        <Text style={[styles.label, { color: colors.primaryText }]}>YOUR RANK</Text>
        <Text style={[styles.big, { color: colors.primaryText }]}>
          #{entry.rank}
          <Text style={styles.small}> / {total}</Text>
        </Text>
      </View>
      <View style={[styles.divider, { backgroundColor: colors.primaryText }]} />
      <View style={styles.col}>
        <Text style={[styles.label, { color: colors.primaryText }]}>YOUR POINTS</Text>
        <Text style={[styles.big, { color: colors.primaryText }]}>{entry.points}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, padding: 16, borderRadius: 18 },
  col: { flex: 1, alignItems: 'center' },
  divider: { width: 1, opacity: 0.3, marginHorizontal: 8 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 1, opacity: 0.85 },
  big: { fontSize: 32, fontWeight: '800', marginTop: 4 },
  small: { fontSize: 16, fontWeight: '600', opacity: 0.8 },
});
