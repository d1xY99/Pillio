import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { FadeIn as FadeBlock } from '@/components/fade-in';
import { MenuButton } from '@/components/menu-button';
import { NoteCard } from '@/components/note-card';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { UiIcon } from '@/components/ui-icon';
import { NOTE_CATEGORIES } from '@/constants/notes';
import { Radius, Spacing } from '@/constants/theme';
import { subscribeDb } from '@/db/events';
import { listNotes } from '@/db/queries/notes';
import { useCloudSlice } from '@/hooks/use-cloud-slice';
import { useTheme } from '@/hooks/use-theme';

export default function NotesScreen() {
  useCloudSlice('notes');
  const router = useRouter();
  const theme = useTheme();
  const [tick, setTick] = useState(0);
  const [filter, setFilter] = useState<string>('all');

  useFocusEffect(
    useCallback(() => {
      setTick((value) => value + 1);
    }, []),
  );

  useLayoutEffect(
    () =>
      subscribeDb(() => {
        setTick((value) => value + 1);
      }),
    [],
  );

  const all = useMemo(() => {
    try {
      return listNotes(false);
    } catch {
      return [];
    }
  }, [tick]);
  const filtered = filter === 'all' ? all : all.filter((note) => note.category === filter);
  const pinnedCount = all.filter((note) => note.pinned).length;
  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const note of all) map[note.category] = (map[note.category] ?? 0) + 1;
    return map;
  }, [all]);

  const listLabel =
    filter === 'all' ? 'All notes' : (NOTE_CATEGORIES.find((row) => row.id === filter)?.label ?? 'Notes');

  return (
    <Screen>
      <ScreenHeader
        title="Notes"
        subtitle="Notebook"
        right={
          <View style={styles.headerActions}>
            <MenuButton />
            <Pressable
              onPress={() => router.push('/note/form')}
              style={[styles.add, { backgroundColor: theme.accent }]}
              accessibilityLabel="Add note">
              <UiIcon name="plus" color="#06110D" size={14} />
            </Pressable>
          </View>
        }
      />

      <View style={styles.stats}>
        <Stat value={all.length} label="notes" />
        <View style={[styles.rule, { backgroundColor: theme.border }]} />
        <Stat value={pinnedCount} label="pinned" />
        <View style={[styles.rule, { backgroundColor: theme.border }]} />
        <Stat value={Object.keys(counts).length} label="categories" />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}>
        <Chip
          label="All"
          emoji="🗂️"
          active={filter === 'all'}
          onPress={() => setFilter('all')}
        />
        {NOTE_CATEGORIES.map((category) => (
          <Chip
            key={category.id}
            label={category.label}
            emoji={category.emoji}
            active={filter === category.id}
            onPress={() => setFilter((current) => (current === category.id ? 'all' : category.id))}
          />
        ))}
      </ScrollView>

      <View style={styles.sectionHead}>
        <ThemedText type="captionBold" themeColor="textTertiary" style={styles.sectionKicker}>
          {listLabel.toUpperCase()}
        </ThemedText>
        <ThemedText type="caption" themeColor="textTertiary">
          {filtered.length}
        </ThemedText>
      </View>

      {filtered.length === 0 ? (
        <FadeBlock delay={80}>
          <EmptyState
            icon="note.text"
            title={all.length ? 'Nothing in this category' : 'No notes yet'}
            body={
              all.length
                ? 'Try another category, or jot down something new.'
                : 'Capture a thought, a protocol, or a reminder. Give it a category to keep it tidy.'
            }
            actionLabel={all.length ? undefined : 'Write a note'}
            onAction={all.length ? undefined : () => router.push('/note/form')}
          />
        </FadeBlock>
      ) : (
        <View style={styles.list}>
          {filtered.map((note, index) => (
            <NoteCard
              key={note.id}
              note={note}
              index={index}
              onPress={() => router.push({ pathname: '/note/[id]', params: { id: note.id } })}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <ThemedText type="headline">{value}</ThemedText>
      <ThemedText type="caption" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

function Chip({
  label,
  emoji,
  active,
  onPress,
}: {
  label: string;
  emoji: string;
  active: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? theme.accentMuted : theme.surface,
          borderColor: active ? theme.accent : theme.border,
        },
      ]}>
      <ThemedText type="captionBold" style={{ color: active ? theme.accent : theme.textSecondary }}>
        {emoji} {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  add: {
    width: 42,
    height: 42,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
    marginBottom: Spacing.three,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  rule: {
    width: 1,
    height: 26,
  },
  chips: {
    gap: 8,
    paddingBottom: Spacing.one,
    marginBottom: Spacing.four,
  },
  chip: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  sectionKicker: {
    letterSpacing: 1.6,
    fontSize: 11,
  },
  list: {
    gap: Spacing.three,
    paddingBottom: Spacing.four,
  },
});
