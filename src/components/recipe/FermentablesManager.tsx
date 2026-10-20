'use client';

import React, { useState } from 'react';
import { useBrewStore } from '@/store/useBrewStore';
import { FERMENTABLES_CATALOG } from '@/data/ingredients';
import {
  BrewMetrics,
  FermentableCategory,
  FermentableAdditionStage,
  FermentableCatalogItem,
} from '@/types/brewing';
import { lbsToDisplay, displayToLbs, formatWeightLbs } from '@/lib/units';
import { srmToHex } from '@/lib/calculations';
import {
  Wheat,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface FermentablesManagerProps {
  metrics: BrewMetrics;
}

const CATEGORY_LABELS: Record<FermentableCategory | 'all', string> = {
  all: 'All Fermentables',
  grain: 'Base & Specialty Grains',
  honey: 'Honeys',
  sugar: 'Sugars & Syrups',
  adjunct: 'Flaked & Adjuncts',
  extract: 'Malt Extracts (DME/LME)',
};

const CATEGORY_BADGE_STYLES: Record<FermentableCategory, string> = {
  grain: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  honey: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  sugar: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
  adjunct: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  extract: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
};

const STAGE_OPTIONS: { value: FermentableAdditionStage; label: string }[] = [
  { value: 'mash', label: 'Mash (60m)' },
  { value: 'steep', label: 'Steep (20m)' },
  { value: 'boil-start', label: 'Boil Start (60m)' },
  { value: 'late-boil', label: 'Late Boil (10–15m)' },
  { value: 'flameout', label: 'Flameout / 0m (Preserve Aroma)' },
  { value: 'whirlpool', label: 'Whirlpool / Warm Stand' },
  { value: 'primary', label: 'Primary Fermentation (High Krausen)' },
  { value: 'secondary', label: 'Secondary Fermentation' },
];

export function FermentablesManager({ metrics }: FermentablesManagerProps) {
  const {
    recipe,
    unitSystem,
    inventory,
    customFermentables,
    addFermentable,
    updateFermentable,
    removeFermentable,
    addCustomFermentableToCatalog,
  } = useBrewStore();

  const [categoryFilter, setCategoryFilter] = useState<
    FermentableCategory | 'all'
  >('all');
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>(
    FERMENTABLES_CATALOG[0].id
  );
  const [addWeightDisplay, setAddWeightDisplay] = useState<string>('1.0');
  const [showCustomModal, setShowCustomModal] = useState(false);

  // Custom fermentable form state
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] =
    useState<FermentableCategory>('honey');
  const [customPpg, setCustomPpg] = useState('35');
  const [customColor, setCustomColor] = useState('2');
  const [customFermentability, setCustomFermentability] = useState('95');

  const allCatalog = [...FERMENTABLES_CATALOG, ...customFermentables];
  const filteredCatalog =
    categoryFilter === 'all'
      ? allCatalog
      : allCatalog.filter((item) => item.category === categoryFilter);

  const activeCatalogSelection =
    filteredCatalog.find((i) => i.id === selectedCatalogId) ||
    filteredCatalog[0];

  const handleAddFermentable = () => {
    if (!activeCatalogSelection) return;
    const parsed = parseFloat(addWeightDisplay) || 1.0;
    const weightLbs = displayToLbs(parsed, unitSystem);
    addFermentable(
      activeCatalogSelection,
      weightLbs,
      activeCatalogSelection.defaultStage
    );
  };

  const handleCreateCustomFermentable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    const newItem: FermentableCatalogItem = {
      id: `custom-ferm-${Date.now()}`,
      name: customName.trim(),
      origin: 'Custom',
      category: customCategory,
      ppg: Number(customPpg) || 35,
      colorLovibond: Number(customColor) || 2,
      fermentability: Number(customFermentability) || 80,
      requiresMash: customCategory === 'grain',
      diastaticPower: customCategory === 'grain' ? 80 : 0,
      defaultStage:
        customCategory === 'honey'
          ? 'flameout'
          : customCategory === 'sugar'
            ? 'late-boil'
            : 'mash',
      maxRecommendedPercent: customCategory === 'grain' ? 100 : 25,
      notes: 'Custom user-created fermentable/adjunct.',
    };
    addCustomFermentableToCatalog(newItem);
    addFermentable(newItem, 1.0, newItem.defaultStage);
    setCustomName('');
    setShowCustomModal(false);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#3B82F6]/15 text-[#3B82F6]">
            <Wheat className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">
              Fermentables: Grains, Honey, Sugars & Adjuncts
            </h2>
            <p className="text-xs text-slate-400">
              Total Bill:{' '}
              <span className="text-slate-200 font-medium">
                {formatWeightLbs(metrics.totalFermentablesLbs, unitSystem)}
              </span>{' '}
              ({formatWeightLbs(metrics.totalGrainWeightLbs, unitSystem)} mashed
              grist)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowCustomModal(!showCustomModal)}
          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#10B981]" />
          + Custom Honey / Sugar / Grain
        </button>
      </div>

      {/* Optional Custom Ingredient Creator */}
      {showCustomModal && (
        <form
          onSubmit={handleCreateCustomFermentable}
          className="bg-slate-950/90 border border-[#3B82F6]/40 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-6 gap-3 items-end"
        >
          <div className="sm:col-span-2">
            <label className="block text-xs text-slate-400 mb-1">
              Custom Ingredient Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Tupelo Honey or Turbinado Sugar"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Category
            </label>
            <select
              value={customCategory}
              onChange={(e) =>
                setCustomCategory(e.target.value as FermentableCategory)
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white"
            >
              <option value="honey">Honey</option>
              <option value="sugar">Sugar / Syrup</option>
              <option value="grain">Grain / Malt</option>
              <option value="adjunct">Adjunct / Flaked</option>
              <option value="extract">Malt Extract</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Yield (PPG)
            </label>
            <input
              type="number"
              min="0"
              max="50"
              value={customPpg}
              onChange={(e) => setCustomPpg(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Fermentability %
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={customFermentability}
              onChange={(e) => setCustomFermentability(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-[#10B981] hover:bg-emerald-600 text-slate-950 font-semibold text-xs py-2 px-3 rounded-lg transition-colors cursor-pointer"
            >
              Save & Add
            </button>
          </div>
        </form>
      )}

      {/* Category Filter Pills & Add Bar */}
      <div className="space-y-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(CATEGORY_LABELS) as (FermentableCategory | 'all')[]).map(
            (cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setCategoryFilter(cat);
                  const firstMatch =
                    cat === 'all'
                      ? allCatalog[0]
                      : allCatalog.find((i) => i.category === cat);
                  if (firstMatch) setSelectedCatalogId(firstMatch.id);
                }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-[#3B82F6] text-white shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            )
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
          <select
            value={activeCatalogSelection?.id || ''}
            onChange={(e) => setSelectedCatalogId(e.target.value)}
            aria-label="Select Fermentable, Honey, or Sugar"
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3B82F6]"
          >
            {filteredCatalog.map((item) => (
              <option key={item.id} value={item.id}>
                [{item.category.toUpperCase()}] {item.name} — {item.ppg} PPG,{' '}
                {item.colorLovibond}°L ({item.fermentability}% Ferm.)
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <div className="relative w-28">
              <input
                type="number"
                step="0.25"
                min="0.05"
                value={addWeightDisplay}
                onChange={(e) => setAddWeightDisplay(e.target.value)}
                aria-label="Ingredient Weight"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-3 pr-9 py-2 text-sm text-white focus:outline-none focus:border-[#3B82F6]"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                {unitSystem === 'metric' ? 'kg' : 'lbs'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleAddFermentable}
              className="inline-flex items-center gap-1.5 bg-[#3B82F6] hover:bg-blue-600 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>
        {activeCatalogSelection && (
          <p className="text-xs text-slate-400 pl-1">
            <span className="text-slate-300 font-medium">
              {activeCatalogSelection.name}:
            </span>{' '}
            {activeCatalogSelection.notes}
          </p>
        )}
      </div>

      {/* Active Recipe Fermentables Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
              <th className="py-2.5 px-3">Ingredient & Type</th>
              <th className="py-2.5 px-3">Addition Stage</th>
              <th className="py-2.5 px-3 w-32">
                Weight ({unitSystem === 'metric' ? 'kg' : 'lbs'})
              </th>
              <th className="py-2.5 px-3 w-36">% of Grist & GU</th>
              <th className="py-2.5 px-3">Specs (PPG / °L / Ferm)</th>
              <th className="py-2.5 px-3">Stock</th>
              <th className="py-2.5 px-2 text-right">Remove</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-sm">
            {recipe.fermentables.map((item) => {
              const breakdown = metrics.fermentableBreakdown.find(
                (b) => b.instanceId === item.instanceId
              );
              const pct = breakdown?.percentageOfGrist ?? 0;
              const gu = breakdown?.gravityPoints ?? 0;

              const invItem = inventory.find(
                (i) => i.type === 'fermentable' && i.ingredientId === item.id
              );
              const onHandLbs = invItem?.quantity ?? 0;
              const hasEnough = onHandLbs >= item.weightLbs;

              return (
                <tr
                  key={item.instanceId}
                  className="hover:bg-slate-800/30 transition-colors"
                >
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                        style={{
                          backgroundColor: srmToHex(
                            Math.max(1, item.colorLovibond)
                          ),
                        }}
                        title={`${item.colorLovibond} °Lovibond`}
                      />
                      <div>
                        <div className="font-medium text-white flex items-center gap-2">
                          {item.name}
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full border uppercase font-semibold ${CATEGORY_BADGE_STYLES[item.category]}`}
                          >
                            {item.category}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400">
                          {item.origin}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <select
                      value={item.stage}
                      onChange={(e) =>
                        updateFermentable(item.instanceId, {
                          stage: e.target.value as FermentableAdditionStage,
                        })
                      }
                      aria-label={`Addition stage for ${item.name}`}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#3B82F6]"
                    >
                      {STAGE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="py-3 px-3">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={lbsToDisplay(item.weightLbs, unitSystem)}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        updateFermentable(item.instanceId, {
                          weightLbs: displayToLbs(val, unitSystem),
                        });
                      }}
                      aria-label={`Weight for ${item.name}`}
                      className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white font-medium focus:outline-none focus:border-[#3B82F6]"
                    />
                  </td>

                  <td className="py-3 px-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-200">
                        {pct}%
                      </span>
                      <span className="text-slate-400">+{gu} pts</span>
                    </div>
                    <progress
                      max={100}
                      value={pct}
                      className="w-full h-1.5 rounded-full overflow-hidden"
                    />
                  </td>

                  <td className="py-3 px-3 text-xs text-slate-300">
                    <div>
                      <span className="text-slate-400">PPG:</span> {item.ppg} •{' '}
                      <span className="text-slate-400">Color:</span>{' '}
                      {item.colorLovibond}°L
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Fermentability: {item.fermentability}%
                      {item.diastaticPower > 0
                        ? ` • ${item.diastaticPower} °Lintner`
                        : ''}
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    {hasEnough ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {formatWeightLbs(onHandLbs, unitSystem)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {onHandLbs > 0
                          ? `Have ${formatWeightLbs(onHandLbs, unitSystem)}`
                          : 'Out of Stock'}
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-2 text-right">
                    <button
                      type="button"
                      onClick={() => removeFermentable(item.instanceId)}
                      aria-label={`Remove ${item.name}`}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
