import {
  Recipe,
  BrewMetrics,
  WaterProfile,
  SaltAdditions,
} from '@/types/brewing';

// SRM to Hex Color mapping (1 to 40+ SRM)
const SRM_COLOR_MAP: Record<number, string> = {
  1: '#FFE699',
  2: '#FFD878',
  3: '#FFCA5A',
  4: '#FFBF42',
  5: '#FBB123',
  6: '#F8A600',
  7: '#F39C00',
  8: '#EA8F00',
  9: '#E58500',
  10: '#DE7C00',
  11: '#D77200',
  12: '#CF6900',
  13: '#CB6200',
  14: '#C35900',
  15: '#BB5100',
  16: '#B54C00',
  17: '#B04500',
  18: '#A63E00',
  19: '#A13700',
  20: '#9B3200',
  21: '#952D00',
  22: '#8E2900',
  23: '#882300',
  24: '#821E00',
  25: '#7B1A00',
  26: '#771900',
  27: '#701400',
  28: '#6A0E00',
  29: '#660D00',
  30: '#5E0B00',
  31: '#5A0A02',
  32: '#600903',
  33: '#520907',
  34: '#4C0505',
  35: '#470606',
  36: '#440607',
  37: '#3F0708',
  38: '#3B0607',
  39: '#3A070B',
  40: '#36080A',
};

export function srmToHex(srm: number): string {
  const clamped = Math.max(1, Math.min(40, Math.round(srm)));
  return SRM_COLOR_MAP[clamped] || '#240506';
}

export function sgToPlato(sg: number): number {
  if (sg <= 1) return 0;
  return (
    -616.868 +
    1111.14 * sg -
    630.272 * Math.pow(sg, 2) +
    135.997 * Math.pow(sg, 3)
  );
}

/**
 * Calculates resulting water ion concentrations (ppm / mg/L) given source water,
 * total water volume (gallons), and salt additions (grams).
 */
export function calculateWaterChemistry(
  source: WaterProfile,
  saltAdditions: SaltAdditions,
  totalWaterGal: number
): {
  resultingWater: WaterProfile;
  sulfateToChlorideRatio: number;
  sulfateChlorideBalanceLabel: string;
} {
  const volLiters = Math.max(1, totalWaterGal * 3.78541);

  // Ion contributions per 1 gram of salt in 1 Liter of water (mg/L):
  // Gypsum (CaSO4 * 2H2O): 232.8 ppm Ca, 557.7 ppm SO4
  // Calcium Chloride (CaCl2 * 2H2O): 272.6 ppm Ca, 482.3 ppm Cl
  // Epsom Salt (MgSO4 * 7H2O): 98.6 ppm Mg, 389.6 ppm SO4
  // Baking Soda (NaHCO3): 273.7 ppm Na, 726.3 ppm HCO3
  // Chalk (CaCO3): 400.4 ppm Ca, 600.0 ppm HCO3 (approx effective)

  const caAdded =
    (saltAdditions.gypsumGrams * 232.8 +
      saltAdditions.calciumChlorideGrams * 272.6 +
      saltAdditions.chalkGrams * 200.0) /
    volLiters;

  const mgAdded = (saltAdditions.epsomSaltGrams * 98.6) / volLiters;
  const naAdded = (saltAdditions.bakingSodaGrams * 273.7) / volLiters;
  const clAdded = (saltAdditions.calciumChlorideGrams * 482.3) / volLiters;
  const so4Added =
    (saltAdditions.gypsumGrams * 557.7 +
      saltAdditions.epsomSaltGrams * 389.6) /
    volLiters;
  const hco3Added =
    (saltAdditions.bakingSodaGrams * 726.3 +
      saltAdditions.chalkGrams * 300.0 -
      saltAdditions.lacticAcid88Ml * 580.0) /
    volLiters;

  const resultingWater: WaterProfile = {
    id: 'resulting',
    name: 'Resulting Brew Water',
    description: 'Calculated water profile after salt and acid additions',
    calcium: Math.max(0, Math.round(source.calcium + caAdded)),
    magnesium: Math.max(0, Math.round(source.magnesium + mgAdded)),
    sodium: Math.max(0, Math.round(source.sodium + naAdded)),
    chloride: Math.max(0, Math.round(source.chloride + clAdded)),
    sulfate: Math.max(0, Math.round(source.sulfate + so4Added)),
    bicarbonate: Math.max(0, Math.round(source.bicarbonate + hco3Added)),
  };

  const ratio =
    resultingWater.chloride > 0
      ? Number((resultingWater.sulfate / resultingWater.chloride).toFixed(2))
      : resultingWater.sulfate;

  let balanceLabel = 'Balanced';
  if (ratio < 0.6) balanceLabel = 'Very Malty / Soft / Juicy';
  else if (ratio < 0.9) balanceLabel = 'Malt-Forward / Round';
  else if (ratio <= 1.4) balanceLabel = 'Balanced';
  else if (ratio <= 2.2) balanceLabel = 'Crisp / Hop-Forward';
  else balanceLabel = 'Very Crisp / Assertive Bittering';

  return {
    resultingWater,
    sulfateToChlorideRatio: ratio,
    sulfateChlorideBalanceLabel: balanceLabel,
  };
}

