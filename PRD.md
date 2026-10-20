# Product Requirements Document (PRD): Homebrew Recipe Studio

## 1. Executive Summary & Vision
**Homebrew Recipe Studio** is a local-first web application built with Next.js that empowers homebrewers to formulate recipes, manage their ingredient inventory (grains, honey, sugars/adjuncts, hops, and yeast), calculate mash & water chemistry, run guided brew-day timers with batch tracking, and leverage an AI assistant to optimize recipes or build brews from existing stock.

## 2. Core Modules Implemented
1. **Fermentables & Adjuncts Engine**: Base & specialty grains, honeys (Orange Blossom, Wildflower, Clover, Buckwheat), sugars & syrups (Belgian Candi Syrup Clear/D-90/D-180, Dextrose, Sucrose, Dark Brown Sugar, Molasses, Maple Syrup, unfermentable Lactose, Maltodextrin), flaked adjuncts, and malt extracts (DME/LME), plus custom ingredient creation.
2. **Hop Schedule & Utilization Calculator**: Tinseth & Rager IBU formulas across Mash, First Wort, Boil, Whirlpool (with custom temperature isomerization modeling), and Dry Hop stages.
3. **Yeast & Pitch Rate Planner**: Attenuation slider, ideal temperature ranges, cell count requirements, and starter volume recommendations.
4. **Personal Inventory Manager**: Live stock badges in the recipe builder, automatic Shopping List generator, and 1-click "Deduct Recipe from Inventory".
5. **Mash & Water Chemistry Calculator**: Strike & sparge water volumes, strike water temperature, multi-step mash rests, mineral salt additions (Gypsum, CaCl₂, Epsom, Baking Soda, Chalk, 88% Lactic Acid), auto-match target profile, $\text{SO}_4:\text{Cl}$ ratio, and estimated Mash pH.
6. **Brew Day Timer & Batch Log**: Interactive Mash & Boil countdown timers, timed addition cue sheet, guided checklist, actual brewhouse efficiency calculation, and fermentation gravity readings.
7. **AI Recipe Assistant & BeerXML / JSON Portability**: Powered by `@google/genai` (`gemini-3.8-flash` via Interactions API) with 1-click specialty sugar/honey recipe presets and BeerXML/JSON export.
