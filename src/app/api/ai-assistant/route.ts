import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { Recipe, InventoryItem } from '@/types/brewing';
import { AUTH_COOKIE_NAME, verifySignedSessionToken } from '@/lib/auth';

interface AssistantRequestBody {
  prompt: string;
  recipe: Recipe;
  inventory: InventoryItem[];
}

export async function POST(req: NextRequest) {
  try {
    const configuredPin = process.env.BREW_STUDIO_PIN?.trim();
    if (configuredPin) {
      const cookieToken = req.cookies.get(AUTH_COOKIE_NAME)?.value;
      const isAuthorized = await verifySignedSessionToken(cookieToken, configuredPin);
      if (!isAuthorized) {
        return NextResponse.json(
          { error: 'Unauthorized: Brewery PIN required' },
          { status: 401 }
        );
      }
    }

    const body = (await req.json()) as AssistantRequestBody;
    const { prompt, recipe, inventory } = body;

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      const client = new GoogleGenAI({ apiKey });

      const systemInstruction = `You are a Master Brewer and Cicerone Recipe Formulation Assistant inside Homebrew Recipe Studio.
The user's active recipe is:
${JSON.stringify(recipe, null, 2)}

The user's current personal brewery inventory is:
${JSON.stringify(inventory, null, 2)}

Provide concise, actionable brewing advice. Specifically address:
1. Grain bill, honey, and sugar/adjunct balance (noting how honey ~95% fermentable and simple sugars ~100% fermentable dry out Final Gravity and boost ABV, while lactose is 0% fermentable).
2. Hop additions, IBU balance (BU:GU ratio), whirlpool temperatures, and dry hopping.
3. Yeast strain selection, attenuation, fermentation temperature, and water chemistry (SO4:Cl ratio).
4. Optional JSON recipe adjustments if they ask to modify or formulate a recipe.`;

      const interaction = await client.interactions.create({
        model: 'gemini-3.8-flash',
        system_instruction: systemInstruction,
        input: prompt,
      });

      return NextResponse.json({
        reply:
          interaction.output_text ||
          'Formulation analysis complete. Let me know how you would like to adjust your recipe!',
        modelUsed: 'gemini-3.8-flash',
      });
    }

    // Intelligent built-in Master Brewer analysis when GEMINI_API_KEY is not set in environment
    const fermentableSummary = recipe.fermentables
      .map((f) => `${f.weightLbs} lbs ${f.name} (${f.category}, ${f.stage})`)
      .join(', ');
    const hopSummary = recipe.hops
      .map((h) => `${h.weightOz} oz ${h.name} (${h.use})`)
      .join(', ');
    const inStockHoneysAndSugars = inventory
      .filter((i) => i.category === 'honey' || i.category === 'sugar')
      .map((i) => `${i.name} (${i.quantity} lbs)`)
      .join(', ');

    const fallbackReply = `### Brewmaster Analysis for **${recipe.name}** (${recipe.styleName})

**Your Query:** *"${prompt}"*

1. **Fermentables, Honey & Sugar Balance**
   - Current Bill: ${fermentableSummary}
   - **Honey & Sugar Tip:** Honeys (~95% fermentable) and simple sugars like Dextrose or Belgian Candi Syrup (95–100% fermentable) contribute 100% of their PPG without needing mash conversion, thinning body and lowering Final Gravity. To preserve delicate floral aromatics in **Orange Blossom** or **Wildflower Honey**, add at **Flameout (0 min)** as the wort cools below 180°F or at **High Krausen** in primary fermentation.
   - **On-Hand Sugars/Honeys in Your Inventory:** ${inStockHoneysAndSugars || 'None listed'}.

2. **Hop Utilization & Aroma Optimization**
   - Current Hop Schedule: ${hopSummary}
   - Holding your whirlpool / hop stand at **175°F–180°F (80°C)** for 20 minutes extracts maximum myrcene, linalool, and geraniol essential oils while keeping thermal isomerization low (~20% of boil utilization) to avoid harsh astringency.

3. **Yeast & Water Chemistry Synergy**
   - Strain: **${recipe.yeasts[0]?.name || 'House Ale Yeast'}** (${recipe.yeasts[0]?.customAttenuation ?? 78}% attenuation).
   - If using high-attenuating sugars/honey (>10% of grist), mash your base grains slightly higher (**153°F–154°F**) or include **0.75–1.0 lb of Flaked Oats or Carafoam** so the beer retains a rounded mouthfeel.

*(Note: Add \`GEMINI_API_KEY\` to your \`.env.local\` to enable live \`gemini-3.8-flash\` cloud reasoning.)*`;

    return NextResponse.json({
      reply: fallbackReply,
      modelUsed: 'built-in-brewmaster-engine',
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to process AI request';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
