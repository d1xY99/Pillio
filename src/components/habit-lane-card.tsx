import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ART } from '@/constants/art';
import { Radius } from '@/constants/theme';

export function HabitLaneCard({
  label,
  meta,
  source,
  selected,
  onPress,
  delay = 0,
}: {
  label: string;
  meta?: string;
  source: typeof ART.habitHero;
  selected?: boolean;
  onPress: () => void;
  delay?: number;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(500).springify()} style={styles.flex}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={{ selected: Boolean(selected) }}
        style={[styles.card, selected && styles.selected]}>
        <Image source={source} style={styles.image} contentFit="cover" />
        <LinearGradient colors={['transparent', 'rgba(6,7,8,0.9)']} style={StyleSheet.absoluteFill} />
        <View style={styles.copy}>
          <ThemedText type="captionBold" style={styles.label} numberOfLines={1}>
            {label}
          </ThemedText>
          {meta ? (
            <ThemedText type="caption" style={styles.meta} numberOfLines={1}>
              {meta}
            </ThemedText>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  card: {
    height: 124,
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selected: {
    borderColor: '#3EE0B7',
    shadowColor: '#3EE0B7',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  image: {
    ...StyleSheet.absoluteFill,
  },
  copy: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 2,
  },
  label: {
    color: '#F6FAF8',
    fontSize: 13,
  },
  meta: {
    color: 'rgba(244,247,245,0.7)',
    fontSize: 12,
  },
});
