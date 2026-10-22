'use client';

import React, { useState } from 'react';
import { useBrewStore } from '@/store/useBrewStore';
import { HOPS_CATALOG } from '@/data/ingredients';
import { BrewMetrics, HopCatalogItem, HopForm, HopUse } from '@/types/brewing';
import {
  ozToDisplay,
  displayToOz,
  tempFToDisplay,
  displayToTempF,
} from '@/lib/units';
import { ModalDialog } from '@/components/ui/ModalDialog';
import { RovingFilterGroup } from '@/components/ui/RovingFilterGroup';
import {
  Hop,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Thermometer,
  Sparkles,
  Search,
} from 'lucide-react';

interface HopsManagerProps {
  metrics: BrewMetrics;
}

const HOP_USE_OPTIONS: { value: HopUse; label: string }[] = [
  { value: 'first-wort', label: 'First Wort Hop (FWH)' },
  { value: 'boil', label: 'Boil Addition' },
  { value: 'whirlpool', label: 'Whirlpool / Hop Stand' },
  { value: 'dry-hop', label: 'Dry Hop (Fermenter)' },
  { value: 'mash', label: 'Mash Hop' },
];

export function HopsManager({ metrics }: HopsManagerProps) {
  const {
    recipe,
    unitSystem,
    inventory,
    customHops,
    addHop,
    updateHop,
    removeHop,
    addCustomHopToCatalog,
  } = useBrewStore();

  const allHops = [...HOPS_CATALOG, ...customHops];
  const origins = [
    'All Origins',
    ...Array.from(new Set(allHops.map((h) => h.origin))),
  ];

  const [selectedOrigin, setSelectedOrigin] = useState<string>('All Origins');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedHopId, setSelectedHopId] = useState(HOPS_CATALOG[0].id);
  const [selectedUse, setSelectedUse] = useState<HopUse>('boil');
  const [addWeightDisplay, setAddWeightDisplay] = useState('1.0');
  const [addTime, setAddTime] = useState('15');
  const [showCustomModal, setShowCustomModal] = useState(false);

  // Custom Hop Form State
  const [customName, setCustomName] = useState('');
  const [customOrigin, setCustomOrigin] = useState('United States');
  const [customAlpha, setCustomAlpha] = useState('10.5');
  const [customBeta, setCustomBeta] = useState('4.5');
  const [customTags, setCustomTags] = useState('Citrus, Tropical, Pine');
  const [customNotes, setCustomNotes] = useState('');

  const filteredHops = allHops.filter((h) => {
    const matchesOrigin =
      selectedOrigin === 'All Origins' || h.origin === selectedOrigin;
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      h.name.toLowerCase().includes(q) ||
      h.origin.toLowerCase().includes(q) ||
      h.flavorTags.some((t) => t.toLowerCase().includes(q)) ||
      h.notes.toLowerCase().includes(q);
    return matchesOrigin && matchesQuery;
  });

  const selectedCatalogHop =
    filteredHops.find((h) => h.id === selectedHopId) ||
    filteredHops[0] ||
    allHops[0];

  const handleAddHop = () => {
    if (!selectedCatalogHop) return;
    const weightOz = displayToOz(
      parseFloat(addWeightDisplay) || 1.0,
      unitSystem
    );
    const timeMins =
      parseFloat(addTime) || (selectedUse === 'dry-hop' ? 4 : 15);
    addHop(selectedCatalogHop, weightOz, timeMins, selectedUse);
  };

  const handleCreateCustomHop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    const tags = customTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const newHop: HopCatalogItem = {
      id: `custom-hop-${Date.now()}`,
      name: customName.trim(),
      origin: customOrigin.trim() || 'Custom',
      alphaAcid: parseFloat(customAlpha) || 10.0,
      betaAcid: parseFloat(customBeta) || 4.0,
      cohumulone: 25,
      totalOilMlPer100g: 1.8,
      flavorTags: tags.length > 0 ? tags : ['Aromatic'],
      substitutes: [],
      notes: customNotes.trim() || 'Custom user-added hop variety.',
    };
    addCustomHopToCatalog(newHop);
    addHop(newHop, 1.0, 15, 'boil');
    setSelectedHopId(newHop.id);
    setCustomName('');
    setCustomNotes('');
    setShowCustomModal(false);
  };

  return (
    <section
      aria-labelledby="hops-section-heading"
      className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="p-2 rounded-xl bg-[#10B981]/15 text-[#10B981]"
            aria-hidden="true"
          >
            <Hop className="w-5 h-5" />
          </div>
          <div>
            <h2
              id="hops-section-heading"
              className="text-lg font-semibold text-white"
            >
              Hop Schedule &amp; Utilization ({allHops.length} Varieties in DB •{' '}
              {recipe.equipment.ibuFormula.toUpperCase()})
            </h2>
            <p className="text-xs text-slate-300">
              Total Hops:{' '}
              <span className="text-white font-medium">
                {ozToDisplay(metrics.totalHopsOz, unitSystem)}{' '}
                {unitSystem === 'metric' ? 'g' : 'oz'}
              </span>{' '}
              ({metrics.hopLoadOzPerGal} oz/gal) • Total Bitterness:{' '}
              <span className="text-[#10B981] font-semibold">
                {metrics.ibu.toFixed(1)} IBU
              </span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowCustomModal(true)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#10B981]" aria-hidden="true" />
          <span>+ Add Custom Hop to DB</span>
        </button>
      </div>

      {/* Origin Filter Radiogroup, Search & Add Hop Bar */}
      <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <RovingFilterGroup
            ariaLabel="Filter Hop Varieties by Country of Origin"
            options={origins.map((origin) => ({
              value: origin,
              label: origin,
            }))}
            value={selectedOrigin}
            onChange={(origin) => {
              setSelectedOrigin(origin);
              const first = allHops.find(
                (h) => origin === 'All Origins' || h.origin === origin
              );
              if (first) setSelectedHopId(first.id);
            }}
            accentColor="emerald"
          />

          <search aria-label="Search Hop Varieties" className="w-full lg:w-64">
            <label htmlFor="hop-search-input" className="visually-hidden">
              Search hop varieties by name, origin, or aroma
            </label>
            <div className="relative">
              <Search
                className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                id="hop-search-input"
                type="search"
                placeholder="Search Galaxy, Amarillo, Noble, Pine..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white"
              />
            </div>
          </search>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
          <div className="sm:col-span-5">
            <label
              htmlFor="add-hop-variety-select"
              className="block text-xs font-medium text-slate-300 mb-1"
            >
              Hop Variety
            </label>
            <select
              id="add-hop-variety-select"
              value={selectedCatalogHop?.id || ''}
              onChange={(e) => setSelectedHopId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
            >
              {filteredHops.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.origin}) — {h.alphaAcid}% AA [
                  {h.flavorTags.slice(0, 3).join(', ')}]
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <label
              htmlFor="add-hop-stage-select"
              className="block text-xs font-medium text-slate-300 mb-1"
            >
              Addition Stage
            </label>
            <select
              id="add-hop-stage-select"
              value={selectedUse}
              onChange={(e) => {
                const nextUse = e.target.value as HopUse;
                setSelectedUse(nextUse);
                if (nextUse === 'dry-hop') setAddTime('4');
                else if (nextUse === 'whirlpool') setAddTime('20');
                else if (nextUse === 'first-wort')
                  setAddTime(String(recipe.equipment.boilTimeMinutes));
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
            >
              {HOP_USE_OPTIONS.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="add-hop-weight-input"
              className="block text-xs font-medium text-slate-300 mb-1"
            >
              Weight ({unitSystem === 'metric' ? 'g' : 'oz'})
            </label>
            <div className="relative">
              <input
                id="add-hop-weight-input"
                type="number"
                step="0.25"
                min="0.1"
                value={addWeightDisplay}
                onChange={(e) => setAddWeightDisplay(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-3 pr-8 py-2 text-sm text-white"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-300">
                {unitSystem === 'metric' ? 'g' : 'oz'}
              </span>
            </div>
          </div>

          <div className="sm:col-span-2 flex items-end gap-2">
            <div className="flex-1">
              <label
                htmlFor="add-hop-time-input"
                className="block text-xs font-medium text-slate-300 mb-1"
              >
                {selectedUse === 'dry-hop' ? 'Days' : 'Minutes'}
              </label>
              <input
                id="add-hop-time-input"
                type="number"
                min="0"
                value={addTime}
                onChange={(e) => setAddTime(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-sm text-white"
              />
            </div>
            <button
              type="button"
              onClick={handleAddHop}
              aria-label="Add Hop Addition to Recipe"
              className="inline-flex items-center justify-center gap-1 bg-[#10B981] hover:bg-emerald-600 text-slate-950 font-semibold text-xs px-3.5 py-2.5 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {selectedCatalogHop && (
          <p className="text-xs text-slate-300 pl-1">
            <span className="text-white font-medium">
              {selectedCatalogHop.name} ({selectedCatalogHop.origin}):
            </span>{' '}
            {selectedCatalogHop.notes}
            {selectedCatalogHop.substitutes.length > 0 && (
              <>
                {' '}
                Substitutes:{' '}
                <span className="text-slate-200">
                  {selectedCatalogHop.substitutes.join(', ')}
                </span>
              </>
            )}
          </p>
        )}
      </div>

      {/* Container-Query Responsive Hop Additions Table */}
      <div
        tabIndex={0}
        role="region"
        aria-labelledby="hops-table-caption"
        className="responsive-table-container"
      >
        <table className="adaptive-table text-left">
          <caption id="hops-table-caption" className="visually-hidden">
            Active Recipe Hop Additions Schedule and IBU Contributions
          </caption>
          <thead>
            <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-300">
              <th scope="col" className="py-2.5 px-3">
                Hop Variety &amp; Aroma
              </th>
              <th scope="col" className="py-2.5 px-3">
                Stage &amp; Form
              </th>
              <th scope="col" className="py-2.5 px-3">
                Amount ({unitSystem === 'metric' ? 'g' : 'oz'})
              </th>
              <th scope="col" className="py-2.5 px-3">
                Alpha Acid %
              </th>
              <th scope="col" className="py-2.5 px-3">
                Time &amp; Whirlpool Temp
              </th>
              <th scope="col" className="py-2.5 px-3">
                IBU
              </th>
              <th scope="col" className="py-2.5 px-3">
                Stock
              </th>
              <th scope="col" className="py-2.5 px-2 text-right">
                Remove
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-sm">
            {recipe.hops.map((hop) => {
              const ibuItem = metrics.hopBreakdown.find(
                (b) => b.instanceId === hop.instanceId
              );
              const ibuVal = ibuItem?.ibuContribution ?? 0;

              const invItem = inventory.find(
                (i) => i.type === 'hop' && i.ingredientId === hop.hopId
              );
              const onHandOz = invItem?.quantity ?? 0;
              const hasEnough = onHandOz >= hop.weightOz;

              return (
                <tr
                  key={hop.instanceId}
                  className="hover:bg-slate-800/30 transition-colors"
                >
                  <td data-label="Hop Variety" className="py-3 px-3">
                    <div className="font-medium text-white">{hop.name}</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(hop.flavorTags || []).map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td data-label="Stage & Form" className="py-3 px-3 space-y-1.5">
                    <select
                      value={hop.use}
                      onChange={(e) =>
                        updateHop(hop.instanceId, {
                          use: e.target.value as HopUse,
                          temperatureF:
                            e.target.value === 'whirlpool'
                              ? hop.temperatureF ?? 180
                              : undefined,
                        })
                      }
                      aria-label={`Addition stage for ${hop.name}`}
                      className="block w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-100"
                    >
                      {HOP_USE_OPTIONS.map((u) => (
                        <option key={u.value} value={u.value}>
                          {u.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={hop.form}
                      onChange={(e) =>
                        updateHop(hop.instanceId, {
                          form: e.target.value as HopForm,
                        })
                      }
                      aria-label={`Hop form for ${hop.name}`}
                      className="block w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300"
                    >
                      <option value="pellet">Pellet (+10% Util)</option>
                      <option value="whole">Whole Leaf</option>
                      <option value="cryo">Cryo / Lupulin (+15%)</option>
                    </select>
                  </td>

                  <td
                    data-label={`Amount (${unitSystem === 'metric' ? 'g' : 'oz'})`}
                    className="py-3 px-3"
                  >
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      value={ozToDisplay(hop.weightOz, unitSystem)}
                      onChange={(e) =>
                        updateHop(hop.instanceId, {
                          weightOz: displayToOz(
                            parseFloat(e.target.value) || 0,
                            unitSystem
                          ),
                        })
                      }
                      aria-label={`Amount for ${hop.name}`}
                      className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white"
                    />
                  </td>

                  <td data-label="Alpha Acid %" className="py-3 px-3">
                    <div className="relative w-20">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="35"
                        value={hop.alphaAcid}
                        onChange={(e) =>
                          updateHop(hop.instanceId, {
                            alphaAcid: parseFloat(e.target.value) || 0,
                          })
                        }
                        aria-label={`Alpha acid percentage for ${hop.name}`}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-2 pr-5 py-1.5 text-sm text-white"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-300">
                        %
                      </span>
                    </div>
                  </td>

                  <td data-label="Time & Temp" className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="relative w-20">
                        <input
                          type="number"
                          min="0"
                          value={hop.timeMinutes}
                          onChange={(e) =>
                            updateHop(hop.instanceId, {
                              timeMinutes: parseFloat(e.target.value) || 0,
                            })
                          }
                          aria-label={`Duration in ${
                            hop.use === 'dry-hop' ? 'days' : 'minutes'
                          } for ${hop.name}`}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-2 pr-8 py-1.5 text-sm text-white"
                        />
                        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-300">
                          {hop.use === 'dry-hop' ? 'days' : 'min'}
                        </span>
                      </div>

                      {hop.use === 'whirlpool' && (
                        <div className="relative w-24 flex items-center">
                          <Thermometer
                            className="w-3.5 h-3.5 text-amber-400 absolute left-2 pointer-events-none"
                            aria-hidden="true"
                          />
                          <input
                            type="number"
                            value={tempFToDisplay(
                              hop.temperatureF ?? 180,
                              unitSystem
                            )}
                            onChange={(e) =>
                              updateHop(hop.instanceId, {
                                temperatureF: displayToTempF(
                                  parseFloat(e.target.value) || 180,
                                  unitSystem
                                ),
                              })
                            }
                            aria-label={`Whirlpool temperature for ${hop.name}`}
                            className="w-full bg-slate-950 border border-amber-500/40 rounded-lg pl-6 pr-6 py-1.5 text-xs text-amber-200"
                          />
                          <span className="absolute right-1.5 text-[10px] text-amber-300">
                            °{unitSystem === 'metric' ? 'C' : 'F'}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>

                  <td data-label="IBU Contribution" className="py-3 px-3">
                    <span className="font-semibold text-[#10B981]">
                      {ibuVal.toFixed(1)} IBU
                    </span>
                  </td>

                  <td data-label="Stock" className="py-3 px-3">
                    {hasEnough ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                        {ozToDisplay(onHandOz, unitSystem)}{' '}
                        {unitSystem === 'metric' ? 'g' : 'oz'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                        <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
                        {onHandOz > 0
                          ? `Have ${ozToDisplay(onHandOz, unitSystem)} ${unitSystem === 'metric' ? 'g' : 'oz'}`
                          : 'Out of Stock'}
                      </span>
                    )}
                  </td>

                  <td data-label="Action" className="py-3 px-2 text-right">
                    <button
                      type="button"
                      onClick={() => removeHop(hop.instanceId)}
                      aria-label={`Remove ${hop.name} addition`}
                      className="p-2 text-slate-300 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Native <dialog> Modal for Adding Custom Hop Variety */}
      <ModalDialog
        open={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        title="Add New Hop Variety to Local Database"
        description="Save a custom hop cultivar with its alpha acid percentage and aroma profile."
        icon={Hop}
        maxWidthClass="max-w-xl"
      >
        <form onSubmit={handleCreateCustomHop} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label
                htmlFor="custom-hop-name"
                className="block text-xs font-medium text-slate-300 mb-1"
              >
                Hop Variety Name
              </label>
              <input
                id="custom-hop-name"
                type="text"
                required
                placeholder="e.g., Superdelic or Anchovy"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>

            <div>
              <label
                htmlFor="custom-hop-origin"
                className="block text-xs font-medium text-slate-300 mb-1"
              >
                Origin Country
              </label>
              <input
                id="custom-hop-origin"
                type="text"
                placeholder="United States, New Zealand..."
                value={customOrigin}
                onChange={(e) => setCustomOrigin(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>

            <div>
              <label
                htmlFor="custom-hop-alpha"
                className="block text-xs font-medium text-slate-300 mb-1"
              >
                Alpha Acid (%)
              </label>
              <input
                id="custom-hop-alpha"
                type="number"
                step="0.1"
                value={customAlpha}
                onChange={(e) => setCustomAlpha(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>

            <div>
              <label
                htmlFor="custom-hop-beta"
                className="block text-xs font-medium text-slate-300 mb-1"
              >
                Beta Acid (%)
              </label>
              <input
                id="custom-hop-beta"
                type="number"
                step="0.1"
                value={customBeta}
                onChange={(e) => setCustomBeta(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="custom-hop-tags"
                className="block text-xs font-medium text-slate-300 mb-1"
              >
                Aroma &amp; Flavor Tags (comma-separated)
              </label>
              <input
                id="custom-hop-tags"
                type="text"
                value={customTags}
                onChange={(e) => setCustomTags(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="custom-hop-notes"
                className="block text-xs font-medium text-slate-300 mb-1"
              >
                Flavor Notes (optional)
              </label>
              <input
                id="custom-hop-notes"
                type="text"
                placeholder="e.g., Red berry, candy, and ripe mango aroma..."
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
