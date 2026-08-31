import { desc } from 'drizzle-orm';
import { useLiveQuery } from '@/db/live';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

import { Button } from '@/components/button';
import { ChoiceChips } from '@/components/choice-chips';
import { EmptyState } from '@/components/empty-state';
import { HeroBanner } from '@/components/hero-banner';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ART } from '@/constants/art';
import { formatKg } from '@/constants/gym';
import { Radius, Spacing } from '@/constants/theme';
import { getDb } from '@/db/client';
import {
  addBodyWeight,
  addProgressPhoto,
  deleteBodyWeight,
  deleteProgressPhoto,
  getLatestBodyWeight,
  listBodyWeights,
  listProgressPhotos,
} from '@/db/queries/body';
import { bodyWeights, progressPhotos } from '@/db/schema';
import { PHOTO_POSES, type PhotoPose } from '@/db/types';
import { captureProgressPhoto, deletePhotoFile } from '@/domain/photos';
import { formatDayLabel } from '@/domain/time';
import { useTheme } from '@/hooks/use-theme';
import { confirmAction } from '@/lib/confirm';

const POSE_LABELS: Record<PhotoPose, string> = {
  front: 'Front',
  side: 'Side',
  back: 'Back',
  other: 'Other',
};

const POSE_FILTER = ['all', ...PHOTO_POSES] as const;
const POSE_FILTER_LABELS = {
  all: 'All',
  ...POSE_LABELS,
};

