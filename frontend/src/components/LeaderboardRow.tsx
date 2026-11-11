import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import type { LeaderboardEntry } from '../types';

interface Props {
  entry: LeaderboardEntry;
  isMe: boolean;
  /** teachers can tap a row to open the award dialog; students get a static row */
  onPress?: () => void;
}

function RankBadge({ rank }: { rank: number }) {
  const { colors } = useTheme();
  const medal = rank === 1 ? colors.gold : rank === 2 ? colors.silver : rank === 3 ? colors.bronze : null;
  return (
    <View style={[styles.badge, { backgroundColor: medal ?? colors.surfaceAlt }]}>
      <Text style={[styles.badgeText, { color: medal ? '#1A1A1A' : colors.text }]}>{rank}</Text>
    </View>
  );
}

function LeaderboardRow({ entry, isMe, onPress }: Props) {
  const { colors } = useTheme();
  const content = (
    <>
      <RankBadge rank={entry.rank} />
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {entry.name}
          {isMe ? '  (You)' : ''}
        </Text>
        <Text style={[styles.email, { color: colors.textMuted }]} numberOfLines={1}>
          {entry.email}
        </Text>
      </View>
      <View style={styles.pointsBox}>
        <Text style={[styles.points, { color: colors.primary }]}>{entry.points}</Text>
        <Text style={[styles.pts, { color: colors.textMuted }]}>pts</Text>
      </View>
    </>
  );

  const containerStyle = [
    styles.row,
    {
      backgroundColor: isMe ? colors.highlight : colors.surface,
      borderColor: isMe ? colors.primary : colors.border,
    },
  ];

  if (!onPress) return <View style={containerStyle}>{content}</View>;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [...containerStyle, { opacity: pressed ? 0.8 : 1 }]}>
      {content}
    </Pressable>
  );
}

export default React.memo(LeaderboardRow);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  badge: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontWeight: '800', fontSize: 15 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700' },
  email: { fontSize: 12, marginTop: 2 },
  pointsBox: { alignItems: 'flex-end' },
  points: { fontSize: 20, fontWeight: '800' },
  pts: { fontSize: 11 },
});
