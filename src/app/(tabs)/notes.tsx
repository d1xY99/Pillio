import { desc, eq } from 'drizzle-orm';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

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
import { getDb } from '@/db/client';
import { useLiveQuery } from '@/db/live';
import { notes } from '@/db/schema';
import { useCloudSlice } from '@/hooks/use-cloud-slice';
import { useTheme } from '@/hooks/use-theme';

export default function NotesScreen() {
  useCloudSlice('notes');
  const router = useRouter();
  const theme = useTheme();
  const [filter, setFilter] = useState<string>('all');

  const db = getDb();
  const { data: all = [] } = useLiveQuery(
    db
      .select()
      .from(notes)
      .where(eq(notes.archived, false))
      .orderBy(desc(notes.pinned), desc(notes.updatedAt)),
    [],
  );

  const filtered = filter === 'all' ? all : all.filter((note) => note.category === filter);
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

      <View style={styles.filters}>
        <FilterChip
          label="All"
          emoji="🗂️"
          count={all.length}
          active={filter === 'all'}
          onPress={() => setFilter('all')}
        />
        {NOTE_CATEGORIES.map((category) => (
          <FilterChip
            key={category.id}
            label={category.label}
            emoji={category.emoji}
            count={counts[category.id] ?? 0}
            active={filter === category.id}
            onPress={() => setFilter((current) => (current === category.id ? 'all' : category.id))}
          />
        ))}
      </View>

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

function FilterChip({
  label,
  emoji,
  count,
  active,
  onPress,
}: {
  label: string;
  emoji: string;
  count: number;
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
      <View style={[styles.count, { backgroundColor: active ? theme.accent : theme.surfaceRaised }]}>
        <ThemedText
          type="captionBold"
          style={{ color: active ? '#06110D' : theme.textTertiary, fontSize: 11 }}>
          {count}
        </ThemedText>
      </View>
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
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.four,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 7,
  },
  count: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
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
