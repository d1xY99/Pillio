import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';

import { TYPE_ART } from '@/constants/art';
import { Radius } from '@/constants/theme';
import type { SupplementType } from '@/db/types';

export function ArtThumb({
  type,
  source,
  size = 48,
}: {
  type?: SupplementType;
  source?: number;
  size?: number;
}) {
  return (
    <Image
      source={source ?? (type ? TYPE_ART[type] : undefined)}
      style={[styles.thumb, { width: size, height: size, borderRadius: Radius.sm }]}
      contentFit="cover"
    />
  );
}

const styles = StyleSheet.create({
  thumb: {
    backgroundColor: '#1C2128',
  },
});
