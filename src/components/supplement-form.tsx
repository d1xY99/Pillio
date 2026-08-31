import { type ReactNode, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

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
  const [error, setError] = useState<string | null>(null);

  function handleTypeChange(next: SupplementType) {
    setType(next);
    if ((COLOR_SWATCHES as readonly string[]).includes(color) && color === TYPE_COLORS[type]) {
      setColor(TYPE_COLORS[next]);
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

    onSubmit({
      name: trimmed,
      type,
      form,
      defaultAmount: parsed,
      defaultUnit: unit,
      color,
      notes: notes.trim() || null,
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
});
