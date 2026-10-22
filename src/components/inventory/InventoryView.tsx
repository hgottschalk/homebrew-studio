'use client';

import React, { useState } from 'react';
import { useBrewStore } from '@/store/useBrewStore';
import {
  FERMENTABLES_CATALOG,
  HOPS_CATALOG,
  YEAST_CATALOG,
} from '@/data/ingredients';
import {
  lbsToDisplay,
  displayToLbs,
  ozToDisplay,
  displayToOz,
  formatWeightLbs,
} from '@/lib/units';
import {
  Package,
  Plus,
  Trash2,
  ShoppingCart,
  MinusCircle,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export function InventoryView() {
  const {
    recipe,
    inventory,
    unitSystem,
    customFermentables,
    customHops,
    customYeasts,
    addInventoryItem,
    updateInventoryItem,
    removeInventoryItem,
    deductRecipeFromInventory,
  } = useBrewStore();

  const allFermentables = [...FERMENTABLES_CATALOG, ...customFermentables];
  const allHops = [...HOPS_CATALOG, ...customHops];
  const allYeasts = [...YEAST_CATALOG, ...customYeasts];

  const [addType, setAddType] = useState<'fermentable' | 'hop' | 'yeast'>(
    'fermentable'
  );
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>(
    FERMENTABLES_CATALOG[0].id
  );
  const [quantityInput, setQuantityInput] = useState<string>('5.0');
  const [locationInput, setLocationInput] = useState<string>('Brew Closet');
  const [deductReport, setDeductReport] = useState<{
    deducted: string[];
    shortages: string[];
  } | null>(null);

  const handleAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    const rawQty = parseFloat(quantityInput) || 1;

    if (addType === 'fermentable') {
      const cat =
        allFermentables.find((f) => f.id === selectedCatalogId) ||
        allFermentables[0];
      addInventoryItem({
        ingredientId: cat.id,
        name: cat.name,
        type: 'fermentable',
        category: cat.category,
        quantity: displayToLbs(rawQty, unitSystem),
        location: locationInput,
      });
    } else if (addType === 'hop') {
      const cat =
        allHops.find((h) => h.id === selectedCatalogId) || allHops[0];
      addInventoryItem({
        ingredientId: cat.id,
        name: cat.name,
        type: 'hop',
        quantity: displayToOz(rawQty, unitSystem),
        customAlphaAcid: cat.alphaAcid,
        location: locationInput,
      });
    } else {
      const cat =
        allYeasts.find((y) => y.id === selectedCatalogId) || allYeasts[0];
      addInventoryItem({
        ingredientId: cat.id,
        name: `${cat.name} (${cat.productId})`,
        type: 'yeast',
        quantity: Math.max(1, Math.round(rawQty)),
        location: locationInput,
      });
    }
  };

  // Compute Shopping List for active recipe
  const shoppingList: {
    name: string;
    needed: string;
    onHand: string;
    shortfall: string;
  }[] = [];

  for (const f of recipe.fermentables) {
    const inv = inventory.find(
      (i) => i.type === 'fermentable' && i.ingredientId === f.id
    );
    const have = inv?.quantity ?? 0;
    if (have < f.weightLbs) {
      shoppingList.push({
        name: f.name,
        needed: formatWeightLbs(f.weightLbs, unitSystem),
        onHand: formatWeightLbs(have, unitSystem),
        shortfall: formatWeightLbs(f.weightLbs - have, unitSystem),
      });
    }
  }

  for (const h of recipe.hops) {
    const inv = inventory.find(
      (i) => i.type === 'hop' && i.ingredientId === h.hopId
    );
    const have = inv?.quantity ?? 0;
    if (have < h.weightOz) {
      const unitLabel = unitSystem === 'metric' ? 'g' : 'oz';
      shoppingList.push({
        name: `${h.name} (Hops)`,
        needed: `${ozToDisplay(h.weightOz, unitSystem)} ${unitLabel}`,
        onHand: `${ozToDisplay(have, unitSystem)} ${unitLabel}`,
        shortfall: `${ozToDisplay(h.weightOz - have, unitSystem)} ${unitLabel}`,
      });
    }
  }

  for (const y of recipe.yeasts) {
    const inv = inventory.find(
      (i) => i.type === 'yeast' && i.ingredientId === y.id
    );
    const have = inv?.quantity ?? 0;
    if (have < y.packs) {
      shoppingList.push({
        name: `${y.name} (${y.productId})`,
        needed: `${y.packs} pack(s)`,
        onHand: `${have} pack(s)`,
        shortfall: `${y.packs - have} pack(s)`,
      });
    }
  }

  return (
    <div className="space-y-6">
      {/* Header & Deduct from Inventory Action */}
      <section
        aria-labelledby="inventory-heading"
        className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div
            className="p-2.5 rounded-xl bg-[#3B82F6]/15 text-[#3B82F6]"
            aria-hidden="true"
          >
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h2
              id="inventory-heading"
              className="text-lg font-semibold text-white"
            >
              Brewery Ingredient Inventory &amp; Shopping List
            </h2>
            <p className="text-xs text-slate-300">
              Manage your grains, honey, sugars, hops, and yeast on hand.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            const report = deductRecipeFromInventory();
            setDeductReport(report);
          }}
          className="inline-flex items-center gap-2 bg-[#10B981] hover:bg-emerald-600 text-slate-950 font-semibold text-xs px-4 py-2.5 rounded-xl transition-colors cursor-pointer shrink-0"
        >
          <MinusCircle className="w-4 h-4" aria-hidden="true" />
          <span>Deduct &ldquo;{recipe.name}&rdquo; from Inventory</span>
        </button>
      </section>

      {deductReport && (
        <div
          role="status"
          aria-live="polite"
          className="bg-slate-900 border border-[#10B981]/40 rounded-2xl p-4 space-y-2"
        >
          <div className="text-sm font-semibold text-white">
            Inventory Deduction Summary
          </div>
          {deductReport.deducted.length > 0 && (
            <div className="text-xs text-emerald-300">
              <strong>Deducted:</strong> {deductReport.deducted.join(' • ')}
            </div>
          )}
          {deductReport.shortages.length > 0 && (
            <div className="text-xs text-amber-300">
              <strong>Shortages:</strong> {deductReport.shortages.join(' • ')}
            </div>
          )}
        </div>
      )}

      {/* Shopping List vs Active Recipe */}
      <section
        aria-labelledby="shopping-list-heading"
        className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3
            id="shopping-list-heading"
            className="flex items-center gap-2 text-sm font-semibold text-white"
          >
            <ShoppingCart
              className="w-4 h-4 text-[#10B981]"
              aria-hidden="true"
            />
            <span>Shopping List for &ldquo;{recipe.name}&rdquo;</span>
          </h3>
          {shoppingList.length === 0 ? (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
              All Ingredients in Stock! Ready to Brew
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
              <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
              {shoppingList.length} item(s) needed
            </span>
          )}
        </div>

        {shoppingList.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {shoppingList.map((item) => (
              <div
                key={item.name}
                className="bg-slate-950 border border-amber-500/30 rounded-xl p-3 flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-medium text-white">
                    {item.name}
                  </div>
                  <div className="text-xs text-slate-300">
                    Recipe needs {item.needed} • Have {item.onHand}
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-300 bg-amber-500/15 px-2.5 py-1 rounded-lg">
                  Buy {item.shortfall}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Add to Inventory Form */}
      <form
        onSubmit={handleAddStock}
        aria-labelledby="add-inventory-heading"
        className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3"
      >
        <h3
          id="add-inventory-heading"
          className="text-sm font-semibold text-white"
        >
          Add Ingredient to Brewery Inventory
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-3">
            <label
              htmlFor="inv-add-type"
              className="block text-xs font-medium text-slate-300 mb-1"
            >
              Ingredient Type
            </label>
            <select
              id="inv-add-type"
              value={addType}
              onChange={(e) => {
                const next = e.target.value as 'fermentable' | 'hop' | 'yeast';
                setAddType(next);
                if (next === 'fermentable')
                  setSelectedCatalogId(FERMENTABLES_CATALOG[0].id);
                else if (next === 'hop')
                  setSelectedCatalogId(HOPS_CATALOG[0].id);
                else setSelectedCatalogId(YEAST_CATALOG[0].id);
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="fermentable">
                Fermentable (Grain / Honey / Sugar)
              </option>
              <option value="hop">Hops</option>
              <option value="yeast">Yeast</option>
            </select>
          </div>

          <div className="sm:col-span-4">
            <label
              htmlFor="inv-add-ingredient"
              className="block text-xs font-medium text-slate-300 mb-1"
            >
              Select Ingredient
            </label>
            <select
              id="inv-add-ingredient"
              value={selectedCatalogId}
              onChange={(e) => setSelectedCatalogId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
            >
              {addType === 'fermentable' &&
                allFermentables.map((f) => (
                  <option key={f.id} value={f.id}>
                    [{f.category.toUpperCase()}] {f.name}
                  </option>
                ))}
              {addType === 'hop' &&
                allHops.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.origin} — {h.alphaAcid}% AA)
                  </option>
                ))}
              {addType === 'yeast' &&
                allYeasts.map((y) => (
                  <option key={y.id} value={y.id}>
                    [{y.lab} {y.productId}] {y.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="inv-add-quantity"
              className="block text-xs font-medium text-slate-300 mb-1"
            >
              Quantity (
              {addType === 'fermentable'
                ? unitSystem === 'metric'
                  ? 'kg'
                  : 'lbs'
                : addType === 'hop'
                  ? unitSystem === 'metric'
                    ? 'g'
                    : 'oz'
                  : 'packs'}
              )
            </label>
            <input
              id="inv-add-quantity"
              type="number"
              step="0.25"
              min="0.1"
              value={quantityInput}
              onChange={(e) => setQuantityInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
            />
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="inv-add-location"
              className="block text-xs font-medium text-slate-300 mb-1"
            >
              Storage Location
            </label>
            <input
              id="inv-add-location"
              type="text"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
            />
          </div>

          <div className="sm:col-span-1">
            <button
              type="submit"
              aria-label="Add Ingredient to Stock"
              className="w-full inline-flex items-center justify-center gap-1 bg-[#3B82F6] hover:bg-blue-600 text-white font-semibold py-2.5 px-3 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>
      </form>

      {/* Inventory Tables by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fermentables (Grains, Honey, Sugars) Stock */}
        <section
          aria-labelledby="stock-fermentables-heading"
          className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3"
        >
          <h3
            id="stock-fermentables-heading"
            className="text-base font-semibold text-white"
          >
            Grains, Honey &amp; Sugars in Stock
          </h3>
          <div className="divide-y divide-slate-800/70">
            {inventory
              .filter((i) => i.type === 'fermentable')
              .map((item) => (
                <div
                  key={item.id}
                  className="py-3 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="text-sm font-medium text-white flex items-center gap-2">
                      <span>{item.name}</span>
                      {item.category && (
                        <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-200">
                          {item.category}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-300">
                      {item.location || 'Pantry / Grain Room'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      value={lbsToDisplay(item.quantity, unitSystem)}
                      onChange={(e) =>
                        updateInventoryItem(item.id, {
                          quantity: displayToLbs(
                            parseFloat(e.target.value) || 0,
                            unitSystem
                          ),
                        })
                      }
                      aria-label={`Stock quantity for ${item.name}`}
                      className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-sm text-white"
                    />
                    <span className="text-xs text-slate-300 w-7">
                      {unitSystem === 'metric' ? 'kg' : 'lbs'}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeInventoryItem(item.id)}
                      aria-label={`Delete ${item.name} from inventory`}
                      className="p-2 text-slate-300 hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </section>

        {/* Hops & Yeast Stock */}
        <section
          aria-labelledby="stock-hops-yeast-heading"
          className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3"
        >
          <h3
            id="stock-hops-yeast-heading"
            className="text-base font-semibold text-white"
          >
            Hops &amp; Yeast in Freezer / Fridge
          </h3>
          <div className="divide-y divide-slate-800/70">
            {inventory
              .filter((i) => i.type === 'hop' || i.type === 'yeast')
              .map((item) => (
                <div
                  key={item.id}
                  className="py-3 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="text-sm font-medium text-white flex items-center gap-2">
                      <span>{item.name}</span>
                      <span
                        className={`text-[10px] uppercase px-2 py-0.5 rounded-full ${
                          item.type === 'hop'
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : 'bg-purple-500/15 text-purple-300'
                        }`}
                      >
                        {item.type}
                      </span>
                    </div>
                    <div className="text-xs text-slate-300">
                      {item.location || 'Freezer / Fridge'}
                      {item.customAlphaAcid
                        ? ` • Lot AA: ${item.customAlphaAcid}%`
                        : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step={item.type === 'hop' ? '0.25' : '1'}
                      min="0"
                      value={
                        item.type === 'hop'
                          ? ozToDisplay(item.quantity, unitSystem)
                          : item.quantity
                      }
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        updateInventoryItem(item.id, {
                          quantity:
                            item.type === 'hop'
                              ? displayToOz(val, unitSystem)
                              : Math.round(val),
                        });
                      }}
                      aria-label={`Stock quantity for ${item.name}`}
                      className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-sm text-white"
                    />
                    <span className="text-xs text-slate-300 w-10">
                      {item.type === 'hop'
                        ? unitSystem === 'metric'
                          ? 'g'
                          : 'oz'
                        : 'packs'}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeInventoryItem(item.id)}
                      aria-label={`Delete ${item.name} from inventory`}
                      className="p-2 text-slate-300 hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </section>
      </div>
    </div>
  );
}
