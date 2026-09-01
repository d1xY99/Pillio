import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { HABIT_CATEGORIES, HABIT_COLORS, HABIT_EMOJIS, habitCategoryArt } from '@/constants/habits';
import { Radius, Spacing } from '@/constants/theme';
import { createHabit, getHabit, updateHabit } from '@/db/queries/habits';
import { ensureHabitLogs } from '@/domain/habits';
import { useTheme } from '@/hooks/use-theme';

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
    };
    if (existing) updateHabit(existing.id, input);
    else createHabit(input);
    ensureHabitLogs(1);
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
          {HABIT_CATEGORIES.map((item) => {
            const active = item.id === category;
            return (
              <Pressable
                key={item.id}
                onPress={() => {
                  setCategory(item.id);
                  setColor(HABIT_COLORS[HABIT_CATEGORIES.findIndex((row) => row.id === item.id)] ?? color);
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.three,
  },
  catCard: {
    width: '31%',
    minWidth: 96,
    flexGrow: 1,
    height: 88,
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    justifyContent: 'flex-end',
    padding: 8,
  },
  catLabel: { color: '#F6FAF8' },
  catKicker: { color: 'rgba(244,247,245,0.65)' },
});
