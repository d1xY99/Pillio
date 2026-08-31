import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { TYPE_ART } from '@/constants/art';
import { TYPE_LABELS } from '@/constants/catalog';
import { Radius, Spacing } from '@/constants/theme';
import type { SupplementType } from '@/db/types';

export function TypeArtCard({
  type,
  selected,
  onPress,
  delay = 0,
}: {
  type: SupplementType;
  selected?: boolean;
  onPress?: () => void;
  delay?: number;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(500).springify()}
      style={styles.flex}>
      <Pressable
        onPress={onPress}
        style={[styles.card, selected && styles.selected]}>
        <Image source={TYPE_ART[type]} style={styles.image} contentFit="cover" />
        <LinearGradient
          colors={['transparent', 'rgba(11,13,16,0.92)']}
          style={styles.fade}
        />
        <View style={styles.label}>
          <ThemedText type="captionBold">{TYPE_LABELS[type]}</ThemedText>
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
    height: 116,
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selected: {
    borderColor: '#3EE0B7',
  },
  image: {
    ...StyleSheet.absoluteFill,
  },
  fade: {
    ...StyleSheet.absoluteFill,
  },
  label: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: Spacing.two,
  },
});
