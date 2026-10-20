import { Recipe } from '@/types/brewing';
import { calculateBrewMetrics } from './calculations';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function exportRecipeToBeerXml(recipe: Recipe): string {
  const metrics = calculateBrewMetrics(recipe);
  const typeMap: Record<Recipe['method'], string> = {
    'all-grain': 'All Grain',
    biab: 'All Grain',
    'partial-mash': 'Partial Mash',
    extract: 'Extract',
  };

  const batchLiters = (recipe.equipment.batchVolumeGal * 3.78541).toFixed(2);
  const boilLiters = (metrics.preBoilVolumeGal * 3.78541).toFixed(2);

  const fermentablesXml = recipe.fermentables
    .map((f) => {
      const amountKg = (f.weightLbs * 0.453592).toFixed(3);
      const yieldPct = (((f.customPpg ?? f.ppg) / 46) * 100).toFixed(1);
      const xmlType =
        f.category === 'extract'
          ? 'Extract'
          : f.category === 'sugar' || f.category === 'honey'
            ? 'Sugar'
            : f.category === 'adjunct'
              ? 'Adjunct'
              : 'Grain';
      return `      <FERMENTABLE>
        <NAME>${escapeXml(f.name)}</NAME>
        <VERSION>1</VERSION>
        <TYPE>${xmlType}</TYPE>
        <AMOUNT>${amountKg}</AMOUNT>
        <YIELD>${yieldPct}</YIELD>
        <COLOR>${(f.customColor ?? f.colorLovibond).toFixed(1)}</COLOR>
        <ORIGIN>${escapeXml(f.origin)}</ORIGIN>
        <ADD_AFTER_BOIL>${f.stage === 'flameout' || f.stage === 'primary' || f.stage === 'secondary' ? 'TRUE' : 'FALSE'}</ADD_AFTER_BOIL>
      </FERMENTABLE>`;
    })
    .join('\n');

  const hopsXml = recipe.hops
    .map((h) => {
      const amountKg = (h.weightOz * 0.0283495).toFixed(4);
      const useMap: Record<typeof h.use, string> = {
        mash: 'Mash',
        'first-wort': 'First Wort',
        boil: 'Boil',
        whirlpool: 'Aroma',
        'dry-hop': 'Dry Hop',
      };
      return `      <HOP>
        <NAME>${escapeXml(h.name)}</NAME>
        <VERSION>1</VERSION>
        <ALPHA>${h.alphaAcid.toFixed(1)}</ALPHA>
        <AMOUNT>${amountKg}</AMOUNT>
        <USE>${useMap[h.use]}</USE>
        <TIME>${h.use === 'dry-hop' ? h.timeMinutes * 1440 : h.timeMinutes}</TIME>
        <FORM>${h.form === 'whole' ? 'Leaf' : 'Pellet'}</FORM>
      </HOP>`;
    })
    .join('\n');

  const yeastsXml = recipe.yeasts
    .map((y) => {
      return `      <YEAST>
        <NAME>${escapeXml(y.name)}</NAME>
        <VERSION>1</VERSION>
        <TYPE>Ale</TYPE>
        <FORM>${y.form === 'dry' ? 'Dry' : 'Liquid'}</FORM>
        <LABORATORY>${escapeXml(y.lab)}</LABORATORY>
        <PRODUCT_ID>${escapeXml(y.productId)}</PRODUCT_ID>
        <ATTENUATION>${y.customAttenuation}</ATTENUATION>
      </YEAST>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<RECIPES>
  <RECIPE>
    <NAME>${escapeXml(recipe.name)}</NAME>
    <VERSION>1</VERSION>
    <TYPE>${typeMap[recipe.method]}</TYPE>
    <BREWER>Homebrew Recipe Studio</BREWER>
    <BATCH_SIZE>${batchLiters}</BATCH_SIZE>
    <BOIL_SIZE>${boilLiters}</BOIL_SIZE>
    <BOIL_TIME>${recipe.equipment.boilTimeMinutes}</BOIL_TIME>
    <EFFICIENCY>${recipe.equipment.brewhouseEfficiency}</EFFICIENCY>
    <OG>${metrics.og}</OG>
    <FG>${metrics.fg}</FG>
    <NOTES>${escapeXml(recipe.notes)}</NOTES>
    <STYLE>
      <NAME>${escapeXml(recipe.styleName)}</NAME>
      <VERSION>1</VERSION>
      <CATEGORY>Specialty</CATEGORY>
      <CATEGORY_NUMBER>21</CATEGORY_NUMBER>
      <STYLE_LETTER>B</STYLE_LETTER>
      <STYLE_GUIDE>BJCP</STYLE_GUIDE>
      <TYPE>Ale</TYPE>
    </STYLE>
    <FERMENTABLES>
${fermentablesXml}
    </FERMENTABLES>
    <HOPS>
${hopsXml}
    </HOPS>
    <YEASTS>
${yeastsXml}
    </YEASTS>
  </RECIPE>
</RECIPES>`;
}
