import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import LeaderboardList from '../components/LeaderboardList';

/** TEACHER: administrative view — tap a student to award / adjust points. */
export default function TeacherHomeScreen() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: 12 }}>
      <LeaderboardList editable />
    </View>
  );
}