export default function ProgressScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const db = getDb();
  const { updatedAt: weightTick } = useLiveQuery(
    db.select().from(bodyWeights).orderBy(desc(bodyWeights.loggedAt)),
  );
  const { updatedAt: photoTick } = useLiveQuery(
    db.select().from(progressPhotos).orderBy(desc(progressPhotos.takenAt)),
  );
  const [weight, setWeight] = useState('');
  const [pose, setPose] = useState<PhotoPose>('front');
  const [filter, setFilter] = useState<(typeof POSE_FILTER)[number]>('all');

  const latest = useMemo(() => getLatestBodyWeight(), [weightTick]);
  const weights = useMemo(() => listBodyWeights(60), [weightTick]);
  const photos = useMemo(
    () => listProgressPhotos(filter === 'all' ? undefined : filter),
    [photoTick, filter],
  );
  const chartData = [...weights].reverse().map((row) => ({ value: row.weightKg }));
  const tile = (width - Spacing.four * 2 - Spacing.two * 2) / 3;

  return (
    <Screen>
      <ScreenHeader title="Progress" subtitle="Body weight and photos" />

      <HeroBanner
        source={ART.progress}
        kicker="PHYSIQUE"
        title={latest ? formatKg(latest.weightKg) : 'Log the first weigh-in.'}
        body={latest ? formatDayLabel(latest.loggedAt) : 'Track weight and compare photos over time.'}
      />

      <View style={[styles.hero, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <ThemedText type="captionBold" themeColor="textTertiary">
          CURRENT WEIGHT
        </ThemedText>
        <ThemedText type="display">{latest ? formatKg(latest.weightKg) : '—'}</ThemedText>
        {latest ? (
          <ThemedText type="caption" themeColor="textSecondary">
            {formatDayLabel(latest.loggedAt)}
          </ThemedText>
        ) : null}
      </View>

      <View style={styles.row}>
        <View style={styles.flex}>
          <TextField
            label="Log weight (kg)"
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
            placeholder="82.4"
          />
        </View>
      </View>
      <Button
        label="Save weight"
        onPress={() => {
          const value = Number(weight);
          if (!Number.isFinite(value) || value <= 0) return;
          addBodyWeight({ weightKg: value });
          setWeight('');
        }}
      />

      {chartData.length >= 2 ? (
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <LineChart
            data={chartData}
            width={Math.max(220, width - 80)}
            height={140}
            color={theme.accent}
            thickness={3}
            hideRules
            yAxisColor={theme.border}
            xAxisColor={theme.border}
            yAxisTextStyle={{ color: theme.textTertiary, fontSize: 11 }}
            dataPointsColor={theme.accent}
            backgroundColor="transparent"
            isAnimated={false}
            adjustToWidth
          />
        </View>
      ) : null}

      {weights.length > 0 ? (
        <View style={styles.section}>
          {weights.slice(0, 6).map((row) => (
            <View key={row.id} style={styles.weightRow}>
              <ThemedText type="callout">
                {formatDayLabel(row.loggedAt)} · {formatKg(row.weightKg)}
              </ThemedText>
              <Pressable onPress={() => deleteBodyWeight(row.id)}>
                <ThemedText type="captionBold" themeColor="danger">
                  Delete
                </ThemedText>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.photosHeader}>
        <ThemedText type="headline">Photos</ThemedText>
        {photos.length >= 2 ? (
          <Pressable onPress={() => router.push('/photo/compare')}>
            <ThemedText type="callout" themeColor="accent">
              Compare
            </ThemedText>
          </Pressable>
        ) : null}
      </View>

      <ThemedText type="captionBold" themeColor="textSecondary">
        Pose for next photo
      </ThemedText>
      <ChoiceChips options={PHOTO_POSES} value={pose} labels={POSE_LABELS} onChange={setPose} />

      <View style={styles.photoActions}>
        <View style={styles.flex}>
          <Button
            label="Camera"
            variant="secondary"
            onPress={() => {
              void captureProgressPhoto('camera').then((uri) => {
                if (uri) addProgressPhoto({ localUri: uri, pose });
              });
            }}
          />
        </View>
        <View style={styles.flex}>
          <Button
            label="Library"
            variant="secondary"
            onPress={() => {
              void captureProgressPhoto('library').then((uri) => {
                if (uri) addProgressPhoto({ localUri: uri, pose });
              });
            }}
          />
        </View>
      </View>

      <ChoiceChips
        options={POSE_FILTER}
        value={filter}
        labels={POSE_FILTER_LABELS}
        onChange={setFilter}
      />

      {photos.length === 0 ? (
        <EmptyState
          icon="camera.fill"
          title="No photos yet"
          body="Add front, side, or back shots so you can compare how you look over time."
        />
      ) : (
        <View style={styles.grid}>
          {photos.map((photo) => (
            <Pressable
              key={photo.id}
              onLongPress={() => {
                void confirmAction(
                  'Delete photo?',
                  'This removes it from Pillio on this device.',
                  'Delete',
                ).then((ok) => {
                  if (!ok) return;
                  deletePhotoFile(photo.localUri);
                  deleteProgressPhoto(photo.id);
                });
              }}
              style={[styles.tile, { width: tile, height: tile * 1.25 }]}>
              <Image source={{ uri: photo.localUri }} style={styles.image} contentFit="cover" />
              <View style={styles.caption}>
                <ThemedText type="captionBold">{POSE_LABELS[photo.pose as PhotoPose]}</ThemedText>
                <ThemedText type="caption" themeColor="textTertiary">
                  {formatDayLabel(photo.takenAt)}
                </ThemedText>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.four,
    marginBottom: Spacing.three,
    gap: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  flex: {
    flex: 1,
  },
  card: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    marginTop: Spacing.three,
    marginBottom: Spacing.three,
  },
  section: {
    gap: Spacing.two,
    marginTop: Spacing.three,
    marginBottom: Spacing.four,
  },
  weightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  photosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
    marginTop: Spacing.two,
  },
  photoActions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginVertical: Spacing.three,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    paddingBottom: Spacing.six,
  },
  tile: {
    borderRadius: Radius.sm,
    overflow: 'hidden',
  },
  image: {
    flex: 1,
    backgroundColor: '#1C2128',
  },
  caption: {
    padding: Spacing.one,
    gap: 2,
  },
});
