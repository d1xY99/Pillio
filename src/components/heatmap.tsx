import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { HeatDay, HeatStatus } from '@/domain/adherence';
import { useTheme } from '@/hooks/use-theme';

const WEEK = 7;

export function Heatmap({ days }: { days: HeatDay[] }) {
  const theme = useTheme();
  const padded = padToWeeks(days);
  const weeks: HeatDay[][] = [];
  for (let i = 0; i < padded.length; i += WEEK) {
    weeks.push(padded.slice(i, i + WEEK));
  }

  const colorFor = (status: HeatStatus) => {
    switch (status) {
      case 'taken':
        return theme.accent;
      case 'missed':
        return theme.danger;
      case 'partial':
        return theme.warning;
      case 'pending':
        return theme.accentMuted;
      default:
        return theme.surfaceRaised;
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.grid}>
        {weeks.map((week, index) => (
          <View key={index} style={styles.week}>
            {week.map((day) => (
              <View
                key={day.dayStart}
                style={[styles.cell, { backgroundColor: colorFor(day.status) }]}
              />
            ))}
          </View>
        ))}
      </View>
      <View style={styles.legend}>
        <LegendDot color={theme.accent} label="Taken" />
        <LegendDot color={theme.warning} label="Partial" />
        <LegendDot color={theme.danger} label="Missed" />
      </View>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <ThemedText type="caption" themeColor="textTertiary">
        {label}
      </ThemedText>
    </View>
  );
}

function padToWeeks(days: HeatDay[]): HeatDay[] {
  if (days.length === 0) return days;
  const first = new Date(days[0].dayStart).getDay();
  const pad: HeatDay[] = Array.from({ length: first }, (_, index) => ({
    dayStart: days[0].dayStart - (first - index) * 24 * 60 * 60 * 1000,
    status: 'none',
  }));
  return [...pad, ...days];
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.two,
  },
  grid: {
    flexDirection: 'row',
    gap: 3,
  },
  week: {
    gap: 3,
  },
  cell: {
    width: 11,
    height: 11,
    borderRadius: 3,
  },
  legend: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
});
