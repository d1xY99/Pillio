import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ART } from '@/constants/art';
import { Radius, Spacing } from '@/constants/theme';

export function HeroBanner({
  kicker,
  title,
  body,
  source,
}: {
  kicker?: string;
  title: string;
  body?: string;
  source?: typeof ART.hero;
}) {
  return (
    <Animated.View entering={FadeIn.duration(700)} style={styles.wrap}>
      <Image source={source ?? ART.hero} style={styles.image} contentFit="cover" />
      <LinearGradient
        colors={['rgba(11,13,16,0.15)', 'rgba(11,13,16,0.82)']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.copy}>
        {kicker ? (
          <ThemedText type="captionBold" themeColor="accent">
            {kicker}
          </ThemedText>
        ) : null}
        <ThemedText type="headline" style={styles.title}>
          {title}
        </ThemedText>
        {body ? (
          <ThemedText type="callout" themeColor="textSecondary">
            {body}
          </ThemedText>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 168,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.four,
  },
  image: {
    ...StyleSheet.absoluteFill,
  },
  copy: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: Spacing.three,
    gap: 4,
  },
  title: {
    color: '#F4F7F5',
  },
});
