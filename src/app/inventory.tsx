import { eq } from 'drizzle-orm';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { apiPatch } from '@/api/client';
import { ChoiceChips } from '@/components/choice-chips';
import { EmptyState } from '@/components/empty-state';
import { FadeIn } from '@/components/fade-in';
import { PressScale } from '@/components/press-scale';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { UiIcon } from '@/components/ui-icon';
import { formatDose } from '@/constants/catalog';
import { Radius, Spacing } from '@/constants/theme';
import { getDb } from '@/db/client';
import { useLiveQuery } from '@/db/live';
import { setInventory, updateSupplement } from '@/db/queries/supplements';
import { supplements, type Supplement } from '@/db/schema';
import type { DoseUnit } from '@/db/types';
import { inventoryUnit, isLowStock } from '@/domain/inventory';
import { useTheme } from '@/hooks/use-theme';
import { showToast } from '@/lib/toast';

export default function InventoryScreen() {
  const theme = useTheme();
  const db = getDb();
  const { data = [] } = useLiveQuery(
    db.select().from(supplements).where(eq(supplements.archived, false)).orderBy(supplements.name),
    [],
  );

  const tracked = data.filter((item) => item.trackInventory);
  const untracked = data.filter((item) => !item.trackInventory);
  const low = tracked.filter(isLowStock).length;

  return (
    <Screen>
      <ScreenHeader title="Inventory" subtitle="What you have" />

      {tracked.length > 0 ? (
        <View style={[styles.summary, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.summaryStat}>
            <ThemedText type="headline">{tracked.length}</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              tracked
            </ThemedText>
          </View>
          <View style={[styles.rule, { backgroundColor: theme.border }]} />
          <View style={styles.summaryStat}>
            <ThemedText type="headline" style={{ color: low ? theme.warning : theme.text }}>
              {low}
            </ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              running low
            </ThemedText>
          </View>
        </View>
      ) : null}

      {tracked.length === 0 ? (
        <FadeIn>
          <EmptyState
            icon="pills.fill"
            title="Nothing tracked yet"
            body="Turn on inventory for an item below and set how much you have left."
          />
        </FadeIn>
      ) : (
        <View style={styles.list}>
          {tracked.map((item, index) => (
            <FadeIn key={item.id} delay={index * 40}>
              <TrackedRow item={item} />
            </FadeIn>
          ))}
        </View>
      )}

      {untracked.length > 0 ? (
        <>
          <ThemedText type="captionBold" themeColor="textTertiary" style={styles.sectionKicker}>
            NOT TRACKED
          </ThemedText>
          <View style={styles.list}>
            {untracked.map((item) => (
              <UntrackedRow key={item.id} item={item} />
            ))}
          </View>
        </>
      ) : null}
    </Screen>
  );
}

function TrackedRow({ item }: { item: Supplement }) {
  const theme = useTheme();
  const unit = inventoryUnit(item);
  const container = item.type === 'peptide' ? 'vial' : 'container';
  const total = item.quantityOnHand;
  const savedPack = item.inventoryPackSize != null && item.inventoryPackSize > 0;
  const savedCount = savedPack && total != null ? Math.round((total / item.inventoryPackSize!) * 1000) / 1000 : null;

  const [editing, setEditing] = useState(false);
  const [mode, setMode] = useState<'amount' | 'vials'>(savedPack ? 'vials' : 'amount');
  const [per, setPer] = useState(
    item.inventoryPackSize != null
      ? String(item.inventoryPackSize)
      : String(item.vialMg ?? item.defaultAmount ?? ''),
  );
  const [amount, setAmount] = useState(total != null ? String(total) : '');
  const [count, setCount] = useState(savedCount != null ? String(savedCount) : '');

  useEffect(() => {
    setAmount(total != null ? String(total) : '');
    if (item.inventoryPackSize != null && item.inventoryPackSize > 0) {
      setPer(String(item.inventoryPackSize));
      setCount(total != null ? String(Math.round((total / item.inventoryPackSize) * 1000) / 1000) : '');
    }
  }, [total, item.inventoryPackSize]);

  const low = isLowStock(item);

  function resetLocal() {
    setMode(savedPack ? 'vials' : 'amount');
    setPer(
      item.inventoryPackSize != null
        ? String(item.inventoryPackSize)
        : String(item.vialMg ?? item.defaultAmount ?? ''),
    );
    setAmount(total != null ? String(total) : '');
    setCount(savedCount != null ? String(savedCount) : '');
  }

  function cancel() {
    resetLocal();
    setEditing(false);
  }

  function save() {
    if (mode === 'vials') {
      const parsedPer = Number(per);
      const parsedCount = count.trim() === '' ? 0 : Number(count);
      if (!Number.isFinite(parsedPer) || parsedPer <= 0) return;
      if (!Number.isFinite(parsedCount) || parsedCount < 0) return;
      setInventory(item.id, {
        inventoryPackSize: parsedPer,
        quantityOnHand: Math.round(parsedCount * parsedPer * 1000) / 1000,
      });
    } else {
      const trimmed = amount.trim();
      if (!trimmed) {
        setInventory(item.id, { quantityOnHand: null, inventoryPackSize: null });
      } else {
        const parsed = Number(trimmed);
        if (!Number.isFinite(parsed) || parsed < 0) return;
        setInventory(item.id, {
          quantityOnHand: Math.round(parsed * 1000) / 1000,
          inventoryPackSize: null,
        });
      }
    }
    setEditing(false);
  }

  function untrack() {
    const previous = {
      trackInventory: true,
      quantityOnHand: item.quantityOnHand,
      inventoryUnit: item.inventoryUnit as DoseUnit | null,
      inventoryPackSize: item.inventoryPackSize,
      lowStockThreshold: item.lowStockThreshold,
      refillReminder: item.refillReminder,
    };
    const patch = {
      trackInventory: false,
      quantityOnHand: null,
      inventoryUnit: null,
      inventoryPackSize: null,
      lowStockThreshold: null,
      refillReminder: false,
    };
    updateSupplement(item.id, patch);
    void apiPatch(`/stack/${item.id}`, patch).catch(() => undefined);
    showToast(`${item.name} removed from tracking`, {
      action: {
        label: 'Undo',
        onPress: () => {
          updateSupplement(item.id, previous);
          void apiPatch(`/stack/${item.id}`, previous).catch(() => undefined);
        },
      },
    });
  }

  function bump(sign: 1 | -1) {
    const base = total ?? 0;
    if (mode === 'vials') {
      const parsedPer = Number(per);
      if (!Number.isFinite(parsedPer) || parsedPer <= 0) return;
      const baseCount = savedCount ?? 0;
      setInventory(item.id, {
        inventoryPackSize: parsedPer,
        quantityOnHand: Math.max(0, Math.round((baseCount + sign) * parsedPer * 1000) / 1000),
      });
      return;
    }
    const step = item.defaultAmount > 0 ? item.defaultAmount : 1;
    setInventory(item.id, {
      quantityOnHand: Math.max(0, Math.round((base + sign * step) * 1000) / 1000),
    });
  }

  return (
    <Pressable
      onPress={() => {
        if (!editing) setEditing(true);
      }}
      accessibilityRole="button"
      accessibilityLabel={`Edit ${item.name} inventory`}
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: low ? `${theme.warning}66` : theme.border },
      ]}>
      <View style={[styles.stripe, { backgroundColor: item.color }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardHead}>
          <Pressable onPress={() => setEditing((value) => !value)} style={styles.headToggle}>
            <ThemedText type="headline" numberOfLines={1} style={styles.name}>
              {item.name}
            </ThemedText>
            {low ? (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: `${theme.warning}22`, borderColor: `${theme.warning}66` },
                ]}>
                <ThemedText type="captionBold" style={[styles.badgeText, { color: theme.warning }]}>
                  LOW
                </ThemedText>
              </View>
            ) : null}
          </Pressable>
          {editing ? (
            <Pressable onPress={cancel} hitSlop={8} accessibilityLabel="Cancel">
              <ThemedText type="captionBold" themeColor="accent">
                Cancel
              </ThemedText>
            </Pressable>
          ) : (
            <Pressable onPress={() => setEditing(true)} hitSlop={8} accessibilityLabel="Edit inventory">
              <UiIcon name="pencil" color={theme.textSecondary} size={18} />
            </Pressable>
          )}
        </View>

        <ThemedText type="title">
          {mode === 'vials'
            ? `${savedCount ?? 0} ${container}s`
            : total == null
              ? 'Not set'
              : formatDose(total, unit)}
        </ThemedText>
        {mode === 'vials' && savedPack ? (
          <ThemedText type="caption" themeColor="textSecondary">
            {`${formatDose(total ?? 0, unit)} total · ${formatDose(item.inventoryPackSize!, unit)} per ${container}`}
          </ThemedText>
        ) : null}
        <ThemedText type="caption" themeColor="textSecondary">
          {item.lowStockThreshold == null
            ? 'No alert threshold set.'
            : `Alert below ${formatDose(item.lowStockThreshold, unit)}.`}
        </ThemedText>

        {editing ? (
          <>
            <ChoiceChips
              options={['amount', 'vials'] as const}
              value={mode}
              labels={{ amount: 'By amount', vials: `By ${container}s` }}
              onChange={setMode}
            />

            {mode === 'vials' ? (
              <View style={styles.mixRow}>
                <View style={styles.field}>
                  <TextField
                    label={container === 'vial' ? 'Vials' : 'Containers'}
                    value={count}
                    onChangeText={setCount}
                    keyboardType="decimal-pad"
                    placeholder="10"
                  />
                </View>
                <View style={styles.field}>
                  <TextField
                    label={`Per ${container} (${unit})`}
                    value={per}
                    onChangeText={setPer}
                    keyboardType="decimal-pad"
                    placeholder="10"
                  />
                </View>
              </View>
            ) : (
              <TextField
                label={`Current (${unit})`}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="0"
              />
            )}

            <View style={styles.controls}>
              <PressScale
                onPress={() => bump(-1)}
                style={[styles.stepButton, { backgroundColor: theme.surfaceRaised, borderColor: theme.border }]}>
                <StepGlyph label="−" color={theme.text} />
              </PressScale>
              <PressScale
                onPress={() => bump(1)}
                style={[styles.stepButton, { backgroundColor: theme.surfaceRaised, borderColor: theme.border }]}>
                <StepGlyph label="+" color={theme.text} />
              </PressScale>
              <View style={styles.spacer} />
              <PressScale onPress={save} style={[styles.saveButton, { backgroundColor: theme.accent }]}>
                <ThemedText type="captionBold" style={styles.saveLabel}>
                  Save
                </ThemedText>
              </PressScale>
            </View>

            <Pressable onPress={untrack} hitSlop={8} style={styles.untrack}>
              <ThemedText type="caption" themeColor="danger">
                Remove from tracking
              </ThemedText>
            </Pressable>
          </>
        ) : null}
      </View>
    </Pressable>
  );
}

