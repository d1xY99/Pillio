import { EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';

export default function ProgressScreen() {
  return (
    <Screen>
      <ScreenHeader title="Progress" subtitle="Body weight and photos" />
      <EmptyState
        icon="camera.fill"
        title="No check-ins yet"
        body="Log your current weight and add photos so you can compare how you look over time."
      />
    </Screen>
  );
}
