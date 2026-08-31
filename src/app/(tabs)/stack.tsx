import { EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';

export default function StackScreen() {
  return (
    <Screen>
      <ScreenHeader
        title="Stack"
        subtitle="Vitamins, peptides, and supplements"
      />
      <EmptyState
        icon="pills.fill"
        title="Nothing in your stack"
        body="Track each item, its dose, and when it is due. History will show what you have used so far."
      />
    </Screen>
  );
}
