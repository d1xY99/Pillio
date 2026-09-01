export const HABIT_CATEGORIES = [
  { id: 'health', label: 'Health' },
  { id: 'mind', label: 'Mind' },
  { id: 'move', label: 'Move' },
  { id: 'home', label: 'Home' },
  { id: 'social', label: 'Social' },
  { id: 'focus', label: 'Focus' },
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
