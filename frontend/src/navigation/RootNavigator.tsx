import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { DarkTheme, DefaultTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeContext';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logout } from '../store/authSlice';
import ThemeToggle from '../components/ThemeToggle';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import StudentHomeScreen from '../screens/StudentHomeScreen';
import TeacherHomeScreen from '../screens/TeacherHomeScreen';

export type AuthStackParamList = { Login: undefined; Register: undefined };
export type StudentStackParamList = { StudentHome: undefined };
export type TeacherStackParamList = { TeacherHome: undefined };

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const StudentStack = createNativeStackNavigator<StudentStackParamList>();
const TeacherStack = createNativeStackNavigator<TeacherStackParamList>();

function LogoutButton() {
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  return (
    <Pressable onPress={() => dispatch(logout())} hitSlop={8}>
      <Text style={{ color: colors.danger, fontWeight: '700' }}>Logout</Text>
    </Pressable>
  );
}

function HeaderRight() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      <ThemeToggle />
      <LogoutButton />
    </View>
  );
}

export default function RootNavigator() {
  const { colors, isDark } = useTheme();
  const { bootstrapped, token, user } = useAppSelector((s) => s.auth);

  const navTheme: Theme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
    },
  };

  const screenOptions = {
    headerStyle: { backgroundColor: colors.surface },
    headerTintColor: colors.text,
    headerTitleStyle: { fontWeight: '800' as const },
    contentStyle: { backgroundColor: colors.background },
  };

  // Wait for the persisted session to be restored/validated before choosing a stack (no login-screen flash).
  if (!bootstrapped) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      {/*
        Route protection: each stack only exists for the matching auth state / role, so a student
        has no route to teacher screens and a logged-out user has no route to any protected screen.
      */}
      {!token || !user ? (
        <AuthStack.Navigator screenOptions={{ ...screenOptions, headerRight: () => <ThemeToggle /> }}>
          <AuthStack.Screen name="Login" component={LoginScreen} options={{ title: 'Sign in' }} />
          <AuthStack.Screen name="Register" component={RegisterScreen} options={{ title: 'Sign up' }} />
        </AuthStack.Navigator>
      ) : user.role === 'TEACHER' ? (
        <TeacherStack.Navigator screenOptions={{ ...screenOptions, headerRight: () => <HeaderRight /> }}>
          <TeacherStack.Screen name="TeacherHome" component={TeacherHomeScreen} options={{ title: 'Manage Points' }} />
        </TeacherStack.Navigator>
      ) : (
        <StudentStack.Navigator screenOptions={{ ...screenOptions, headerRight: () => <HeaderRight /> }}>
          <StudentStack.Screen name="StudentHome" component={StudentHomeScreen} options={{ title: 'Leaderboard' }} />
        </StudentStack.Navigator>
      )}
    </NavigationContainer>
  );
}
