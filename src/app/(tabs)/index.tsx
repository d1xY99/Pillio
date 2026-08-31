import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { IconButton } from '@/components/icon-button';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

function formatToday() {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date());
}

export default function TodayScreen() {
  const router = useRouter();
  const theme = useTheme();
  const taken = 0;
  const total = 0;

  return (
    <Screen>
      <ScreenHeader
        title="Today"
        subtitle={formatToday()}
        right={
          <IconButton
            name="gearshape"
            accessibilityLabel="Open settings"
            onPress={() => router.push('/settings')}
          />
        }
      />

      <View style={[styles.summary, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[styles.ring, { borderColor: theme.border }]}>
          <ThemedText type="headline">{taken}</ThemedText>
          <ThemedText type="caption" themeColor="textTertiary">
            of {total}
          </ThemedText>
        </View>
        <View style={styles.summaryCopy}>
          <ThemedText type="headline">No doses yet</ThemedText>
          <ThemedText type="callout" themeColor="textSecondary">
            Check off what you take. Reminders wait until the due time if a dose is still open.
          </ThemedText>
        </View>
      </View>

      <EmptyState
        icon="checkmark.circle"
        title="Your day is clear"
        body="Add vitamins, peptides, and supplements in Stack to see them here."
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.four,
    marginBottom: Spacing.four,
  },
  ring: {
    width: 72,
    height: 72,
    borderRadius: Radius.full,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCopy: {
    flex: 1,
    gap: Spacing.one,
  },
});
