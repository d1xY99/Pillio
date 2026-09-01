import { and, gte, lte } from 'drizzle-orm';
import { useLiveQuery } from '@/db/live';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { DoseRow } from '@/components/dose-row';
import { SupplementRow } from '@/components/supplement-row';
import { EmptyState } from '@/components/empty-state';
import { FadeIn } from '@/components/fade-in';
import { GlassCard } from '@/components/glass-card';
import { HeroBanner } from '@/components/hero-banner';
import { MenuButton } from '@/components/menu-button';
import { PulseRing } from '@/components/pulse-ring';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { getDb } from '@/db/client';
import { takeDose, untakeDose } from '@/domain/logging';
import { getReminderPermission, requestReminderPermission } from '@/notifications/permissions';
import { syncDoseReminders } from '@/notifications/sync';
import { doseLogs } from '@/db/schema';
import type { DoseUnit } from '@/db/types';
import { overallStreak } from '@/domain/adherence';
import { ensureUpcomingDoses, groupDosesByTime, listParkedWeekly, listTodayDoses } from '@/domain/doses';
import { endOfLocalDay, formatTimeMinutes, startOfLocalDay } from '@/domain/time';
import { useTheme } from '@/hooks/use-theme';
import { useSettingsDrawer } from '@/settings/drawer-context';

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
  const menu = useSettingsDrawer();
  const db = getDb();
  const [nowTick, setNowTick] = useState(0);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'undetermined' | 'web'>('undetermined');
  const [webAlertsOn, setWebAlertsOn] = useState(false);
  const [tab, setTab] = useState<'daily' | 'weekly'>('daily');
  const start = startOfLocalDay();
  const end = endOfLocalDay();

  useFocusEffect(
    useCallback(() => {
      ensureUpcomingDoses();
      setNowTick((value) => value + 1);
      if (Platform.OS === 'web') {
        setPermission('web');
        void import('@/notifications/web').then((mod) =>
          mod.getWebReminderStatus().then((status) => setWebAlertsOn(status === 'granted')),
        );
      } else {
        void getReminderPermission().then(setPermission);
      }
    }, []),
  );

  const { updatedAt } = useLiveQuery(
    db
      .select()
      .from(doseLogs)
      .where(and(gte(doseLogs.scheduledFor, start), lte(doseLogs.scheduledFor, end))),
    [start, end],
  );

  const doses = useMemo(
    () => listTodayDoses(),
    [updatedAt, nowTick],
  );
  const parkedWeekly = useMemo(() => listParkedWeekly(), [updatedAt, nowTick]);
  const groups = groupDosesByTime(doses);
  const taken = doses.filter((dose) => dose.takenAt).length;
  const total = doses.length;
  const streak = useMemo(() => overallStreak(), [updatedAt, nowTick]);

  return (
    <Screen>
      <ScreenHeader
        title="Today"
        subtitle={formatToday()}
        right={<MenuButton />}
      />

      {Platform.OS === 'web' && !webAlertsOn ? (
        <FadeIn>
          <GlassCard style={styles.permission}>
            <ThemedText type="headline">Turn on reminders</ThemedText>
            <ThemedText type="callout" themeColor="textSecondary">
              Share this page → Add to Home Screen, then open Pillio from that icon. In Settings,
              subscribe in ntfy so alerts still arrive when the phone is locked.
            </ThemedText>
            <Button label="Open menu" onPress={menu.show} />
          </GlassCard>
        </FadeIn>
      ) : Platform.OS !== 'web' && permission !== 'granted' ? (
        <FadeIn>
          <GlassCard glow style={styles.permission}>
            <ThemedText type="headline">Turn on reminders</ThemedText>
            <ThemedText type="callout" themeColor="textSecondary">
              Expo Go can alert you at the due time only if a dose is still open. Allow notifications,
              then enable Reminder on each supplement.
            </ThemedText>
            <Button
              label={permission === 'denied' ? 'Open iOS Settings' : 'Allow notifications'}
              onPress={() => {
                if (permission === 'denied') {
                  void Linking.openSettings();
                  return;
                }
                void requestReminderPermission().then((granted) => {
                  setPermission(granted ? 'granted' : 'denied');
                  if (granted) void syncDoseReminders();
                });
              }}
            />
          </GlassCard>
        </FadeIn>
      ) : null}

      <View style={styles.filters}>
        {(['daily', 'weekly'] as const).map((key) => {
          const active = tab === key;
          return (
            <Pressable
              key={key}
              onPress={() => setTab(key)}
              style={[
                styles.filter,
                {
                  backgroundColor: active ? theme.accentMuted : theme.surface,
                  borderColor: active ? theme.accent : theme.border,
                },
              ]}>
              <ThemedText type="captionBold" style={{ color: active ? theme.accent : theme.textSecondary }}>
                {key === 'daily' ? 'Daily' : 'Weekly'}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <HeroBanner
        compact
        kicker={tab === 'weekly' ? 'WEEKLY' : 'DAILY STACK'}
        title={
          tab === 'weekly'
            ? parkedWeekly.length
              ? `${parkedWeekly.length} waiting`
              : 'Nothing parked'
            : streak > 0
              ? `${streak}-day streak`
              : total === 0
                ? 'Build the ritual'
                : taken === total
                  ? 'Stack complete'
                  : 'Stay on protocol'
        }
      />

      {tab === 'daily' ? (
        <>
          <FadeIn delay={80}>
            <GlassCard glow={total > 0 && taken < total} padded={false} style={styles.summary}>
              <PulseRing color={theme.accent} active={total > 0 && taken < total}>
                <View
                  style={[
                    styles.ring,
                    { borderColor: total > 0 && taken === total ? theme.accent : theme.border },
                  ]}>
                  <ThemedText type="headline">{taken}</ThemedText>
                  <ThemedText type="caption" themeColor="textTertiary">
                    of {total}
                  </ThemedText>
                </View>
              </PulseRing>
              <View style={styles.summaryCopy}>
                <ThemedText type="headline">
                  {total === 0 ? 'Nothing due' : taken === total ? 'All taken' : `${total - taken} remaining`}
                </ThemedText>
                <ThemedText type="callout" themeColor="textSecondary">
                  Weekly items join this list only on their day.
                </ThemedText>
              </View>
            </GlassCard>
          </FadeIn>

          {total === 0 ? (
            <FadeIn delay={160}>
              <EmptyState
                icon="checkmark.circle"
                title="Your day is clear"
                body="Daily doses show here. Once-a-week items wait under Weekly until their day."
                actionLabel="Go to Stack"
                onAction={() => router.push('/stack')}
              />
            </FadeIn>
          ) : (
            <View style={styles.groups}>
              {groups.map((group, groupIndex) => (
                <FadeIn key={group.time} delay={120 + groupIndex * 70}>
                  <View style={styles.group}>
                    <ThemedText type="captionBold" themeColor="textTertiary">
                      {formatTimeMinutes(group.time).toUpperCase()}
                    </ThemedText>
                    {group.items.map((item) => (
                      <DoseRow
                        key={item.id}
                        item={item}
                        onPress={() =>
                          router.push({ pathname: '/supplement/[id]', params: { id: item.supplementId } })
                        }
                        onToggle={() => {
                          if (item.takenAt) {
                            void untakeDose(item.id);
                          } else {
                            void takeDose(item.id, {
                              amount: item.supplement.defaultAmount,
                              unit: item.supplement.defaultUnit as DoseUnit,
                            });
                          }
                        }}
                      />
                    ))}
                  </View>
                </FadeIn>
              ))}
            </View>
          )}
        </>
      ) : parkedWeekly.length === 0 ? (
        <EmptyState
          icon="pills.fill"
          title="No weekly items waiting"
          body="Add a supplement in Stack and set Frequency to Weekly. On its day it moves into Daily so you can check it off."
        />
      ) : (
        <View style={styles.groups}>
          {parkedWeekly.map((row) => (
            <SupplementRow
              key={row.supplement.id}
              item={row.supplement}
              status={`Next ${row.nextLabel}`}
              onPress={() =>
                router.push({ pathname: '/supplement/[id]', params: { id: row.supplement.id } })
              }
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.three,
  },
  filter: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  permission: {
    marginBottom: Spacing.four,
    gap: Spacing.two,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginBottom: Spacing.four,
    padding: Spacing.three,
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
  groups: {
    gap: Spacing.four,
  },
  group: {
    gap: Spacing.two,
  },
});
