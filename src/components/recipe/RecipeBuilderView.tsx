'use client';

import React, { useState, useRef } from 'react';
import { useBrewStore } from '@/store/useBrewStore';
import { BrewMetrics, BrewingMethod } from '@/types/brewing';
import {
  galToDisplay,
  displayToGal,
  formatWeightLbs,
  ozToDisplay,
  tempFToDisplay,
} from '@/lib/units';
import { exportRecipeToBeerXml } from '@/lib/beerxml';
import { formatRecipeForEmail } from '@/lib/recipeFormatter';
import {
  BJCP_STYLES_CATALOG,
  findBjcpStyleForRecipe,
} from '@/data/bjcpStyles';
import { SrmGlassPreview } from './SrmGlassPreview';
import { FermentablesManager } from './FermentablesManager';
import { HopsManager } from './HopsManager';
import { YeastManager } from './YeastManager';
import { ActionMenu } from '@/components/ui/ActionMenu';
import { ModalDialog } from '@/components/ui/ModalDialog';
import { RovingFilterGroup } from '@/components/ui/RovingFilterGroup';
import {
  Save,
  FolderOpen,
  Download,
  Upload,
  FilePlus2,
  Scaling,
  Trash2,
  Printer,
  Mail,
  BookOpen,
  Copy,
  Check,
  Search,
  ClipboardList,
  Share2,
  Edit3,
} from 'lucide-react';

interface RecipeBuilderViewProps {
  metrics: BrewMetrics;
}

