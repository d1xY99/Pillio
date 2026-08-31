import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#111418',
    textSecondary: '#5C6570',
    textTertiary: '#8A939E',
    background: '#F3F5F7',
    surface: '#FFFFFF',
    surfaceRaised: '#FFFFFF',
    border: '#E6EAEE',
    accent: '#0F9F7E',
    accentMuted: '#D8F6ED',
    danger: '#E5484D',
    warning: '#D97706',
    overlay: 'rgba(11,13,16,0.45)',
    tabBar: '#FFFFFF',
    tabBarBorder: '#E6EAEE',
    vitamin: '#6D5EF6',
    peptide: '#C9852A',
    supplement: '#0F9F7E',
  },
  dark: {
    text: '#F6FAF8',
    textSecondary: '#9AA3AB',
    textTertiary: '#6E777F',
    background: '#060708',
    surface: 'rgba(18,21,26,0.88)',
    surfaceRaised: '#1A1F26',
    border: 'rgba(255,255,255,0.08)',
    accent: '#3EE0B7',
    accentMuted: '#102820',
    danger: '#FF6B6B',
    warning: '#F5C14C',
    overlay: 'rgba(0,0,0,0.55)',
    tabBar: 'rgba(8,10,12,0.92)',
    tabBarBorder: 'transparent',
    vitamin: '#C4B5FD',
    peptide: '#F5C14C',
    supplement: '#3EE0B7',
  },
} as const;

export type ColorSchemeName = keyof typeof Colors;
export type ThemeColor = keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 48,
} as const;

export const Radius = {
  sm: 10,
  md: 16,
  lg: 20,
  xl: 28,
  full: 999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
