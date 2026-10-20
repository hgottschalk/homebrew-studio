import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Recipe,
  UnitSystem,
  RecipeFermentable,
  RecipeHop,
  RecipeYeast,
  MashStep,
  EquipmentProfile,
  WaterProfile,
  SaltAdditions,
  InventoryItem,
  BatchLog,
  ActualIngredientUsed,
  FermentableCatalogItem,
  HopCatalogItem,
  YeastCatalogItem,
} from '@/types/brewing';
import {
  INITIAL_RECIPE,
  INITIAL_INVENTORY,
  FERMENTABLES_CATALOG,
  HOPS_CATALOG,
  YEAST_CATALOG,
} from '@/data/ingredients';
import { calculateBrewMetrics } from '@/lib/calculations';

export type ActiveTab = 'recipe' | 'inventory' | 'water' | 'brewday' | 'ai';

interface BrewStoreState {
  activeTab: ActiveTab;
  unitSystem: UnitSystem;
  recipe: Recipe;
  savedRecipes: Recipe[];
  inventory: InventoryItem[];
  batchLogs: BatchLog[];
  customFermentables: FermentableCatalogItem[];
  customHops: HopCatalogItem[];
  customYeasts: YeastCatalogItem[];

  // Navigation & Units
  setActiveTab: (tab: ActiveTab) => void;
  setUnitSystem: (unit: UnitSystem) => void;

  // Recipe Metadata & Management
  updateRecipeMeta: (
    updates: Partial<
      Pick<
        Recipe,
        'name' | 'styleName' | 'styleId' | 'method' | 'notes' | 'formulatedAt'
      >
    >
  ) => void;
  updateEquipment: (updates: Partial<EquipmentProfile>) => void;
  scaleRecipeVolume: (newVolumeGal: number) => void;
  saveCurrentRecipe: () => void;
  loadRecipe: (id: string) => void;
  createNewRecipe: () => void;
  importRecipe: (recipe: Recipe) => void;
  deleteSavedRecipe: (id: string) => void;

  // Fermentables (Grains, Honeys, Sugars, Adjuncts, Extracts)
  addFermentable: (
    item: FermentableCatalogItem,
    weightLbs?: number,
    stage?: RecipeFermentable['stage']
  ) => void;
  updateFermentable: (
    instanceId: string,
    updates: Partial<RecipeFermentable>
  ) => void;
  removeFermentable: (instanceId: string) => void;
  addCustomFermentableToCatalog: (item: FermentableCatalogItem) => void;

  // Hops
  addHop: (
    item: HopCatalogItem,
    weightOz?: number,
    timeMinutes?: number,
    use?: RecipeHop['use']
  ) => void;
  updateHop: (instanceId: string, updates: Partial<RecipeHop>) => void;
  removeHop: (instanceId: string) => void;
  addCustomHopToCatalog: (item: HopCatalogItem) => void;

  // Yeast
  addYeast: (item: YeastCatalogItem) => void;
  updateYeast: (instanceId: string, updates: Partial<RecipeYeast>) => void;
  removeYeast: (instanceId: string) => void;
  addCustomYeastToCatalog: (item: YeastCatalogItem) => void;

  // Mash & Water Chemistry
  addMashStep: (step: Omit<MashStep, 'id'>) => void;
  updateMashStep: (id: string, updates: Partial<MashStep>) => void;
  removeMashStep: (id: string) => void;
  setSourceWater: (profile: WaterProfile) => void;
  setTargetWater: (profile: WaterProfile) => void;
  updateSaltAdditions: (updates: Partial<SaltAdditions>) => void;
  autoMatchTargetWater: () => void;

  // Inventory Management
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
  removeInventoryItem: (id: string) => void;
  deductRecipeFromInventory: () => { deducted: string[]; shortages: string[] };

  // Batch Logs
  startNewBatchFromRecipe: () => string;
  updateBatchLog: (id: string, updates: Partial<BatchLog>) => void;
  deleteBatchLog: (id: string) => void;
  updateActualIngredient: (
    batchId: string,
    itemId: string,
    updates: Partial<ActualIngredientUsed>
  ) => void;
  addActualIngredient: (
    batchId: string,
    item: Omit<ActualIngredientUsed, 'id'>
  ) => void;
  toggleBatchChecklistStep: (batchId: string, stepId: string) => void;
  addGravityReading: (
    batchId: string,
    reading: { dayNumber: number; gravity: number; tempF: number; notes: string }
  ) => void;
}

