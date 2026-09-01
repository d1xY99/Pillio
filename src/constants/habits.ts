import { ART } from '@/constants/art';

export const HABIT_CATEGORIES = [
  { id: 'health', label: 'Health', kicker: 'Body', art: 'habitHealth' },
  { id: 'mind', label: 'Mind', kicker: 'Calm', art: 'habitMind' },
  { id: 'move', label: 'Move', kicker: 'Motion', art: 'habitMove' },
  { id: 'home', label: 'Home', kicker: 'Space', art: 'habitHome' },
  { id: 'social', label: 'Social', kicker: 'People', art: 'habitSocial' },
  { id: 'focus', label: 'Focus', kicker: 'Work', art: 'habitFocus' },
] as const;

export type HabitCategory = (typeof HABIT_CATEGORIES)[number]['id'];

export const HABIT_EMOJIS = [
  '💧',
  '🧘',
  '📖',
  '🚶',
  '☀️',
  '🧊',
  '🧠',
  '🧹',
  '🙏',
  '✍️',
  '🥗',
  '💤',
  '🚿',
  '🎯',
  '🏃',
  '🫁',
  '🦷',
  '📵',
  '🎵',
  '📱',
  '🌿',
  '🫖',
  '📓',
  '💪',
];

export const HABIT_COLORS = ['#3EE0B7', '#C4B5FD', '#F5C14C', '#FF8B7B', '#7DD3FC', '#F9A8D4', '#86EFAC', '#FDBA74'];

export function habitCategoryArt(id: string) {
  const row = HABIT_CATEGORIES.find((item) => item.id === id);
  const key = row?.art ?? 'habitHero';
  return ART[key as keyof typeof ART] ?? ART.habitHero;
}
