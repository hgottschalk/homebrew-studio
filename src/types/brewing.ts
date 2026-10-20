export type BrewingMethod = 'all-grain' | 'biab' | 'partial-mash' | 'extract';
export type UnitSystem = 'imperial' | 'metric';

export type FermentableCategory =
  | 'grain'
  | 'extract'
  | 'honey'
  | 'sugar'
  | 'adjunct';

export type FermentableAdditionStage =
  | 'mash'
  | 'steep'
  | 'boil-start'
  | 'late-boil'
  | 'flameout'
  | 'whirlpool'
  | 'primary'
  | 'secondary';

export interface FermentableCatalogItem {
  id: string;
  name: string;
  origin: string;
  category: FermentableCategory;
  /** Potential Gravity in PPG (Points Per Pound Per Gallon), e.g., 37 for 1.037 */
  ppg: number;
  /** Color in degrees Lovibond / SRM */
  colorLovibond: number;
  /** Typical fermentability % (e.g., 100 for dextrose, 95 for honey, 0 for lactose, 78 for base malt) */
  fermentability: number;
  /** Whether this ingredient requires enzymatic mashing to convert starch */
  requiresMash: boolean;
  /** Diastatic power in degrees Lintner (0 for sugars, extracts, crystal, roasted malts) */
  diastaticPower: number;
  defaultStage: FermentableAdditionStage;
  maxRecommendedPercent: number;
  notes: string;
}

export interface RecipeFermentable extends FermentableCatalogItem {
  instanceId: string;
  /** Always stored in lbs internally, converted to kg when displaying in metric */
  weightLbs: number;
  stage: FermentableAdditionStage;
  customPpg?: number;
  customColor?: number;
}

export type HopForm = 'pellet' | 'whole' | 'cryo' | 'extract';
export type HopUse = 'mash' | 'first-wort' | 'boil' | 'whirlpool' | 'dry-hop';

export interface HopCatalogItem {
  id: string;
  name: string;
  origin: string;
  alphaAcid: number;
  betaAcid: number;
  cohumulone: number;
  totalOilMlPer100g: number;
  flavorTags: string[];
  substitutes: string[];
  notes: string;
}

export interface RecipeHop {
  instanceId: string;
  hopId: string;
  name: string;
  origin: string;
  form: HopForm;
  use: HopUse;
  /** Always stored in oz internally, converted to g in metric */
  weightOz: number;
  alphaAcid: number;
  /** Boil or whirlpool minutes, or Dry Hop days */
  timeMinutes: number;
  /** Relevant for whirlpool / hop stand (°F internally) */
  temperatureF?: number;
  flavorTags?: string[];
}

export type YeastForm = 'liquid' | 'dry' | 'slurry' | 'kveik';
export type FlocculationLevel = 'low' | 'medium' | 'high' | 'very-high';

export interface YeastCatalogItem {
  id: string;
  name: string;
  lab: string;
  productId: string;
  form: YeastForm;
  attenuationMin: number;
  attenuationMax: number;
  tempMinF: number;
  tempMaxF: number;
  flocculation: FlocculationLevel;
  alcoholTolerance: number;
  notes: string;
}

export interface RecipeYeast extends YeastCatalogItem {
  instanceId: string;
  packs: number;
  customAttenuation: number;
  manufactureDate?: string;
  targetPitchRate?: number; // Millions of cells / mL / °Plato (e.g., 0.75 Ale, 1.5 Lager)
}

export interface WaterProfile {
  id: string;
  name: string;
  description: string;
  calcium: number;     // Ca2+ ppm
  magnesium: number;   // Mg2+ ppm
  sodium: number;      // Na+ ppm
  chloride: number;    // Cl- ppm
  sulfate: number;     // SO4 2- ppm
  bicarbonate: number; // HCO3- ppm
}

export interface SaltAdditions {
  gypsumGrams: number;          // CaSO4
  calciumChlorideGrams: number; // CaCl2
  epsomSaltGrams: number;       // MgSO4
  bakingSodaGrams: number;      // NaHCO3
  chalkGrams: number;           // CaCO3
  lacticAcid88Ml: number;       // 88% Lactic Acid mL
}

export interface MashStep {
  id: string;
  name: string;
  type: 'infusion' | 'temperature' | 'decoction';
  targetTempF: number;
  durationMinutes: number;
}