export const useBrewStore = create<BrewStoreState>()(
  persist(
    (set, get) => ({
      activeTab: 'recipe',
      unitSystem: 'imperial',
      recipe: INITIAL_RECIPE,
      savedRecipes: [INITIAL_RECIPE],
      inventory: INITIAL_INVENTORY,
      batchLogs: [
        {
          id: 'batch-demo-1',
          recipeId: INITIAL_RECIPE.id,
          recipeName: INITIAL_RECIPE.name,
          brewDate: new Date().toISOString().split('T')[0],
          leadBrewer: 'Head Brewer',
          coBrewers: '',
          status: 'mashing',
          targetOg: 1.066,
          targetFg: 1.011,
          targetVolumeGal: 5.5,
          actualStrikeTempF: 163.5,
          actualMashTempF: 151.0,
          actualMashPh: 5.34,
          postBoilVolumeGal: 5.5,
          actualOg: 1.065,
          actualFg: 1.011,
          actualIngredientsUsed: [
            ...INITIAL_RECIPE.fermentables.map((f) => ({
              id: f.instanceId,
              type: 'fermentable' as const,
              plannedName: `${f.name} (${f.stage})`,
              plannedAmount: `${f.weightLbs} lbs`,
              actualName: `${f.name} (${f.stage})`,
              actualAmount: `${f.weightLbs} lbs`,
              notes: '',
            })),
            ...INITIAL_RECIPE.hops.map((h) => ({
              id: h.instanceId,
              type: 'hop' as const,
              plannedName: `${h.name} (${h.use})`,
              plannedAmount: `${h.weightOz} oz`,
              actualName: `${h.name} (${h.use})`,
              actualAmount: `${h.weightOz} oz`,
              notes: '',
            })),
            ...INITIAL_RECIPE.yeasts.map((y) => ({
              id: y.instanceId,
              type: 'yeast' as const,
              plannedName: `${y.name} (${y.productId})`,
              plannedAmount: `${y.packs} pack(s)`,
              actualName: `${y.name} (${y.productId})`,
              actualAmount: `${y.packs} pack(s)`,
              notes: '',
            })),
          ],
          actualIngredientsNotes:
            'Used local raw Orange Blossom Honey added at 175°F flameout cooling.',
          whatWentRight:
            'Hit 151.0°F mash temp on the nose; vorlauf ran crystal clear; whirlpool Citra aroma was super bright.',
          adjustmentsMade:
            'Added 0.5 mL extra 88% lactic acid at 15 min into mash to bring pH from 5.44 down to 5.34.',
          completedChecklistIds: ['prep-water', 'mill-grains'],
          gravityReadings: [
            {
              id: 'grav-1',
              date: new Date().toISOString().split('T')[0],
              dayNumber: 0,
              gravity: 1.065,
              tempF: 68,
              notes: 'Chilled wort & pitched US-05 + Orange Blossom Honey at flameout.',
            },
          ],
          tastingNotes:
            'Bright floral orange blossom aroma on the nose with juicy Citra & Mosaic hop character.',
          rating: 5,
          inventoryDeducted: false,
        },
      ],
      customFermentables: [],
      customHops: [],
      customYeasts: [],

      setActiveTab: (tab) => set({ activeTab: tab }),
      setUnitSystem: (unitSystem) => set({ unitSystem }),

      updateRecipeMeta: (updates) =>
        set((state) => ({
          recipe: {
            ...state.recipe,
            ...updates,
            updatedAt: new Date().toISOString(),
          },
        })),

      updateEquipment: (updates) =>
        set((state) => ({
          recipe: {
            ...state.recipe,
            equipment: { ...state.recipe.equipment, ...updates },
            updatedAt: new Date().toISOString(),
          },
        })),

      scaleRecipeVolume: (newVolumeGal) =>
        set((state) => {
          const currentVol = Math.max(0.5, state.recipe.equipment.batchVolumeGal);
          const ratio = newVolumeGal / currentVol;
          if (ratio <= 0 || !isFinite(ratio)) return state;

          return {
            recipe: {
              ...state.recipe,
              equipment: {
                ...state.recipe.equipment,
                batchVolumeGal: Number(newVolumeGal.toFixed(2)),
                trubLossGal: Number(
                  (state.recipe.equipment.trubLossGal * ratio).toFixed(2)
                ),
              },
              fermentables: state.recipe.fermentables.map((f) => ({
                ...f,
                weightLbs: Number((f.weightLbs * ratio).toFixed(2)),
              })),
              hops: state.recipe.hops.map((h) => ({
                ...h,
                weightOz: Number((h.weightOz * ratio).toFixed(2)),
              })),
              saltAdditions: {
                gypsumGrams: Number(
                  (state.recipe.saltAdditions.gypsumGrams * ratio).toFixed(1)
                ),
                calciumChlorideGrams: Number(
                  (
                    state.recipe.saltAdditions.calciumChlorideGrams * ratio
                  ).toFixed(1)
                ),
                epsomSaltGrams: Number(
                  (state.recipe.saltAdditions.epsomSaltGrams * ratio).toFixed(1)
                ),
                bakingSodaGrams: Number(
                  (state.recipe.saltAdditions.bakingSodaGrams * ratio).toFixed(1)
                ),
                chalkGrams: Number(
                  (state.recipe.saltAdditions.chalkGrams * ratio).toFixed(1)
                ),
                lacticAcid88Ml: Number(
                  (state.recipe.saltAdditions.lacticAcid88Ml * ratio).toFixed(1)
                ),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        }),

      saveCurrentRecipe: () =>
        set((state) => {
          const updated = {
            ...state.recipe,
            updatedAt: new Date().toISOString(),
          };
          const exists = state.savedRecipes.some((r) => r.id === updated.id);
          const savedRecipes = exists
            ? state.savedRecipes.map((r) => (r.id === updated.id ? updated : r))
            : [updated, ...state.savedRecipes];
          return { recipe: updated, savedRecipes };
        }),

      loadRecipe: (id) =>
        set((state) => {
          const found = state.savedRecipes.find((r) => r.id === id);
          if (!found) return state;
          return { recipe: found };
        }),

      createNewRecipe: () =>
        set((state) => {
          const newRecipe: Recipe = {
            ...INITIAL_RECIPE,
            id: `recipe-${Date.now()}`,
            name: 'New Custom Brew',
            styleName: 'American Pale Ale (18B)',
            notes: '',
            formulatedAt: new Date().toISOString().split('T')[0],
            updatedAt: new Date().toISOString(),
            fermentables: [
              {
                ...FERMENTABLES_CATALOG[0],
                instanceId: `ferm-${Date.now()}-1`,
                weightLbs: 10.0,
                stage: 'mash',
              },
            ],
            hops: [
              {
                instanceId: `hop-${Date.now()}-1`,
                hopId: HOPS_CATALOG[2].id,
                name: HOPS_CATALOG[2].name,
                origin: HOPS_CATALOG[2].origin,
                form: 'pellet',
                use: 'boil',
                weightOz: 1.5,
                alphaAcid: HOPS_CATALOG[2].alphaAcid,
                timeMinutes: 60,
                flavorTags: HOPS_CATALOG[2].flavorTags,
              },
            ],
            yeasts: [
              {
                ...YEAST_CATALOG[0],
                instanceId: `yeast-${Date.now()}-1`,
                packs: 1,
                customAttenuation: 80,
                targetPitchRate: 0.75,
              },
            ],
          };
          return {
            recipe: newRecipe,
            savedRecipes: [newRecipe, ...state.savedRecipes],
          };
        }),

      importRecipe: (importedRecipe) =>
        set((state) => {
          const withId: Recipe = {
            ...importedRecipe,
            id: importedRecipe.id || `recipe-${Date.now()}`,
            updatedAt: new Date().toISOString(),
          };
          const exists = state.savedRecipes.some((r) => r.id === withId.id);
          return {
            recipe: withId,
            savedRecipes: exists
              ? state.savedRecipes.map((r) => (r.id === withId.id ? withId : r))
              : [withId, ...state.savedRecipes],
          };
        }),

      deleteSavedRecipe: (id) =>
        set((state) => {
          const remaining = state.savedRecipes.filter((r) => r.id !== id);
          const nextActive =
            state.recipe.id === id
              ? remaining[0] || INITIAL_RECIPE
              : state.recipe;
          return {
            savedRecipes: remaining.length > 0 ? remaining : [INITIAL_RECIPE],
            recipe: nextActive,
          };
        }),

      addFermentable: (item, weightLbs = 1.0, stage) =>
        set((state) => ({
          recipe: {
            ...state.recipe,
            fermentables: [
              ...state.recipe.fermentables,
              {
                ...item,
                instanceId: `ferm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                weightLbs,
                stage: stage ?? item.defaultStage,
              },
            ],
            updatedAt: new Date().toISOString(),
          },
        })),

      updateFermentable: (instanceId, updates) =>
        set((state) => ({
          recipe: {
            ...state.recipe,
            fermentables: state.recipe.fermentables.map((f) =>
              f.instanceId === instanceId ? { ...f, ...updates } : f
            ),
            updatedAt: new Date().toISOString(),
          },
        })),

      removeFermentable: (instanceId) =>
        set((state) => ({
          recipe: {
            ...state.recipe,
            fermentables: state.recipe.fermentables.filter(
              (f) => f.instanceId !== instanceId
            ),
            updatedAt: new Date().toISOString(),
          },
        })),

      addCustomFermentableToCatalog: (item) =>
        set((state) => ({
          customFermentables: [...state.customFermentables, item],
        })),

      addHop: (item, weightOz = 1.0, timeMinutes = 15, use = 'boil') =>
        set((state) => {
          // Check if user has a custom alpha acid override in inventory
          const invMatch = state.inventory.find(
            (i) => i.type === 'hop' && i.ingredientId === item.id
          );
          const alphaAcid = invMatch?.customAlphaAcid ?? item.alphaAcid;
          return {
            recipe: {
              ...state.recipe,
              hops: [
                ...state.recipe.hops,
                {
                  instanceId: `hop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  hopId: item.id,
                  name: item.name,
                  origin: item.origin,
                  form: 'pellet',
                  use,
                  weightOz,
                  alphaAcid,
                  timeMinutes,
                  temperatureF: use === 'whirlpool' ? 180 : undefined,
                  flavorTags: item.flavorTags,
                },
              ],
              updatedAt: new Date().toISOString(),
            },
          };
        }),

      updateHop: (instanceId, updates) =>
        set((state) => ({
          recipe: {
            ...state.recipe,
            hops: state.recipe.hops.map((h) =>
              h.instanceId === instanceId ? { ...h, ...updates } : h
            ),
            updatedAt: new Date().toISOString(),
          },
        })),

      removeHop: (instanceId) =>
        set((state) => ({
          recipe: {
            ...state.recipe,
            hops: state.recipe.hops.filter((h) => h.instanceId !== instanceId),
            updatedAt: new Date().toISOString(),
          },
        })),

      addCustomHopToCatalog: (item) =>
        set((state) => ({
          customHops: [...state.customHops, item],
        })),

      addYeast: (item) =>
        set((state) => ({
          recipe: {
            ...state.recipe,
            yeasts: [
              ...state.recipe.yeasts,
              {
                ...item,
                instanceId: `yeast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                packs: 1,
                customAttenuation: Math.round(
                  (item.attenuationMin + item.attenuationMax) / 2
                ),
                targetPitchRate: 0.75,
              },
            ],
            updatedAt: new Date().toISOString(),
          },
        })),

      updateYeast: (instanceId, updates) =>
        set((state) => ({
          recipe: {
            ...state.recipe,
            yeasts: state.recipe.yeasts.map((y) =>
              y.instanceId === instanceId ? { ...y, ...updates } : y
            ),
            updatedAt: new Date().toISOString(),
          },
        })),

      removeYeast: (instanceId) =>
        set((state) => ({
          recipe: {
            ...state.recipe,
            yeasts: state.recipe.yeasts.filter(
              (y) => y.instanceId !== instanceId
            ),
            updatedAt: new Date().toISOString(),
          },
        })),

      addCustomYeastToCatalog: (item) =>
        set((state) => ({
          customYeasts: [...state.customYeasts, item],
        })),

      addMashStep: (step) =>
        set((state) => ({
          recipe: {
            ...state.recipe,
            mashSteps: [
              ...state.recipe.mashSteps,
              { ...step, id: `mash-${Date.now()}` },
            ],
          },
        })),

      updateMashStep: (id, updates) =>
        set((state) => ({
          recipe: {
            ...state.recipe,
            mashSteps: state.recipe.mashSteps.map((s) =>
              s.id === id ? { ...s, ...updates } : s
            ),
          },
        })),

      removeMashStep: (id) =>
        set((state) => ({
          recipe: {
            ...state.recipe,
            mashSteps: state.recipe.mashSteps.filter((s) => s.id !== id),
          },
        })),

      setSourceWater: (sourceWater) =>
        set((state) => ({
          recipe: { ...state.recipe, sourceWater },
        })),

      setTargetWater: (targetWater) =>
        set((state) => ({
          recipe: { ...state.recipe, targetWater },
        })),

      updateSaltAdditions: (updates) =>
        set((state) => ({
          recipe: {
            ...state.recipe,
            saltAdditions: { ...state.recipe.saltAdditions, ...updates },
          },
        })),

      autoMatchTargetWater: () =>
        set((state) => {
          const metrics = calculateBrewMetrics(state.recipe);
          const volLiters = Math.max(1, metrics.totalWaterNeededGal * 3.78541);
          const { sourceWater, targetWater } = state.recipe;

          const neededCl = Math.max(0, targetWater.chloride - sourceWater.chloride);
          const neededSo4 = Math.max(0, targetWater.sulfate - sourceWater.sulfate);
          const neededMg = Math.max(0, targetWater.magnesium - sourceWater.magnesium);
          const neededHco3 = Math.max(
            0,
            targetWater.bicarbonate - sourceWater.bicarbonate
          );

          const calciumChlorideGrams = Number(
            ((neededCl * volLiters) / 482.3).toFixed(1)
          );
          const epsomSaltGrams = Number(
            ((neededMg * volLiters) / 98.6).toFixed(1)
          );
          const so4FromEpsom = (epsomSaltGrams * 389.6) / volLiters;
          const remainingSo4 = Math.max(0, neededSo4 - so4FromEpsom);
          const gypsumGrams = Number(
            ((remainingSo4 * volLiters) / 557.7).toFixed(1)
          );
          const bakingSodaGrams = Number(
            ((neededHco3 * volLiters) / 726.3).toFixed(1)
          );

          return {
            recipe: {
              ...state.recipe,
              saltAdditions: {
                ...state.recipe.saltAdditions,
                gypsumGrams,
                calciumChlorideGrams,
                epsomSaltGrams,
                bakingSodaGrams,
                chalkGrams: 0,
              },
            },
          };
        }),

      addInventoryItem: (item) =>
        set((state) => ({
          inventory: [
            { ...item, id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 5)}` },
            ...state.inventory,
          ],
        })),

      updateInventoryItem: (id, updates) =>
        set((state) => ({
          inventory: state.inventory.map((i) =>
            i.id === id ? { ...i, ...updates } : i
          ),
        })),

      removeInventoryItem: (id) =>
        set((state) => ({
          inventory: state.inventory.filter((i) => i.id !== id),
        })),

      deductRecipeFromInventory: () => {
        const state = get();
        const updatedInventory = [...state.inventory];
        const deducted: string[] = [];
        const shortages: string[] = [];

        for (const f of state.recipe.fermentables) {
          const idx = updatedInventory.findIndex(
            (i) => i.type === 'fermentable' && i.ingredientId === f.id
          );
          if (idx >= 0) {
            const avail = updatedInventory[idx].quantity;
            if (avail >= f.weightLbs) {
              updatedInventory[idx] = {
                ...updatedInventory[idx],
                quantity: Number((avail - f.weightLbs).toFixed(2)),
              };
              deducted.push(`${f.name}: -${f.weightLbs} lbs`);
            } else {
              updatedInventory[idx] = { ...updatedInventory[idx], quantity: 0 };
              shortages.push(
                `${f.name}: needed ${f.weightLbs} lbs, only had ${avail} lbs`
              );
            }
          } else {
            shortages.push(`${f.name}: not in inventory (${f.weightLbs} lbs)`);
          }
        }

        for (const h of state.recipe.hops) {
          const idx = updatedInventory.findIndex(
            (i) => i.type === 'hop' && i.ingredientId === h.hopId
          );
          if (idx >= 0) {
            const avail = updatedInventory[idx].quantity;
            if (avail >= h.weightOz) {
              updatedInventory[idx] = {
                ...updatedInventory[idx],
                quantity: Number((avail - h.weightOz).toFixed(2)),
              };
              deducted.push(`${h.name}: -${h.weightOz} oz`);
            } else {
              updatedInventory[idx] = { ...updatedInventory[idx], quantity: 0 };
              shortages.push(
                `${h.name}: needed ${h.weightOz} oz, only had ${avail} oz`
              );
            }
          } else {
            shortages.push(`${h.name}: not in inventory (${h.weightOz} oz)`);
          }
        }

        for (const y of state.recipe.yeasts) {
          const idx = updatedInventory.findIndex(
            (i) => i.type === 'yeast' && i.ingredientId === y.id
          );
          if (idx >= 0) {
            const avail = updatedInventory[idx].quantity;
            if (avail >= y.packs) {
              updatedInventory[idx] = {
                ...updatedInventory[idx],
                quantity: avail - y.packs,
              };
              deducted.push(`${y.name}: -${y.packs} pack(s)`);
            } else {
              updatedInventory[idx] = { ...updatedInventory[idx], quantity: 0 };
              shortages.push(
                `${y.name}: needed ${y.packs} pack(s), only had ${avail}`
              );
            }
          } else {
            shortages.push(`${y.name}: not in inventory (${y.packs} pack)`);
          }
        }

        set({ inventory: updatedInventory });
        return { deducted, shortages };
      },

      startNewBatchFromRecipe: () => {
        const state = get();
        const metrics = calculateBrewMetrics(state.recipe);
        const newId = `batch-${Date.now()}`;
        const snapshotIngredients: ActualIngredientUsed[] = [
          ...state.recipe.fermentables.map((f) => ({
            id: `act-${f.instanceId}`,
            type: 'fermentable' as const,
            plannedName: `${f.name} (${f.stage})`,
            plannedAmount: `${f.weightLbs} lbs`,
            actualName: `${f.name} (${f.stage})`,
            actualAmount: `${f.weightLbs} lbs`,
            notes: '',
          })),
          ...state.recipe.hops.map((h) => ({
            id: `act-${h.instanceId}`,
            type: 'hop' as const,
            plannedName: `${h.name} (${h.use} @ ${h.timeMinutes}${h.use === 'dry-hop' ? 'd' : 'm'})`,
            plannedAmount: `${h.weightOz} oz (${h.alphaAcid}% AA)`,
            actualName: `${h.name} (${h.use} @ ${h.timeMinutes}${h.use === 'dry-hop' ? 'd' : 'm'})`,
            actualAmount: `${h.weightOz} oz (${h.alphaAcid}% AA)`,
            notes: '',
          })),
          ...state.recipe.yeasts.map((y) => ({
            id: `act-${y.instanceId}`,
            type: 'yeast' as const,
            plannedName: `${y.name} (${y.lab} ${y.productId})`,
            plannedAmount: `${y.packs} pack(s)`,
            actualName: `${y.name} (${y.lab} ${y.productId})`,
            actualAmount: `${y.packs} pack(s)`,
            notes: '',
          })),
          {
            id: `act-salts-${Date.now()}`,
            type: 'water-additive' as const,
            plannedName: 'Water Salts & Acid',
            plannedAmount: `Gypsum ${state.recipe.saltAdditions.gypsumGrams}g, CaCl2 ${state.recipe.saltAdditions.calciumChlorideGrams}g, Epsom ${state.recipe.saltAdditions.epsomSaltGrams}g, Lactic ${state.recipe.saltAdditions.lacticAcid88Ml}mL`,
            actualName: 'Water Salts & Acid',
            actualAmount: `Gypsum ${state.recipe.saltAdditions.gypsumGrams}g, CaCl2 ${state.recipe.saltAdditions.calciumChlorideGrams}g, Epsom ${state.recipe.saltAdditions.epsomSaltGrams}g, Lactic ${state.recipe.saltAdditions.lacticAcid88Ml}mL`,
            notes: '',
          },
        ];

        const newBatch: BatchLog = {
          id: newId,
          recipeId: state.recipe.id,
          recipeName: state.recipe.name,
          brewDate: new Date().toISOString().split('T')[0],
          leadBrewer: 'Head Brewer',
          coBrewers: '',
          status: 'mashing',
          targetOg: metrics.og,
          targetFg: metrics.fg,
          targetVolumeGal: state.recipe.equipment.batchVolumeGal,
          actualStrikeTempF: metrics.strikeWaterTempF,
          actualMashTempF: state.recipe.mashSteps[0]?.targetTempF ?? 152,
          actualMashPh: metrics.estimatedMashPh,
          preBoilVolumeGal: metrics.preBoilVolumeGal,
          preBoilGravity: metrics.preBoilGravity,
          postBoilVolumeGal: state.recipe.equipment.batchVolumeGal,
          actualOg: metrics.og,
          actualFg: metrics.fg,
          pitchTempF: 68,
          actualIngredientsUsed: snapshotIngredients,
          actualIngredientsNotes: '',
          whatWentRight: '',
          adjustmentsMade: '',
          completedChecklistIds: [],
          gravityReadings: [],
          tastingNotes: '',
          rating: 5,
          inventoryDeducted: false,
        };
        set({ batchLogs: [newBatch, ...state.batchLogs] });
        return newId;
      },

      updateBatchLog: (id, updates) =>
        set((state) => ({
          batchLogs: state.batchLogs.map((b) =>
            b.id === id ? { ...b, ...updates } : b
          ),
        })),

      deleteBatchLog: (id) =>
        set((state) => {
          const remaining = state.batchLogs.filter((b) => b.id !== id);
          return { batchLogs: remaining };
        }),

      updateActualIngredient: (batchId, itemId, updates) =>
        set((state) => ({
          batchLogs: state.batchLogs.map((b) => {
            if (b.id !== batchId) return b;
            return {
              ...b,
              actualIngredientsUsed: (b.actualIngredientsUsed || []).map(
                (item) => (item.id === itemId ? { ...item, ...updates } : item)
              ),
            };
          }),
        })),

      addActualIngredient: (batchId, item) =>
        set((state) => ({
          batchLogs: state.batchLogs.map((b) => {
            if (b.id !== batchId) return b;
            return {
              ...b,
              actualIngredientsUsed: [
                ...(b.actualIngredientsUsed || []),
                { ...item, id: `act-custom-${Date.now()}` },
              ],
            };
          }),
        })),

      toggleBatchChecklistStep: (batchId, stepId) =>
        set((state) => ({
          batchLogs: state.batchLogs.map((b) => {
            if (b.id !== batchId) return b;
            const exists = b.completedChecklistIds.includes(stepId);
            return {
              ...b,
              completedChecklistIds: exists
                ? b.completedChecklistIds.filter((s) => s !== stepId)
                : [...b.completedChecklistIds, stepId],
            };
          }),
        })),

      addGravityReading: (batchId, reading) =>
        set((state) => ({
          batchLogs: state.batchLogs.map((b) => {
            if (b.id !== batchId) return b;
            return {
              ...b,
              actualFg: reading.gravity,
              gravityReadings: [
                ...b.gravityReadings,
                {
                  id: `grav-${Date.now()}`,
                  date: new Date().toISOString().split('T')[0],
                  ...reading,
                },
              ],
            };
          }),
        })),
    }),
    {
      name: 'homebrew-recipe-studio-v1',
    }
  )
);
