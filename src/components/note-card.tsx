import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';

import { PressScale } from '@/components/press-scale';
import { ThemedText } from '@/components/themed-text';
import { UiIcon } from '@/components/ui-icon';
import { noteCategory } from '@/constants/notes';
import { Radius, Spacing } from '@/constants/theme';
import type { Note } from '@/db/schema';
import { useTheme } from '@/hooks/use-theme';

function preview(note: Note) {
  const text = note.body.replace(/\s+/g, ' ').trim();
  if (!text) return 'No details yet';
  return text.length > 110 ? `${text.slice(0, 110)}…` : text;
}

function updatedLabel(ms: number) {
  const date = new Date(ms);
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) {
    return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(date);
  }
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
}

export function NoteCard({
  note,
  index,
  onPress,
}: {
  note: Note;
  index: number;
  onPress: () => void;
}) {
  const theme = useTheme();
  const category = noteCategory(note.category);
  const accent = note.color || category.color;

  return (
    <Animated.View entering={FadeInRight.delay(50 + index * 45).springify().damping(16)}>
      <PressScale
        onPress={onPress}
        style={[
          styles.card,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}>
        <View style={[styles.accent, { backgroundColor: accent }]} />
        <View style={styles.copy}>
          <View style={styles.topRow}>
            <Text style={styles.emoji}>{category.emoji}</Text>
            <View
              style={[
                styles.badge,
                { backgroundColor: `${accent}22`, borderColor: `${accent}66` },
              ]}>
              <ThemedText type="captionBold" style={[styles.badgeText, { color: accent }]}>
                {category.label.toUpperCase()}
              </ThemedText>
            </View>
            <View style={styles.spacer} />
            {note.pinned ? <UiIcon name="pin.fill" color={accent} size={15} /> : null}
          </View>
          <ThemedText type="headline" numberOfLines={1}>
            {note.title}
          </ThemedText>
          <ThemedText type="callout" themeColor="textSecondary" numberOfLines={2}>
            {preview(note)}
          </ThemedText>
          <ThemedText type="caption" themeColor="textTertiary">
            {updatedLabel(note.updatedAt)}
          </ThemedText>
        </View>
      </PressScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
  },
  accent: {
    width: 4,
    alignSelf: 'stretch',
  },
  copy: {
    flex: 1,
    padding: Spacing.three,
    gap: 5,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  emoji: { fontSize: 15 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  badgeText: {
    letterSpacing: 0.8,
    fontSize: 10,
  },
  spacer: { flex: 1 },
});