function StepGlyph({ label, color }: { label: string; color: string }) {
  return (
    <View style={styles.glyphBox}>
      <ThemedText style={[styles.glyph, { color }]}>{label}</ThemedText>
    </View>
  );
}

function UntrackedRow({ item }: { item: Supplement }) {
  const theme = useTheme();

  function track() {
    const patch = {
      trackInventory: true,
      inventoryUnit: item.defaultUnit as DoseUnit,
      refillReminder: true,
    };
    updateSupplement(item.id, patch);
    void apiPatch(`/stack/${item.id}`, patch).catch(() => undefined);
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={[styles.stripe, { backgroundColor: item.color }]} />
      <View style={[styles.cardBody, styles.untrackedBody]}>
        <View style={styles.field}>
          <ThemedText type="headline" numberOfLines={1}>
            {item.name}
          </ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            {formatDose(item.defaultAmount, item.defaultUnit)}
          </ThemedText>
        </View>
        <PressScale onPress={track} style={[styles.trackButton, { borderColor: theme.accent }]}>
          <ThemedText type="captionBold" style={{ color: theme.accent }}>
            Track
          </ThemedText>
        </PressScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.three,
    marginBottom: Spacing.four,
  },
  summaryStat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  rule: {
    width: 1,
    height: 26,
  },
  list: {
    gap: Spacing.three,
    marginBottom: Spacing.four,
  },
  sectionKicker: {
    letterSpacing: 1.6,
    fontSize: 11,
    marginBottom: Spacing.two,
  },
  card: {
    flexDirection: 'row',
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  stripe: {
    width: 4,
  },
  cardBody: {
    flex: 1,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  headToggle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  name: {
    flex: 1,
  },
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
  mixRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  spacer: {
    flex: 1,
  },
  stepButton: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyphBox: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    fontSize: 26,
    lineHeight: 26,
    fontWeight: '600',
    textAlign: 'center',
    includeFontPadding: false,
  },
  field: {
    flex: 1,
  },
  saveButton: {
    height: 52,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveLabel: {
    color: '#06110D',
  },
  untrack: {
    alignSelf: 'center',
    marginTop: Spacing.three,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
  untrackedBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  trackButton: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
});
