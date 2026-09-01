import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { GlassCard } from '@/components/glass-card';
import { InsulinSyringe } from '@/components/insulin-syringe';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { peptideMix } from '@/domain/peptide';

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
        DRAW TO
      </ThemedText>
      {mix.ok ? (
        <View style={styles.result}>
          <ThemedText type="display">{mix.unitsLabel}</ThemedText>
          <ThemedText type="callout" themeColor="textSecondary">
            U-100 · {mix.volumeMl < 0.1 ? mix.volumeMl.toFixed(3) : mix.volumeMl.toFixed(2)} ml ·{' '}
            {Math.round(mix.mcgPerMl / 100)} mcg per unit
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
  fields: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
  },
});
