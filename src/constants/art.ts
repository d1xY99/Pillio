import { Platform } from 'react-native';

import type { SupplementType } from '@/db/types';

const native = {
  vitamin: require('../../assets/images/art/vitamin.jpg'),
  peptide: require('../../assets/images/art/peptide.jpg'),
  supplement: require('../../assets/images/art/supplement.jpg'),
  train: require('../../assets/images/art/train.jpg'),
  progress: require('../../assets/images/art/progress.jpg'),
  hero: require('../../assets/images/art/hero.jpg'),
  habitHero: require('../../assets/images/art/habit-hero.jpg'),
  habitHealth: require('../../assets/images/art/habit-health.jpg'),
  habitMind: require('../../assets/images/art/habit-mind.jpg'),
  habitMove: require('../../assets/images/art/habit-move.jpg'),
  habitHome: require('../../assets/images/art/habit-home.jpg'),
  habitSocial: require('../../assets/images/art/habit-social.jpg'),
  habitFocus: require('../../assets/images/art/habit-focus.jpg'),
};

const web = {
  vitamin: { uri: '/art/vitamin.jpg?v=3' },
  peptide: { uri: '/art/peptide.jpg?v=2' },
  supplement: { uri: '/art/supplement.jpg?v=2' },
  train: { uri: '/art/train.jpg?v=2' },
  progress: { uri: '/art/progress.jpg?v=2' },
  hero: { uri: '/art/hero.jpg?v=2' },
  habitHero: { uri: '/art/habit-hero.jpg?v=1' },
  habitHealth: { uri: '/art/habit-health.jpg?v=1' },
  habitMind: { uri: '/art/habit-mind.jpg?v=1' },
  habitMove: { uri: '/art/habit-move.jpg?v=1' },
  habitHome: { uri: '/art/habit-home.jpg?v=1' },
  habitSocial: { uri: '/art/habit-social.jpg?v=1' },
  habitFocus: { uri: '/art/habit-focus.jpg?v=1' },
};

export const ART = Platform.OS === 'web' ? web : native;

export const TYPE_ART: Record<SupplementType, (typeof ART)['vitamin']> = {
  vitamin: ART.vitamin,
  peptide: ART.peptide,
  supplement: ART.supplement,
};
