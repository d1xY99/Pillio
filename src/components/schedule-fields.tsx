import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Switch, View } from 'react-native';

import { ChoiceChips } from '@/components/choice-chips';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { WebTimeInput } from '@/components/web-time-input';
import { Radius, Spacing } from '@/constants/theme';
import { SCHEDULE_FREQUENCIES, type ScheduleFrequency } from '@/db/types';
import {
  ALL_WEEKDAYS_MASK,
  hasWeekday,
  toggleWeekday,
  weekdayBit,
  WEEKDAY_LABELS,
  type ScheduleDraft,
} from '@/domain/schedule';
import { dateToMinutes, formatTimeMinutes, minutesToDate } from '@/domain/time';
import { useTheme } from '@/hooks/use-theme';
import { requestReminderPermission } from '@/notifications/permissions';

function toInputTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
    .toString()
    .padStart(2, '0');
  const mins = (minutes % 60).toString().padStart(2, '0');
  return `${hours}:${mins}`;
}

function fromInputTime(value: string): number {
  const [hours, minutes] = value.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

const FREQUENCY_LABELS: Record<ScheduleFrequency, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  every_n_days: 'Every N days',
  weekdays: 'Weekdays',
  cycle: 'On / off cycle',
};

export function ScheduleFields({
  value,
  onChange,
}: {
  value: ScheduleDraft;
  onChange: (next: ScheduleDraft) => void;
}) {
  const theme = useTheme();
  const [editingTime, setEditingTime] = useState<number | null>(null);

  function update(patch: Partial<ScheduleDraft>) {
    onChange({ ...value, ...patch });
  }

  return (
    <View style={styles.block}>
      <ThemedText type="headline">Schedule</ThemedText>

      <ThemedText type="captionBold" themeColor="textSecondary">
        Times
      </ThemedText>
      <View style={styles.times}>
        {value.times.map((minutes, index) => (
          <Pressable
            key={`${minutes}-${index}`}
            onPress={() => setEditingTime(index)}
            style={[styles.timeChip, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <ThemedText type="callout">{formatTimeMinutes(minutes)}</ThemedText>
          </Pressable>
        ))}
        <Pressable
          onPress={() => update({ times: [...value.times, 21 * 60] })}
          style={[styles.timeChip, { backgroundColor: theme.accentMuted, borderColor: theme.accent }]}>
          <ThemedText type="callout" themeColor="accent">
            Add time
          </ThemedText>
        </Pressable>
      </View>
      {value.times.length > 1 ? (
        <Pressable onPress={() => update({ times: value.times.slice(0, -1) })}>
          <ThemedText type="caption" themeColor="danger">
            Remove last time
          </ThemedText>
        </Pressable>
      ) : null}

      {editingTime !== null ? (
        <View>
          {Platform.OS === 'web' ? (
            <WebTimeInput
              value={toInputTime(value.times[editingTime] ?? 9 * 60)}
              color={theme.text}
              background={theme.surface}
              border={theme.border}
              onChange={(time) => {
                const next = [...value.times];
                next[editingTime] = fromInputTime(time);
                update({ times: next });
              }}
            />
          ) : (
            <DateTimePicker
              value={minutesToDate(value.times[editingTime] ?? 9 * 60)}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_, date) => {
                if (!date) {
                  if (Platform.OS === 'android') setEditingTime(null);
                  return;
                }
                const next = [...value.times];
                next[editingTime] = dateToMinutes(date);
                update({ times: next });
                if (Platform.OS === 'android') setEditingTime(null);
              }}
            />
          )}
          {Platform.OS === 'ios' || Platform.OS === 'web' ? (
            <Pressable onPress={() => setEditingTime(null)}>
              <ThemedText type="callout" themeColor="accent">
                Done
              </ThemedText>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <ThemedText type="captionBold" themeColor="textSecondary">
        Frequency
      </ThemedText>
      <ChoiceChips
        options={SCHEDULE_FREQUENCIES}
        value={value.frequency}
        labels={FREQUENCY_LABELS}
        onChange={(frequency) => {
          if (frequency === 'weekly' && (value.weekdaysMask === ALL_WEEKDAYS_MASK || !value.weekdaysMask)) {
            update({ frequency, weekdaysMask: weekdayBit(1) });
            return;
          }
          update({ frequency });
        }}
      />

      {value.frequency === 'every_n_days' ? (
        <TextField
          label="Interval (days)"
          value={String(value.intervalDays)}
          keyboardType="number-pad"
          onChangeText={(text) => update({ intervalDays: Math.max(1, Number(text) || 1) })}
        />
      ) : null}

      {value.frequency === 'weekly' || value.frequency === 'weekdays' ? (
        <View>
          <ThemedText type="captionBold" themeColor="textSecondary">
            {value.frequency === 'weekly' ? 'Day of week' : 'Days'}
          </ThemedText>
          <View style={styles.weekdays}>
            {WEEKDAY_LABELS.map((label, jsDay) => {
              const selected =
                value.frequency === 'weekly'
                  ? hasWeekday(value.weekdaysMask || weekdayBit(1), jsDay)
                  : hasWeekday(value.weekdaysMask || ALL_WEEKDAYS_MASK, jsDay);
              return (
                <Pressable
                  key={`${label}-${jsDay}`}
                  onPress={() =>
                    update({
                      weekdaysMask:
                        value.frequency === 'weekly'
                          ? weekdayBit(jsDay)
                          : toggleWeekday(value.weekdaysMask, jsDay),
                    })
                  }
                  style={[
                    styles.day,
                    {
                      backgroundColor: selected ? theme.accentMuted : theme.surface,
                      borderColor: selected ? theme.accent : theme.border,
                    },
                  ]}>
                  <ThemedText type="captionBold" style={{ color: selected ? theme.accent : theme.textSecondary }}>
                    {label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {value.frequency === 'cycle' ? (
        <View style={styles.row}>
          <View style={styles.flex}>
            <TextField
              label="Days on"
              value={String(value.cycleOnDays)}
              keyboardType="number-pad"
              onChangeText={(text) => update({ cycleOnDays: Math.max(1, Number(text) || 1) })}
            />
          </View>
          <View style={styles.flex}>
            <TextField
              label="Days off"
              value={String(value.cycleOffDays)}
              keyboardType="number-pad"
              onChangeText={(text) => update({ cycleOffDays: Math.max(0, Number(text) || 0) })}
            />
          </View>
        </View>
      ) : null}

      <View style={styles.reminder}>
        <View style={styles.flex}>
          <ThemedText type="body">Reminder</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            Notify at the due time only if this dose is still unchecked.
          </ThemedText>
        </View>
        <Switch
          value={value.reminderEnabled}
          onValueChange={(reminderEnabled) => {
            if (!reminderEnabled) {
              update({ reminderEnabled: false });
              return;
            }
            void requestReminderPermission().then((granted) => {
              update({ reminderEnabled: granted });
            });
          }}
          trackColor={{ true: theme.accent, false: theme.border }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: Spacing.three,
  },
  times: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  timeChip: {
    borderRadius: Radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  weekdays: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  day: {
    flex: 1,
    height: 36,
    borderRadius: Radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
  },
  reminder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
});
