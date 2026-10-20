'use client';

import React, { useState, useEffect } from 'react';
import { useBrewStore } from '@/store/useBrewStore';
import { BrewMetrics, ActualIngredientUsed } from '@/types/brewing';
import {
  formatWeightLbs,
  ozToDisplay,
  galToDisplay,
  tempFToDisplay,
} from '@/lib/units';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  CheckSquare,
  Square,
  Plus,
  ClipboardCheck,
  TrendingUp,
  Users,
  Calendar,
  BookOpenCheck,
  Wrench,
  ThumbsUp,
  Printer,
  Trash2,
  RefreshCw,
  Star,
} from 'lucide-react';

interface BrewDayViewProps {
  metrics: BrewMetrics;
}

export function BrewDayView({ metrics }: BrewDayViewProps) {
  const {
    recipe,
    unitSystem,
    batchLogs,
    startNewBatchFromRecipe,
    updateBatchLog,
    deleteBatchLog,
    updateActualIngredient,
    addActualIngredient,
    toggleBatchChecklistStep,
    addGravityReading,
  } = useBrewStore();

  const [selectedBatchId, setSelectedBatchId] = useState<string>(
    batchLogs[0]?.id || ''
  );

  // Interactive Countdown Timer State (Mash or Boil)
  const [timerMode, setTimerMode] = useState<'mash' | 'boil'>('boil');
  const defaultSeconds =
    (timerMode === 'mash'
      ? recipe.mashSteps[0]?.durationMinutes ?? 60
      : recipe.equipment.boilTimeMinutes) * 60;
  const [secondsLeft, setSecondsLeft] = useState<number>(defaultSeconds);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // New Gravity Reading Form
  const [readingDay, setReadingDay] = useState('7');
  const [readingGravity, setReadingGravity] = useState('1.014');
  const [readingTemp, setReadingTemp] = useState('68');
  const [readingNotes, setReadingNotes] = useState(
    'Dry hop addition / Krausen dropping'
  );

  // Extra Day-of Ingredient Addition Form
  const [extraType, setExtraType] =
    useState<ActualIngredientUsed['type']>('fermentable');
  const [extraName, setExtraName] = useState('');
  const [extraAmount, setExtraAmount] = useState('');
  const [extraNotes, setExtraNotes] = useState('');

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const activeBatch =
    batchLogs.find((b) => b.id === selectedBatchId) || batchLogs[0];

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const currentMinuteMark = Math.ceil(secondsLeft / 60);

  // Build default actualIngredientsUsed snapshot if an older stored batch doesn't have one yet
  const buildSnapshotFromRecipe = (): ActualIngredientUsed[] => [
    ...recipe.fermentables.map((f) => ({
      id: `act-${f.instanceId}`,
      type: 'fermentable' as const,
      plannedName: `${f.name} (${f.stage})`,
      plannedAmount: formatWeightLbs(f.weightLbs, unitSystem),
      actualName: `${f.name} (${f.stage})`,
      actualAmount: formatWeightLbs(f.weightLbs, unitSystem),
      notes: '',
    })),
    ...recipe.hops.map((h) => ({
      id: `act-${h.instanceId}`,
      type: 'hop' as const,
      plannedName: `${h.name} (${h.use} @ ${h.timeMinutes}${h.use === 'dry-hop' ? 'd' : 'm'})`,
      plannedAmount: `${ozToDisplay(h.weightOz, unitSystem)} ${unitSystem === 'metric' ? 'g' : 'oz'} (${h.alphaAcid}% AA)`,
      actualName: `${h.name} (${h.use} @ ${h.timeMinutes}${h.use === 'dry-hop' ? 'd' : 'm'})`,
      actualAmount: `${ozToDisplay(h.weightOz, unitSystem)} ${unitSystem === 'metric' ? 'g' : 'oz'} (${h.alphaAcid}% AA)`,
      notes: '',
    })),
    ...recipe.yeasts.map((y) => ({
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
      plannedAmount: `Gypsum ${recipe.saltAdditions.gypsumGrams}g, CaCl₂ ${recipe.saltAdditions.calciumChlorideGrams}g, Epsom ${recipe.saltAdditions.epsomSaltGrams}g, Lactic ${recipe.saltAdditions.lacticAcid88Ml}mL`,
      actualName: 'Water Salts & Acid',
      actualAmount: `Gypsum ${recipe.saltAdditions.gypsumGrams}g, CaCl₂ ${recipe.saltAdditions.calciumChlorideGrams}g, Epsom ${recipe.saltAdditions.epsomSaltGrams}g, Lactic ${recipe.saltAdditions.lacticAcid88Ml}mL`,
      notes: '',
    },
  ];

  // Build Brew Day Checklist from Active Recipe
  const checklistSteps = [
    {
      id: 'prep-water',
      title: `Measure ${galToDisplay(metrics.strikeWaterGal, unitSystem)} ${unitSystem === 'metric' ? 'L' : 'gal'} Strike Water & Add Mineral Salts`,
      detail: `Gypsum: ${recipe.saltAdditions.gypsumGrams}g • CaCl₂: ${recipe.saltAdditions.calciumChlorideGrams}g • Epsom: ${recipe.saltAdditions.epsomSaltGrams}g • Lactic Acid: ${recipe.saltAdditions.lacticAcid88Ml}mL`,
    },
    {
      id: 'mill-grains',
      title: `Mill & Weigh Mashed Grains (${formatWeightLbs(metrics.totalGrainWeightLbs, unitSystem)})`,
      detail: recipe.fermentables
        .filter((f) => f.stage === 'mash')
        .map((f) => `${f.name} (${formatWeightLbs(f.weightLbs, unitSystem)})`)
        .join(', '),
    },
    {
      id: 'mash-in',
      title: `Heat Strike Water to ${tempFToDisplay(metrics.strikeWaterTempF, unitSystem)}°${unitSystem === 'metric' ? 'C' : 'F'} & Mash In`,
      detail: `Target Rest: ${tempFToDisplay(recipe.mashSteps[0]?.targetTempF ?? 152, unitSystem)}°${unitSystem === 'metric' ? 'C' : 'F'} for ${recipe.mashSteps[0]?.durationMinutes ?? 60} mins (Est. pH ${metrics.estimatedMashPh})`,
    },
    {
      id: 'sparge-collect',
      title: `Vorlauf & Sparge with ${galToDisplay(metrics.spargeWaterGal, unitSystem)} ${unitSystem === 'metric' ? 'L' : 'gal'}`,
      detail: `Target Pre-Boil Volume: ${galToDisplay(metrics.preBoilVolumeGal, unitSystem)} ${unitSystem === 'metric' ? 'L' : 'gal'} @ ${metrics.preBoilGravity.toFixed(3)} SG`,
    },
    {
      id: 'boil-additions',
      title: `Boil for ${recipe.equipment.boilTimeMinutes} mins & Add Hops / Sugars / Honey on Schedule`,
      detail: [
        ...recipe.hops
          .filter((h) => h.use !== 'dry-hop')
          .map(
            (h) =>
              `${h.name} (${ozToDisplay(h.weightOz, unitSystem)}${unitSystem === 'metric' ? 'g' : 'oz'} @ ${h.use === 'whirlpool' ? `Whirlpool ${h.timeMinutes}m` : `${h.timeMinutes}m`})`
          ),
        ...recipe.fermentables
          .filter(
            (f) =>
              f.stage === 'boil-start' ||
              f.stage === 'late-boil' ||
              f.stage === 'flameout'
          )
          .map(
            (f) =>
              `${f.name} (${formatWeightLbs(f.weightLbs, unitSystem)} @ ${f.stage})`
          ),
      ].join(' • '),
    },
    {
      id: 'chill-pitch',
      title: `Chill Wort to Fermentation Temp & Pitch Yeast`,
      detail: recipe.yeasts
        .map((y) => `${y.packs}x ${y.name} (${y.productId})`)
        .join(', '),
    },
  ];

  // Calculate Actual Efficiency if Actual OG and Post-Boil Volume are recorded
  const maxTheoreticalPoints = recipe.fermentables.reduce(
    (sum, f) => sum + f.weightLbs * f.ppg,
    0
  );
  const actualPointsAchieved =
    activeBatch && activeBatch.actualOg && activeBatch.postBoilVolumeGal
      ? (activeBatch.actualOg - 1) * 1000 * activeBatch.postBoilVolumeGal
      : 0;
  const actualEfficiencyPct =
    maxTheoreticalPoints > 0 && actualPointsAchieved > 0
      ? Number(((actualPointsAchieved / maxTheoreticalPoints) * 100).toFixed(1))
      : recipe.equipment.brewhouseEfficiency;

  const actualIngredientsList =
    activeBatch?.actualIngredientsUsed &&
    activeBatch.actualIngredientsUsed.length > 0
      ? activeBatch.actualIngredientsUsed
      : [];

  return (
    <div className="space-y-6">
      {/* Printable Brewer's Log (Visible when printing from Brew Day tab) */}
      {activeBatch && (
        <div className="hidden print-only p-6 text-slate-900 space-y-5">
          <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-end">
            <div>
              <h1 className="text-2xl font-bold">
                Brewer&apos;s Log: {activeBatch.recipeName}
              </h1>
              <p className="text-sm text-slate-700">
                Brew Date: <strong>{activeBatch.brewDate}</strong>
                {activeBatch.packagingDate
                  ? ` • Packaged: ${activeBatch.packagingDate}`
                  : ''}{' '}
                • Lead Brewer:{' '}
                <strong>{activeBatch.leadBrewer || 'Head Brewer'}</strong>
                {activeBatch.coBrewers
                  ? ` • Brewed With: ${activeBatch.coBrewers}`
                  : ''}
              </p>
            </div>
            <div className="text-right text-xs text-slate-600">
              Status: <strong>{activeBatch.status.toUpperCase()}</strong> •
              Actual Efficiency: <strong>{actualEfficiencyPct}%</strong>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-3 border border-slate-300 rounded-lg p-3 text-center text-xs">
            <div>
              <div className="uppercase text-slate-500">Actual Mash Temp</div>
              <div className="text-base font-bold">
                {activeBatch.actualMashTempF ?? 151}°F
              </div>
            </div>
            <div>
              <div className="uppercase text-slate-500">Actual Mash pH</div>
              <div className="text-base font-bold">
                {activeBatch.actualMashPh ?? 5.35}
              </div>
            </div>
            <div>
              <div className="uppercase text-slate-500">Actual OG</div>
              <div className="text-base font-bold">
                {(activeBatch.actualOg ?? metrics.og).toFixed(3)} (Target{' '}
                {metrics.og.toFixed(3)})
              </div>
            </div>
            <div>
              <div className="uppercase text-slate-500">Actual FG</div>
              <div className="text-base font-bold">
                {(activeBatch.actualFg ?? metrics.fg).toFixed(3)} (Target{' '}
                {metrics.fg.toFixed(3)})
              </div>
            </div>
            <div>
              <div className="uppercase text-slate-500">Actual ABV</div>
              <div className="text-base font-bold">
                {(
                  ((activeBatch.actualOg ?? metrics.og) -
                    (activeBatch.actualFg ?? metrics.fg)) *
                  131.25
                ).toFixed(2)}
                %
              </div>
            </div>
          </div>

          {actualIngredientsList.length > 0 && (
            <div>
              <h2 className="text-sm font-bold uppercase border-b border-slate-300 pb-1 mb-2">
                What Was Actually Used (Planned vs. Actual)
              </h2>
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-300">
                    <th className="py-1">Planned Ingredient</th>
                    <th className="py-1">Planned Amount</th>
                    <th className="py-1">Actual Ingredient Used</th>
                    <th className="py-1">Actual Amount</th>
                    <th className="py-1">Notes / Lot</th>
                  </tr>
                </thead>
                <tbody>
                  {actualIngredientsList.map((item) => (
                    <tr key={item.id} className="border-b border-slate-200">
                      <td className="py-1">{item.plannedName}</td>
                      <td className="py-1">{item.plannedAmount}</td>
                      <td className="py-1 font-medium">{item.actualName}</td>
                      <td className="py-1 font-medium">{item.actualAmount}</td>
                      <td className="py-1">{item.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="border border-slate-300 rounded-lg p-3">
              <h3 className="font-bold uppercase mb-1">What Went Right</h3>
              <p className="whitespace-pre-wrap">
                {activeBatch.whatWentRight || 'None recorded'}
              </p>
            </div>
            <div className="border border-slate-300 rounded-lg p-3">
              <h3 className="font-bold uppercase mb-1">
                What We Had to Adjust / Lessons Learned
              </h3>
              <p className="whitespace-pre-wrap">
                {activeBatch.adjustmentsMade || 'None recorded'}
              </p>
            </div>
          </div>

          <div className="border border-slate-300 rounded-lg p-3 text-xs">
            <h3 className="font-bold uppercase mb-1">
              Tasting & Fermentation Notes
            </h3>
            <p className="whitespace-pre-wrap">
              {activeBatch.tastingNotes || 'None recorded'}
            </p>
          </div>
        </div>
      )}

      {/* Interactive Screen UI */}
      <div className="no-print space-y-6">
        {/* Top Bar: Brew Session Selector, New Session, Print Brewer's Log */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#3B82F6]/15 text-[#3B82F6]">
              <BookOpenCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Brewer&apos;s Log, Actual Batch Record & Timers
              </h2>
              <p className="text-xs text-slate-400">
                Log when you brewed, who brewed with you, what was actually used,
                what went right, and what you adjusted.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={activeBatch?.id || ''}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              aria-label="Select Brew Batch Session"
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-white focus:outline-none focus:border-[#3B82F6]"
            >
              {batchLogs.map((b) => (
                <option key={b.id} value={b.id}>
                  [{b.brewDate}] {b.recipeName} ({b.status.toUpperCase()})
                  {b.coBrewers ? ` — w/ ${b.coBrewers}` : ''}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                const newId = startNewBatchFromRecipe();
                setSelectedBatchId(newId);
              }}
              className="inline-flex items-center gap-1.5 bg-[#3B82F6] hover:bg-blue-600 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Start New Brew Log for &ldquo;{recipe.name}&rdquo;
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 bg-[#10B981] hover:bg-emerald-600 text-slate-950 text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print Brewer&apos;s Log
            </button>

            {activeBatch && batchLogs.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  deleteBatchLog(activeBatch.id);
                  const next = batchLogs.find((b) => b.id !== activeBatch.id);
                  if (next) setSelectedBatchId(next.id);
                }}
                aria-label="Delete batch log"
                className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-rose-500/10 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Section 1: Brew Session Header — When You Brewed & Who Brewed With You */}
        {activeBatch && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#10B981]" />
                <h3 className="text-base font-semibold text-white">
                  Brew Session Details: {activeBatch.recipeName}
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() =>
                        updateBatchLog(activeBatch.id, { rating: star })
                      }
                      aria-label={`Rate ${star} stars`}
                      className="cursor-pointer"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          (activeBatch.rating ?? 5) >= star
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                <select
                  value={activeBatch.status}
                  onChange={(e) =>
                    updateBatchLog(activeBatch.id, {
                      status: e.target.value as typeof activeBatch.status,
                    })
                  }
                  aria-label="Batch Status"
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-semibold uppercase"
                >
                  <option value="planning">Planning</option>
                  <option value="mashing">Mashing</option>
                  <option value="boiling">Boiling</option>
                  <option value="fermenting">Fermenting</option>
                  <option value="packaged">Packaged / Conditioning</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Actual Brew Date
                </label>
                <input
                  type="date"
                  value={activeBatch.brewDate}
                  onChange={(e) =>
                    updateBatchLog(activeBatch.id, { brewDate: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Packaging / Keg / Bottle Date
                </label>
                <input
                  type="date"
                  value={activeBatch.packagingDate || ''}
                  onChange={(e) =>
                    updateBatchLog(activeBatch.id, {
                      packagingDate: e.target.value,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Lead Brewer
                </label>
                <input
                  type="text"
                  placeholder="Your name"
                  value={activeBatch.leadBrewer ?? ''}
                  onChange={(e) =>
                    updateBatchLog(activeBatch.id, {
                      leadBrewer: e.target.value,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <Users className="w-3.5 h-3.5 text-[#3B82F6]" />
                  Who Brewed With You (Co-Brewers / Friends)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Dave, Sarah, Mike..."
                  value={activeBatch.coBrewers ?? ''}
                  onChange={(e) =>
                    updateBatchLog(activeBatch.id, {
                      coBrewers: e.target.value,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
            </div>

            {/* Section 2: What Went Right & What You Had to Adjust */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="bg-slate-950/70 border border-emerald-500/30 rounded-xl p-4 space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
                  <ThumbsUp className="w-4 h-4" />
                  What Went Right (Brew Day Wins & Highlights)
                </label>
                <textarea
                  rows={3}
                  placeholder="Record what went smoothly: hit target strike/mash temps, clear vorlauf, great hop aroma, strong fermentation start..."
                  value={activeBatch.whatWentRight ?? ''}
                  onChange={(e) =>
                    updateBatchLog(activeBatch.id, {
                      whatWentRight: e.target.value,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="bg-slate-950/70 border border-amber-500/30 rounded-xl p-4 space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-amber-400">
                  <Wrench className="w-4 h-4" />
                  What Did You Have to Adjust? (Day-Of Tweaks & Fixes)
                </label>
                <textarea
                  rows={3}
                  placeholder="Record any adjustments made on the fly: added extra lactic acid for pH, boiled 10 mins longer, topped up water, DME gravity boost, hop/yeast substitutions..."
                  value={activeBatch.adjustmentsMade ?? ''}
                  onChange={(e) =>
                    updateBatchLog(activeBatch.id, {
                      adjustmentsMade: e.target.value,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Section 3: What Was Actually Used (Planned vs. Actual Ingredients Table) */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    What Was Actually Used (Planned Recipe vs. Actual Brew Day)
                  </h4>
                  <p className="text-xs text-slate-400">
                    Edit any ingredient name or amount if you used a different
                    weight, hop lot, honey jar, or substitute on brew day.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    updateBatchLog(activeBatch.id, {
                      actualIngredientsUsed: buildSnapshotFromRecipe(),
                    })
                  }
                  className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 px-3 py-1.5 rounded-lg cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#3B82F6]" />
                  Sync Planned List from Recipe
                </button>
              </div>

              {actualIngredientsList.length === 0 ? (
                <div className="text-xs text-slate-400 py-3">
                  Click{' '}
                  <strong className="text-white">
                    Sync Planned List from Recipe
                  </strong>{' '}
                  above to populate the Planned vs. Actual ingredients table for
                  this batch.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-[11px] uppercase text-slate-400">
                        <th className="py-2 px-2">Type</th>
                        <th className="py-2 px-2">Planned Ingredient</th>
                        <th className="py-2 px-2">Planned Amount</th>
                        <th className="py-2 px-2">Actual Ingredient Used</th>
                        <th className="py-2 px-2">Actual Amount Used</th>
                        <th className="py-2 px-2">
                          Substitution / Lot / Addition Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {actualIngredientsList.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-900/50">
                          <td className="py-2 px-2">
                            <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                              {item.type}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-slate-300">
                            {item.plannedName}
                          </td>
                          <td className="py-2 px-2 text-slate-400">
                            {item.plannedAmount}
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={item.actualName}
                              onChange={(e) =>
                                updateActualIngredient(activeBatch.id, item.id, {
                                  actualName: e.target.value,
                                })
                              }
                              aria-label={`Actual ingredient for ${item.plannedName}`}
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={item.actualAmount}
                              onChange={(e) =>
                                updateActualIngredient(activeBatch.id, item.id, {
                                  actualAmount: e.target.value,
                                })
                              }
                              aria-label={`Actual amount for ${item.plannedName}`}
                              className="w-32 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-medium"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              placeholder="e.g., Used 2025 crop 13.1% AA or added at 170°F..."
                              value={item.notes || ''}
                              onChange={(e) =>
                                updateActualIngredient(activeBatch.id, item.id, {
                                  notes: e.target.value,
                                })
                              }
                              aria-label={`Notes for ${item.plannedName}`}
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Add Extra Unplanned Day-Of Addition */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!extraName.trim()) return;
                  addActualIngredient(activeBatch.id, {
                    type: extraType,
                    plannedName: 'Unplanned Day-Of Addition',
                    plannedAmount: '0',
                    actualName: extraName.trim(),
                    actualAmount: extraAmount.trim() || '1 unit',
                    notes: extraNotes.trim(),
                  });
                  setExtraName('');
                  setExtraAmount('');
                  setExtraNotes('');
                }}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-2 border-t border-slate-800/80"
              >
                <select
                  value={extraType}
                  onChange={(e) =>
                    setExtraType(
                      e.target.value as ActualIngredientUsed['type']
                    )
                  }
                  className="sm:col-span-2 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
                >
                  <option value="fermentable">Fermentable / Sugar</option>
                  <option value="hop">Hop</option>
                  <option value="yeast">Yeast / Nutrient</option>
                  <option value="water-additive">Water / Fining</option>
                </select>
                <input
                  type="text"
                  placeholder="Extra addition name (e.g., Whirlfloc, Yeast Nutrient, Extra DME)"
                  value={extraName}
                  onChange={(e) => setExtraName(e.target.value)}
                  className="sm:col-span-4 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Actual amount (e.g., 1 tablet, 0.5 lb)"
                  value={extraAmount}
                  onChange={(e) => setExtraAmount(e.target.value)}
                  className="sm:col-span-2 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Reason / Note"
                  value={extraNotes}
                  onChange={(e) => setExtraNotes(e.target.value)}
                  className="sm:col-span-2 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
                <button
                  type="submit"
                  className="sm:col-span-2 bg-slate-800 hover:bg-slate-700 text-[#10B981] font-semibold text-xs rounded-lg py-1.5 px-3 cursor-pointer"
                >
                  + Log Extra Item
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Interactive Mash & Boil Timer Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-5 flex flex-col items-center lg:items-start space-y-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsRunning(false);
                    setTimerMode('mash');
                    setSecondsLeft(
                      (recipe.mashSteps[0]?.durationMinutes ?? 60) * 60
                    );
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    timerMode === 'mash'
                      ? 'bg-[#3B82F6] text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Mash Timer ({recipe.mashSteps[0]?.durationMinutes ?? 60}m)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsRunning(false);
                    setTimerMode('boil');
                    setSecondsLeft(recipe.equipment.boilTimeMinutes * 60);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    timerMode === 'boil'
                      ? 'bg-[#10B981] text-slate-950'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Boil Timer ({recipe.equipment.boilTimeMinutes}m)
                </button>
              </div>

              <div className="text-6xl font-mono font-bold text-white tracking-wider">
                {formatTimer(secondsLeft)}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsRunning(!isRunning)}
                  className="inline-flex items-center gap-2 bg-[#3B82F6] hover:bg-blue-600 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  {isRunning ? (
                    <>
                      <Pause className="w-4 h-4" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" /> Start Timer
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsRunning(false);
                    setSecondsLeft(defaultSeconds);
                  }}
                  className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" /> Reset
                </button>
              </div>
            </div>

            {/* Boil & Flameout Addition Alarms Schedule */}
            <div className="lg:col-span-7 bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <Timer className="w-4 h-4 text-[#10B981]" />
                Timed Boil, Honey & Sugar Addition Cue Sheet
              </div>
              <div className="divide-y divide-slate-800/70 text-sm">
                {recipe.hops
                  .filter((h) => h.use === 'boil' || h.use === 'whirlpool')
                  .sort((a, b) => b.timeMinutes - a.timeMinutes)
                  .map((h) => {
                    const isUpcoming =
                      timerMode === 'boil' &&
                      Math.abs(currentMinuteMark - h.timeMinutes) <= 2;
                    return (
                      <div
                        key={h.instanceId}
                        className={`py-2 flex items-center justify-between ${
                          isUpcoming
                            ? 'text-[#10B981] font-semibold'
                            : 'text-slate-200'
                        }`}
                      >
                        <span>
                          {h.use === 'whirlpool'
                            ? `Flameout / Whirlpool (${h.temperatureF ?? 180}°F)`
                            : `@ ${h.timeMinutes} min remaining`}
                        </span>
                        <span>
                          {h.name} — {ozToDisplay(h.weightOz, unitSystem)}{' '}
                          {unitSystem === 'metric' ? 'g' : 'oz'} ({h.alphaAcid}%
                          AA)
                        </span>
                      </div>
                    );
                  })}
                {recipe.fermentables
                  .filter(
                    (f) =>
                      f.stage === 'late-boil' ||
                      f.stage === 'flameout' ||
                      f.stage === 'whirlpool'
                  )
                  .map((f) => (
                    <div
                      key={f.instanceId}
                      className="py-2 flex items-center justify-between text-amber-300"
                    >
                      <span className="capitalize">
                        @ {f.stage.replace('-', ' ')}
                      </span>
                      <span>
                        {f.name} — {formatWeightLbs(f.weightLbs, unitSystem)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Step-by-Step Brew Day Checklist & Measured Gravity/Efficiency Logger */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Guided Brew Day Checklist */}
          <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-[#3B82F6]" />
                <h3 className="text-base font-semibold text-white">
                  Guided Brew Day Step-by-Step Checklist
                </h3>
              </div>
            </div>

            <div className="space-y-2.5">
              {checklistSteps.map((step) => {
                const checked =
                  activeBatch?.completedChecklistIds.includes(step.id) ?? false;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() =>
                      activeBatch &&
                      toggleBatchChecklistStep(activeBatch.id, step.id)
                    }
                    className={`w-full text-left p-3.5 rounded-xl border transition-colors flex items-start gap-3 cursor-pointer ${
                      checked
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-slate-300'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-white'
                    }`}
                  >
                    {checked ? (
                      <CheckSquare className="w-5 h-5 text-[#10B981] shrink-0 mt-0.5" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div
                        className={`text-sm font-medium ${
                          checked ? 'line-through text-slate-400' : 'text-white'
                        }`}
                      >
                        {step.title}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {step.detail || 'Standard step'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Measured vs. Target Numbers, Fermentation Readings & Tasting Notes */}
          {activeBatch && (
            <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-semibold text-white">
                    Measured Gravity, Volumes & Tasting Notes
                  </h3>
                  <p className="text-xs text-slate-400">
                    Actual Brewhouse Efficiency:{' '}
                    <span className="text-[#10B981] font-semibold">
                      {actualEfficiencyPct}%
                    </span>{' '}
                    (Planned: {recipe.equipment.brewhouseEfficiency}%)
                  </p>
                </div>
              </div>

              {/* Measured Metrics Inputs */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Actual Mash Temp (°F)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={activeBatch.actualMashTempF ?? 151}
                    onChange={(e) =>
                      updateBatchLog(activeBatch.id, {
                        actualMashTempF: parseFloat(e.target.value) || 151,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Actual Mash pH
                  </label>
                  <input
                    type="number"
                    step="0.02"
                    value={activeBatch.actualMashPh ?? 5.35}
                    onChange={(e) =>
                      updateBatchLog(activeBatch.id, {
                        actualMashPh: parseFloat(e.target.value) || 5.35,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Post-Boil Vol (gal)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={
                      activeBatch.postBoilVolumeGal ??
                      recipe.equipment.batchVolumeGal
                    }
                    onChange={(e) =>
                      updateBatchLog(activeBatch.id, {
                        postBoilVolumeGal: parseFloat(e.target.value) || 5.5,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Measured OG (Target {metrics.og})
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={activeBatch.actualOg ?? metrics.og}
                    onChange={(e) =>
                      updateBatchLog(activeBatch.id, {
                        actualOg: parseFloat(e.target.value) || metrics.og,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Measured FG (Target {metrics.fg})
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={activeBatch.actualFg ?? metrics.fg}
                    onChange={(e) =>
                      updateBatchLog(activeBatch.id, {
                        actualFg: parseFloat(e.target.value) || metrics.fg,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Measured ABV
                  </label>
                  <div className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-sm font-bold text-[#10B981]">
                    {(
                      ((activeBatch.actualOg ?? metrics.og) -
                        (activeBatch.actualFg ?? metrics.fg)) *
                      131.25
                    ).toFixed(2)}
                    %
                  </div>
                </div>
              </div>

              {/* Fermentation Gravity Log */}
              <div className="space-y-2.5 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <TrendingUp className="w-4 h-4 text-[#3B82F6]" />
                  Fermentation Gravity Readings
                </div>

                <div className="space-y-1.5">
                  {activeBatch.gravityReadings.map((r) => (
                    <div
                      key={r.id}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-white">
                          Day {r.dayNumber}: {r.gravity.toFixed(3)} SG
                        </span>{' '}
                        <span className="text-slate-400">@ {r.tempF}°F</span>
                      </div>
                      <span className="text-slate-400">{r.notes}</span>
                    </div>
                  ))}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    addGravityReading(activeBatch.id, {
                      dayNumber: parseInt(readingDay, 10) || 1,
                      gravity: parseFloat(readingGravity) || 1.012,
                      tempF: parseFloat(readingTemp) || 68,
                      notes: readingNotes,
                    });
                  }}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1"
                >
                  <input
                    type="number"
                    placeholder="Day #"
                    value={readingDay}
                    onChange={(e) => setReadingDay(e.target.value)}
                    className="sm:col-span-2 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white"
                  />
                  <input
                    type="number"
                    step="0.001"
                    placeholder="SG"
                    value={readingGravity}
                    onChange={(e) => setReadingGravity(e.target.value)}
                    className="sm:col-span-3 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Notes (e.g. Dry hop added)"
                    value={readingNotes}
                    onChange={(e) => setReadingNotes(e.target.value)}
                    className="sm:col-span-5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                  <button
                    type="submit"
                    className="sm:col-span-2 bg-slate-800 hover:bg-slate-700 text-xs text-[#10B981] font-semibold rounded-lg py-1.5 cursor-pointer"
                  >
                    + Log SG
                  </button>
                </form>
              </div>

              {/* Tasting & Conditioning Notes */}
              <div className="pt-2 border-t border-slate-800 space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Final Tasting & Conditioning Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Aroma, mouthfeel, head retention, carbonation level, how it aged..."
                  value={activeBatch.tastingNotes}
                  onChange={(e) =>
                    updateBatchLog(activeBatch.id, {
                      tastingNotes: e.target.value,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-[#3B82F6]"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