export function RecipeBuilderView({ metrics }: RecipeBuilderViewProps) {
  const {
    recipe,
    savedRecipes,
    batchLogs,
    unitSystem,
    setActiveTab,
    startNewBatchFromRecipe,
    updateRecipeMeta,
    updateEquipment,
    scaleRecipeVolume,
    saveCurrentRecipe,
    loadRecipe,
    createNewRecipe,
    importRecipe,
    deleteSavedRecipe,
  } = useBrewStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scaleTargetInput, setScaleTargetInput] = useState<string>('');
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [showScaleModal, setShowScaleModal] = useState(false);
  const [showStyleBrowser, setShowStyleBrowser] = useState(false);
  const [styleSearch, setStyleSearch] = useState('');
  const [selectedStyleCategory, setSelectedStyleCategory] =
    useState<string>('All');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [copiedEmailText, setCopiedEmailText] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isCustomStyle, setIsCustomStyle] = useState(false);

  const activeBjcpStyle = findBjcpStyleForRecipe(
    recipe.styleId,
    recipe.styleName
  );
  const bjcpCategories = Array.from(
    new Set(BJCP_STYLES_CATALOG.map((s) => s.category))
  );

  const filteredStyles = BJCP_STYLES_CATALOG.filter((s) => {
    const matchesCat =
      selectedStyleCategory === 'All' || s.category === selectedStyleCategory;
    const q = styleSearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  const flashStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handlePrintRecipe = () => {
    window.print();
  };

  const emailContent = formatRecipeForEmail(recipe, metrics, unitSystem);

  const handleLaunchMailto = () => {
    const mailtoUrl = `mailto:${encodeURIComponent(
      emailTo.trim()
    )}?subject=${encodeURIComponent(
      emailContent.subject
    )}&body=${encodeURIComponent(emailContent.body)}`;
    window.location.href = mailtoUrl;
    flashStatus('Opened default email app');
  };

  const handleCopyEmailBody = async () => {
    await navigator.clipboard.writeText(
      `${emailContent.subject}\n\n${emailContent.body}`
    );
    setCopiedEmailText(true);
    setTimeout(() => setCopiedEmailText(false), 2500);
    flashStatus('Copied formatted recipe for email');
  };

  const handleScale = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(scaleTargetInput);
    if (!val || val <= 0) return;
    const newVolGal = displayToGal(val, unitSystem);
    scaleRecipeVolume(newVolGal);
    setScaleTargetInput('');
    setShowScaleModal(false);
    flashStatus(
      `Scaled recipe ingredients to ${val} ${
        unitSystem === 'metric' ? 'L' : 'gal'
      }`
    );
  };

  const handleExportBeerXml = () => {
    const xml = exportRecipeToBeerXml(recipe);
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${recipe.name.toLowerCase().replace(/\s+/g, '-')}.xml`;
    a.click();
    URL.revokeObjectURL(url);
    flashStatus('Exported BeerXML file');
  };

  const handleExportJson = () => {
    const json = JSON.stringify(recipe, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${recipe.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    flashStatus('Exported JSON recipe file');
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && parsed.name && Array.isArray(parsed.fermentables)) {
          importRecipe(parsed);
          flashStatus(`Imported "${parsed.name}"`);
        }
      } catch {
        flashStatus('Invalid recipe JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Hidden File Input for Import JSON menu action */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImportJson}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* Printable Recipe Sheet (Visible ONLY when printing via @media print) */}
      <div className="hidden print-only text-slate-900 bg-white p-6 space-y-5">
        <div className="border-b-2 border-slate-800 pb-4 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{recipe.name}</h1>
            <p className="text-sm font-medium text-slate-700">
              Target Style: {recipe.styleName} • Method:{' '}
              {recipe.method.toUpperCase()} • Batch Size:{' '}
              {galToDisplay(recipe.equipment.batchVolumeGal, unitSystem)}{' '}
              {unitSystem === 'metric' ? 'L' : 'gal'} (
              {recipe.equipment.brewhouseEfficiency}% Eff.)
            </p>
            <p className="text-xs text-slate-600 mt-1" suppressHydrationWarning>
              Date Formulated:{' '}
              {recipe.formulatedAt || recipe.updatedAt.split('T')[0]} • Last
              Updated: {new Date(recipe.updatedAt).toLocaleString()}
            </p>
          </div>
          <div className="text-right text-xs text-slate-600">
            <div>Homebrew Recipe Studio</div>
            <div suppressHydrationWarning>
              Printed {new Date(recipe.updatedAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-3 text-center border border-slate-300 rounded-lg p-3 bg-slate-50">
          <div>
            <div className="text-xs text-slate-500 uppercase">OG</div>
            <div className="text-lg font-bold">{metrics.og.toFixed(3)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase">FG</div>
            <div className="text-lg font-bold">{metrics.fg.toFixed(3)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase">ABV</div>
            <div className="text-lg font-bold">{metrics.abv.toFixed(1)}%</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase">Bitterness</div>
            <div className="text-lg font-bold">
              {metrics.ibu.toFixed(1)} IBU
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase">
              Color &amp; pH
            </div>
            <div className="text-lg font-bold">
              {metrics.srm} SRM • {metrics.estimatedMashPh.toFixed(2)} pH
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider border-b border-slate-300 pb-1 mb-2">
            Fermentables (Grains, Honey, Sugars &amp; Adjuncts) — Total:{' '}
            {formatWeightLbs(metrics.totalFermentablesLbs, unitSystem)}
          </h2>
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-300">
                <th scope="col" className="py-1">
                  Ingredient
                </th>
                <th scope="col" className="py-1">
                  Category
                </th>
                <th scope="col" className="py-1">
                  Stage
                </th>
                <th scope="col" className="py-1">
                  Amount
                </th>
                <th scope="col" className="py-1">
                  % Grist
                </th>
                <th scope="col" className="py-1">
                  Color / PPG
                </th>
              </tr>
            </thead>
            <tbody>
              {recipe.fermentables.map((f) => {
                const b = metrics.fermentableBreakdown.find(
                  (x) => x.instanceId === f.instanceId
                );
                return (
                  <tr key={f.instanceId} className="border-b border-slate-200">
                    <td className="py-1 font-medium">{f.name}</td>
                    <td className="py-1 uppercase">{f.category}</td>
                    <td className="py-1">{f.stage}</td>
                    <td className="py-1">
                      {formatWeightLbs(f.weightLbs, unitSystem)}
                    </td>
                    <td className="py-1">
                      {(b?.percentageOfGrist ?? 0).toFixed(1)}%
                    </td>
                    <td className="py-1">
                      {f.colorLovibond}°L • {f.ppg} PPG
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider border-b border-slate-300 pb-1 mb-2">
            Hop Additions Schedule — Total:{' '}
            {ozToDisplay(metrics.totalHopsOz, unitSystem)}{' '}
            {unitSystem === 'metric' ? 'g' : 'oz'}
          </h2>
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-300">
                <th scope="col" className="py-1">
                  Hop Variety
                </th>
                <th scope="col" className="py-1">
                  Stage &amp; Form
                </th>
                <th scope="col" className="py-1">
                  Amount
                </th>
                <th scope="col" className="py-1">
                  Alpha Acid
                </th>
                <th scope="col" className="py-1">
                  Time / Temp
                </th>
                <th scope="col" className="py-1">
                  IBU
                </th>
              </tr>
            </thead>
            <tbody>
              {recipe.hops.map((h) => {
                const b = metrics.hopBreakdown.find(
                  (x) => x.instanceId === h.instanceId
                );
                return (
                  <tr key={h.instanceId} className="border-b border-slate-200">
                    <td className="py-1 font-medium">{h.name}</td>
                    <td className="py-1 uppercase">
                      {h.use} ({h.form})
                    </td>
                    <td className="py-1">
                      {ozToDisplay(h.weightOz, unitSystem)}{' '}
                      {unitSystem === 'metric' ? 'g' : 'oz'}
                    </td>
                    <td className="py-1">{h.alphaAcid}%</td>
                    <td className="py-1">
                      {h.timeMinutes} {h.use === 'dry-hop' ? 'days' : 'min'}
                      {h.use === 'whirlpool' && h.temperatureF
                        ? ` @ ${tempFToDisplay(h.temperatureF, unitSystem)}°${unitSystem === 'metric' ? 'C' : 'F'}`
                        : ''}
                    </td>
                    <td className="py-1">
                      {(b?.ibuContribution ?? 0).toFixed(1)} IBU
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="border border-slate-300 rounded-lg p-3">
            <h3 className="font-bold uppercase mb-1">Yeast &amp; Fermentation</h3>
            {recipe.yeasts.map((y) => (
              <div key={y.instanceId}>
                <strong>
                  {y.packs}x {y.name}
                </strong>{' '}
                ({y.lab} {y.productId}) — {y.customAttenuation}% Attenuation •
                Ideal Temp: {tempFToDisplay(y.tempMinF, unitSystem)}–
                {tempFToDisplay(y.tempMaxF, unitSystem)}°
                {unitSystem === 'metric' ? 'C' : 'F'}
              </div>
            ))}
          </div>
          <div className="border border-slate-300 rounded-lg p-3">
            <h3 className="font-bold uppercase mb-1">Mash &amp; Water Volumes</h3>
            <div>
              Strike Water: {galToDisplay(metrics.strikeWaterGal, unitSystem)}{' '}
              {unitSystem === 'metric' ? 'L' : 'gal'} @{' '}
              {tempFToDisplay(metrics.strikeWaterTempF, unitSystem)}°
              {unitSystem === 'metric' ? 'C' : 'F'} • Sparge:{' '}
              {galToDisplay(metrics.spargeWaterGal, unitSystem)}{' '}
              {unitSystem === 'metric' ? 'L' : 'gal'}
            </div>
            <div>
              Salts: Gypsum {recipe.saltAdditions.gypsumGrams}g, CaCl₂{' '}
              {recipe.saltAdditions.calciumChlorideGrams}g, Epsom{' '}
              {recipe.saltAdditions.epsomSaltGrams}g, Lactic Acid{' '}
              {recipe.saltAdditions.lacticAcid88Ml}mL
            </div>
          </div>
        </div>

        {recipe.notes && (
          <div className="border border-slate-300 rounded-lg p-3 text-xs">
            <h3 className="font-bold uppercase mb-1">Brewer&apos;s Notes</h3>
            <p>{recipe.notes}</p>
          </div>
        )}
      </div>

      {/* Interactive Screen UI (Hidden during print) */}
      <div className="no-print space-y-6">
        {/* Consolidated Recipe Toolbar & Metadata Card */}
        <section
          aria-labelledby="recipe-profile-heading"
          className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <h2
                id="recipe-profile-heading"
                className="text-base font-bold text-white"
              >
                Recipe Profile &amp; Equipment
              </h2>
              {statusMessage && (
                <span
                  role="status"
                  aria-live="polite"
                  className="text-xs font-medium text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/30 px-2.5 py-1 rounded-full"
                >
                  {statusMessage}
                </span>
              )}
            </div>

            {/* Consolidated Primary CTAs + Keyboard-Operable Dropdown Menus */}
            <div
              role="toolbar"
              aria-label="Recipe Actions Toolbar"
              className="flex flex-wrap items-center gap-2"
            >
              {/* Primary Action 1: Save Recipe */}
              <button
                type="button"
                onClick={() => {
                  saveCurrentRecipe();
                  flashStatus('Recipe saved to local library');
                }}
                className="inline-flex items-center gap-1.5 bg-[#3B82F6] hover:bg-blue-600 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Save Recipe</span>
              </button>

              {/* Primary Action 2: Log New Brew Session */}
              <button
                type="button"
                onClick={() => {
                  startNewBatchFromRecipe();
                  setActiveTab('brewday');
                }}
                className="inline-flex items-center gap-1.5 bg-[#10B981]/15 hover:bg-[#10B981]/25 text-[#10B981] border border-[#10B981]/40 text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
              >
                <ClipboardList className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Log Brew Session ({batchLogs.length})</span>
              </button>

              {/* Menu 1: Recipe File & Library Menu */}
              <ActionMenu
                label="Recipe File"
                icon={FolderOpen}
                badge={savedRecipes.length}
                items={[
                  {
                    id: 'open-library',
                    label: `Open Saved Recipes (${savedRecipes.length})`,
                    description: 'Load or manage your saved recipes',
                    icon: FolderOpen,
                    onSelect: () => setShowSavedModal(true),
                  },
                  {
                    id: 'new-recipe',
                    label: 'New Blank Recipe',
                    description: 'Start a fresh formulation from scratch',
                    icon: FilePlus2,
                    onSelect: () => {
                      createNewRecipe();
                      flashStatus('Created blank recipe');
                    },
                  },
                  {
                    id: 'scale-recipe',
                    label: 'Scale Recipe Volume...',
                    description:
                      'Linearly scale grains, honeys, sugars & hops to a new batch size',
                    icon: Scaling,
                    onSelect: () => setShowScaleModal(true),
                  },
                  {
                    id: 'import-json',
                    label: 'Import Recipe JSON...',
                    description: 'Load a recipe .json file from disk',
                    icon: Upload,
                    dividerBefore: true,
                    onSelect: () => fileInputRef.current?.click(),
                  },
                ]}
              />

              {/* Menu 2: Share, Print & Export Menu */}
              <ActionMenu
                label="Share & Export"
                icon={Share2}
                align="right"
                items={[
                  {
                    id: 'print-recipe',
                    label: 'Print Recipe Sheet',
                    description: 'Clean 1-page brew sheet for your binder',
                    shortcut: '⌘P',
                    icon: Printer,
                    variant: 'accent',
                    onSelect: handlePrintRecipe,
                  },
                  {
                    id: 'email-recipe',
                    label: 'Email or Copy Recipe...',
                    description:
                      'Send via default email client or copy plain text',
                    icon: Mail,
                    onSelect: () => setShowEmailModal(true),
                  },
                  {
                    id: 'export-beerxml',
                    label: 'Export BeerXML (.xml)',
                    description: 'Standard format for BeerSmith, Brewfather, etc.',
                    icon: Download,
                    dividerBefore: true,
                    onSelect: handleExportBeerXml,
                  },
                  {
                    id: 'export-json',
                    label: 'Export Recipe JSON (.json)',
                    description: 'Full Homebrew Recipe Studio backup file',
                    icon: Download,
                    onSelect: handleExportJson,
                  },
                ]}
              />
            </div>
          </div>

          {/* Recipe Core Metadata & Equipment Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
            <div className="sm:col-span-2 lg:col-span-4 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <label
                  htmlFor="recipe-name-input"
                  className="block text-xs font-medium text-slate-300 truncate"
                >
                  Recipe Name
                </label>
                <span className="text-[11px] text-slate-300 shrink-0">
                  Updated {recipe.updatedAt.split('T')[0]}
                </span>
              </div>
              <input
                id="recipe-name-input"
                type="text"
                value={recipe.name}
                onChange={(e) => updateRecipeMeta({ name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-semibold text-white"
              />
            </div>

            {/* Target Beer Style (BJCP) Selector + Visual Browser Trigger */}
            <div className="sm:col-span-2 lg:col-span-4 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <label
                  htmlFor="recipe-style-input"
                  className="block text-xs font-medium text-slate-300 truncate"
                >
                  Target Beer Style (BJCP)
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomStyle(!isCustomStyle)}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-[#3B82F6] hover:underline cursor-pointer shrink-0 whitespace-nowrap"
                >
                  <Edit3 className="w-3 h-3" aria-hidden="true" />
                  {isCustomStyle ? 'Use BJCP Dropdown' : 'Enter Custom Style'}
                </button>
              </div>

              <div className="flex items-stretch gap-1.5 min-w-0">
                {isCustomStyle ? (
                  <input
                    id="recipe-style-input"
                    type="text"
                    value={recipe.styleName}
                    onChange={(e) =>
                      updateRecipeMeta({
                        styleName: e.target.value,
                        styleId: undefined,
                      })
                    }
                    placeholder="Enter custom beer style..."
                    className="flex-1 min-w-0 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                  />
                ) : (
                  <select
                    id="recipe-style-input"
                    value={activeBjcpStyle?.id || ''}
                    onChange={(e) => {
                      const chosen = BJCP_STYLES_CATALOG.find(
                        (s) => s.id === e.target.value
                      );
                      if (chosen) {
                        updateRecipeMeta({
                          styleId: chosen.id,
                          styleName: `${chosen.name} (${chosen.code})`,
                        });
                        flashStatus(
                          `Selected BJCP ${chosen.code}: ${chosen.name}`
                        );
                      }
                    }}
                    className="flex-1 min-w-0 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white truncate"
                  >
                    {!activeBjcpStyle && (
                      <option value="">{recipe.styleName} (Custom)</option>
                    )}
                    {bjcpCategories.map((cat) => (
                      <optgroup key={cat} label={cat}>
                        {BJCP_STYLES_CATALOG.filter(
                          (s) => s.category === cat
                        ).map((style) => (
                          <option key={style.id} value={style.id}>
                            [{style.code}] {style.name} ({style.abvMin}–
                            {style.abvMax}% ABV, {style.ibuMin}–{style.ibuMax}{' '}
                            IBU)
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                )}

                <button
                  type="button"
                  onClick={() => setShowStyleBrowser(true)}
                  aria-label="Browse BJCP 2021 Beer Style Catalog"
                  title="Browse BJCP 2021 Style Guide"
                  className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-[#10B981] border border-slate-700 text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                >
                  <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>BJCP Guide</span>
                </button>
              </div>
            </div>

            <div className="sm:col-span-1 lg:col-span-2 min-w-0">
              <label
                htmlFor="recipe-method-select"
                className="block text-xs font-medium text-slate-300 mb-1 truncate"
              >
                Brewing Method
              </label>
              <select
                id="recipe-method-select"
                value={recipe.method}
                onChange={(e) =>
                  updateRecipeMeta({ method: e.target.value as BrewingMethod })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white truncate"
              >
                <option value="all-grain">All-Grain (Mash + Sparge)</option>
                <option value="biab">BIAB (Full-Volume Mash)</option>
                <option value="partial-mash">Partial Mash</option>
                <option value="extract">Extract + Steeped Grains</option>
              </select>
            </div>

            <div className="sm:col-span-1 lg:col-span-2 min-w-0">
              <label
                htmlFor="recipe-formulated-date"
                className="block text-xs font-medium text-slate-300 mb-1 truncate"
              >
                Date Formulated
              </label>
              <input
                id="recipe-formulated-date"
                type="date"
                value={recipe.formulatedAt || recipe.updatedAt.split('T')[0]}
                onChange={(e) =>
                  updateRecipeMeta({ formulatedAt: e.target.value })
                }
                aria-describedby="recipe-last-edit-hint"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white"
              />
              <div
                id="recipe-last-edit-hint"
                suppressHydrationWarning
                className="text-[11px] text-slate-300 mt-0.5 truncate"
              >
                Edited: {new Date(recipe.updatedAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Equipment Profile Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-800/70">
            <div className="min-w-0">
              <label
                htmlFor="equip-batch-size"
                className="block text-xs font-medium text-slate-300 mb-1 truncate"
              >
                Batch Size ({unitSystem === 'metric' ? 'Liters' : 'Gallons'})
              </label>
              <input
                id="equip-batch-size"
                type="number"
                step="0.25"
                min="0.5"
                value={galToDisplay(
                  recipe.equipment.batchVolumeGal,
                  unitSystem
                )}
                onChange={(e) =>
                  updateEquipment({
                    batchVolumeGal: displayToGal(
                      parseFloat(e.target.value) || 5,
                      unitSystem
                    ),
                  })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white"
              />
            </div>

            <div className="min-w-0">
              <label
                htmlFor="equip-efficiency"
                className="block text-xs font-medium text-slate-300 mb-1 truncate"
              >
                Brewhouse Eff. (%)
              </label>
              <input
                id="equip-efficiency"
                type="number"
                min="30"
                max="98"
                value={recipe.equipment.brewhouseEfficiency}
                onChange={(e) =>
                  updateEquipment({
                    brewhouseEfficiency: parseFloat(e.target.value) || 72,
                  })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white"
              />
            </div>

            <div className="min-w-0">
              <label
                htmlFor="equip-boil-time"
                className="block text-xs font-medium text-slate-300 mb-1 truncate"
              >
                Boil Time (mins)
              </label>
              <input
                id="equip-boil-time"
                type="number"
                step="15"
                min="0"
                max="180"
                value={recipe.equipment.boilTimeMinutes}
                onChange={(e) =>
                  updateEquipment({
                    boilTimeMinutes: parseInt(e.target.value, 10) || 60,
                  })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white"
              />
            </div>

            <div className="min-w-0">
              <label
                htmlFor="equip-boiloff-rate"
                className="block text-xs font-medium text-slate-300 mb-1 truncate"
              >
                Boil-Off Rate ({unitSystem === 'metric' ? 'L/hr' : 'gal/hr'})
              </label>
              <input
                id="equip-boiloff-rate"
                type="number"
                step="0.1"
                min="0"
                value={galToDisplay(
                  recipe.equipment.boilOffRateGalPerHr,
                  unitSystem
                )}
                onChange={(e) =>
                  updateEquipment({
                    boilOffRateGalPerHr: displayToGal(
                      parseFloat(e.target.value) || 1.0,
                      unitSystem
                    ),
                  })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white"
              />
            </div>

            <div className="col-span-2 sm:col-span-1 min-w-0">
              <label
                htmlFor="equip-ibu-formula"
                className="block text-xs font-medium text-slate-300 mb-1 truncate"
              >
                IBU Formula
              </label>
              <select
                id="equip-ibu-formula"
                value={recipe.equipment.ibuFormula}
                onChange={(e) =>
                  updateEquipment({
                    ibuFormula: e.target.value as 'tinseth' | 'rager',
                  })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white"
              >
                <option value="tinseth">Tinseth (Standard)</option>
                <option value="rager">Rager</option>
              </select>
            </div>
          </div>
        </section>

        {/* Active BJCP Style Target Banner */}
        {activeBjcpStyle && (
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div>
              <span className="font-semibold text-[#10B981]">
                BJCP {activeBjcpStyle.code} — {activeBjcpStyle.name}:
              </span>{' '}
              <span className="text-slate-200">
                {activeBjcpStyle.description}
              </span>
            </div>
            <div className="text-slate-300 shrink-0 font-mono">
              OG {activeBjcpStyle.ogMin.toFixed(3)}–
              {activeBjcpStyle.ogMax.toFixed(3)} • FG{' '}
              {activeBjcpStyle.fgMin.toFixed(3)}–
              {activeBjcpStyle.fgMax.toFixed(3)} • IBU {activeBjcpStyle.ibuMin}–
              {activeBjcpStyle.ibuMax} • SRM {activeBjcpStyle.srmMin}–
              {activeBjcpStyle.srmMax}
            </div>
          </div>
        )}

        {/* Full SRM Glass & Vital Metrics Dashboard */}
        <SrmGlassPreview metrics={metrics} bjcpStyle={activeBjcpStyle} />

        {/* Fermentables: Grains, Honey, Sugars, Adjuncts */}
        <FermentablesManager metrics={metrics} />

        {/* Hops Schedule */}
        <HopsManager metrics={metrics} />

        {/* Yeast & Fermentation */}
        <YeastManager metrics={metrics} />

        {/* Brewer's Notes */}
        <section
          aria-labelledby="brewers-notes-heading"
          className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2"
        >
          <label
            id="brewers-notes-heading"
            htmlFor="recipe-brewers-notes"
            className="block text-sm font-semibold text-white"
          >
            Brewer&apos;s Process &amp; Fermentation Notes
          </label>
          <textarea
            id="recipe-brewers-notes"
            rows={3}
            value={recipe.notes}
            onChange={(e) => updateRecipeMeta({ notes: e.target.value })}
            placeholder="Record honey/sugar addition timing, fermentation temperature ramps, dry-hop schedule, or water adjustments..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200"
          />
        </section>
      </div>

      {/* Native <dialog> Modal 1: Saved Recipes Library */}
      <ModalDialog
        open={showSavedModal}
        onClose={() => setShowSavedModal(false)}
        title={`Saved Recipe Library (${savedRecipes.length})`}
        description="Select a recipe to load into the formulator or remove old drafts."
        icon={FolderOpen}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {savedRecipes.map((r) => (
            <div
              key={r.id}
              className={`p-3.5 rounded-xl border flex items-center justify-between gap-2 ${
                r.id === recipe.id
                  ? 'bg-[#3B82F6]/15 border-[#3B82F6]'
                  : 'bg-slate-950 border-slate-800'
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  loadRecipe(r.id);
                  setShowSavedModal(false);
                  flashStatus(`Loaded recipe "${r.name}"`);
                }}
                className="text-left flex-1 cursor-pointer"
              >
                <div className="text-sm font-semibold text-white">{r.name}</div>
                <div className="text-xs text-slate-300 mt-0.5">
                  {r.styleName} • {r.method.toUpperCase()} • Formulated{' '}
                  {r.formulatedAt || r.updatedAt.split('T')[0]}
                </div>
              </button>
              {savedRecipes.length > 1 && (
                <button
                  type="button"
                  onClick={() => deleteSavedRecipe(r.id)}
                  aria-label={`Delete saved recipe ${r.name}`}
                  className="p-2 text-slate-300 hover:text-rose-400 rounded-lg cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
        </div>
      </ModalDialog>

      {/* Native <dialog> Modal 2: Scale Recipe Volume */}
      <ModalDialog
        open={showScaleModal}
        onClose={() => setShowScaleModal(false)}
        title="Scale Recipe Batch Volume"
        description="Linearly scales all grains, honeys, sugars, and hop weights to maintain your exact Original Gravity and IBU."
        icon={Scaling}
        maxWidthClass="max-w-md"
      >
        <form onSubmit={handleScale} className="space-y-4">
          <div>
            <label
              htmlFor="scale-target-volume-input"
              className="block text-xs font-medium text-slate-300 mb-1"
            >
              New Target Batch Volume ({unitSystem === 'metric' ? 'Liters' : 'Gallons'})
            </label>
            <input
              id="scale-target-volume-input"
              type="number"
              step="0.5"
              min="1"
              required
              placeholder={`Current: ${galToDisplay(
                recipe.equipment.batchVolumeGal,
                unitSystem
              )} ${unitSystem === 'metric' ? 'L' : 'gal'}`}
              value={scaleTargetInput}
              onChange={(e) => setScaleTargetInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowScaleModal(false)}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 bg-[#10B981] hover:bg-emerald-600 text-slate-950 font-semibold text-xs px-4 py-2 rounded-lg cursor-pointer"
            >
              <Scaling className="w-3.5 h-3.5" aria-hidden="true" />
              Scale Ingredients
            </button>
          </div>
        </form>
      </ModalDialog>

      {/* Native <dialog> Modal 3: Email or Copy Recipe Sheet */}
      <ModalDialog
        open={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        title={`Email or Copy Recipe Sheet: "${recipe.name}"`}
        description="Send a formatted plain-text brew sheet via your email client or copy it to your clipboard."
        icon={Mail}
      >
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-end">
            <div className="flex-1">
              <label
                htmlFor="email-recipient-input"
                className="block text-xs font-medium text-slate-300 mb-1"
              >
                Recipient Email (optional)
              </label>
              <input
                id="email-recipient-input"
                type="email"
                 inputMode="email"
                autoComplete="email"
                placeholder="brewer@example.com"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>
            <button
              type="button"
              onClick={handleLaunchMailto}
              className="inline-flex items-center justify-center gap-1.5 bg-[#3B82F6] hover:bg-blue-600 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5" aria-hidden="true" />
              Open in Default Mail App
            </button>
            <button
              type="button"
              onClick={handleCopyEmailBody}
              className="inline-flex items-center justify-center gap-1.5 bg-[#10B981] hover:bg-emerald-600 text-slate-950 text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
            >
              {copiedEmailText ? (
                <>
                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                  Copied to Clipboard!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  Copy Formatted Recipe
                </>
              )}
            </button>
          </div>

          <pre
            tabIndex={0}
            aria-label="Formatted recipe text preview"
            className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 max-h-60 overflow-y-auto whitespace-pre-wrap font-mono"
          >
            <code>{emailContent.body}</code>
          </pre>
        </div>
      </ModalDialog>

      {/* Native <dialog> Modal 4: Searchable BJCP 2021 Beer Style Browser */}
      <ModalDialog
        open={showStyleBrowser}
        onClose={() => setShowStyleBrowser(false)}
        title="BJCP 2021 Beer Style Guidelines Database"
        description="Filter by category or search by style name, code, or flavor profile."
        icon={BookOpen}
        maxWidthClass="max-w-4xl"
      >
        <div className="space-y-4">
          <search aria-label="Search BJCP Beer Styles">
            <label
              htmlFor="bjcp-style-search-input"
              className="block text-xs font-medium text-slate-300 mb-1"
            >
              Search Style Name, Code, or Characteristics
            </label>
            <div className="relative">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                id="bjcp-style-search-input"
                type="search"
                placeholder="Search IPA, Saison, Honey, Weizen, Stout, 21A..."
                value={styleSearch}
                onChange={(e) => setStyleSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white"
              />
            </div>
          </search>

          <RovingFilterGroup
            ariaLabel="Filter BJCP Styles by Category"
            options={['All', ...bjcpCategories].map((cat) => ({
              value: cat,
              label: cat,
            }))}
            value={selectedStyleCategory}
            onChange={setSelectedStyleCategory}
            accentColor="emerald"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-80 overflow-y-auto pr-1">
            {filteredStyles.map((style) => {
              const isSelected = activeBjcpStyle?.id === style.id;
              return (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => {
                    updateRecipeMeta({
                      styleId: style.id,
                      styleName: `${style.name} (${style.code})`,
                    });
                    setIsCustomStyle(false);
                    setShowStyleBrowser(false);
                    flashStatus(`Selected BJCP ${style.code}: ${style.name}`);
                  }}
                  className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#10B981]/15 border-[#10B981] text-white'
                      : 'bg-slate-950/90 hover:bg-slate-800 border-slate-800 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white">
                      {style.name}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-[#10B981]">
                      {style.code}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 line-clamp-2 mt-1">
                    {style.description}
                  </p>
                  <div className="text-[10px] text-slate-300 mt-1.5 font-mono">
                    ABV {style.abvMin}–{style.abvMax}% • IBU {style.ibuMin}–
                    {style.ibuMax} • SRM {style.srmMin}–{style.srmMax}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </ModalDialog>
    </div>
  );
}
