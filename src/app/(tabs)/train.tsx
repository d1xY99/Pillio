import { EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';

export default function TrainScreen() {
  return (
    <Screen>
      <ScreenHeader title="Train" subtitle="Working weights and sessions" />
      <EmptyState
        icon="dumbbell.fill"
        title="No workouts yet"
        body="Log sets with weight and reps. Each exercise remembers the last load you used."
      />
    </Screen>
  );
}
