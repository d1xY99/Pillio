export const SUPPLEMENT_TYPES = ['vitamin', 'peptide', 'supplement'] as const;
export type SupplementType = (typeof SUPPLEMENT_TYPES)[number];

export const SUPPLEMENT_FORMS = [
  'capsule',
  'tablet',
  'powder',
  'liquid',
  'injection',
  'other',
] as const;
export type SupplementForm = (typeof SUPPLEMENT_FORMS)[number];

export const DOSE_UNITS = ['mg', 'mcg', 'g', 'IU', 'ml', 'mcL', 'caps', 'drops'] as const;
export type DoseUnit = (typeof DOSE_UNITS)[number];

export const DRAW_DISPLAYS = ['units', 'ml'] as const;
export type DrawDisplay = (typeof DRAW_DISPLAYS)[number];

export const SCHEDULE_FREQUENCIES = ['daily', 'weekly', 'every_n_days', 'weekdays', 'cycle'] as const;
export type ScheduleFrequency = (typeof SCHEDULE_FREQUENCIES)[number];

export const PHOTO_POSES = ['front', 'side', 'back', 'other'] as const;
export type PhotoPose = (typeof PHOTO_POSES)[number];

export const MUSCLE_GROUPS = [
  'chest',
  'back',
  'shoulders',
  'arms',
  'legs',
  'core',
  'full_body',
] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];
