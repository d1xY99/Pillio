import { Platform } from 'react-native';

import type { SupplementType } from '@/db/types';

const native = {
  vitamin: require('../../assets/images/art/vitamin.jpg'),
  peptide: require('../../assets/images/art/peptide.jpg'),
  supplement: require('../../assets/images/art/supplement.jpg'),
  train: require('../../assets/images/art/train.jpg'),
  progress: require('../../assets/images/art/progress.jpg'),
  hero: require('../../assets/images/art/hero.jpg'),
};

const web = {
  vitamin: { uri: '/art/vitamin.jpg?v=2' },
  peptide: { uri: '/art/peptide.jpg?v=2' },
  supplement: { uri: '/art/supplement.jpg?v=2' },
  train: { uri: '/art/train.jpg?v=2' },
  progress: { uri: '/art/progress.jpg?v=2' },
  hero: { uri: '/art/hero.jpg?v=2' },
};

export const ART = Platform.OS === 'web' ? web : native;

export const TYPE_ART: Record<SupplementType, (typeof ART)['vitamin']> = {
  vitamin: ART.vitamin,
  peptide: ART.peptide,
  supplement: ART.supplement,
};
