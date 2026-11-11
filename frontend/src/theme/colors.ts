export type ThemeMode = 'light' | 'dark';

export interface Palette {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  primary: string;
  primaryText: string;
  border: string;
  danger: string;
  success: string;
  highlight: string;
  gold: string;
  silver: string;
  bronze: string;
}

export const lightPalette: Palette = {
  background: '#F3F5F9',
  surface: '#FFFFFF',
  surfaceAlt: '#E9EDF5',
  text: '#14213D',
  textMuted: '#667085',
  primary: '#3B5BDB',
  primaryText: '#FFFFFF',
  border: '#D5DBE8',
  danger: '#D6336C',
  success: '#2F9E44',
  highlight: '#E7EDFF',
  gold: '#E8B100',
  silver: '#9AA5B1',
  bronze: '#C07A3F',
};

export const darkPalette: Palette = {
  background: '#0E1320',
  surface: '#171E30',
  surfaceAlt: '#222B42',
  text: '#EEF1F8',
  textMuted: '#9AA5BC',
  primary: '#7C95FF',
  primaryText: '#0E1320',
  border: '#2B3550',
  danger: '#FF6B9A',
  success: '#51CF66',
  highlight: '#26335C',
  gold: '#F5C518',
  silver: '#B8C2CF',
  bronze: '#D99A5E',
};
