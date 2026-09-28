export const NOTE_CATEGORIES = [
  { id: 'general', label: 'General', kicker: 'Anything', emoji: '📝', color: '#3EE0B7' },
  { id: 'health', label: 'Health', kicker: 'Body', emoji: '🩺', color: '#7DD3FC' },
  { id: 'training', label: 'Training', kicker: 'Gym', emoji: '🏋️', color: '#C4B5FD' },
  { id: 'diet', label: 'Diet', kicker: 'Fuel', emoji: '🥗', color: '#86EFAC' },
  { id: 'ideas', label: 'Ideas', kicker: 'Sparks', emoji: '💡', color: '#F5C14C' },
  { id: 'reminders', label: 'Reminders', kicker: 'To do', emoji: '⏰', color: '#FF8B7B' },
] as const;

export type NoteCategory = (typeof NOTE_CATEGORIES)[number]['id'];

export const NOTE_COLORS = [
  '#3EE0B7',
  '#7DD3FC',
  '#C4B5FD',
  '#86EFAC',
  '#F5C14C',
  '#FF8B7B',
  '#F9A8D4',
  '#FDBA74',
];

export function noteCategory(id: string) {
  return NOTE_CATEGORIES.find((item) => item.id === id) ?? NOTE_CATEGORIES[0];
}

export function noteCategoryLabel(id: string) {
  return noteCategory(id).label;
}

export function noteCategoryColor(id: string) {
  return noteCategory(id).color;
}
