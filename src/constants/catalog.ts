import type { DoseUnit, SupplementForm, SupplementType } from '@/db/types';

export const TYPE_LABELS: Record<SupplementType, string> = {
  vitamin: 'Vitamin',
  peptide: 'Peptide',
  supplement: 'Supplement',
};

export const FORM_LABELS: Record<SupplementForm, string> = {
  capsule: 'Capsule',
  tablet: 'Tablet',
  powder: 'Powder',
  liquid: 'Liquid',
  injection: 'Injection',
  other: 'Other',
};

export const UNIT_LABELS: Record<DoseUnit, string> = {
  mg: 'mg',
  mcg: 'mcg',
  g: 'g',
  IU: 'IU',
  ml: 'ml',
  mcL: 'mcL',
  caps: 'caps',
  drops: 'drops',
};

export const COLOR_SWATCHES = [
  '#3EE0B7',
  '#A78BFA',
  '#F5C14C',
  '#5B8CFF',
  '#FF6B6B',
  '#F472B6',
  '#22D3EE',
  '#FB923C',
] as const;

export const TYPE_COLORS: Record<SupplementType, string> = {
  vitamin: '#A78BFA',
  peptide: '#F5C14C',
  supplement: '#3EE0B7',
};

export function formatDose(amount: number, unit: string): string {
  const rounded = Number.isInteger(amount) ? amount.toString() : amount.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
  return `${rounded} ${unit}`;
}
