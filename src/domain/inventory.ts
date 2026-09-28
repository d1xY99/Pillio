import type { Supplement } from '@/db/schema';

export function isLowStock(
  supplement: Pick<Supplement, 'trackInventory' | 'quantityOnHand' | 'lowStockThreshold'>,
): boolean {
  if (!supplement.trackInventory) return false;
  if (supplement.quantityOnHand == null) return false;
  if (supplement.lowStockThreshold == null) return false;
  return supplement.quantityOnHand <= supplement.lowStockThreshold;
}

export function inventoryUnit(supplement: Pick<Supplement, 'inventoryUnit' | 'defaultUnit'>): string {
  return supplement.inventoryUnit ?? supplement.defaultUnit;
}

export function doseInventoryDelta(
  supplement: Pick<Supplement, 'inventoryUnit' | 'defaultUnit'>,
  dose: { amount: number; unit: string },
): number {
  const tracked = inventoryUnit(supplement);
  if (dose.unit === tracked || dose.unit === supplement.defaultUnit) return dose.amount;
  return 0;
}
