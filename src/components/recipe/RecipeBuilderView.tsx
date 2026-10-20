'use client';

import React, { useState } from 'react';
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
  X,
  Search,
  ClipboardList,
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

  const [scaleTargetInput, setScaleTargetInput] = useState<string>('');
  const [showSavedDrawer, setShowSavedDrawer] = useState(false);
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
    setTimeout(() => setStatusMessage(null), 3000);
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

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(recipe, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${recipe.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    flashStatus('Exported Recipe JSON');
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
    flashStatus('Exported BeerXML');
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (parsed && parsed.name && Array.isArray(parsed.fermentables)) {
          importRecipe(parsed);
          flashStatus(`Imported "${parsed.name}"`);
        }
      } catch {
        flashStatus('Invalid Recipe JSON file');
      }
    };
    reader.readAsText(file);
  };

  const handleScale = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(scaleTargetInput);
    if (!val || val <= 0) return;
    const targetGal = displayToGal(val, unitSystem);
    scaleRecipeVolume(targetGal);
    setScaleTargetInput('');
    flashStatus(
      `Scaled recipe to ${val} ${unitSystem === 'metric' ? 'L' : 'gal'}`
    );
  };

  return (
    <div className="space-y-6">
      {/* Dedicated Clean Printable Brew Sheet (Only visible when printing) */}
      <div className="hidden print-only p-6 text-slate-900 space-y-5">
        <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold">{recipe.name}</h1>
            <p className="text-sm text-slate-700">
              Style: <strong>{recipe.styleName}</strong> • Method:{' '}
              <strong>{recipe.method.toUpperCase()}</strong> • Batch Size:{' '}
              <strong>
                {galToDisplay(recipe.equipment.batchVolumeGal, unitSystem)}{' '}
                {unitSystem === 'metric' ? 'L' : 'gal'}
              </strong>{' '}
              • Efficiency: <strong>{recipe.equipment.brewhouseEfficiency}%</strong>
            </p>
          </div>
          <div className="text-right text-xs text-slate-600">
            <div>
              Formulated:{' '}
              <strong>
                {recipe.formulatedAt || recipe.updatedAt.split('T')[0]}
              </strong>{' '}
              • Updated: <strong>{recipe.updatedAt.split('T')[0]}</strong>
            </div>
            <div>Printed from Homebrew Recipe Studio</div>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-3 border border-slate-300 rounded-lg p-3 text-center">
          <div>
            <div className="text-xs uppercase text-slate-500">Est. ABV</div>
            <div className="text-lg font-bold">{metrics.abv.toFixed(1)}%</div>
          </div>
          <div>
            <div className="text-xs uppercase text-slate-500">Original Gravity</div>
            <div className="text-lg font-bold">{metrics.og.toFixed(3)}</div>
          </div>
          <div>
            <div className="text-xs uppercase text-slate-500">Final Gravity</div>
            <div className="text-lg font-bold">{metrics.fg.toFixed(3)}</div>
          </div>
          <div>
            <div className="text-xs uppercase text-slate-500">Bitterness</div>
            <div className="text-lg font-bold">
              {metrics.ibu.toFixed(1)} IBU (BU:GU {metrics.buGuRatio})
            </div>
          </div>
          <div>
            <div className="text-xs uppercase text-slate-500">Color & Mash pH</div>
            <div className="text-lg font-bold">
              {metrics.srm} SRM • {metrics.estimatedMashPh} pH
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider border-b border-slate-300 pb-1 mb-2">
            Fermentables: Grains, Honey, Sugars & Adjuncts (Total:{' '}
            {formatWeightLbs(metrics.totalFermentablesLbs, unitSystem)})
          </h2>
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-300">
                <th className="py-1">Ingredient</th>
                <th className="py-1">Category</th>
                <th className="py-1">Stage</th>
                <th className="py-1">Amount</th>
                <th className="py-1">% of Grist</th>
                <th className="py-1">Specs</th>
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
                    <td className="py-1">{b?.percentageOfGrist ?? 0}%</td>
                    <td className="py-1">
                      {f.ppg} PPG, {f.colorLovibond}°L ({f.fermentability}% Ferm)
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider border-b border-slate-300 pb-1 mb-2">
            Hop Schedule (Total: {ozToDisplay(metrics.totalHopsOz, unitSystem)}{' '}
            {unitSystem === 'metric' ? 'g' : 'oz'})
          </h2>
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-300">
                <th className="py-1">Hop Variety</th>
                <th className="py-1">Stage & Form</th>
                <th className="py-1">Amount</th>
                <th className="py-1">Alpha Acid</th>
                <th className="py-1">Time / Temp</th>
                <th className="py-1">IBU</th>
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
            <h3 className="font-bold uppercase mb-1">Yeast & Fermentation</h3>
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
            <h3 className="font-bold uppercase mb-1">Mash & Water Volumes</h3>
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
        {/* Top Action Bar & Recipe Selector */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  saveCurrentRecipe();
                  flashStatus('Recipe saved to local library');
                }}
                className="inline-flex items-center gap-1.5 bg-[#3B82F6] hover:bg-blue-600 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                Save Recipe
              </button>

              <button
                type="button"
                onClick={() => setShowSavedDrawer(!showSavedDrawer)}
                className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
              >
                <FolderOpen className="w-3.5 h-3.5 text-[#10B981]" />
                My Recipes ({savedRecipes.length})
              </button>

              <button
                type="button"
                onClick={() => {
                  createNewRecipe();
                  flashStatus('Created blank recipe');
                }}
                className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
              >
                <FilePlus2 className="w-3.5 h-3.5" />
                New Recipe
              </button>

              <button
                type="button"
                onClick={() => {
                  startNewBatchFromRecipe();
                  setActiveTab('brewday');
                }}
                className="inline-flex items-center gap-1.5 bg-[#10B981]/15 hover:bg-[#10B981]/25 text-[#10B981] border border-[#10B981]/40 text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                Log New Brew Session ({batchLogs.length})
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {statusMessage && (
                <span
                  role="status"
                  aria-live="polite"
                  className="text-xs font-medium text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/30 px-2.5 py-1 rounded-full"
                >
                  {statusMessage}
                </span>
              )}

              {/* Print Recipe Button */}
              <button
                type="button"
                onClick={handlePrintRecipe}
                className="inline-flex items-center gap-1.5 bg-[#10B981] hover:bg-emerald-600 text-slate-950 font-semibold text-xs px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Recipe
              </button>

              {/* Email Recipe Button */}
              <button
                type="button"
                onClick={() => setShowEmailModal(!showEmailModal)}
                className="inline-flex items-center gap-1.5 bg-[#3B82F6]/20 hover:bg-[#3B82F6]/30 text-[#3B82F6] border border-[#3B82F6]/40 font-semibold text-xs px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5" />
                Email Recipe
              </button>

              <button
                type="button"
                onClick={handleExportBeerXml}
                className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-2 rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                BeerXML
              </button>

              <button
                type="button"
                onClick={handleExportJson}
                className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-2 rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                JSON
              </button>

              <label className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-2 rounded-lg transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                Import JSON
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJson}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Email Recipe Modal / Drawer */}
          {showEmailModal && (
            <div className="bg-slate-950/95 border border-[#3B82F6]/40 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Mail className="w-4 h-4 text-[#3B82F6]" />
                  Email or Copy Recipe Sheet: &ldquo;{recipe.name}&rdquo;
                </div>
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="text-slate-400 hover:text-white p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="email"
                  placeholder="Recipient email (optional, e.g. brewer@example.com)"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3B82F6]"
                />
                <button
                  type="button"
                  onClick={handleLaunchMailto}
                  className="inline-flex items-center justify-center gap-1.5 bg-[#3B82F6] hover:bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Open in Default Mail App
                </button>
                <button
                  type="button"
                  onClick={handleCopyEmailBody}
                  className="inline-flex items-center justify-center gap-1.5 bg-[#10B981] hover:bg-emerald-600 text-slate-950 text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  {copiedEmailText ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Copied to Clipboard!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy Formatted Recipe
                    </>
                  )}
                </button>
              </div>

              <pre className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 max-h-48 overflow-y-auto whitespace-pre-wrap font-mono">
                {emailContent.body}
              </pre>
            </div>
          )}

          {/* Saved Recipes Drawer */}
          {showSavedDrawer && (
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Saved Recipe Library
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {savedRecipes.map((r) => (
                  <div
                    key={r.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                      r.id === recipe.id
                        ? 'bg-[#3B82F6]/10 border-[#3B82F6]/50'
                        : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        loadRecipe(r.id);
                        setShowSavedDrawer(false);
                      }}
                      className="text-left flex-1 cursor-pointer"
                    >
                      <div className="text-sm font-semibold text-white">
                        {r.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        {r.styleName} • {r.method.toUpperCase()} • Formulated{' '}
                        {r.formulatedAt || r.updatedAt.split('T')[0]}
                      </div>
                    </button>
                    {savedRecipes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => deleteSavedRecipe(r.id)}
                        aria-label={`Delete ${r.name}`}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recipe Core Metadata & Equipment Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-3">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs text-slate-400">
                  Recipe Name
                </label>
                <span className="text-[10px] text-slate-500">
                  Updated {recipe.updatedAt.split('T')[0]}
                </span>
              </div>
              <input
                type="text"
                value={recipe.name}
                onChange={(e) => updateRecipeMeta({ name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-semibold text-white focus:outline-none focus:border-[#3B82F6]"
              />
            </div>

            {/* Target Beer Style (BJCP) Selector + Visual Browser Trigger */}
            <div className="md:col-span-3">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs text-slate-400">
                  Target Beer Style (BJCP)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowStyleBrowser(!showStyleBrowser)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#10B981] hover:underline cursor-pointer"
                  >
                    <BookOpen className="w-3 h-3" />
                    {showStyleBrowser ? 'Hide Style Catalog' : 'Browse BJCP DB'}
                  </button>
                  <span className="text-slate-600">•</span>
                  <button
                    type="button"
                    onClick={() => setIsCustomStyle(!isCustomStyle)}
                    className="text-[11px] text-[#3B82F6] hover:underline cursor-pointer"
                  >
                    {isCustomStyle ? 'Use Dropdown' : 'Custom text'}
                  </button>
                </div>
              </div>
              {isCustomStyle ? (
                <input
                  type="text"
                  value={recipe.styleName}
                  onChange={(e) =>
                    updateRecipeMeta({
                      styleName: e.target.value,
                      styleId: undefined,
                    })
                  }
                  placeholder="Enter custom beer style..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3B82F6]"
                />
              ) : (
                <select
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
                      flashStatus(`Selected BJCP ${chosen.code}: ${chosen.name}`);
                    }
                  }}
                  aria-label="Target Beer Style (BJCP)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3B82F6]"
                >
                  {!activeBjcpStyle && (
                    <option value="">{recipe.styleName} (Custom)</option>
                  )}
                  {bjcpCategories.map((cat) => (
                    <optgroup key={cat} label={cat}>
                      {BJCP_STYLES_CATALOG.filter((s) => s.category === cat).map(
                        (style) => (
                          <option key={style.id} value={style.id}>
                            [{style.code}] {style.name} ({style.abvMin}–
                            {style.abvMax}% ABV, {style.ibuMin}–{style.ibuMax}{' '}
                            IBU)
                          </option>
                        )
                      )}
                    </optgroup>
                  ))}
                </select>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs text-slate-400 mb-1">
                Brewing Method
              </label>
              <select
                value={recipe.method}
                onChange={(e) =>
                  updateRecipeMeta({ method: e.target.value as BrewingMethod })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3B82F6]"
              >
                <option value="all-grain">All-Grain (Mash + Sparge)</option>
                <option value="biab">BIAB (Full-Volume Mash)</option>
                <option value="partial-mash">Partial Mash</option>
                <option value="extract">Extract + Steeped Grains</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs text-slate-400 mb-1">
                Date Formulated
              </label>
              <input
                type="date"
                value={recipe.formulatedAt || recipe.updatedAt.split('T')[0]}
                onChange={(e) =>
                  updateRecipeMeta({ formulatedAt: e.target.value })
                }
                aria-label="Date Formulated"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-[#3B82F6]"
              />
              <div className="text-[10px] text-slate-500 mt-0.5">
                Last edit: {new Date(recipe.updatedAt).toLocaleString()}
              </div>
            </div>

            <div className="md:col-span-2">
              <form onSubmit={handleScale}>
                <label className="block text-xs text-slate-400 mb-1">
                  Scale Recipe to Volume ({unitSystem === 'metric' ? 'L' : 'gal'})
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    placeholder={`e.g. ${unitSystem === 'metric' ? '38' : '10'}`}
                    value={scaleTargetInput}
                    onChange={(e) => setScaleTargetInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-sm text-white"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-[#10B981] font-medium text-xs px-3 py-2 rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    <Scaling className="w-3.5 h-3.5" />
                    Scale
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Interactive Searchable BJCP Style Browser Drawer */}
          {showStyleBrowser && (
            <div className="bg-slate-950 border border-[#10B981]/40 rounded-xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="text-sm font-semibold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#10B981]" />
                  Select a Target Beer Style from the BJCP 2021 Database
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search IPA, Saison, Honey, Stout..."
                    value={styleSearch}
                    onChange={(e) => setStyleSearch(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#10B981]"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {['All', ...bjcpCategories].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedStyleCategory(cat)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                      selectedStyleCategory === cat
                        ? 'bg-[#10B981] text-slate-950 font-semibold'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
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
                          : 'bg-slate-900/90 hover:bg-slate-900 border-slate-800 hover:border-slate-600 text-slate-200'
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
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
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
          )}

          {/* Equipment Profile Row */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Batch Size ({unitSystem === 'metric' ? 'Liters' : 'Gallons'})
              </label>
              <input
                type="number"
                step="0.25"
                min="0.5"
                value={galToDisplay(recipe.equipment.batchVolumeGal, unitSystem)}
                onChange={(e) =>
                  updateEquipment({
                    batchVolumeGal: displayToGal(
                      parseFloat(e.target.value) || 5,
                      unitSystem
                    ),
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Brewhouse Efficiency (%)
              </label>
              <input
                type="number"
                min="30"
                max="98"
                value={recipe.equipment.brewhouseEfficiency}
                onChange={(e) =>
                  updateEquipment({
                    brewhouseEfficiency: parseFloat(e.target.value) || 72,
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Boil Time (mins)
              </label>
              <input
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
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Boil-Off Rate ({unitSystem === 'metric' ? 'L/hr' : 'gal/hr'})
              </label>
              <input
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
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-sm text-white"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] text-slate-400 mb-1">
                IBU Formula
              </label>
              <select
                value={recipe.equipment.ibuFormula}
                onChange={(e) =>
                  updateEquipment({
                    ibuFormula: e.target.value as 'tinseth' | 'rager',
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-sm text-white"
              >
                <option value="tinseth">Tinseth (Standard)</option>
                <option value="rager">Rager</option>
              </select>
            </div>
          </div>
        </div>

        {/* Live SRM Glass & Vital Metrics */}
        {activeBjcpStyle && (
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div>
              <span className="font-semibold text-[#10B981]">
                BJCP {activeBjcpStyle.code} — {activeBjcpStyle.name}:
              </span>{' '}
              <span className="text-slate-300">
                {activeBjcpStyle.description}
              </span>
            </div>
            <div className="text-slate-400 shrink-0">
              OG {activeBjcpStyle.ogMin.toFixed(3)}–
              {activeBjcpStyle.ogMax.toFixed(3)} • FG{' '}
              {activeBjcpStyle.fgMin.toFixed(3)}–
              {activeBjcpStyle.fgMax.toFixed(3)} • IBU {activeBjcpStyle.ibuMin}–
              {activeBjcpStyle.ibuMax} • SRM {activeBjcpStyle.srmMin}–
              {activeBjcpStyle.srmMax}
            </div>
          </div>
        )}

        <SrmGlassPreview metrics={metrics} bjcpStyle={activeBjcpStyle} />

        {/* Fermentables: Grains, Honey, Sugars, Adjuncts */}
        <FermentablesManager metrics={metrics} />

        {/* Hops Schedule */}
        <HopsManager metrics={metrics} />

        {/* Yeast & Fermentation */}
        <YeastManager metrics={metrics} />

        {/* Brewer's Notes */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <label className="block text-sm font-semibold text-white mb-2">
            Brewer&apos;s Formulation & Process Notes
          </label>
          <textarea
            rows={3}
            value={recipe.notes}
            onChange={(e) => updateRecipeMeta({ notes: e.target.value })}
            placeholder="Record honey addition timing, fermentation temperature ramps, dry hop notes..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-[#3B82F6]"
          />
        </div>
      </div>
    </div>
  );
}
