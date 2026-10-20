'use client';

import React, { useMemo } from 'react';
import { useBrewStore, ActiveTab } from '@/store/useBrewStore';
import { calculateBrewMetrics } from '@/lib/calculations';
import { RecipeBuilderView } from '@/components/recipe/RecipeBuilderView';
import { InventoryView } from '@/components/inventory/InventoryView';
import { WaterChemistryView } from '@/components/water/WaterChemistryView';
import { BrewDayView } from '@/components/brewday/BrewDayView';
import { AiRecipeAssistant } from '@/components/ai/AiRecipeAssistant';
import {
  Beer,
  FlaskConical,
  Package,
  Droplets,
  Timer,
  Sparkles,
} from 'lucide-react';

export default function HomePage() {
  const {
    recipe,
    batchLogs,
    activeTab,
    unitSystem,
    setActiveTab,
    setUnitSystem,
  } = useBrewStore();

  const metrics = useMemo(() => calculateBrewMetrics(recipe), [recipe]);

  const navItems: {
    id: ActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[] = [
    { id: 'recipe', label: 'Recipe Formulator', icon: FlaskConical },
    { id: 'inventory', label: 'My Inventory & Stock', icon: Package },
    { id: 'water', label: 'Mash & Water Chemistry', icon: Droplets },
    {
      id: 'brewday',
      label: "Brewer's Log & Timers",
      icon: Timer,
      badge: batchLogs.length,
    },
    { id: 'ai', label: 'AI Brewmaster', icon: Sparkles },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-slate-950/85 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Brand Logo & Active Recipe Summary Pill */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#10B981] flex items-center justify-center shadow-lg shadow-[#3B82F6]/20">
                <Beer className="w-5 h-5 text-slate-950 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold tracking-tight text-white">
                    Homebrew Recipe Studio
                  </h1>
                  <span className="hidden sm:inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                    {metrics.abv.toFixed(1)}% ABV • {metrics.ibu.toFixed(0)} IBU
                    • {metrics.srm} SRM
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Grain, Honey, Sugar, Hop & Yeast Formulation Workbench
                </p>
              </div>
            </div>

            {/* Mobile Unit Toggle */}
            <div className="flex md:hidden items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setUnitSystem('imperial')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                  unitSystem === 'imperial'
                    ? 'bg-[#3B82F6] text-white'
                    : 'text-slate-400'
                }`}
              >
                US (lbs/gal/°F)
              </button>
              <button
                type="button"
                onClick={() => setUnitSystem('metric')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                  unitSystem === 'metric'
                    ? 'bg-[#3B82F6] text-white'
                    : 'text-slate-400'
                }`}
              >
                Metric (kg/L/°C)
              </button>
            </div>
          </div>

          {/* Module Tabs */}
          <nav className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-[#3B82F6] text-white shadow-md shadow-[#3B82F6]/25'
                      : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800/80'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                  {typeof item.badge === 'number' && item.badge > 0 && (
                    <span
                      className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-[#10B981]/20 text-[#10B981]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Desktop Unit System Toggle */}
          <div className="hidden md:flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 shrink-0">
            <button
              type="button"
              onClick={() => setUnitSystem('imperial')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                unitSystem === 'imperial'
                  ? 'bg-[#3B82F6] text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Imperial (lbs / oz / gal / °F)
            </button>
            <button
              type="button"
              onClick={() => setUnitSystem('metric')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                unitSystem === 'metric'
                  ? 'bg-[#3B82F6] text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Metric (kg / g / L / °C)
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'recipe' && <RecipeBuilderView metrics={metrics} />}
        {activeTab === 'inventory' && <InventoryView />}
        {activeTab === 'water' && <WaterChemistryView metrics={metrics} />}
        {activeTab === 'brewday' && <BrewDayView metrics={metrics} />}
        {activeTab === 'ai' && <AiRecipeAssistant />}
      </main>
    </div>
  );
}
