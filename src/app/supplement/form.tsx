import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';

import { Screen } from '@/components/screen';
import { SupplementFormFields } from '@/components/supplement-form';
import { ThemedText } from '@/components/themed-text';
import {
  createSupplement,
  getSupplement,
  updateSupplement,
  type SupplementInput,
} from '@/db/queries/supplements';

export default function SupplementFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const existing = id ? getSupplement(id) : undefined;

  useEffect(() => {
    navigation.setOptions({ title: existing ? 'Edit item' : 'Add to stack' });
  }, [existing, navigation]);

  function onSubmit(input: SupplementInput) {
    if (existing) {
      updateSupplement(existing.id, input);
      router.back();
      return;
    }

    const created = createSupplement(input);
    router.replace({ pathname: '/supplement/[id]', params: { id: created.id } });
  }

  if (id && !existing) {
    return (
      <Screen>
        <ThemedText type="headline">Item not found</ThemedText>
      </Screen>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <SupplementFormFields
          initial={
            existing
              ? {
                  name: existing.name,
                  type: existing.type as SupplementInput['type'],
                  form: existing.form as SupplementInput['form'],
                  defaultAmount: existing.defaultAmount,
                  defaultUnit: existing.defaultUnit as SupplementInput['defaultUnit'],
                  color: existing.color,
                  notes: existing.notes,
                }
              : undefined
          }
          submitLabel={existing ? 'Save changes' : 'Add to stack'}
          onSubmit={onSubmit}
        />
      </Screen>
    </KeyboardAvoidingView>
  );
}
