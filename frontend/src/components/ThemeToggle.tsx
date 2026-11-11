import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

/** Day / Night switch — lives in every screen header so the whole app restyles instantly. */
export default function ThemeToggle() {
  const { isDark, toggleTheme, colors } = useTheme();
  return (
    <View style={styles.row} accessibilityRole="switch" accessibilityLabel="Toggle dark mode">
      <Text style={{ fontSize: 16 }}>{isDark ? '🌙' : '☀️'}</Text>
      <Switch
        value={isDark}
        onValueChange={toggleTheme}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={isDark ? colors.primaryText : '#FFFFFF'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