export interface EquipmentProfile {
  batchVolumeGal: number;
  boilTimeMinutes: number;
  boilOffRateGalPerHr: number;
  brewhouseEfficiency: number; // e.g., 72%
  mashThicknessQtPerLb: number; // e.g., 1.5 qt/lb
  grainAbsorptionGalPerLb: number; // e.g., 0.125 gal/lb (0.08 for BIAB)
  trubLossGal: number;
  grainTempF: number;
  ibuFormula: 'tinseth' | 'rager';
}

export interface BjcpStyleItem {
  id: string;
  code: string;        // e.g. '21B', '18B', '25B'
  name: string;        // e.g. 'Specialty Honey IPA'
  category: string;    // e.g. 'IPA', 'Belgian & Farmhouse', 'Lager & Pilsner', 'Stout & Porter', 'Pale & Amber Ale', 'Honey & Specialty'
  ogMin: number;
  ogMax: number;
  fgMin: number;
  fgMax: number;
  abvMin: number;
  abvMax: number;
  ibuMin: number;
  ibuMax: number;
  srmMin: number;
  srmMax: number;
  description: string;
}

export interface Recipe {
  id: string;
  name: string;
  styleName: string;
  styleId?: string;
  method: BrewingMethod;
  notes: string;
  formulatedAt?: string;
  updatedAt: string;
  equipment: EquipmentProfile;
  fermentables: RecipeFermentable[];
  hops: RecipeHop[];
  yeasts: RecipeYeast[];
  mashSteps: MashStep[];
  sourceWater: WaterProfile;
  targetWater: WaterProfile;
  saltAdditions: SaltAdditions;
}

export interface InventoryItem {
  id: string;
  ingredientId: string;
  name: string;
  type: 'fermentable' | 'hop' | 'yeast';
  category?: FermentableCategory;
  /** lbs for fermentables, oz for hops, packs for yeast */
  quantity: number;
  /** Optional lot-specific overrides */
  customAlphaAcid?: number;
  customPpg?: number;
  customColor?: number;
  expirationOrMfgDate?: string;
  location?: string;
  notes?: string;
}

export interface GravityReading {
  id: string;
  date: string;
  dayNumber: number;
  gravity: number;
  tempF: number;
  notes: string;
}

export interface ActualIngredientUsed {
  id: string;
  type: 'fermentable' | 'hop' | 'yeast' | 'water-additive';
  plannedName: string;
  plannedAmount: string;
  actualName: string;
  actualAmount: string;
  notes?: string;
}

export interface BatchLog {
  id: string;
  recipeId: string;
  recipeName: string;
  brewDate: string;
  packagingDate?: string;
  leadBrewer?: string;
  coBrewers?: string;
  status: 'planning' | 'mashing' | 'boiling' | 'fermenting' | 'packaged';
  targetOg: number;
  targetFg: number;
  targetVolumeGal: number;
  actualStrikeTempF?: number;
  actualMashTempF?: number;
  actualMashPh?: number;
  preBoilVolumeGal?: number;
  preBoilGravity?: number;
  postBoilVolumeGal?: number;
  actualOg?: number;
  actualFg?: number;
  pitchTempF?: number;
  actualIngredientsUsed?: ActualIngredientUsed[];
  actualIngredientsNotes?: string;
  whatWentRight?: string;
  adjustmentsMade?: string;
  completedChecklistIds: string[];
  gravityReadings: GravityReading[];
  tastingNotes: string;
  rating?: number;
  inventoryDeducted: boolean;
}

export interface BrewMetrics {
  og: number;
  preBoilGravity: number;
  fg: number;
  abv: number;
  abvAlternate: number;
  ibu: number;
  buGuRatio: number;
  srm: number;
  ebc: number;
  srmHex: string;
  totalGrainWeightLbs: number;
  totalFermentablesLbs: number;
  averageDiastaticPower: number;
  hasSufficientDiastaticPower: boolean;
  totalHopsOz: number;
  hopLoadOzPerGal: number;
  strikeWaterGal: number;
  spargeWaterGal: number;
  preBoilVolumeGal: number;
  totalWaterNeededGal: number;
  strikeWaterTempF: number;
  resultingWater: WaterProfile;
  sulfateToChlorideRatio: number;
  sulfateChlorideBalanceLabel: string;
  estimatedMashPh: number;
  requiredCellsBillions: number;
  pitchedCellsBillions: number;
  starterLitresRecommended: number;
  fermentableBreakdown: {
    instanceId: string;
    name: string;
    category: FermentableCategory;
    weightLbs: number;
    percentageOfGrist: number;
    gravityPoints: number;
  }[];
  hopBreakdown: {
    instanceId: string;
    name: string;
    use: HopUse;
    ibuContribution: number;
  }[];
}
