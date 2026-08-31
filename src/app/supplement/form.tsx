import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';

import { Screen } from '@/components/screen';
import { ScheduleFields } from '@/components/schedule-fields';
import { SupplementFormFields } from '@/components/supplement-form';
import { ThemedText } from '@/components/themed-text';
import { listSchedulesForSupplement } from '@/db/queries/schedules';
import {
  createSupplement,
  getSupplement,
  updateSupplement,
  type SupplementInput,
} from '@/db/queries/supplements';
import { saveSchedules } from '@/domain/doses';
import { DEFAULT_SCHEDULE, draftFromSchedules, type ScheduleDraft } from '@/domain/schedule';
import { startOfLocalDay } from '@/domain/time';

export default function SupplementFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const existing = id ? getSupplement(id) : undefined;
  const [schedule, setSchedule] = useState<ScheduleDraft>(() =>
    existing
      ? draftFromSchedules(listSchedulesForSupplement(existing.id))
      : { ...DEFAULT_SCHEDULE, startDate: startOfLocalDay() },
  );

  useEffect(() => {
    navigation.setOptions({ title: existing ? 'Edit item' : 'Add to stack' });
  }, [existing, navigation]);

  function onSubmit(input: SupplementInput) {
    if (schedule.times.length === 0) return;

    if (existing) {
      updateSupplement(existing.id, input);
      saveSchedules(existing.id, schedule);
      router.back();
      return;
    }

    const created = createSupplement(input);
    saveSchedules(created.id, schedule);
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
          onSubmit={onSubmit}>
          <ScheduleFields value={schedule} onChange={setSchedule} />
        </SupplementFormFields>
      </Screen>
    </KeyboardAvoidingView>
  );
}
