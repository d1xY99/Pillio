import { useEffect, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

export function InsulinSyringe({
  units,
  overfill = false,
}: {
  units: number;
  overfill?: boolean;
}) {
  const theme = useTheme();
  const [barrelW, setBarrelW] = useState(0);
  const drawn = Math.min(100, Math.max(0, units));
  const progress = useSharedValue(0);
  const fillColor = overfill ? theme.danger : theme.accent;

  useEffect(() => {
    progress.value = withSpring(drawn, { damping: 15, stiffness: 120, mass: 0.7 });
  }, [drawn, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: barrelW ? (progress.value / 100) * barrelW : 0,
  }));

  const markStyle = useAnimatedStyle(() => {
    const x = barrelW ? (progress.value / 100) * barrelW : 0;
    return { transform: [{ translateX: -x }] };
  });

  function onBarrel(event: LayoutChangeEvent) {
    setBarrelW(event.nativeEvent.layout.width);
  }

  const majors = barrelW > 260 ? [100, 80, 60, 40, 20, 0] : [100, 50, 0];
  const tickCount = 21;

  return (
    <View style={styles.wrap}>
      <View style={styles.scaleRow}>
        {majors.map((n) => (
          <ThemedText key={n} type="caption" themeColor="textTertiary" style={styles.scaleLabel}>
            {n}
          </ThemedText>
        ))}
      </View>

      <View style={styles.row}>
        <View style={styles.plunger}>
          <View style={[styles.thumb, { backgroundColor: theme.textSecondary }]} />
          <View style={[styles.rod, { backgroundColor: theme.textSecondary }]} />
        </View>

        <View
          onLayout={onBarrel}
          style={[
            styles.barrel,
            { borderColor: `${theme.text}22`, backgroundColor: theme.background },
          ]}>
          <Animated.View style={[styles.fill, { backgroundColor: `${fillColor}cc` }, fillStyle]}>
            <View style={[styles.stopper, { backgroundColor: fillColor }]} />
          </Animated.View>
          <View style={styles.tickLayer} pointerEvents="none">
            {Array.from({ length: tickCount }, (_, index) => {
              const major = index % 2 === 0;
              return (
                <View
                  key={index}
                  style={[
                    styles.tick,
                    {
                      height: major ? 12 : 7,
                      backgroundColor: major ? theme.textTertiary : theme.border,
                    },
                  ]}
                />
              );
            })}
          </View>
        </View>

        <View style={[styles.hub, { backgroundColor: fillColor }]} />
        <View style={[styles.needle, { backgroundColor: theme.textSecondary }]} />
      </View>

      <View style={styles.markTrack} pointerEvents="none">
        <Animated.View style={[styles.mark, markStyle]}>
          <View style={[styles.markLine, { backgroundColor: fillColor }]} />
          <ThemedText type="captionBold" style={[styles.markLabel, { color: fillColor }]}>
            {Math.round(drawn * 10) / 10} u
          </ThemedText>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 4,
    paddingTop: 4,
    paddingBottom: 8,
  },
  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 28,
    paddingRight: 36,
  },
  scaleLabel: {
    fontSize: 10,
    fontVariant: ['tabular-nums'],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
  },
  plunger: {
    width: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumb: {
    width: 16,
    height: 6,
    borderRadius: 2,
  },
  rod: {
    width: 5,
    height: 14,
    borderRadius: 1,
    marginTop: 1,
  },
  barrel: {
    flex: 1,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  fill: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  stopper: {
    width: 6,
    alignSelf: 'stretch',
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  tickLayer: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 4,
    paddingTop: 1,
  },
  tick: {
    width: 1,
  },
  hub: {
    width: 10,
    height: 12,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
    marginLeft: -1,
  },
  needle: {
    width: 22,
    height: 2,
    borderRadius: 1,
  },
  markTrack: {
    height: 28,
    marginLeft: 28,
    marginRight: 36,
    alignItems: 'flex-end',
  },
  mark: {
    alignItems: 'center',
    width: 36,
    marginRight: -18,
  },
  markLine: {
    width: 2,
    height: 10,
    borderRadius: 1,
  },
  markLabel: {
    fontSize: 11,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
});
