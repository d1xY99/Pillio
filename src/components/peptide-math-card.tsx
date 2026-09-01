import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { GlassCard } from '@/components/glass-card';
import { InsulinSyringe } from '@/components/insulin-syringe';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { amountInUnit, formatMcg, formatMg, peptideMix } from '@/domain/peptide';
import { useTheme } from '@/hooks/use-theme';

const UNITS = ['mcg', 'mg'] as const;
type DoseMass = (typeof UNITS)[number];

function initialUnit(unit: string): DoseMass {
  return unit.toLowerCase() === 'mg' ? 'mg' : 'mcg';
}

function prettyNumber(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '';
  const rounded = Math.round(value * 10000) / 10000;
  return String(rounded);
}

export function PeptideMathCard({
  vialMg,
  bacMl,
  doseAmount,
  doseUnit,
  onSave,
}: {
  vialMg?: number | null;
  bacMl?: number | null;
  doseAmount: number;
  doseUnit: string;
  onSave?: (next: { vialMg: number; bacMl: number }) => void;
}) {
  const theme = useTheme();
  const [vial, setVial] = useState(vialMg != null ? String(vialMg) : '');
  const [bac, setBac] = useState(bacMl != null ? String(bacMl) : '');
  const [unit, setUnit] = useState<DoseMass>(() => initialUnit(doseUnit));
  const [dose, setDose] = useState(() =>
    prettyNumber(amountInUnit(doseAmount, doseUnit, initialUnit(doseUnit))),
  );

  useEffect(() => {
    setVial(vialMg != null ? String(vialMg) : '');
    setBac(bacMl != null ? String(bacMl) : '');
  }, [vialMg, bacMl]);

  useEffect(() => {
    const next = initialUnit(doseUnit);
    setUnit(next);
    setDose(prettyNumber(amountInUnit(doseAmount, doseUnit, next)));
  }, [doseAmount, doseUnit]);

  const mix = useMemo(
    () =>
      peptideMix({
        vialMg: Number(vial),
        bacMl: Number(bac),
        doseAmount: Number(dose),
        doseUnit: unit,
      }),
    [vial, bac, dose, unit],
  );
  const dirty = Number(vial) !== Number(vialMg) || Number(bac) !== Number(bacMl);

  function switchUnit(next: DoseMass) {
    if (next === unit) return;
    const converted = amountInUnit(Number(dose), unit, next);
    setDose(prettyNumber(converted) || dose);
    setUnit(next);
  }

  return (
    <GlassCard style={styles.card}>
      <ThemedText type="captionBold" themeColor="textTertiary" style={styles.kicker}>
        DRAW TO
      </ThemedText>
      {mix.ok ? (
        <View style={styles.result}>
          <ThemedText type="display">{mix.unitsLabel}</ThemedText>
          <ThemedText type="callout" themeColor="textSecondary">
            {unit === 'mg'
              ? `U-100 · ${formatMg(mix.doseMcg)} mg · ${mix.volumeMl < 0.1 ? mix.volumeMl.toFixed(3) : mix.volumeMl.toFixed(2)} ml · ${formatMg(mix.mcgPerMl)} mg/ml`
              : `U-100 · ${formatMcg(mix.doseMcg)} mcg · ${mix.volumeMl < 0.1 ? mix.volumeMl.toFixed(3) : mix.volumeMl.toFixed(2)} ml · ${formatMcg(mix.mcgPerMl)} mcg/ml`}
          </ThemedText>
          {mix.overfill ? (
            <ThemedText type="captionBold" themeColor="danger">
              Over 1 ml — split the draw or use a larger syringe.
            </ThemedText>
          ) : null}
        </View>
      ) : (
        <ThemedText type="callout" themeColor="textTertiary">
          Enter vial mg, BAC ml, and dose to get units.
        </ThemedText>
      )}
      <InsulinSyringe units={mix.ok ? mix.units : 0} overfill={mix.ok && mix.overfill} />

      <View style={styles.fields}>
        <View style={styles.flex}>
          <TextField label="Vial (mg)" value={vial} onChangeText={setVial} keyboardType="decimal-pad" placeholder="5" />
        </View>
        <View style={styles.flex}>
          <TextField label="BAC (ml)" value={bac} onChangeText={setBac} keyboardType="decimal-pad" placeholder="2" />
        </View>
      </View>
      <View style={styles.doseRow}>
        <View style={styles.flex}>
          <TextField
            label={`Dose (${unit})`}
            value={dose}
            onChangeText={setDose}
            keyboardType="decimal-pad"
            placeholder={unit === 'mg' ? '0.25' : '250'}
          />
        </View>
        <View style={styles.switch}>
          {UNITS.map((option) => {
            const on = option === unit;
            return (
              <Pressable
                key={option}
                onPress={() => switchUnit(option)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: on ? theme.accentMuted : theme.surface,
                    borderColor: on ? theme.accent : theme.border,
                  },
                ]}>
                <ThemedText type="captionBold" style={{ color: on ? theme.accent : theme.textSecondary }}>
                  {option}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>

      {onSave ? (
        <Button
          label="Save mix"
          variant="secondary"
          disabled={!mix.ok || !dirty}
          onPress={() => {
            if (!mix.ok) return;
            onSave({ vialMg: Number(vial), bacMl: Number(bac) });
          }}
        />
      ) : null}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  kicker: {
    letterSpacing: 1.6,
    fontSize: 11,
  },
  result: {
    gap: 6,
    paddingVertical: Spacing.two,
  },
  fields: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  doseRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
  },
  switch: {
    flexDirection: 'row',
    gap: 6,
    paddingBottom: 4,
  },
  chip: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  flex: {
    flex: 1,
  },
});
