import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Kicker } from '@/components/kicker';
import { ThemedText } from '@/components/themed-text';
import { ART } from '@/constants/art';
import { Radius, Spacing } from '@/constants/theme';

export function HeroBanner({
  kicker,
  title,
  body,
  source,
  compact = true,
}: {
  kicker?: string;
  title: string;
  body?: string;
  source?: typeof ART.hero;
  compact?: boolean;
}) {
  return (
    <Animated.View
      entering={FadeIn.duration(800)}
      style={[styles.wrap, compact ? styles.wrapCompact : styles.wrapTall]}>
      <Image source={source ?? ART.hero} style={styles.image} contentFit="cover" />
      <LinearGradient
        colors={['rgba(6,7,8,0.2)', 'rgba(6,7,8,0.72)']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.edge} />
      <View style={[styles.copy, compact && styles.copyCompact]}>
        {kicker ? <Kicker label={kicker} /> : null}
        <ThemedText type={compact ? 'headline' : 'title'} style={styles.title} numberOfLines={1}>
          {title}
        </ThemedText>
        {body && !compact ? (
          <ThemedText type="callout" style={styles.body}>
            {body}
          </ThemedText>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  wrapCompact: {
    height: 88,
  },
  wrapTall: {
    height: 168,
  },
  image: {
    ...StyleSheet.absoluteFill,
    transform: [{ scale: 1.04 }],
  },
  edge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(62,224,183,0.35)',
  },
  copy: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: Spacing.four,
    gap: 8,
  },
  copyCompact: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: 6,
    justifyContent: 'center',
  },
  title: {
    color: '#F6FAF8',
    letterSpacing: -0.8,
  },
  body: {
    color: 'rgba(244,247,245,0.72)',
    maxWidth: 340,
  },
});
