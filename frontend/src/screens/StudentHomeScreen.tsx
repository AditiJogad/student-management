import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import LeaderboardList from '../components/LeaderboardList';

/** STUDENT: read-only. There is deliberately no award UI here, and the API rejects it with 403 anyway. */
export default function StudentHomeScreen() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: 12 }}>
      <LeaderboardList editable={false} />
    </View>
  );
}
