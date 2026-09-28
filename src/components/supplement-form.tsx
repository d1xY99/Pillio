import { type ReactNode, useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { Button } from '@/components/button';
import { ChoiceChips } from '@/components/choice-chips';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { TypeArtCard } from '@/components/type-art-card';
import {
  COLOR_SWATCHES,
  FORM_LABELS,
  TYPE_COLORS,
  UNIT_LABELS,
} from '@/constants/catalog';
import { Radius, Spacing } from '@/constants/theme';
import type { SupplementInput } from '@/db/queries/supplements';
import {
  DOSE_UNITS,
  SUPPLEMENT_FORMS,
  SUPPLEMENT_TYPES,
  type DoseUnit,
  type SupplementForm,
  type SupplementType,
} from '@/db/types';
import { useTheme } from '@/hooks/use-theme';

type SupplementFormProps = {
  initial?: Partial<SupplementInput>;
  submitLabel: string;
  onSubmit: (input: SupplementInput) => void;
  children?: ReactNode;
};

export function SupplementFormFields({ initial, submitLabel, onSubmit, children }: SupplementFormProps) {
  const theme = useTheme();
  const [name, setName] = useState(initial?.name ?? '');
  const [type, setType] = useState<SupplementType>(initial?.type ?? 'vitamin');
  const [form, setForm] = useState<SupplementForm>(initial?.form ?? 'capsule');
  const [amount, setAmount] = useState(
    initial?.defaultAmount !== undefined ? String(initial.defaultAmount) : '',
  );
  const [unit, setUnit] = useState<DoseUnit>(initial?.defaultUnit ?? 'mg');
  const [color, setColor] = useState(initial?.color ?? TYPE_COLORS.vitamin);
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [vialMg, setVialMg] = useState(initial?.vialMg != null ? String(initial.vialMg) : '');
  const [bacMl, setBacMl] = useState(initial?.bacMl != null ? String(initial.bacMl) : '');
  const [trackInventory, setTrackInventory] = useState(initial?.trackInventory ?? false);
  const [inventoryMode, setInventoryMode] = useState<'amount' | 'vials'>(
    initial?.inventoryPackSize != null && initial.inventoryPackSize > 0 ? 'vials' : 'amount',
  );
  const [quantity, setQuantity] = useState(
    initial?.quantityOnHand != null ? String(initial.quantityOnHand) : '',
  );
  const [vialCount, setVialCount] = useState(
    initial?.inventoryPackSize != null &&
      initial.inventoryPackSize > 0 &&
      initial.quantityOnHand != null
      ? String(Math.round((initial.quantityOnHand / initial.inventoryPackSize) * 1000) / 1000)
      : '',
  );
  const [packSize, setPackSize] = useState(
    initial?.inventoryPackSize != null
      ? String(initial.inventoryPackSize)
      : initial?.type === 'peptide' && initial?.vialMg != null
        ? String(initial.vialMg)
        : '',
  );
  const [threshold, setThreshold] = useState(
    initial?.lowStockThreshold != null ? String(initial.lowStockThreshold) : '',
  );
  const [refillReminder, setRefillReminder] = useState(initial?.refillReminder !== false);
  const [error, setError] = useState<string | null>(null);

  function handleTypeChange(next: SupplementType) {
    setType(next);
    if ((COLOR_SWATCHES as readonly string[]).includes(color) && color === TYPE_COLORS[type]) {
      setColor(TYPE_COLORS[next]);
    }
    if (next === 'peptide') {
      if (form === 'capsule' || form === 'tablet') setForm('injection');
      if (unit === 'caps' || unit === 'IU') setUnit('mcg');
    }
  }

  function handleSubmit() {
    const trimmed = name.trim();
    const parsed = Number(amount);
    if (!trimmed) {
      setError('Name is required.');
      return;
    }
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError('Enter a dose greater than zero.');
      return;
    }

    let quantityOnHand: number | null = null;
    let inventoryPackSize: number | null = null;
    if (trackInventory) {
      if (inventoryMode === 'vials') {
        const per = parseOptional(packSize);
        const count = parseQuantity(vialCount);
        inventoryPackSize = per;
        quantityOnHand = per != null && count != null ? Math.round(count * per * 1000) / 1000 : null;
      } else {
        quantityOnHand = parseQuantity(quantity);
      }
    }

    onSubmit({
      name: trimmed,
      type,
      form,
      defaultAmount: parsed,
      defaultUnit: unit,
      color,
      notes: notes.trim() || null,
      vialMg: type === 'peptide' ? parseOptional(vialMg) : null,
      bacMl: type === 'peptide' ? parseOptional(bacMl) : null,
      trackInventory,
      quantityOnHand,
      inventoryUnit: trackInventory ? unit : null,
      inventoryPackSize,
      lowStockThreshold: trackInventory ? parseQuantity(threshold) : null,
      refillReminder: trackInventory ? refillReminder : false,
    });
  }

  return (
    <View style={styles.form}>
      <TextField
        label="Name"
        value={name}
        onChangeText={setName}
        placeholder="Vitamin D, BPC-157, Creatine..."
        autoFocus={!initial?.name}
      />

      <FieldLabel label="Type" />
      <View style={styles.typeRow}>
        {SUPPLEMENT_TYPES.map((option, index) => (
          <TypeArtCard
            key={option}
            type={option}
            selected={type === option}
            delay={index * 60}
            onPress={() => handleTypeChange(option)}
          />
        ))}
      </View>

      <FieldLabel label="Form" />
      <ChoiceChips options={SUPPLEMENT_FORMS} value={form} labels={FORM_LABELS} onChange={setForm} />

      <TextField
        label="Dose"
        value={amount}
        onChangeText={setAmount}
        placeholder="5000"
        keyboardType="decimal-pad"
      />

      <FieldLabel label="Unit" />
      <ChoiceChips options={DOSE_UNITS} value={unit} labels={UNIT_LABELS} onChange={setUnit} />

      {type === 'peptide' ? (
        <View style={styles.mix}>
          <FieldLabel label="Reconstitution (optional)" />
          <View style={styles.mixRow}>
            <View style={styles.flex}>
              <TextField
                label="Vial (mg)"
                value={vialMg}
                onChangeText={setVialMg}
                keyboardType="decimal-pad"
                placeholder="5"
              />
            </View>
            <View style={styles.flex}>
              <TextField
                label="BAC water (ml)"
                value={bacMl}
                onChangeText={setBacMl}
                keyboardType="decimal-pad"
                placeholder="2"
              />
            </View>
          </View>
          <ThemedText type="caption" themeColor="textTertiary">
            Saves the mix so Today can show insulin units next to the dose.
          </ThemedText>
        </View>
      ) : null}

      <View style={styles.toggleRow}>
        <View style={styles.flex}>
          <FieldLabel label="Inventory" />
          <ThemedText type="caption" themeColor="textSecondary">
            Track how much is left and get a refill alert.
          </ThemedText>
        </View>
        <Switch
          value={trackInventory}
          onValueChange={setTrackInventory}
          trackColor={{ false: theme.border, true: theme.accent }}
          thumbColor="#F6FAF8"
        />
      </View>

      {trackInventory ? (
        <View style={styles.mix}>
          <ChoiceChips
            options={['amount', 'vials'] as const}
            value={inventoryMode}
            labels={{ amount: 'By amount', vials: type === 'peptide' ? 'By vials' : 'By container' }}
            onChange={setInventoryMode}
          />

          {inventoryMode === 'vials' ? (
            <View style={styles.mixRow}>
              <View style={styles.flex}>
                <TextField
                  label={type === 'peptide' ? 'Vials' : 'Containers'}
                  value={vialCount}
                  onChangeText={setVialCount}
                  keyboardType="decimal-pad"
                  placeholder="10"
                />
              </View>
              <View style={styles.flex}>
                <TextField
                  label={`Amount per ${type === 'peptide' ? 'vial' : 'container'} (${unit})`}
                  value={packSize}
                  onChangeText={setPackSize}
                  keyboardType="decimal-pad"
                  placeholder="10"
                />
              </View>
            </View>
          ) : (
            <TextField
              label={`Remaining (${unit})`}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="decimal-pad"
              placeholder="60"
            />
          )}

          <TextField
            label={`Alert below (${unit})`}
            value={threshold}
            onChangeText={setThreshold}
            keyboardType="decimal-pad"
            placeholder="10"
          />

          <View style={styles.toggleRow}>
            <View style={styles.flex}>
              <ThemedText type="body">Refill reminder</ThemedText>
              <ThemedText type="caption" themeColor="textSecondary">
                Ping when remaining reaches the threshold.
              </ThemedText>
            </View>
            <Switch
              value={refillReminder}
              onValueChange={setRefillReminder}
              trackColor={{ false: theme.border, true: theme.accent }}
              thumbColor="#F6FAF8"
            />
          </View>
        </View>
      ) : null}

      <FieldLabel label="Color" />
      <View style={styles.swatches}>
        {COLOR_SWATCHES.map((swatch) => {
          const selected = swatch === color;
          return (
            <Pressable
              key={swatch}
              onPress={() => setColor(swatch)}
              style={[
                styles.swatch,
                { backgroundColor: swatch, borderColor: selected ? theme.text : 'transparent' },
              ]}
            />
          );
        })}
      </View>

      <TextField
        label="Notes"
        value={notes}
        onChangeText={setNotes}
        placeholder="Optional — timing, brand, reconstitution..."
        multiline
      />

      {children}

      {error ? (
        <ThemedText type="callout" themeColor="danger">
          {error}
        </ThemedText>
      ) : null}

      <Button label={submitLabel} onPress={handleSubmit} />
    </View>
  );
}

function parseOptional(value: string): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseQuantity(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function FieldLabel({ label }: { label: string }) {
  return (
    <ThemedText type="captionBold" themeColor="textSecondary">
      {label}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
  typeRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  swatches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    borderWidth: 3,
  },
  mix: {
    gap: Spacing.two,
  },
  mixRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  flex: {
    flex: 1,
  },
});
