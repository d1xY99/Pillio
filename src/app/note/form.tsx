import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Switch, View } from 'react-native';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { NOTE_CATEGORIES, NOTE_COLORS } from '@/constants/notes';
import { Radius, Spacing } from '@/constants/theme';
import { createNote, getNote, updateNote } from '@/db/queries/notes';
import { useTheme } from '@/hooks/use-theme';

export default function NoteFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = id ? getNote(id) : undefined;
  const router = useRouter();
  const navigation = useNavigation();
  const theme = useTheme();
  const [title, setTitle] = useState(existing?.title ?? '');
  const [body, setBody] = useState(existing?.body ?? '');
  const [category, setCategory] = useState(existing?.category ?? NOTE_CATEGORIES[0].id);
  const [color, setColor] = useState(existing?.color ?? NOTE_CATEGORIES[0].color);
  const [pinned, setPinned] = useState(existing?.pinned ?? false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    navigation.setOptions({ title: existing ? 'Edit note' : 'New note' });
  }, [existing, navigation]);

  function save() {
    if (!title.trim() && !body.trim()) {
      setError('Add a title or some text.');
      return;
    }
    const input = { title, body, category, color, pinned };
    if (existing) updateNote(existing.id, input);
    else createNote(input);
    router.back();
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <TextField label="Title" value={title} onChangeText={setTitle} placeholder="Peptide protocol" autoFocus />
        <TextField
          label="Note"
          value={body}
          onChangeText={setBody}
          placeholder="Write anything…"
          multiline
        />

        <ThemedText type="captionBold" themeColor="textSecondary">
          Category
        </ThemedText>
        <View style={styles.wrap}>
          {NOTE_CATEGORIES.map((item) => {
            const active = item.id === category;
            return (
              <Pressable
                key={item.id}
                onPress={() => {
                  setCategory(item.id);
                  setColor(item.color);
                }}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? theme.accentMuted : theme.surface,
                    borderColor: active ? theme.accent : theme.border,
                  },
                ]}>
                <ThemedText
                  type="captionBold"
                  style={{ color: active ? theme.accent : theme.textSecondary }}>
                  {item.emoji} {item.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        <ThemedText type="captionBold" themeColor="textSecondary">
          Color
        </ThemedText>
        <View style={styles.colors}>
          {NOTE_COLORS.map((item) => (
            <Pressable
              key={item}
              onPress={() => setColor(item)}
              style={[
                styles.swatch,
                {
                  backgroundColor: item,
                  borderColor: item === color ? theme.text : 'transparent',
                  borderWidth: item === color ? 2 : 0,
                },
              ]}
            />
          ))}
        </View>

        <View style={styles.pinRow}>
          <View style={styles.pinCopy}>
            <ThemedText type="body">Pin to top</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              Keep this note above the rest.
            </ThemedText>
          </View>
          <Switch
            value={pinned}
            onValueChange={setPinned}
            trackColor={{ false: theme.border, true: theme.accent }}
            thumbColor="#F6FAF8"
          />
        </View>

        {error ? (
          <ThemedText type="callout" themeColor="danger">
            {error}
          </ThemedText>
        ) : null}
        <Button label={existing ? 'Save note' : 'Add note'} onPress={save} />
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
  chip: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  colors: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: Spacing.three,
  },
  swatch: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  pinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginBottom: Spacing.three,
  },
  pinCopy: {
    flex: 1,
    gap: 4,
  },
});
