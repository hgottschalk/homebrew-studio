# Contributing to Homebrew Recipe Studio 🍺

Thank you for your interest in contributing to **Homebrew Recipe Studio** (`github.com/hgottschalk/homebrew-studio`), created by **Harold Gottschalk (@hgottschalk) • SoftBrew**!

Whether you want to add new hop varieties, yeast strains, specialty malts/honeys/sugars, BJCP styles, or new brewing calculators, your contributions are welcome.

---

## 🛠️ Local Development Setup

1. **Fork and Clone the Repository**
   ```bash
   git clone https://github.com/<your-username>/homebrew-studio.git
   cd homebrew-studio
   npm install
   ```

2. **Start the Development Server (Port 3456)**
   ```bash
   npm run dev
   ```
   Open **`http://localhost:3456`** in your browser.

3. **Run TypeScript & Build Verification Before Submitting a PR**
   ```bash
   npx tsc --noEmit
   npm run build
   ```

---

## 🌾 How to Add New Ingredients (Hops, Yeasts, Malts, Honeys, Sugars)

All built-in catalog items live in **[`src/data/ingredients.ts`](./src/data/ingredients.ts)**:

* **Fermentables (`FERMENTABLES_CATALOG`)**: Include `id`, `name`, `category` (`'grain' | 'honey' | 'sugar' | 'adjunct' | 'extract'`), `origin`, `ppg`, `colorLovibond`, `fermentability` (0–100%), `diastaticPower`, `requiresMash`, and `notes`.
* **Hops (`HOPS_CATALOG`)**: Include `id`, `name`, `origin`, `alphaAcid`, `betaAcid`, `cohumulone`, `totalOilMlPer100g`, `purpose` (`'bittering' | 'aroma' | 'dual'`), `flavorTags`, `substitutes`, and `notes`.
* **Yeasts (`YEAST_CATALOG`)**: Include `id`, `name`, `lab` (`'Fermentis' | 'White Labs' | 'Wyeast' | 'Lallemand' | 'Imperial' | 'Omega' | 'Other'`), `productId`, `form`, `attenuationMin`, `attenuationMax`, `tempMinF`, `tempMaxF`, `flocculation`, `alcoholTolerance`, and `notes`.
* **BJCP Styles (`BJCP_STYLES_CATALOG`)**: Include official BJCP 2021 `code`, `name`, `category`, `ogMin`/`ogMax`, `fgMin`/`fgMax`, `ibuMin`/`ibuMax`, `srmMin`/`srmMax`, `abvMin`/`abvMax`, and `description`.

---

## ♿ Accessibility & Responsive Design Standards

We maintain **ADA / WCAG 2.1 AA** and full keyboard accessibility across the application:
* Use native `<dialog>` ([`src/components/ui/ModalDialog.tsx`](./src/components/ui/ModalDialog.tsx)) for all modal dialogs.
* Every `<input>`, `<select>`, and `<textarea>` must have an explicit `<label htmlFor="...">` or `aria-label`.
* Support both **US Imperial (`lbs`, `oz`, `gal`, `°F`)** and **Metric (`kg`, `g`, `L`, `°C`)** via helpers in [`src/lib/units.ts`](./src/lib/units.ts).
