import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { GlassCard } from '@/components/glass-card';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { peptideMix } from '@/domain/peptide';
import { useTheme } from '@/hooks/use-theme';

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
  const [dose, setDose] = useState(String(doseAmount));

  useEffect(() => {
    setVial(vialMg != null ? String(vialMg) : '');
    setBac(bacMl != null ? String(bacMl) : '');
  }, [vialMg, bacMl]);

  useEffect(() => {
    setDose(String(doseAmount));
  }, [doseAmount]);

  const mix = useMemo(
    () =>
      peptideMix({
        vialMg: Number(vial),
        bacMl: Number(bac),
        doseAmount: Number(dose),
        doseUnit,
      }),
    [vial, bac, dose, doseUnit],
  );
  const dirty =
    Number(vial) !== Number(vialMg) || Number(bac) !== Number(bacMl);

  return (
    <GlassCard style={styles.card}>
      <ThemedText type="captionBold" themeColor="textTertiary" style={styles.kicker}>
        SYRINGE
      </ThemedText>
      <ThemedText type="callout" themeColor="textSecondary">
        U-100 insulin syringe · 100 units = 1 ml
      </ThemedText>

      {mix.ok ? (
        <View style={styles.result}>
          <ThemedText type="display">{mix.unitsLabel}</ThemedText>
          <ThemedText type="callout" themeColor="textSecondary">
            {mix.volumeMl < 0.1 ? mix.volumeMl.toFixed(3) : mix.volumeMl.toFixed(2)} ml ·{' '}
            {Math.round(mix.mcgPerMl)} mcg/ml
          </ThemedText>
          {mix.overfill ? (
            <ThemedText type="captionBold" themeColor="danger">
              Over 1 ml — split the draw or use a larger syringe.
            </ThemedText>
          ) : null}
          <View style={[styles.syringe, { borderColor: theme.border, backgroundColor: theme.background }]}>
            <View
              style={[
                styles.plunger,
                {
                  width: `${Math.min(100, Math.max(3, mix.units))}%`,
                  backgroundColor: mix.overfill ? theme.danger : theme.accent,
                },
              ]}
            />
          </View>
          <View style={styles.ticks}>
            <ThemedText type="caption" themeColor="textTertiary">
              0
            </ThemedText>
            <ThemedText type="caption" themeColor="textTertiary">
              50
            </ThemedText>
            <ThemedText type="caption" themeColor="textTertiary">
              100
            </ThemedText>
          </View>
        </View>
      ) : (
        <ThemedText type="callout" themeColor="textTertiary">
          Enter vial mg, BAC ml, and dose to get units.
        </ThemedText>
      )}

      <View style={styles.fields}>
        <View style={styles.flex}>
          <TextField label="Vial (mg)" value={vial} onChangeText={setVial} keyboardType="decimal-pad" placeholder="5" />
        </View>
        <View style={styles.flex}>
          <TextField label="BAC (ml)" value={bac} onChangeText={setBac} keyboardType="decimal-pad" placeholder="2" />
        </View>
      </View>
      <TextField
        label={doseUnit === 'mg' ? 'Dose (mg)' : 'Dose (mcg)'}
        value={dose}
        onChangeText={setDose}
        keyboardType="decimal-pad"
        placeholder="250"
      />

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
  syringe: {
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 8,
  },
  plunger: {
    height: 14,
    borderRadius: 7,
  },
  ticks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fields: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
  },
});
