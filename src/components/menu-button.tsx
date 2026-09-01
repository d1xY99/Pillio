import { IconButton } from '@/components/icon-button';
import { useSettingsDrawer } from '@/settings/drawer-context';

export function MenuButton() {
  const { show } = useSettingsDrawer();
  return <IconButton name="gearshape" accessibilityLabel="Open menu" onPress={show} />;
}
