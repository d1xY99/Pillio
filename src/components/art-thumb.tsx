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
  source?: (typeof TYPE_ART)['vitamin'];
  size?: number;
}) {
  const resolved = source ?? (type ? TYPE_ART[type] : undefined) ?? TYPE_ART.vitamin;
  return (
    <Image
      source={resolved}
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
