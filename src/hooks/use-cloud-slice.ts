import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

import { pullSlice, type CloudSlice } from '@/sync/cloud';

export function useCloudSlice(slice: CloudSlice) {
  useFocusEffect(
    useCallback(() => {
      void pullSlice(slice);
    }, [slice]),
  );
}
