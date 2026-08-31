import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { listProgressPhotos } from '@/db/queries/body';
import type { ProgressPhoto } from '@/db/schema';
import type { PhotoPose } from '@/db/types';
import { formatDayLabel } from '@/domain/time';
import { useTheme } from '@/hooks/use-theme';

const POSE_LABELS: Record<PhotoPose, string> = {
  front: 'Front',
  side: 'Side',
  back: 'Back',
  other: 'Other',
};

export default function ComparePhotosScreen() {
  const theme = useTheme();
  const photos = useMemo(() => listProgressPhotos(), []);
  const [leftId, setLeftId] = useState(photos[1]?.id ?? photos[0]?.id);
  const [rightId, setRightId] = useState(photos[0]?.id);
  const [picking, setPicking] = useState<'left' | 'right' | null>(null);

  const left = photos.find((photo) => photo.id === leftId);
  const right = photos.find((photo) => photo.id === rightId);

  if (photos.length < 2) {
    return (
      <Screen>
        <ThemedText type="headline">Need two photos</ThemedText>
        <ThemedText type="callout" themeColor="textSecondary">
          Add at least two progress photos to compare.
        </ThemedText>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.split}>
        <CompareSlot
          label="Earlier"
          photo={left}
          onPress={() => setPicking('left')}
          themeBorder={theme.border}
        />
        <CompareSlot
          label="Later"
          photo={right}
          onPress={() => setPicking('right')}
          themeBorder={theme.border}
        />
      </View>

      <ThemedText type="captionBold" themeColor="textTertiary">
        {picking ? `Choose ${picking} photo` : 'TAP A SIDE TO SWAP'}
      </ThemedText>
      <View style={styles.grid}>
        {photos.map((photo) => {
          const selected = photo.id === leftId || photo.id === rightId;
          return (
            <Pressable
              key={photo.id}
              onPress={() => {
                if (picking === 'left') {
                  setLeftId(photo.id);
                  setPicking(null);
                  return;
                }
                if (picking === 'right') {
                  setRightId(photo.id);
                  setPicking(null);
                  return;
                }
              }}
              style={[
                styles.thumb,
                { borderColor: selected ? theme.accent : theme.border },
              ]}>
              <Image source={{ uri: photo.localUri }} style={styles.thumbImage} contentFit="cover" />
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

function CompareSlot({
  label,
  photo,
  onPress,
  themeBorder,
}: {
  label: string;
  photo?: ProgressPhoto;
  onPress: () => void;
  themeBorder: string;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.slot, { borderColor: themeBorder }]}>
      {photo ? (
        <Image source={{ uri: photo.localUri }} style={styles.slotImage} contentFit="cover" />
      ) : (
        <View style={styles.slotImage} />
      )}
      <ThemedText type="captionBold">{label}</ThemedText>
      {photo ? (
        <ThemedText type="caption" themeColor="textSecondary">
          {POSE_LABELS[photo.pose as PhotoPose]} · {formatDayLabel(photo.takenAt)}
        </ThemedText>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  split: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  slot: {
    flex: 1,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    paddingBottom: Spacing.two,
    gap: 4,
  },
  slotImage: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: '#1C2128',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  thumb: {
    width: 72,
    height: 96,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    borderWidth: 2,
  },
  thumbImage: {
    flex: 1,
  },
});
