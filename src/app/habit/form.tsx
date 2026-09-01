import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { WebTimeInput } from '@/components/web-time-input';
import { HABIT_CATEGORIES, HABIT_COLORS, HABIT_EMOJIS, habitCategoryArt } from '@/constants/habits';
import { Radius, Spacing } from '@/constants/theme';
import { notifyDbChanged } from '@/db/events';
import { createHabit, getHabit, updateHabit } from '@/db/queries/habits';
import { ensureHabitLogs } from '@/domain/habits';
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

const WEEKDAYS = [
  { bit: 1 << 1, label: 'M' },
  { bit: 1 << 2, label: 'T' },
  { bit: 1 << 3, label: 'W' },
  { bit: 1 << 4, label: 'T' },
  { bit: 1 << 5, label: 'F' },
  { bit: 1 << 6, label: 'S' },
  { bit: 1 << 0, label: 'S' },
];

export default function HabitFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = id ? getHabit(id) : undefined;
  const router = useRouter();
  const navigation = useNavigation();
  const theme = useTheme();
  const [name, setName] = useState(existing?.name ?? '');
  const [emoji, setEmoji] = useState(existing?.emoji ?? '💧');
  const [color, setColor] = useState(existing?.color ?? HABIT_COLORS[0]);
  const [category, setCategory] = useState(existing?.category ?? 'health');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [frequency, setFrequency] = useState(existing?.frequency ?? 'daily');
  const [weekdaysMask, setWeekdaysMask] = useState(existing?.weekdaysMask ?? 0b0111110);
  const [timesPerDay, setTimesPerDay] = useState(existing?.timesPerDay ?? 1);
  const [reminderEnabled, setReminderEnabled] = useState(existing?.reminderEnabled !== false);
  const [reminderMinutes, setReminderMinutes] = useState(existing?.reminderMinutes ?? 9 * 60);
  const [editingTime, setEditingTime] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    navigation.setOptions({ title: existing ? 'Edit habit' : 'New habit' });
  }, [existing, navigation]);

  function save() {
    if (!name.trim()) {
      setError('Give it a name.');
      return;
    }
    const input = {
      name,
      emoji,
      color,
      category,
      notes,
      frequency,
      weekdaysMask: frequency === 'weekly' ? weekdaysMask : null,
      timesPerDay,
      reminderEnabled,
      reminderMinutes,
    };
    if (existing) updateHabit(existing.id, input);
    else createHabit(input);
    ensureHabitLogs(1);
    notifyDbChanged();
    router.back();
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <TextField label="Name" value={name} onChangeText={setName} placeholder="Drink water" autoFocus />

        <ThemedText type="captionBold" themeColor="textSecondary">
          Icon
        </ThemedText>
        <View style={styles.wrap}>
          {HABIT_EMOJIS.map((item) => {
            const active = item === emoji;
            return (
              <Pressable
                key={item}
                onPress={() => setEmoji(item)}
                style={[
                  styles.emoji,
                  { borderColor: active ? theme.accent : theme.border, backgroundColor: active ? theme.accentMuted : theme.surface },
                ]}>
                <Text style={{ fontSize: 20 }}>{item}</Text>
              </Pressable>
            );
          })}
        </View>

        <ThemedText type="captionBold" themeColor="textSecondary">
          Color
        </ThemedText>
        <View style={styles.row}>
          {HABIT_COLORS.map((item) => (
            <Pressable
              key={item}
              onPress={() => setColor(item)}
              style={[
                styles.swatch,
                { backgroundColor: item, borderColor: item === color ? theme.text : 'transparent', borderWidth: item === color ? 2 : 0 },
              ]}
            />
          ))}
        </View>

        <ThemedText type="captionBold" themeColor="textSecondary">
          Category
        </ThemedText>
        <View style={styles.catGrid}>
          {[HABIT_CATEGORIES.slice(0, 3), HABIT_CATEGORIES.slice(3, 6)].map((row) => (
            <View key={row.map((item) => item.id).join('-')} style={styles.catRow}>
              {row.map((item) => {
                const active = item.id === category;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      setCategory(item.id);
                      setColor(HABIT_COLORS[HABIT_CATEGORIES.findIndex((cat) => cat.id === item.id)] ?? color);
                    }}
                    style={[styles.catCard, active && { borderColor: theme.accent }]}>
                    <Image source={habitCategoryArt(item.id)} style={StyleSheet.absoluteFill} contentFit="cover" />
                    <LinearGradient colors={['transparent', 'rgba(6,7,8,0.92)']} style={StyleSheet.absoluteFill} />
                    <ThemedText type="captionBold" style={styles.catLabel}>
                      {item.label}
                    </ThemedText>
                    <ThemedText type="caption" style={styles.catKicker}>
                      {item.kicker}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        <ThemedText type="captionBold" themeColor="textSecondary">
          When
        </ThemedText>
        <View style={styles.row}>
          {[
            { id: 'daily', label: 'Every day' },
            { id: 'weekdays', label: 'Weekdays' },
            { id: 'weekly', label: 'Pick days' },
          ].map((item) => {
            const active = frequency === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setFrequency(item.id)}
                style={[
                  styles.chip,
                  { backgroundColor: active ? theme.accentMuted : theme.surface, borderColor: active ? theme.accent : theme.border },
                ]}>
                <ThemedText type="captionBold" style={{ color: active ? theme.accent : theme.textSecondary }}>
                  {item.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
        {frequency === 'weekly' ? (
          <View style={styles.row}>
            {WEEKDAYS.map((day) => {
              const on = (weekdaysMask & day.bit) !== 0;
              return (
                <Pressable
                  key={day.bit + day.label}
                  onPress={() => setWeekdaysMask((mask) => (on ? mask & ~day.bit : mask | day.bit))}
                  style={[
                    styles.day,
                    { backgroundColor: on ? theme.accent : theme.surface, borderColor: on ? theme.accent : theme.border },
                  ]}>
                  <ThemedText type="captionBold" style={{ color: on ? '#06110D' : theme.textSecondary }}>
                    {day.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <ThemedText type="captionBold" themeColor="textSecondary">
          Times per day
        </ThemedText>
        <View style={styles.row}>
          {[1, 2, 3, 4, 5].map((n) => {
            const active = timesPerDay === n;
            return (
              <Pressable
                key={n}
                onPress={() => setTimesPerDay(n)}
                style={[
                  styles.day,
                  { backgroundColor: active ? theme.accent : theme.surface, borderColor: active ? theme.accent : theme.border },
                ]}>
                <ThemedText type="captionBold" style={{ color: active ? '#06110D' : theme.textSecondary }}>
                  {n}×
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.reminder}>
          <View style={styles.reminderCopy}>
            <ThemedText type="body">Reminder</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              Ping at this time if still open. Same ntfy topic as doses.
            </ThemedText>
          </View>
          <Switch
            value={reminderEnabled}
            onValueChange={(next) => {
              setReminderEnabled(next);
              if (next) void requestReminderPermission();
            }}
            trackColor={{ false: theme.border, true: theme.accent }}
            thumbColor="#F6FAF8"
          />
        </View>
        {reminderEnabled ? (
          <View style={styles.timeBlock}>
            {Platform.OS === 'web' ? (
              <WebTimeInput
                value={toInputTime(reminderMinutes)}
                color={theme.text}
                background={theme.surface}
                border={theme.border}
                onChange={(time) => setReminderMinutes(fromInputTime(time))}
              />
            ) : (
              <>
                <Pressable
                  onPress={() => setEditingTime(true)}
                  style={[styles.timeChip, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <ThemedText type="callout">{formatTimeMinutes(reminderMinutes)}</ThemedText>
                </Pressable>
                {editingTime ? (
                  <DateTimePicker
                    value={minutesToDate(reminderMinutes)}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(_, date) => {
                      if (!date) {
                        if (Platform.OS === 'android') setEditingTime(false);
                        return;
                      }
                      setReminderMinutes(dateToMinutes(date));
                      if (Platform.OS === 'android') setEditingTime(false);
                    }}
                  />
                ) : null}
                {editingTime && Platform.OS === 'ios' ? (
                  <Pressable onPress={() => setEditingTime(false)}>
                    <ThemedText type="callout" themeColor="accent">
                      Done
                    </ThemedText>
                  </Pressable>
                ) : null}
              </>
            )}
          </View>
        ) : null}

        <TextField label="Notes" value={notes} onChangeText={setNotes} placeholder="Optional" multiline />
        {error ? (
          <ThemedText type="callout" themeColor="danger">
            {error}
          </ThemedText>
        ) : null}
        <Button label={existing ? 'Save habit' : 'Add habit'} onPress={save} />
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.three,
  },
  emoji: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  chip: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  day: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catGrid: {
    gap: 10,
    marginBottom: Spacing.four,
  },
  catRow: {
    flexDirection: 'row',
    gap: 10,
  },
  catCard: {
    flex: 1,
    height: 124,
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  catLabel: { color: '#F6FAF8' },
  catKicker: { color: 'rgba(244,247,245,0.65)' },
  reminder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginBottom: Spacing.three,
  },
  reminderCopy: {
    flex: 1,
    gap: 4,
  },
  timeBlock: {
    marginBottom: Spacing.three,
    gap: 8,
  },
  timeChip: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
});
