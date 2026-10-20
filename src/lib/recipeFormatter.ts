import { Recipe, BrewMetrics, UnitSystem } from '@/types/brewing';
import {
  formatWeightLbs,
  ozToDisplay,
  galToDisplay,
  tempFToDisplay,
} from './units';

export function formatRecipeForEmail(
  recipe: Recipe,
  metrics: BrewMetrics,
  unitSystem: UnitSystem
): { subject: string; body: string } {
  const volUnit = unitSystem === 'metric' ? 'L' : 'gal';
  const hopUnit = unitSystem === 'metric' ? 'g' : 'oz';
  const tempUnit = unitSystem === 'metric' ? '°C' : '°F';

  const fermentableLines = recipe.fermentables
    .map((f) => {
      const b = metrics.fermentableBreakdown.find(
        (x) => x.instanceId === f.instanceId
      );
      const pct = b ? `${b.percentageOfGrist}%` : '';
      return `• ${formatWeightLbs(f.weightLbs, unitSystem)} (${pct}) — ${f.name} [${f.category.toUpperCase()}, Stage: ${f.stage}] (${f.colorLovibond}°L, ${f.ppg} PPG)`;
    })
    .join('\n');

  const hopLines = recipe.hops
    .map((h) => {
      const b = metrics.hopBreakdown.find(
        (x) => x.instanceId === h.instanceId
      );
      const ibu = b ? `${b.ibuContribution.toFixed(1)} IBU` : '0 IBU';
      const timeLabel =
        h.use === 'dry-hop' ? `${h.timeMinutes} days` : `${h.timeMinutes} min`;
      return `• ${ozToDisplay(h.weightOz, unitSystem)} ${hopUnit} — ${h.name} (${h.alphaAcid}% AA) @ ${h.use.toUpperCase()} (${timeLabel}) -> ${ibu}`;
    })
    .join('\n');

  const yeastLines = recipe.yeasts
    .map(
      (y) =>
        `• ${y.packs} pack(s) — ${y.name} (${y.lab} ${y.productId}) | Attenuation: ${y.customAttenuation}% | Ideal Temp: ${tempFToDisplay(y.tempMinF, unitSystem)}–${tempFToDisplay(y.tempMaxF, unitSystem)}${tempUnit}`
    )
    .join('\n');

  const mashLines = recipe.mashSteps
    .map(
      (s, idx) =>
        `${idx + 1}. ${s.name}: ${tempFToDisplay(s.targetTempF, unitSystem)}${tempUnit} for ${s.durationMinutes} min`
    )
    .join('\n');

  const subject = `Homebrew Recipe: ${recipe.name} (${recipe.styleName})`;

  const body = `${recipe.name.toUpperCase()}
Style: ${recipe.styleName}
Formulated: ${recipe.formulatedAt || recipe.updatedAt.split('T')[0]} | Last Updated: ${recipe.updatedAt.split('T')[0]}
Method: ${recipe.method.toUpperCase()} | Batch Size: ${galToDisplay(recipe.equipment.batchVolumeGal, unitSystem)} ${volUnit} | Efficiency: ${recipe.equipment.brewhouseEfficiency}%
==================================================
VITAL STATISTICS
• Est. ABV: ${metrics.abv.toFixed(1)}%
• Original Gravity (OG): ${metrics.og.toFixed(3)} (Pre-Boil: ${metrics.preBoilGravity.toFixed(3)})
• Final Gravity (FG): ${metrics.fg.toFixed(3)}
• Bitterness: ${metrics.ibu.toFixed(1)} IBU (BU:GU Ratio: ${metrics.buGuRatio})
• Color: ${metrics.srm} SRM (${metrics.ebc} EBC)
• Est. Mash pH: ${metrics.estimatedMashPh.toFixed(2)}

FERMENTABLES (GRAINS, HONEY, SUGARS & ADJUNCTS) — Total: ${formatWeightLbs(metrics.totalFermentablesLbs, unitSystem)}
${fermentableLines}

HOP SCHEDULE — Total: ${ozToDisplay(metrics.totalHopsOz, unitSystem)} ${hopUnit}
${hopLines}

YEAST & FERMENTATION
${yeastLines}
• Target Pitch Rate: ${metrics.requiredCellsBillions}B cells (Pitched: ${metrics.pitchedCellsBillions}B cells)

MASH & WATER SCHEDULE
• Strike Water: ${galToDisplay(metrics.strikeWaterGal, unitSystem)} ${volUnit} heated to ${tempFToDisplay(metrics.strikeWaterTempF, unitSystem)}${tempUnit}
• Sparge Water: ${galToDisplay(metrics.spargeWaterGal, unitSystem)} ${volUnit}
• Total Water Needed: ${galToDisplay(metrics.totalWaterNeededGal, unitSystem)} ${volUnit}
${mashLines}

WATER CHEMISTRY & SALTS
• Resulting Ions (ppm): Ca ${metrics.resultingWater.calcium} | Mg ${metrics.resultingWater.magnesium} | Na ${metrics.resultingWater.sodium} | Cl ${metrics.resultingWater.chloride} | SO4 ${metrics.resultingWater.sulfate} | HCO3 ${metrics.resultingWater.bicarbonate}
• SO4:Cl Ratio: ${metrics.sulfateToChlorideRatio}:1 (${metrics.sulfateChlorideBalanceLabel})
• Additions: Gypsum ${recipe.saltAdditions.gypsumGrams}g | CaCl2 ${recipe.saltAdditions.calciumChlorideGrams}g | Epsom ${recipe.saltAdditions.epsomSaltGrams}g | Baking Soda ${recipe.saltAdditions.bakingSodaGrams}g | 88% Lactic Acid ${recipe.saltAdditions.lacticAcid88Ml}mL

BREWER'S NOTES
${recipe.notes || 'None'}
`;

  return { subject, body };
}
