import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'display' | 'title' | 'headline' | 'body' | 'callout' | 'caption' | 'captionBold';
  themeColor?: ThemeColor;
};

export function ThemedText({
  style,
  type = 'body',
  themeColor,
  ...rest
}: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        styles[type],
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  display: {
    fontSize: 38,
    lineHeight: 42,
    fontWeight: '700',
    letterSpacing: -1.2,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  headline: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
  },
  callout: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500',
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  captionBold: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  mono: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: '700' }) ?? '500',
    fontSize: 12,
  },
});
