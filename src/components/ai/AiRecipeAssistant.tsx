'use client';

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useBrewStore } from '@/store/useBrewStore';
import {
  FERMENTABLES_CATALOG,
  HOPS_CATALOG,
  YEAST_CATALOG,
  WATER_PROFILES_CATALOG,
} from '@/data/ingredients';
import { Recipe } from '@/types/brewing';
import {
  Sparkles,
  Send,
  Wand2,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

export function AiRecipeAssistant() {
  const { recipe, inventory, importRecipe, setActiveTab } = useBrewStore();
  const [prompt, setPrompt] = useState(
    'How can I balance 1.5 lbs of Orange Blossom Honey in this recipe so it stays aromatic without finishing too thin?'
  );
  const [history, setHistory] = useState<
    { role: 'user' | 'assistant'; text: string; modelUsed?: string }[]
  >([]);

  const assistantMutation = useMutation({
    mutationFn: async (userPrompt: string) => {
      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userPrompt,
          recipe,
          inventory,
        }),
      });
      if (!res.ok) {
        throw new Error('Failed to reach AI Recipe Assistant');
      }
      return (await res.json()) as { reply: string; modelUsed: string };
    },
    onSuccess: (data, variables) => {
      setHistory((prev) => [
        ...prev,
        { role: 'user', text: variables },
        { role: 'assistant', text: data.reply, modelUsed: data.modelUsed },
      ]);
    },
  });

  const handleAsk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || assistantMutation.isPending) return;
    assistantMutation.mutate(prompt.trim());
    setPrompt('');
  };

  // Instant 1-Click Inventory-Aware Recipe Generators
  const applyPresetRecipe = (presetKey: 'saison' | 'neipa' | 'stout') => {
    if (presetKey === 'saison') {
      const saisonRecipe: Recipe = {
        ...recipe,
        id: `recipe-saison-${Date.now()}`,
        name: 'Farmhouse Wildflower Honey & Candi Saison',
        styleName: 'Belgian Saison (25B)',
        method: 'all-grain',
        notes:
          'Mash low at 148°F for high fermentability. Add Amber Candi Syrup at 10 mins remaining and Wildflower Honey at Flameout (below 175°F) to preserve delicate floral aromatics.',
        updatedAt: new Date().toISOString(),
        fermentables: [
          {
            ...FERMENTABLES_CATALOG[2], // German Pilsner
            instanceId: 'f-s1',
            weightLbs: 8.5,
            stage: 'mash',
          },
          {
            ...FERMENTABLES_CATALOG[5], // White Wheat
            instanceId: 'f-s2',
            weightLbs: 1.5,
            stage: 'mash',
          },
          {
            ...FERMENTABLES_CATALOG[16], // Raw Wildflower Honey
            instanceId: 'f-s3',
            weightLbs: 1.25,
            stage: 'flameout',
          },
          {
            ...FERMENTABLES_CATALOG[21], // Belgian Candi Syrup D-90
            instanceId: 'f-s4',
            weightLbs: 0.75,
            stage: 'late-boil',
          },
        ],
        hops: [
          {
            instanceId: 'h-s1',
            hopId: HOPS_CATALOG[5].id, // Magnum
            name: HOPS_CATALOG[5].name,
            origin: HOPS_CATALOG[5].origin,
            form: 'pellet',
            use: 'boil',
            weightOz: 0.5,
            alphaAcid: HOPS_CATALOG[5].alphaAcid,
            timeMinutes: 60,
            flavorTags: HOPS_CATALOG[5].flavorTags,
          },
          {
            instanceId: 'h-s2',
            hopId: HOPS_CATALOG[6].id, // Saaz
            name: HOPS_CATALOG[6].name,
            origin: HOPS_CATALOG[6].origin,
            form: 'pellet',
            use: 'boil',
            weightOz: 1.5,
            alphaAcid: HOPS_CATALOG[6].alphaAcid,
            timeMinutes: 15,
            flavorTags: HOPS_CATALOG[6].flavorTags,
          },
        ],
        yeasts: [
          {
            ...YEAST_CATALOG[4], // Belle Saison
            instanceId: 'y-s1',
            packs: 1,
            customAttenuation: 90,
            targetPitchRate: 0.75,
          },
        ],
        targetWater: WATER_PROFILES_CATALOG[1],
      };
      importRecipe(saisonRecipe);
      setActiveTab('recipe');
    } else if (presetKey === 'neipa') {
      const neipaRecipe: Recipe = {
        ...recipe,
        id: `recipe-neipa-${Date.now()}`,
        name: 'Cloudburst Citra-Mosaic-Nelson DIPA',
        styleName: 'Hazy / Juicy Double IPA (22A)',
        method: 'all-grain',
        notes:
          'High-chloride water profile for pillowy softness. Corn sugar (Dextrose) boosts ABV cleanly while Flaked Oats and White Wheat build lush haze.',
        updatedAt: new Date().toISOString(),
        fermentables: [
          {
            ...FERMENTABLES_CATALOG[0], // 2-Row
            instanceId: 'f-n1',
            weightLbs: 11.0,
            stage: 'mash',
          },
          {
            ...FERMENTABLES_CATALOG[12], // Flaked Oats
            instanceId: 'f-n2',
            weightLbs: 2.25,
            stage: 'mash',
          },
          {
            ...FERMENTABLES_CATALOG[5], // White Wheat
            instanceId: 'f-n3',
            weightLbs: 1.5,
            stage: 'mash',
          },
          {
            ...FERMENTABLES_CATALOG[18], // Corn Sugar Dextrose
            instanceId: 'f-n4',
            weightLbs: 1.0,
            stage: 'late-boil',
          },
        ],
        hops: [
          {
            instanceId: 'h-n1',
            hopId: HOPS_CATALOG[0].id, // Citra
            name: HOPS_CATALOG[0].name,
            origin: HOPS_CATALOG[0].origin,
            form: 'pellet',
            use: 'whirlpool',
            weightOz: 3.0,
            alphaAcid: HOPS_CATALOG[0].alphaAcid,
            timeMinutes: 25,
            temperatureF: 175,
            flavorTags: HOPS_CATALOG[0].flavorTags,
          },
          {
            instanceId: 'h-n2',
            hopId: HOPS_CATALOG[1].id, // Mosaic
            name: HOPS_CATALOG[1].name,
            origin: HOPS_CATALOG[1].origin,
            form: 'pellet',
            use: 'dry-hop',
            weightOz: 3.5,
            alphaAcid: HOPS_CATALOG[1].alphaAcid,
            timeMinutes: 4,
            flavorTags: HOPS_CATALOG[1].flavorTags,
          },
          {
            instanceId: 'h-n3',
            hopId: HOPS_CATALOG[9].id, // Nelson Sauvin
            name: HOPS_CATALOG[9].name,
            origin: HOPS_CATALOG[9].origin,
            form: 'pellet',
            use: 'dry-hop',
            weightOz: 2.0,
            alphaAcid: HOPS_CATALOG[9].alphaAcid,
            timeMinutes: 3,
            flavorTags: HOPS_CATALOG[9].flavorTags,
          },
        ],
        yeasts: [
          {
            ...YEAST_CATALOG[2], // London Ale III
            instanceId: 'y-n1',
            packs: 2,
            customAttenuation: 74,
            targetPitchRate: 1.0,
          },
        ],
        targetWater: WATER_PROFILES_CATALOG[3],
      };
      importRecipe(neipaRecipe);
      setActiveTab('recipe');
    } else {
      const stoutRecipe: Recipe = {
        ...recipe,
        id: `recipe-stout-${Date.now()}`,
        name: 'Velvet Buckwheat Honey & Lactose Milk Stout',
        styleName: 'Sweet / Milk Stout (16A)',
        method: 'all-grain',
        notes:
          'Combines unfermentable Milk Sugar (Lactose, 0% attenuation) for creamy residual sweetness with Dark Buckwheat Honey at flameout for earthy roasted depth.',
        updatedAt: new Date().toISOString(),
        fermentables: [
          {
            ...FERMENTABLES_CATALOG[1], // Maris Otter
            instanceId: 'f-m1',
            weightLbs: 8.5,
            stage: 'mash',
          },
          {
            ...FERMENTABLES_CATALOG[10], // Chocolate Malt
            instanceId: 'f-m2',
            weightLbs: 0.75,
            stage: 'mash',
          },
          {
            ...FERMENTABLES_CATALOG[11], // Roasted Barley
            instanceId: 'f-m3',
            weightLbs: 0.5,
            stage: 'mash',
          },
          {
            ...FERMENTABLES_CATALOG[12], // Flaked Oats
            instanceId: 'f-m4',
            weightLbs: 1.0,
            stage: 'mash',
          },
          {
            ...FERMENTABLES_CATALOG[26], // Milk Sugar Lactose
            instanceId: 'f-m5',
            weightLbs: 1.0,
            stage: 'late-boil',
          },
          {
            ...FERMENTABLES_CATALOG[17], // Dark Buckwheat Honey
            instanceId: 'f-m6',
            weightLbs: 1.0,
            stage: 'flameout',
          },
        ],
        hops: [
          {
            instanceId: 'h-m1',
            hopId: HOPS_CATALOG[8].id, // EKG
            name: HOPS_CATALOG[8].name,
            origin: HOPS_CATALOG[8].origin,
            form: 'pellet',
            use: 'boil',
            weightOz: 1.5,
            alphaAcid: HOPS_CATALOG[8].alphaAcid,
            timeMinutes: 60,
            flavorTags: HOPS_CATALOG[8].flavorTags,
          },
        ],
        yeasts: [
          {
            ...YEAST_CATALOG[3], // S-04
            instanceId: 'y-m1',
            packs: 1,
            customAttenuation: 74,
            targetPitchRate: 0.75,
          },
        ],
        targetWater: WATER_PROFILES_CATALOG[5],
      };
      importRecipe(stoutRecipe);
      setActiveTab('recipe');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1-Click Recipe Templates */}
      <section
        aria-labelledby="ai-presets-heading"
        className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4"
      >
        <div className="flex items-center gap-2.5">
          <div
            className="p-2 rounded-xl bg-[#10B981]/15 text-[#10B981]"
            aria-hidden="true"
          >
            <Wand2 className="w-5 h-5" />
          </div>
          <div>
            <h2
              id="ai-presets-heading"
              className="text-lg font-semibold text-white"
            >
              1-Click Specialty Sugar &amp; Honey Recipe Generators
            </h2>
            <p className="text-xs text-slate-300">
              Load a pre-balanced recipe showcasing different honeys, candi
              syrups, dextrose, and unfermentable lactose directly into the
              Recipe Builder.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <button
            type="button"
            onClick={() => applyPresetRecipe('saison')}
            className="text-left p-4 rounded-xl bg-slate-950 hover:bg-slate-950/60 border border-slate-800 hover:border-[#3B82F6] transition-all cursor-pointer space-y-1.5"
          >
            <div className="text-xs font-semibold text-[#10B981] uppercase">
              Belgian Farmhouse (25B)
            </div>
            <div className="text-sm font-bold text-white">
              Wildflower Honey &amp; Candi Syrup Saison
            </div>
            <p className="text-xs text-slate-300">
              Pilsner + Wheat base with D-90 Amber Candi Syrup (late boil), Raw
              Wildflower Honey (flameout), Saaz hops, and Belle Saison yeast.
            </p>
          </button>

          <button
            type="button"
            onClick={() => applyPresetRecipe('neipa')}
            className="text-left p-4 rounded-xl bg-slate-950 hover:bg-slate-950/60 border border-slate-800 hover:border-[#3B82F6] transition-all cursor-pointer space-y-1.5"
          >
            <div className="text-xs font-semibold text-[#3B82F6] uppercase">
              Hazy Double IPA (22A)
            </div>
            <div className="text-sm font-bold text-white">
              Cloudburst Citra-Mosaic-Nelson DIPA
            </div>
            <p className="text-xs text-slate-300">
              2-Row, Flaked Oats &amp; White Wheat with Corn Sugar (Dextrose,
              100% fermentable) to boost ABV while keeping body soft and juicy.
            </p>
          </button>

          <button
            type="button"
            onClick={() => applyPresetRecipe('stout')}
            className="text-left p-4 rounded-xl bg-slate-950 hover:bg-slate-950/60 border border-slate-800 hover:border-[#3B82F6] transition-all cursor-pointer space-y-1.5"
          >
            <div className="text-xs font-semibold text-amber-300 uppercase">
              Sweet / Milk Stout (16A)
            </div>
            <div className="text-sm font-bold text-white">
              Buckwheat Honey &amp; Lactose Milk Stout
            </div>
            <p className="text-xs text-slate-300">
              Maris Otter, Chocolate Malt, Lactose (0% fermentable milk sugar)
              for creamy sweetness, and Dark Buckwheat Honey at flameout.
            </p>
          </button>
        </div>
      </section>

      {/* Interactive Gemini AI Brewmaster Chat */}
      <section
        aria-labelledby="ai-assistant-heading"
        className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div
              className="p-2 rounded-xl bg-[#3B82F6]/15 text-[#3B82F6]"
              aria-hidden="true"
            >
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3
                id="ai-assistant-heading"
                className="text-base font-semibold text-white"
              >
                AI Master Brewer Formulation Assistant
              </h3>
              <p className="text-xs text-slate-300">
                Context-aware of your active recipe (&ldquo;{recipe.name}
                &rdquo;) and {inventory.length} inventory items.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Prompt Chips */}
        <div className="flex flex-wrap gap-2">
          {[
            'What can I brew today using only my current inventory?',
            'How does swapping cane sugar vs honey vs lactose affect my Final Gravity?',
            'Suggest hop substitutions and whirlpool temps for a tropical aroma.',
            'How should I adjust my mash temp when adding 15% honey or simple sugar?',
          ].map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => setPrompt(suggestion)}
              className="text-xs bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
            >
              {suggestion}
            </button>
          ))}
        </div>

        {/* Conversation Thread */}
        {history.length > 0 && (
          <div
            role="log"
            aria-live="polite"
            aria-label="AI Brewmaster Conversation History"
            className="space-y-3 max-h-[420px] overflow-y-auto pr-1"
          >
            {history.map((msg, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl text-sm whitespace-pre-wrap leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#3B82F6]/15 border border-[#3B82F6]/30 text-white ml-8'
                    : 'bg-slate-950 border border-slate-800 text-slate-200 mr-4'
                }`}
              >
                {msg.role === 'assistant' && msg.modelUsed && (
                  <div className="flex items-center gap-1.5 text-[11px] text-[#10B981] font-semibold mb-2">
                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Brewmaster Response ({msg.modelUsed})</span>
                  </div>
                )}
                {msg.text}
              </div>
            ))}
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleAsk} className="flex flex-col sm:flex-row gap-2.5">
          <label htmlFor="ai-brewmaster-prompt" className="visually-hidden">
            Ask the AI Brewmaster a question about your recipe
          </label>
          <input
            id="ai-brewmaster-prompt"
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask about grain bills, honey/sugar fermentability, hop pairings, or yeast..."
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white"
          />
          <button
            type="submit"
            disabled={assistantMutation.isPending}
            className="inline-flex items-center justify-center gap-2 bg-[#3B82F6] hover:bg-blue-600 disabled:opacity-50 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            {assistantMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" aria-hidden="true" />
                <span>Ask Brewmaster</span>
              </>
            )}
          </button>
        </form>
      </section>
    </div>
  );
}
