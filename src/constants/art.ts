import type { SupplementType } from '@/db/types';

export const ART = {
  vitamin: require('../../assets/images/art/vitamin.jpg'),
  peptide: require('../../assets/images/art/peptide.jpg'),
  supplement: require('../../assets/images/art/supplement.jpg'),
  train: require('../../assets/images/art/train.jpg'),
  progress: require('../../assets/images/art/progress.jpg'),
  hero: require('../../assets/images/art/hero.jpg'),
};

export const TYPE_ART: Record<SupplementType, typeof ART.vitamin> = {
  vitamin: ART.vitamin,
  peptide: ART.peptide,
  supplement: ART.supplement,
};
