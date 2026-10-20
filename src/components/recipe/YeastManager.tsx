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
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">
              Yeast, Attenuation & Pitch Rate Planner ({allYeasts.length} Strains in DB)
            </h2>
            <p className="text-xs text-slate-400">
              Target Pitch:{' '}
              <span className="text-slate-200 font-medium">
                {metrics.requiredCellsBillions}B cells
              </span>{' '}
              • Pitched:{' '}
              <span
                className={
                  metrics.pitchedCellsBillions >= metrics.requiredCellsBillions
                    ? 'text-emerald-400 font-semibold'
                    : 'text-amber-400 font-semibold'
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
          onClick={() => setShowCustomModal(!showCustomModal)}
          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          + Add Custom Yeast to DB
        </button>
      </div>

      {/* Custom Yeast Creator Modal */}
      {showCustomModal && (
        <form
          onSubmit={handleCreateCustomYeast}
          className="bg-slate-950/95 border border-purple-500/40 rounded-xl p-4 space-y-3"
        >
          <div className="text-xs font-semibold uppercase tracking-wider text-purple-300">
            Add New Yeast Strain to Local Database
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs text-slate-400 mb-1">
                Strain Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Weihenstephan Weizen or Conan"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Lab / Manufacturer
              </label>
              <input
                type="text"
                placeholder="White Labs, Wyeast..."
                value={customLab}
                onChange={(e) => setCustomLab(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Code / Product ID
              </label>
              <input
                type="text"
                placeholder="e.g., WLP300"
                value={customProductId}
                onChange={(e) => setCustomProductId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Form</label>
              <select
                value={customForm}
                onChange={(e) => setCustomForm(e.target.value as YeastForm)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white"
              >
                <option value="liquid">Liquid Pouch/Vial</option>
                <option value="dry">Dry Sachet</option>
                <option value="kveik">Kveik</option>
                <option value="slurry">Harvested Slurry</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Flocculation
              </label>
              <select
                value={customFlocc}
                onChange={(e) =>
                  setCustomFlocc(e.target.value as FlocculationLevel)
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="very-high">Very High</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Min Atten %
              </label>
              <input
                type="number"
                value={customAttenMin}
                onChange={(e) => setCustomAttenMin(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Max Atten %
              </label>
              <input
                type="number"
                value={customAttenMax}
                onChange={(e) => setCustomAttenMax(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Min Temp (°F)
              </label>
              <input
                type="number"
                value={customTempMinF}
                onChange={(e) => setCustomTempMinF(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Max Temp (°F)
              </label>
              <input
                type="number"
                value={customTempMaxF}
                onChange={(e) => setCustomTempMaxF(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                ABV Tolerance %
              </label>
              <input
                type="number"
                value={customAbvTol}
                onChange={(e) => setCustomAbvTol(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full bg-[#10B981] hover:bg-emerald-600 text-slate-950 font-semibold text-xs py-2 px-3 rounded-lg transition-colors cursor-pointer"
              >
                Save to DB & Add
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Flavor Profile / Notes (optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Classic Bavarian banana and clove esters..."
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
            />
          </div>
        </form>
      )}

      {/* Lab Filter Pills, Search & Add Yeast Bar */}
      <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex flex-wrap gap-1.5">
            {labs.map((lab) => (
              <button
                key={lab}
                type="button"
                onClick={() => {
                  setSelectedLab(lab);
                  const first = allYeasts.find(
                    (y) => lab === 'All Labs' || y.lab === lab
                  );
                  if (first) setSelectedYeastId(first.id);
                }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                  selectedLab === lab
                    ? 'bg-purple-500 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {lab}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search WLP300, Weihenstephan, Saison..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-400"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
          <select
            value={selectedCatalogYeast?.id || ''}
            onChange={(e) => setSelectedYeastId(e.target.value)}
            aria-label="Select Yeast Strain"
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3B82F6]"
          >
            {filteredYeasts.map((y) => (
              <option key={y.id} value={y.id}>
                [{y.lab} {y.productId}] {y.name} — {y.attenuationMin}–
                {y.attenuationMax}% Atten, {y.tempMinF}–{y.tempMaxF}°F (
                {y.form.toUpperCase()})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleAddYeast}
            className="inline-flex items-center justify-center gap-1.5 bg-[#3B82F6] hover:bg-blue-600 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Yeast Strain
          </button>
        </div>
        {selectedCatalogYeast && (
          <p className="text-xs text-slate-400 pl-1">
            <span className="text-slate-300 font-medium">
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
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 uppercase">
                    {y.form}
                  </span>
                  {hasEnough ? (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {onHandPacks} pack(s) in stock
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {onHandPacks > 0
                        ? `Only ${onHandPacks} in stock`
                        : 'Out of Stock'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  Ideal Temp:{' '}
                  <span className="text-slate-200 font-medium">
                    {tempFToDisplay(y.tempMinF, unitSystem)}–
                    {tempFToDisplay(y.tempMaxF, unitSystem)}°
                    {unitSystem === 'metric' ? 'C' : 'F'}
                  </span>{' '}
                  • Flocculation:{' '}
                  <span className="text-slate-200 capitalize">
                    {y.flocculation}
                  </span>{' '}
                  • Alcohol Tolerance:{' '}
                  <span className="text-slate-200">
                    {y.alcoholTolerance}% ABV
                  </span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Apparent Attenuation (%)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={50}
                      max={98}
                      value={y.customAttenuation}
                      onChange={(e) =>
                        updateYeast(y.instanceId, {
                          customAttenuation: parseInt(e.target.value, 10) || 75,
                        })
                      }
                      aria-label={`Attenuation for ${y.name}`}
                      className="w-28 accent-[#3B82F6]"
                    />
                    <span className="text-sm font-semibold text-white w-10">
                      {y.customAttenuation}%
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Packs / Vials
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={y.packs}
                    onChange={(e) =>
                      updateYeast(y.instanceId, {
                        packs: Math.max(1, parseInt(e.target.value, 10) || 1),
                      })
                    }
                    aria-label={`Packs for ${y.name}`}
                    className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Pitch Rate Target
                  </label>
                  <select
                    value={y.targetPitchRate ?? 0.75}
                    onChange={(e) =>
                      updateYeast(y.instanceId, {
                        targetPitchRate: parseFloat(e.target.value) || 0.75,
                      })
                    }
                    aria-label={`Pitch rate for ${y.name}`}
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
                  aria-label={`Remove ${y.name}`}
                  className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer self-end"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
