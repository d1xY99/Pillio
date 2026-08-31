import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useTheme() {
  const scheme = useColorScheme();
  return Colors[scheme === 'light' ? 'light' : 'dark'];
}

export function useThemeName() {
  const scheme = useColorScheme();
  return scheme === 'light' ? 'light' : 'dark';
}
