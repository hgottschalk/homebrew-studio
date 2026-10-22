'use client';

import React, { useState } from 'react';
import { useBrewStore } from '@/store/useBrewStore';
import { YEAST_CATALOG } from '@/data/ingredients';
import {
  BrewMetrics,
  YeastCatalogItem,
  YeastForm,
  FlocculationLevel,
} from '@/types/brewing';
import { tempFToDisplay } from '@/lib/units';
import { ModalDialog } from '@/components/ui/ModalDialog';
import { RovingFilterGroup } from '@/components/ui/RovingFilterGroup';
import {
  FlaskConical,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Search,
} from 'lucide-react';

interface YeastManagerProps {
  metrics: BrewMetrics;
}

export function YeastManager({ metrics }: YeastManagerProps) {
  const {
    recipe,
    unitSystem,
    inventory,
    customYeasts,
    addYeast,
    updateYeast,
    removeYeast,
    addCustomYeastToCatalog,
  } = useBrewStore();

  const allYeasts = [...YEAST_CATALOG, ...customYeasts];
  const labs = ['All Labs', ...Array.from(new Set(allYeasts.map((y) => y.lab)))];

  const [selectedLab, setSelectedLab] = useState<string>('All Labs');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedYeastId, setSelectedYeastId] = useState(YEAST_CATALOG[0].id);
  const [showCustomModal, setShowCustomModal] = useState(false);

  // Custom Yeast Form State
  const [customName, setCustomName] = useState('');
  const [customLab, setCustomLab] = useState('White Labs');
  const [customProductId, setCustomProductId] = useState('');
  const [customForm, setCustomForm] = useState<YeastForm>('liquid');
  const [customAttenMin, setCustomAttenMin] = useState('73');
  const [customAttenMax, setCustomAttenMax] = useState('78');
  const [customTempMinF, setCustomTempMinF] = useState('65');
  const [customTempMaxF, setCustomTempMaxF] = useState('72');
  const [customFlocc, setCustomFlocc] = useState<FlocculationLevel>('medium');
  const [customAbvTol, setCustomAbvTol] = useState('11');
  const [customNotes, setCustomNotes] = useState('');

  const filteredYeasts = allYeasts.filter((y) => {
    const matchesLab = selectedLab === 'All Labs' || y.lab === selectedLab;
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      y.name.toLowerCase().includes(q) ||
      y.productId.toLowerCase().includes(q) ||
      y.lab.toLowerCase().includes(q) ||
      y.notes.toLowerCase().includes(q);
    return matchesLab && matchesQuery;
  });

  const selectedCatalogYeast =
    filteredYeasts.find((y) => y.id === selectedYeastId) ||
    filteredYeasts[0] ||
    allYeasts[0];

  const handleAddYeast = () => {
    if (!selectedCatalogYeast) return;
    addYeast(selectedCatalogYeast);
  };

  const handleCreateCustomYeast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    const newYeast: YeastCatalogItem = {
      id: `custom-yeast-${Date.now()}`,
      name: customName.trim(),
      lab: customLab.trim() || 'Custom Lab',
      productId: customProductId.trim() || 'CUSTOM',
      form: customForm,
      attenuationMin: Number(customAttenMin) || 73,
      attenuationMax: Number(customAttenMax) || 78,
      tempMinF: Number(customTempMinF) || 65,
      tempMaxF: Number(customTempMaxF) || 72,
      flocculation: customFlocc,
      alcoholTolerance: Number(customAbvTol) || 11,
      notes: customNotes.trim() || 'Custom user-added yeast strain.',
    };
    addCustomYeastToCatalog(newYeast);
    addYeast(newYeast);
    setSelectedYeastId(newYeast.id);
    setCustomName('');
    setCustomProductId('');
    setCustomNotes('');
    setShowCustomModal(false);
  };

  return (
    <section
      aria-labelledby="yeast-section-heading"
      className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="p-2 rounded-xl bg-purple-500/15 text-purple-400"
            aria-hidden="true"
          >
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <h2
              id="yeast-section-heading"
              className="text-lg font-semibold text-white"
            >
              Yeast, Attenuation &amp; Pitch Rate Planner ({allYeasts.length}{' '}
              Strains in DB)
            </h2>
            <p className="text-xs text-slate-300">
              Target Pitch:{' '}
              <span className="text-white font-medium">
                {metrics.requiredCellsBillions}B cells
              </span>{' '}
              • Pitched:{' '}
              <span
                className={
                  metrics.pitchedCellsBillions >= metrics.requiredCellsBillions
                    ? 'text-emerald-300 font-semibold'
                    : 'text-amber-300 font-semibold'
                }
              >
                {metrics.pitchedCellsBillions}B cells
              </span>
              {metrics.starterLitresRecommended > 0 && (
                <span className="text-amber-300 ml-2">
                  (Recommend {metrics.starterLitresRecommended}L DME Starter or
                  extra pack)
                </span>
              )}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowCustomModal(true)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" aria-hidden="true" />
          <span>+ Add Custom Yeast to DB</span>
        </button>
      </div>

      {/* Lab Filter Radiogroup, Search & Add Yeast Bar */}
      <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <RovingFilterGroup
            ariaLabel="Filter Yeast Strains by Laboratory"
            options={labs.map((lab) => ({
              value: lab,
              label: lab,
            }))}
            value={selectedLab}
            onChange={(lab) => {
              setSelectedLab(lab);
              const first = allYeasts.find(
                (y) => lab === 'All Labs' || y.lab === lab
              );
              if (first) setSelectedYeastId(first.id);
            }}
            accentColor="purple"
          />

          <search aria-label="Search Yeast Strains" className="w-full lg:w-64">
            <label htmlFor="yeast-search-input" className="visually-hidden">
              Search yeast strains by name, lab, or product code
            </label>
            <div className="relative">
              <Search
                className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                id="yeast-search-input"
                type="search"
                placeholder="Search WLP300, Weihenstephan, Saison..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white"
              />
            </div>
          </search>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-end">
          <div className="flex-1">
            <label
              htmlFor="add-yeast-strain-select"
              className="block text-xs font-medium text-slate-300 mb-1"
            >
              Select Yeast Strain
            </label>
            <select
              id="add-yeast-strain-select"
              value={selectedCatalogYeast?.id || ''}
              onChange={(e) => setSelectedYeastId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
            >
              {filteredYeasts.map((y) => (
                <option key={y.id} value={y.id}>
                  [{y.lab} {y.productId}] {y.name} — {y.attenuationMin}–
                  {y.attenuationMax}% Atten, {y.tempMinF}–{y.tempMaxF}°F (
                  {y.form.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleAddYeast}
            className="inline-flex items-center justify-center gap-1.5 bg-[#3B82F6] hover:bg-blue-600 text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Add Yeast Strain</span>
          </button>
        </div>

        {selectedCatalogYeast && (
          <p className="text-xs text-slate-300 pl-1">
            <span className="text-white font-medium">
              {selectedCatalogYeast.lab} {selectedCatalogYeast.productId} —{' '}
              {selectedCatalogYeast.name}:
            </span>{' '}
            {selectedCatalogYeast.notes}
          </p>
        )}
      </div>

      {/* Active Yeasts List */}
      <div className="grid grid-cols-1 gap-3">
        {recipe.yeasts.map((y) => {
          const invItem = inventory.find(
            (i) => i.type === 'yeast' && i.ingredientId === y.id
          );
          const onHandPacks = invItem?.quantity ?? 0;
          const hasEnough = onHandPacks >= y.packs;

          return (
            <div
              key={y.instanceId}
              className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-semibold text-white">
                    {y.name}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-medium">
                    {y.lab} • {y.productId}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 uppercase">
                    {y.form}
                  </span>
                  {hasEnough ? (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                      {onHandPacks} pack(s) in stock
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                      <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
                      {onHandPacks > 0
                        ? `Only ${onHandPacks} in stock`
                        : 'Out of Stock'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300">
                  Ideal Temp:{' '}
                  <span className="text-white font-medium">
                    {tempFToDisplay(y.tempMinF, unitSystem)}–
                    {tempFToDisplay(y.tempMaxF, unitSystem)}°
                    {unitSystem === 'metric' ? 'C' : 'F'}
                  </span>{' '}
                  • Flocculation:{' '}
                  <span className="text-white capitalize">{y.flocculation}</span>{' '}
                  • Alcohol Tolerance:{' '}
                  <span className="text-white">{y.alcoholTolerance}% ABV</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <label
                    htmlFor={`yeast-atten-${y.instanceId}`}
                    className="block text-xs font-medium text-slate-300 mb-1"
                  >
                    Apparent Attenuation (%)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id={`yeast-atten-${y.instanceId}`}
                      type="range"
                      min={50}
                      max={98}
                      value={y.customAttenuation}
                      onChange={(e) =>
                        updateYeast(y.instanceId, {
                          customAttenuation: parseInt(e.target.value, 10) || 75,
                        })
                      }
                      className="w-28 accent-[#3B82F6]"
                    />
                    <span className="text-sm font-semibold text-white w-10">
                      {y.customAttenuation}%
                    </span>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor={`yeast-packs-${y.instanceId}`}
                    className="block text-xs font-medium text-slate-300 mb-1"
                  >
                    Packs / Vials
                  </label>
                  <input
                    id={`yeast-packs-${y.instanceId}`}
                    type="number"
                    min={1}
                    max={10}
                    value={y.packs}
                    onChange={(e) =>
                      updateYeast(y.instanceId, {
                        packs: Math.max(1, parseInt(e.target.value, 10) || 1),
                      })
                    }
                    className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor={`yeast-pitch-${y.instanceId}`}
                    className="block text-xs font-medium text-slate-300 mb-1"
                  >
                    Pitch Rate Target
                  </label>
                  <select
                    id={`yeast-pitch-${y.instanceId}`}
                    value={y.targetPitchRate ?? 0.75}
                    onChange={(e) =>
                      updateYeast(y.instanceId, {
                        targetPitchRate: parseFloat(e.target.value) || 0.75,
                      })
                    }
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value={0.5}>0.50M (Low / Kveik)</option>
                    <option value={0.75}>0.75M (Standard Ale)</option>
                    <option value={1.0}>1.00M (High-Gravity Ale)</option>
                    <option value={1.5}>1.50M (Standard Lager)</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => removeYeast(y.instanceId)}
                  aria-label={`Remove ${y.name} from recipe`}
                  className="p-2 text-slate-300 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer self-end"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Native <dialog> Modal for Adding Custom Yeast Strain */}
      <ModalDialog
        open={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        title="Add New Yeast Strain to Local Database"
        description="Save a custom yeast strain from any laboratory with its attenuation and temperature range."
        icon={FlaskConical}
        maxWidthClass="max-w-2xl"
      >
        <form onSubmit={handleCreateCustomYeast} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="sm:col-span-2">
              <label
                htmlFor="custom-yeast-name"
                className="block text-xs font-medium text-slate-300 mb-1"
              >
                Strain Name
              </label>
              <input
                id="custom-yeast-name"
                type="text"
                required
                placeholder="e.g., Weihenstephan Weizen or Conan"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>

            <div>
              <label
                htmlFor="custom-yeast-lab"
                className="block text-xs font-medium text-slate-300 mb-1"
              >
                Lab / Manufacturer
              </label>
              <input
                id="custom-yeast-lab"
                type="text"
                placeholder="White Labs, Wyeast..."
                value={customLab}
                onChange={(e) => setCustomLab(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>

            <div>
              <label
                htmlFor="custom-yeast-code"
                className="block text-xs font-medium text-slate-300 mb-1"
              >
                Code / Product ID
              </label>
              <input
                id="custom-yeast-code"
                type="text"
                placeholder="e.g., WLP300"
                value={customProductId}
                onChange={(e) => setCustomProductId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>

            <div>
              <label
                htmlFor="custom-yeast-form"
                className="block text-xs font-medium text-slate-300 mb-1"
              >
                Form
              </label>
              <select
                id="custom-yeast-form"
                value={customForm}
                onChange={(e) => setCustomForm(e.target.value as YeastForm)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value="liquid">Liquid Pouch/Vial</option>
                <option value="dry">Dry Sachet</option>
                <option value="kveik">Kveik</option>
                <option value="slurry">Harvested Slurry</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="custom-yeast-flocc"
                className="block text-xs font-medium text-slate-300 mb-1"
              >
                Flocculation
              </label>
              <select
                id="custom-yeast-flocc"
                value={customFlocc}
                onChange={(e) =>
                  setCustomFlocc(e.target.value as FlocculationLevel)
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="very-high">Very High</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="custom-yeast-atten-min"
                className="block text-xs font-medium text-slate-300 mb-1"
              >
                Min Attenuation (%)
              </label>
              <input
                id="custom-yeast-atten-min"
                type="number"
                value={customAttenMin}
                onChange={(e) => setCustomAttenMin(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>

            <div>
              <label
                htmlFor="custom-yeast-atten-max"
                className="block text-xs font-medium text-slate-300 mb-1"
              >
                Max Attenuation (%)
              </label>
              <input
                id="custom-yeast-atten-max"
                type="number"
                value={customAttenMax}
                onChange={(e) => setCustomAttenMax(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>

            <div>
              <label
                htmlFor="custom-yeast-abv-tol"
                className="block text-xs font-medium text-slate-300 mb-1"
              >
                ABV Tolerance (%)
              </label>
              <input
                id="custom-yeast-abv-tol"
                type="number"
                value={customAbvTol}
                onChange={(e) => setCustomAbvTol(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>

            <div>
              <label
                htmlFor="custom-yeast-temp-min"
                className="block text-xs font-medium text-slate-300 mb-1"
              >
                Min Temp (°F)
              </label>
              <input
                id="custom-yeast-temp-min"
                type="number"
                value={customTempMinF}
                onChange={(e) => setCustomTempMinF(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>

            <div>
              <label
                htmlFor="custom-yeast-temp-max"
                className="block text-xs font-medium text-slate-300 mb-1"
              >
                Max Temp (°F)
              </label>
              <input
                id="custom-yeast-temp-max"
                type="number"
                value={customTempMaxF}
                onChange={(e) => setCustomTempMaxF(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>

            <div className="sm:col-span-3">
              <label
                htmlFor="custom-yeast-notes"
                className="block text-xs font-medium text-slate-300 mb-1"
              >
                Flavor Profile / Notes (optional)
              </label>
              <input
                id="custom-yeast-notes"
                type="text"
                placeholder="e.g., Classic Bavarian banana and clove esters..."
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowCustomModal(false)}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#10B981] hover:bg-emerald-600 text-slate-950 font-semibold text-xs py-2 px-4 rounded-lg transition-colors cursor-pointer"
            >
              Save to DB &amp; Add to Recipe
            </button>
          </div>
        </form>
      </ModalDialog>
    </section>
  );
}