export function calculateBrewMetrics(recipe: Recipe): BrewMetrics {
  const { equipment, fermentables, hops, yeasts, mashSteps } = recipe;
  const batchVol = Math.max(0.5, equipment.batchVolumeGal);
  const effFraction = Math.max(0.1, Math.min(1, equipment.brewhouseEfficiency / 100));

  const totalFermentablesLbs = fermentables.reduce(
    (sum, f) => sum + Math.max(0, f.weightLbs),
    0
  );

  // Mashed grains vs non-mashed sugars/honey/extract
  const mashedFermentables = fermentables.filter(
    (f) => f.category === 'grain' || f.category === 'adjunct'
  );
  const totalGrainWeightLbs = mashedFermentables.reduce(
    (sum, f) => sum + Math.max(0, f.weightLbs),
    0
  );

  // Diastatic Power (weighted average across mashed grains & adjuncts)
  const totalLintnerPoints = mashedFermentables.reduce(
    (sum, f) => sum + Math.max(0, f.weightLbs) * (f.diastaticPower || 0),
    0
  );
  const averageDiastaticPower =
    totalGrainWeightLbs > 0
      ? Math.round(totalLintnerPoints / totalGrainWeightLbs)
      : 0;
  // Minimum ~35 °Lintner is required for self-conversion in an all-grain mash
  const hasSufficientDiastaticPower =
    recipe.method === 'extract' ||
    totalGrainWeightLbs === 0 ||
    averageDiastaticPower >= 35;

  // Calculate Gravity Points (GU) and individual fermentability
  let totalGravityUnits = 0;
  let preBoilGravityUnits = 0;
  let totalResidualGravityUnits = 0;
  let totalMcu = 0;

  // Yeast base attenuation
  const primaryYeast = yeasts[0];
  const yeastAttenuation = primaryYeast
    ? primaryYeast.customAttenuation / 100
    : 0.77;

  // Mash temperature adjustment on grain fermentability:
  // Baseline saccharification is 152°F. Higher mash temp creates more unfermentable dextrins.
  const mainMashStep = mashSteps[0];
  const mashTempF = mainMashStep ? mainMashStep.targetTempF : 152;
  const mashTempAttenuationModifier = (152 - mashTempF) * 0.0075; // ~0.75% per °F from 152°F

  const fermentableBreakdown = fermentables.map((f) => {
    const weight = Math.max(0, f.weightLbs);
    const ppg = f.customPpg ?? f.ppg;
    const color = f.customColor ?? f.colorLovibond;

    // Sugars, Honeys, and Extracts yield 100% of their PPG into the kettle/fermenter
    // Mashed/Steeped grains are multiplied by brewhouse efficiency (or 35% steep yield if steeped specialty grain in extract brew)
    let yieldFactor = 1.0;
    if (f.category === 'grain' || f.category === 'adjunct') {
      if (recipe.method === 'extract' || f.stage === 'steep') {
        yieldFactor = f.requiresMash ? 0.15 : 0.45;
      } else {
        yieldFactor = effFraction;
      }
    }

    const gu = (weight * ppg * yieldFactor) / batchVol;
    totalGravityUnits += gu;

    // Pre-boil gravity includes mash, steep, and boil-start additions
    if (
      f.stage === 'mash' ||
      f.stage === 'steep' ||
      f.stage === 'boil-start'
    ) {
      preBoilGravityUnits += weight * ppg * yieldFactor;
    }

    // Fermentability modeling:
    // - Unfermentable sugars (e.g., Lactose = 0%, Maltodextrin = 5%) use their intrinsic fermentability
    // - Simple sugars & Honey (90% - 100% fermentable) ferment much drier than wort
    // - Wort from grains/extracts is governed by Yeast Attenuation + Mash Temp modifier
    let effectiveAttenuation = yeastAttenuation;
    if (f.category === 'sugar' || f.category === 'honey') {
      effectiveAttenuation = Math.min(1, Math.max(0, f.fermentability / 100));
    } else if (f.category === 'extract') {
      effectiveAttenuation = Math.min(0.95, Math.max(0.5, yeastAttenuation));
    } else {
      // Grain or Adjunct: blend ingredient intrinsic fermentability with yeast attenuation & mash temp
      const ingredientRatio = f.fermentability / 78; // normalized to 2-row (78%)
      effectiveAttenuation = Math.min(
        0.96,
        Math.max(
          0.4,
          yeastAttenuation * ingredientRatio + mashTempAttenuationModifier
        )
      );
    }

    const residualGu = gu * (1 - effectiveAttenuation);
    totalResidualGravityUnits += residualGu;

    // Color MCU
    totalMcu += (weight * color) / batchVol;

    return {
      instanceId: f.instanceId,
      name: f.name,
      category: f.category,
      weightLbs: weight,
      percentageOfGrist:
        totalFermentablesLbs > 0
          ? Number(((weight / totalFermentablesLbs) * 100).toFixed(1))
          : 0,
      gravityPoints: Number(gu.toFixed(1)),
    };
  });

  const og = Number((1 + totalGravityUnits / 1000).toFixed(3));
  const fg = Number((1 + totalResidualGravityUnits / 1000).toFixed(3));

  // Water Volumes Calculation
  const boilOffGal =
    (equipment.boilTimeMinutes / 60) * equipment.boilOffRateGalPerHr;
  const preBoilVolumeGal = Number(
    (batchVol + boilOffGal + equipment.trubLossGal).toFixed(2)
  );
  const preBoilGravity = Number(
    (1 + preBoilGravityUnits / Math.max(0.5, preBoilVolumeGal) / 1000).toFixed(3)
  );

  const grainAbsorptionLossGal =
    totalGrainWeightLbs * equipment.grainAbsorptionGalPerLb;
  const totalWaterNeededGal = Number(
    (preBoilVolumeGal + grainAbsorptionLossGal).toFixed(2)
  );

  let strikeWaterGal = totalWaterNeededGal;
  let spargeWaterGal = 0;

  if (recipe.method === 'all-grain' || recipe.method === 'partial-mash') {
    strikeWaterGal = Number(
      Math.min(
        totalWaterNeededGal,
        (totalGrainWeightLbs * equipment.mashThicknessQtPerLb) / 4
      ).toFixed(2)
    );
    spargeWaterGal = Number(
      Math.max(0, totalWaterNeededGal - strikeWaterGal).toFixed(2)
    );
  }

  // Strike Water Temp Formula (Palmer):
  // Tw = (0.2 / R) * (T2 - T1) + T2
  // where R = water to grist ratio in qt/lb, T1 = grain temp °F, T2 = target mash temp °F
  const effectiveRatioQtPerLb =
    totalGrainWeightLbs > 0
      ? (strikeWaterGal * 4) / totalGrainWeightLbs
      : equipment.mashThicknessQtPerLb;
  const strikeWaterTempF =
    totalGrainWeightLbs > 0
      ? Number(
          (
            (0.2 / Math.max(0.5, effectiveRatioQtPerLb)) *
              (mashTempF - equipment.grainTempF) +
            mashTempF
          ).toFixed(1)
        )
      : mashTempF;

  // ABV Standard & High-Gravity Alternate Formula
  const abv = Number(Math.max(0, (og - fg) * 131.25).toFixed(2));
  const abvAlternate = Number(
    Math.max(
      0,
      (76.08 * (og - fg)) / (1.775 - og) * (fg / 0.794)
    ).toFixed(2)
  );

  // Morey SRM Color Formula: SRM = 1.4922 * (MCU ^ 0.6859)
  const srm =
    totalMcu > 0
      ? Number((1.4922 * Math.pow(totalMcu, 0.6859)).toFixed(1))
      : 1.0;
  const ebc = Number((srm * 1.97).toFixed(1));
  const srmHex = srmToHex(srm);

  // IBU Calculation (Tinseth & Rager)
  // Boil gravity used for hop utilization is average of pre-boil and post-boil OG
  const avgBoilGravity = (preBoilGravity + og) / 2;
  let totalIbu = 0;

  const hopBreakdown = hops.map((h) => {
    const weightOz = Math.max(0, h.weightOz);
    const aaDecimal = Math.max(0, h.alphaAcid) / 100;

    // Form multiplier: Pellet gives ~10% higher utilization than whole leaf, Cryo ~15%
    let formFactor = 1.0;
    if (h.form === 'pellet') formFactor = 1.1;
    else if (h.form === 'cryo') formFactor = 1.15;

    // Use / Stage multiplier & effective time
    let stageFactor = 1.0;
    let timeMins = Math.max(0, h.timeMinutes);

    if (h.use === 'dry-hop') {
      stageFactor = 0;
    } else if (h.use === 'mash') {
      stageFactor = 0.2;
    } else if (h.use === 'first-wort') {
      stageFactor = 1.1; // FWH +10% utilization bonus
      timeMins = equipment.boilTimeMinutes;
    } else if (h.use === 'whirlpool') {
      // Temperature-dependent isomerization factor relative to 212°F boil
      const tempF = h.temperatureF ?? 180;
      if (tempF < 140) stageFactor = 0.02;
      else if (tempF < 165) stageFactor = 0.08;
      else if (tempF < 185) stageFactor = 0.2;
      else if (tempF < 200) stageFactor = 0.4;
      else stageFactor = 0.65;
    }

    let utilization = 0;
    if (equipment.ibuFormula === 'rager') {
      const tanhArg = (timeMins - 31.32) / 18.27;
      const baseUtil = (18.11 + 13.86 * Math.tanh(tanhArg)) / 100;
      const gravityAdj =
        avgBoilGravity > 1.05 ? (avgBoilGravity - 1.05) / 0.2 : 0;
      utilization = (baseUtil / (1 + gravityAdj)) * formFactor * stageFactor;
    } else {
      // Default Tinseth formula:
      // Bigness factor = 1.65 * 0.000125^(wort_gravity - 1)
      // Boil Time factor = (1 - e^(-0.04 * time_mins)) / 4.15
      const bignessFactor = 1.65 * Math.pow(0.000125, avgBoilGravity - 1);
      const boilTimeFactor = (1 - Math.exp(-0.04 * timeMins)) / 4.15;
      utilization = bignessFactor * boilTimeFactor * formFactor * stageFactor;
    }

    const ibu =
      stageFactor > 0
        ? (weightOz * aaDecimal * utilization * 7489) / batchVol
        : 0;

    const roundedIbu = Number(Math.max(0, ibu).toFixed(1));
    totalIbu += roundedIbu;

    return {
      instanceId: h.instanceId,
      name: h.name,
      use: h.use,
      ibuContribution: roundedIbu,
    };
  });

  const roundedTotalIbu = Number(totalIbu.toFixed(1));
  const buGuRatio =
    totalGravityUnits > 0
      ? Number((roundedTotalIbu / totalGravityUnits).toFixed(2))
      : 0;

  const totalHopsOz = Number(
    hops.reduce((sum, h) => sum + Math.max(0, h.weightOz), 0).toFixed(2)
  );
  const hopLoadOzPerGal = Number((totalHopsOz / batchVol).toFixed(2));

  // Water Chemistry & Mash pH Estimation
  const {
    resultingWater,
    sulfateToChlorideRatio,
    sulfateChlorideBalanceLabel,
  } = calculateWaterChemistry(
    recipe.sourceWater,
    recipe.saltAdditions,
    totalWaterNeededGal
  );

  // Empirical Mash pH model based on distilled water pH of grist, residual alkalinity, and lactic acid
  // Base malt distilled pH ~5.72; specialty/crystal/roasted malts lower pH proportional to Lovibond color;
  // Calcium & Magnesium lower pH via phytin reaction; Bicarbonate raises pH; Lactic acid lowers pH.
  const roastedAndCrystalColorUnits = mashedFermentables.reduce(
    (sum, f) =>
      sum +
      (f.weightLbs / Math.max(1, totalGrainWeightLbs)) *
        Math.min(250, f.colorLovibond),
    0
  );
  const gristBasePh = 5.72 - roastedAndCrystalColorUnits * 0.0032;
  const residualAlkalinityEffect =
    (resultingWater.bicarbonate * 0.82 -
      (resultingWater.calcium / 3.5 + resultingWater.magnesium / 7)) *
    0.0012;
  const lacticAcidPhDrop =
    (recipe.saltAdditions.lacticAcid88Ml / Math.max(1, strikeWaterGal)) * 0.14;
  const estimatedMashPh = Number(
    Math.min(
      6.2,
      Math.max(
        4.6,
        gristBasePh + residualAlkalinityEffect - lacticAcidPhDrop
      )
    ).toFixed(2)
  );

  // Yeast Pitch Rate & Starter Calculator
  const degreesPlato = sgToPlato(og);
  const batchMl = batchVol * 3785.41;
  const pitchRate = primaryYeast?.targetPitchRate ?? 0.75; // M cells / mL / °P
  const requiredCellsBillions = Math.round(
    (batchMl * degreesPlato * pitchRate) / 1000
  );

  const pitchedCellsBillions = yeasts.reduce((sum, y) => {
    const baseCellsPerPack = y.form === 'dry' || y.form === 'kveik' ? 200 : 100;
    return sum + y.packs * baseCellsPerPack;
  }, 0);

  const cellDeficit = Math.max(0, requiredCellsBillions - pitchedCellsBillions);
  const starterLitresRecommended =
    cellDeficit > 0 ? Number(Math.max(1.0, cellDeficit / 110).toFixed(1)) : 0;

  return {
    og,
    preBoilGravity,
    fg,
    abv,
    abvAlternate,
    ibu: roundedTotalIbu,
    buGuRatio,
    srm,
    ebc,
    srmHex,
    totalGrainWeightLbs: Number(totalGrainWeightLbs.toFixed(2)),
    totalFermentablesLbs: Number(totalFermentablesLbs.toFixed(2)),
    averageDiastaticPower,
    hasSufficientDiastaticPower,
    totalHopsOz,
    hopLoadOzPerGal,
    strikeWaterGal,
    spargeWaterGal,
    preBoilVolumeGal,
    totalWaterNeededGal,
    strikeWaterTempF,
    resultingWater,
    sulfateToChlorideRatio,
    sulfateChlorideBalanceLabel,
    estimatedMashPh,
    requiredCellsBillions,
    pitchedCellsBillions,
    starterLitresRecommended,
    fermentableBreakdown,
    hopBreakdown,
  };
}
