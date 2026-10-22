'use client';

import React, { useState } from 'react';
import { useBrewStore } from '@/store/useBrewStore';
import { WATER_PROFILES_CATALOG } from '@/data/ingredients';
import { BrewMetrics } from '@/types/brewing';
import {
  galToDisplay,
  tempFToDisplay,
  displayToTempF,
} from '@/lib/units';
import {
  Droplets,
  Thermometer,
  Wand2,
  Plus,
  Trash2,
  Beaker,
} from 'lucide-react';

interface WaterChemistryViewProps {
  metrics: BrewMetrics;
}

export function WaterChemistryView({ metrics }: WaterChemistryViewProps) {
  const {
    recipe,
    unitSystem,
    updateEquipment,
    addMashStep,
    updateMashStep,
    removeMashStep,
    setSourceWater,
    setTargetWater,
    updateSaltAdditions,
    autoMatchTargetWater,
  } = useBrewStore();

  const [newStepName, setNewStepName] = useState('Protein Rest');
  const [newStepTemp, setNewStepTemp] = useState('122');
  const [newStepMins, setNewStepMins] = useState('20');

  const handleAddMashStep = (e: React.FormEvent) => {
    e.preventDefault();
    addMashStep({
      name: newStepName || 'Mash Step',
      type: 'infusion',
      targetTempF: displayToTempF(parseFloat(newStepTemp) || 152, unitSystem),
      durationMinutes: parseInt(newStepMins, 10) || 60,
    });
  };

  const ions: {
    key: keyof typeof recipe.sourceWater;
    label: string;
    symbol: string;
    idealRange: string;
  }[] = [
    { key: 'calcium', label: 'Calcium', symbol: 'Ca²⁺', idealRange: '50–150 ppm' },
    { key: 'magnesium', label: 'Magnesium', symbol: 'Mg²⁺', idealRange: '5–30 ppm' },
    { key: 'sodium', label: 'Sodium', symbol: 'Na⁺', idealRange: '0–50 ppm' },
    { key: 'chloride', label: 'Chloride', symbol: 'Cl⁻', idealRange: '40–200 ppm' },
    { key: 'sulfate', label: 'Sulfate', symbol: 'SO₄²⁻', idealRange: '40–250 ppm' },
    {
      key: 'bicarbonate',
      label: 'Bicarbonate',
      symbol: 'HCO₃⁻',
      idealRange: '0–200 ppm',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Water Volumes & Strike Temperature Cards */}
      <section
        aria-label="Strike Water, Sparge Water, and Mash pH Summary"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
            <span>Strike Water Volume</span>
            <Droplets
              className="w-4 h-4 text-[#3B82F6]"
              aria-hidden="true"
            />
          </div>
          <div className="text-2xl font-bold text-white">
            {galToDisplay(metrics.strikeWaterGal, unitSystem)}{' '}
            <span className="text-sm font-normal text-slate-300">
              {unitSystem === 'metric' ? 'L' : 'gal'}
            </span>
          </div>
          <div className="text-xs text-slate-300 mt-1">
            Heat to{' '}
            <span className="text-amber-300 font-semibold">
              {tempFToDisplay(metrics.strikeWaterTempF, unitSystem)}°
              {unitSystem === 'metric' ? 'C' : 'F'}
            </span>{' '}
            strike temp
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
            <span>Sparge Water Volume</span>
            <Droplets
              className="w-4 h-4 text-cyan-400"
              aria-hidden="true"
            />
          </div>
          <div className="text-2xl font-bold text-white">
            {galToDisplay(metrics.spargeWaterGal, unitSystem)}{' '}
            <span className="text-sm font-normal text-slate-300">
              {unitSystem === 'metric' ? 'L' : 'gal'}
            </span>
          </div>
          <div className="text-xs text-slate-300 mt-1">
            Total Brew Water:{' '}
            {galToDisplay(metrics.totalWaterNeededGal, unitSystem)}{' '}
            {unitSystem === 'metric' ? 'L' : 'gal'}
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
            <span>Estimated Mash pH</span>
            <Beaker
              className="w-4 h-4 text-[#10B981]"
              aria-hidden="true"
            />
          </div>
          <div className="text-2xl font-bold text-white">
            {metrics.estimatedMashPh.toFixed(2)}{' '}
            <span className="text-sm font-normal text-slate-300">pH</span>
          </div>
          <div className="text-xs mt-1">
            {metrics.estimatedMashPh >= 5.2 && metrics.estimatedMashPh <= 5.6 ? (
              <span className="text-emerald-300">
                Ideal Conversion Range (5.2–5.6)
              </span>
            ) : (
              <span className="text-amber-300">
                Outside 5.2–5.6 — Adjust Lactic Acid or Salts
              </span>
            )}
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
            <span>SO₄²⁻ : Cl⁻ Balance</span>
            <Thermometer
              className="w-4 h-4 text-amber-400"
              aria-hidden="true"
            />
          </div>
          <div className="text-2xl font-bold text-white">
            {metrics.sulfateToChlorideRatio} : 1
          </div>
          <div className="text-xs text-[#10B981] font-medium mt-1">
            {metrics.sulfateChlorideBalanceLabel}
          </div>
        </div>
      </section>

      {/* Mash Schedule & Strike Water Parameters */}
      <section
        aria-labelledby="mash-schedule-heading"
        className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h2
              id="mash-schedule-heading"
              className="text-base font-semibold text-white"
            >
              Mash Schedule &amp; Strike Parameters
            </h2>
            <p className="text-xs text-slate-300">
              Adjust mash thickness, dry grain temperature, and multi-step rests.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="mash-thickness-input"
              className="block text-xs font-medium text-slate-300 mb-1"
            >
              Water-to-Grist Ratio (qt/lb)
            </label>
            <input
              id="mash-thickness-input"
              type="number"
              step="0.1"
              min="1.0"
              max="3.5"
              value={recipe.equipment.mashThicknessQtPerLb}
              onChange={(e) =>
                updateEquipment({
                  mashThicknessQtPerLb: parseFloat(e.target.value) || 1.5,
                })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
            />
          </div>

          <div>
            <label
              htmlFor="mash-grain-temp-input"
              className="block text-xs font-medium text-slate-300 mb-1"
            >
              Dry Grain Temp (°{unitSystem === 'metric' ? 'C' : 'F'})
            </label>
            <input
              id="mash-grain-temp-input"
              type="number"
              value={tempFToDisplay(recipe.equipment.grainTempF, unitSystem)}
              onChange={(e) =>
                updateEquipment({
                  grainTempF: displayToTempF(
                    parseFloat(e.target.value) || 68,
                    unitSystem
                  ),
                })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
            />
          </div>

          <div>
            <label
              htmlFor="mash-grain-abs-input"
              className="block text-xs font-medium text-slate-300 mb-1"
            >
              Grain Absorption (gal/lb)
            </label>
            <input
              id="mash-grain-abs-input"
              type="number"
              step="0.01"
              min="0.05"
              max="0.2"
              value={recipe.equipment.grainAbsorptionGalPerLb}
              onChange={(e) =>
                updateEquipment({
                  grainAbsorptionGalPerLb: parseFloat(e.target.value) || 0.12,
                })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
            />
          </div>
        </div>

        {/* Mash Rest Steps */}
        <div className="space-y-2 pt-2">
          {recipe.mashSteps.map((step, index) => (
            <div
              key={step.id}
              className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-6 h-6 rounded-full bg-[#3B82F6]/20 text-[#3B82F6] text-xs font-bold flex items-center justify-center"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <label
                  htmlFor={`mash-step-name-${step.id}`}
                  className="visually-hidden"
                >
                  Mash step {index + 1} name
                </label>
                <input
                  id={`mash-step-name-${step.id}`}
                  type="text"
                  value={step.name}
                  onChange={(e) =>
                    updateMashStep(step.id, { name: e.target.value })
                  }
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white font-medium"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <label
                    htmlFor={`mash-step-temp-${step.id}`}
                    className="text-xs text-slate-300"
                  >
                    Temp:
                  </label>
                  <input
                    id={`mash-step-temp-${step.id}`}
                    type="number"
                    value={tempFToDisplay(step.targetTempF, unitSystem)}
                    onChange={(e) =>
                      updateMashStep(step.id, {
                        targetTempF: displayToTempF(
                          parseFloat(e.target.value) || 152,
                          unitSystem
                        ),
                      })
                    }
                    className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm text-white"
                  />
                  <span className="text-xs text-slate-300">
                    °{unitSystem === 'metric' ? 'C' : 'F'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <label
                    htmlFor={`mash-step-dur-${step.id}`}
                    className="text-xs text-slate-300"
                  >
                    Duration:
                  </label>
                  <input
                    id={`mash-step-dur-${step.id}`}
                    type="number"
                    value={step.durationMinutes}
                    onChange={(e) =>
                      updateMashStep(step.id, {
                        durationMinutes: parseInt(e.target.value, 10) || 60,
                      })
                    }
                    className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm text-white"
                  />
                  <span className="text-xs text-slate-300">min</span>
                </div>

                {recipe.mashSteps.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMashStep(step.id)}
                    aria-label={`Remove ${step.name}`}
                    className="p-2 text-slate-300 hover:text-rose-400 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          ))}

          <form
            onSubmit={handleAddMashStep}
            className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end pt-2"
          >
            <div className="sm:col-span-5">
              <label
                htmlFor="new-mash-step-name"
                className="block text-xs font-medium text-slate-300 mb-1"
              >
                New Mash Rest Name
              </label>
              <input
                id="new-mash-step-name"
                type="text"
                placeholder="e.g., Mash Out"
                value={newStepName}
                onChange={(e) => setNewStepName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="new-mash-step-temp"
                className="block text-xs font-medium text-slate-300 mb-1"
              >
                Temp (°{unitSystem === 'metric' ? 'C' : 'F'})
              </label>
              <input
                id="new-mash-step-temp"
                type="number"
                value={newStepTemp}
                onChange={(e) => setNewStepTemp(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="new-mash-step-mins"
                className="block text-xs font-medium text-slate-300 mb-1"
              >
                Duration (min)
              </label>
              <input
                id="new-mash-step-mins"
                type="number"
                value={newStepMins}
                onChange={(e) => setNewStepMins(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
            </div>

            <div className="sm:col-span-3">
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-100 px-3 py-2 rounded-lg cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Add Rest Step</span>
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Water Chemistry & Mineral Salts Calculator */}
      <section
        aria-labelledby="water-chemistry-heading"
        className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h2
              id="water-chemistry-heading"
              className="text-base font-semibold text-white"
            >
              Water Chemistry &amp; Salt Additions (ppm / mg/L)
            </h2>
            <p className="text-xs text-slate-300">
              Select your source water and target beer style profile, or
              auto-match salts.
            </p>
          </div>

          <button
            type="button"
            onClick={autoMatchTargetWater}
            className="inline-flex items-center gap-1.5 bg-[#10B981] hover:bg-emerald-600 text-slate-950 font-semibold text-xs px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            <Wand2 className="w-4 h-4" aria-hidden="true" />
            <span>Auto-Calculate Salts for Target Profile</span>
          </button>
        </div>

        {/* Source & Target Water Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="source-water-select"
              className="block text-xs font-medium text-slate-300 mb-1"
            >
              Source Water Profile
            </label>
            <select
              id="source-water-select"
              value={recipe.sourceWater.id}
              onChange={(e) => {
                const found = WATER_PROFILES_CATALOG.find(
                  (w) => w.id === e.target.value
                );
                if (found) setSourceWater(found);
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
            >
              {WATER_PROFILES_CATALOG.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} — {w.description}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="target-water-select"
              className="block text-xs font-medium text-slate-300 mb-1"
            >
              Target Style Water Profile
            </label>
            <select
              id="target-water-select"
              value={recipe.targetWater.id}
              onChange={(e) => {
                const found = WATER_PROFILES_CATALOG.find(
                  (w) => w.id === e.target.value
                );
                if (found) setTargetWater(found);
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
            >
              {WATER_PROFILES_CATALOG.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} — {w.description}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Salt & Acid Additions Inputs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <label
              htmlFor="salt-gypsum-input"
              className="block text-xs font-medium text-slate-300 mb-1"
            >
              Gypsum CaSO₄ (g)
            </label>
            <input
              id="salt-gypsum-input"
              type="number"
              step="0.5"
              min="0"
              value={recipe.saltAdditions.gypsumGrams}
              onChange={(e) =>
                updateSaltAdditions({
                  gypsumGrams: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white"
            />
          </div>

          <div>
            <label
              htmlFor="salt-cacl2-input"
              className="block text-xs font-medium text-slate-300 mb-1"
            >
              Calcium Chloride CaCl₂ (g)
            </label>
            <input
              id="salt-cacl2-input"
              type="number"
              step="0.5"
              min="0"
              value={recipe.saltAdditions.calciumChlorideGrams}
              onChange={(e) =>
                updateSaltAdditions({
                  calciumChlorideGrams: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white"
            />
          </div>

          <div>
            <label
              htmlFor="salt-epsom-input"
              className="block text-xs font-medium text-slate-300 mb-1"
            >
              Epsom Salt MgSO₄ (g)
            </label>
            <input
              id="salt-epsom-input"
              type="number"
              step="0.5"
              min="0"
              value={recipe.saltAdditions.epsomSaltGrams}
              onChange={(e) =>
                updateSaltAdditions({
                  epsomSaltGrams: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white"
            />
          </div>

          <div>
            <label
              htmlFor="salt-bakingsoda-input"
              className="block text-xs font-medium text-slate-300 mb-1"
            >
              Baking Soda NaHCO₃ (g)
            </label>
            <input
              id="salt-bakingsoda-input"
              type="number"
              step="0.5"
              min="0"
              value={recipe.saltAdditions.bakingSodaGrams}
              onChange={(e) =>
                updateSaltAdditions({
                  bakingSodaGrams: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white"
            />
          </div>

          <div>
            <label
              htmlFor="salt-chalk-input"
              className="block text-xs font-medium text-slate-300 mb-1"
            >
              Chalk CaCO₃ (g)
            </label>
            <input
              id="salt-chalk-input"
              type="number"
              step="0.5"
              min="0"
              value={recipe.saltAdditions.chalkGrams}
              onChange={(e) =>
                updateSaltAdditions({
                  chalkGrams: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white"
            />
          </div>

          <div>
            <label
              htmlFor="salt-lactic-input"
              className="block text-xs font-medium text-emerald-300 mb-1"
            >
              88% Lactic Acid (mL)
            </label>
            <input
              id="salt-lactic-input"
              type="number"
              step="0.5"
              min="0"
              value={recipe.saltAdditions.lacticAcid88Ml}
              onChange={(e) =>
                updateSaltAdditions({
                  lacticAcid88Ml: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full bg-slate-950 border border-emerald-500/40 rounded-lg px-2.5 py-1.5 text-sm text-emerald-200"
            />
          </div>
        </div>

        {/* Ion Comparison Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          {ions.map((ion) => {
            const resultingVal = metrics.resultingWater[ion.key] as number;
            const targetVal = recipe.targetWater[ion.key] as number;
            const diff = resultingVal - targetVal;

            return (
              <div
                key={ion.key}
                className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-center space-y-1"
              >
                <div className="text-xs font-semibold text-slate-300">
                  {ion.label} ({ion.symbol})
                </div>
                <div className="text-xl font-bold text-white">
                  {resultingVal}{' '}
                  <span className="text-xs font-normal text-slate-300">
                    ppm
                  </span>
                </div>
                <div className="text-[11px] text-slate-300">
                  Target: {targetVal} ppm (
                  <span
                    className={
                      Math.abs(diff) <= 15
                        ? 'text-emerald-300'
                        : 'text-amber-300'
                    }
                  >
                    {diff >= 0 ? `+${diff}` : diff}
                  </span>
                  )
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
