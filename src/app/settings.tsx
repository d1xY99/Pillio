import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { useSettingsDrawer } from '@/settings/drawer-context';

export default function SettingsScreen() {
  const router = useRouter();
  const { show } = useSettingsDrawer();

  useEffect(() => {
    show();
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, [router, show]);

  return null;
}
