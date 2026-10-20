import { UnitSystem } from '@/types/brewing';

export function formatWeightLbs(lbs: number, unit: UnitSystem): string {
  if (unit === 'metric') {
    const kg = lbs * 0.453592;
    return kg >= 1 ? `${kg.toFixed(2)} kg` : `${Math.round(kg * 1000)} g`;
  }
  return `${lbs.toFixed(2)} lbs`;
}

export function lbsToDisplay(lbs: number, unit: UnitSystem): number {
  return unit === 'metric'
    ? Number((lbs * 0.453592).toFixed(2))
    : Number(lbs.toFixed(2));
}

export function displayToLbs(val: number, unit: UnitSystem): number {
  return unit === 'metric'
    ? Number((val / 0.453592).toFixed(3))
    : Number(val.toFixed(3));
}

export function ozToDisplay(oz: number, unit: UnitSystem): number {
  return unit === 'metric'
    ? Number((oz * 28.3495).toFixed(1))
    : Number(oz.toFixed(2));
}

export function displayToOz(val: number, unit: UnitSystem): number {
  return unit === 'metric'
    ? Number((val / 28.3495).toFixed(3))
    : Number(val.toFixed(3));
}

export function galToDisplay(gal: number, unit: UnitSystem): number {
  return unit === 'metric'
    ? Number((gal * 3.78541).toFixed(2))
    : Number(gal.toFixed(2));
}

export function displayToGal(val: number, unit: UnitSystem): number {
  return unit === 'metric'
    ? Number((val / 3.78541).toFixed(2))
    : Number(val.toFixed(2));
}

export function tempFToDisplay(tempF: number, unit: UnitSystem): number {
  return unit === 'metric'
    ? Number((((tempF - 32) * 5) / 9).toFixed(1))
    : Number(tempF.toFixed(1));
}

export function displayToTempF(val: number, unit: UnitSystem): number {
  return unit === 'metric'
    ? Number(((val * 9) / 5 + 32).toFixed(1))
    : Number(val.toFixed(1));
}
