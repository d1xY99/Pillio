const U100_UNITS_PER_ML = 100;

export type PeptideMixInput = {
  vialMg: number;
  bacMl: number;
  doseAmount: number;
  doseUnit: string;
};

export type PeptideMix =
  | { ok: false; error: string }
  | {
      ok: true;
      doseMcg: number;
      mcgPerMl: number;
      volumeMl: number;
      units: number;
      unitsLabel: string;
      overfill: boolean;
    };

export function peptideMix(input: PeptideMixInput): PeptideMix {
  const vialMg = Number(input.vialMg);
  const bacMl = Number(input.bacMl);
  const doseAmount = Number(input.doseAmount);
  if (!(vialMg > 0)) return { ok: false, error: 'Vial mg must be greater than zero.' };
  if (!(bacMl > 0)) return { ok: false, error: 'BAC ml must be greater than zero.' };
  if (!(doseAmount > 0)) return { ok: false, error: 'Dose must be greater than zero.' };

  const vialMcg = vialMg * 1000;
  const mcgPerMl = vialMcg / bacMl;
  const unit = input.doseUnit.toLowerCase();
  const doseMcg = unit === 'mg' ? doseAmount * 1000 : unit === 'mcg' ? doseAmount : null;
  const volumeMl = unit === 'ml' ? doseAmount : doseMcg != null ? doseMcg / mcgPerMl : null;
  if (volumeMl == null || !Number.isFinite(volumeMl)) {
    return { ok: false, error: 'Use mcg, mg, or ml for the dose.' };
  }

  const units = volumeMl * U100_UNITS_PER_ML;
  const rounded = Math.round(units * 10) / 10;
  const label = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return {
    ok: true,
    doseMcg: doseMcg ?? volumeMl * mcgPerMl,
    mcgPerMl,
    volumeMl,
    units: rounded,
    unitsLabel: `${label} unit${rounded === 1 ? '' : 's'}`,
    overfill: rounded > 100,
  };
}

export function formatPeptideDraw(
  vialMg?: number | null,
  bacMl?: number | null,
  doseAmount?: number,
  doseUnit?: string,
): string | null {
  if (vialMg == null || bacMl == null || doseAmount == null || !doseUnit) return null;
  const mix = peptideMix({ vialMg, bacMl, doseAmount, doseUnit });
  return mix.ok ? mix.unitsLabel : null;
}
