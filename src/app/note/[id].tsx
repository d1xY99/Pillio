import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { UiIcon } from '@/components/ui-icon';
import { noteCategory } from '@/constants/notes';
import { Radius, Spacing } from '@/constants/theme';
import { deleteNote, getNote, setNoteArchived, setNotePinned } from '@/db/queries/notes';
import { formatDateTime } from '@/domain/time';
import { confirmAction } from '@/lib/confirm';
import { useTheme } from '@/hooks/use-theme';

export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const [, setTick] = useState(0);
  const note = getNote(id);

  if (!note) {
    return (
      <Screen>
        <ThemedText type="headline">Note not found</ThemedText>
      </Screen>
    );
  }

  const category = noteCategory(note.category);
  const accent = note.color || category.color;

  return (
    <Screen>
      <View style={[styles.hero, { backgroundColor: theme.surface, borderColor: `${accent}55` }]}>
        <View style={[styles.strand, { backgroundColor: accent }]} />
        <View style={styles.heroTop}>
          <View style={[styles.badge, { backgroundColor: `${accent}22`, borderColor: `${accent}66` }]}>
            <ThemedText type="captionBold" style={{ color: accent }}>
              {category.emoji} {category.label.toUpperCase()}
            </ThemedText>
          </View>
          <Pressable
            onPress={() => {
              setNotePinned(note.id, !note.pinned);
              setTick((value) => value + 1);
            }}
            hitSlop={10}
            accessibilityLabel={note.pinned ? 'Unpin note' : 'Pin note'}>
            <UiIcon name="pin.fill" color={note.pinned ? accent : theme.textTertiary} size={18} />
          </Pressable>
        </View>
        <ThemedText type="title">{note.title}</ThemedText>
        {note.body ? (
          <ThemedText type="body" themeColor="textSecondary" style={styles.body}>
            {note.body}
          </ThemedText>
        ) : (
          <ThemedText type="callout" themeColor="textTertiary">
            No details yet.
          </ThemedText>
        )}
      </View>

      <View style={styles.meta}>
        <ThemedText type="caption" themeColor="textTertiary">
          Created {formatDateTime(note.createdAt)}
        </ThemedText>
        <ThemedText type="caption" themeColor="textTertiary">
          Updated {formatDateTime(note.updatedAt)}
        </ThemedText>
      </View>

      <Button
        label="Edit"
        variant="secondary"
        onPress={() => router.push({ pathname: '/note/form', params: { id: note.id } })}
      />
      <Button
        label={note.archived ? 'Restore' : 'Archive'}
        variant="secondary"
        onPress={() => {
          setNoteArchived(note.id, !note.archived);
          setTick((value) => value + 1);
          router.back();
        }}
      />
      <Pressable
        onPress={() => {
          void confirmAction(`Delete ${note.title}?`, 'This note will be removed for good.', 'Delete').then(
            (ok) => {
              if (!ok) return;
              deleteNote(note.id);
              router.back();
            },
          );
        }}>
        <ThemedText type="callout" themeColor="danger" style={styles.delete}>
          Delete
        </ThemedText>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: Spacing.two,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.four,
    marginBottom: Spacing.three,
    overflow: 'hidden',
  },
  strand: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  body: {
    marginTop: Spacing.one,
  },
  meta: {
    gap: 4,
    marginBottom: Spacing.four,
  },
  delete: {
    textAlign: 'center',
    marginTop: Spacing.one,
  },
});
