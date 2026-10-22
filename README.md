# 🍺 Homebrew Recipe Studio

Created by **[Harold Gottschalk (@hgottschalk)](https://github.com/hgottschalk) • SoftBrew**

An open-source, precision **All-Grain, BIAB, Partial-Mash, and Extract** homebrew recipe formulator, specialty **Honey & Sugar** fermentability calculator, **Water Chemistry** workbench, **Inventory** tracker, and **Brewer's Log** — built with Next.js 15, React 19, Tailwind CSS v4, Zustand, and TanStack Query.

Designed so **any homebrewer can run it locally or deploy it to the cloud for $0/month** and install it on their phone as a standalone Progressive Web App (PWA).

---

## ✨ Key Features

* **Precision Recipe Formulation**:
  * Real-time **OG, FG, ABV (Standard & High-Gravity), IBU (Tinseth & Rager), SRM/EBC Pint Glass Preview, BU:GU Ratio, and Diastatic Power (°Lintner)** calculations.
  * Differential fermentability modeling for **Mashed Grains** (efficiency-scaled) vs. **100%-dissolved Honeys, Belgian Candi Syrups, Dextrose, Brown/Invert Sugars, and Unfermentable Lactose (0% attenuation)**.
  * Built-in **BJCP 2021 Style Guide Browser** with live range compliance badges.
  * **39 Hop Varieties** & **32 Yeast Strains** (Fermentis, White Labs including Weihenstephan WLP300/WLP830/WLP833/WLP838, Wyeast, Lallemand, Imperial, Omega) + custom ingredient database modals.
* **Mash & Water Chemistry Workbench**:
  * Strike water volume & temperature calculator, multi-step mash rest planner, and **Auto-Match Target Water** solver (Gypsum, Calcium Chloride, Epsom Salt, Baking Soda, Chalk, 88% Lactic Acid) with live **Sulfate-to-Chloride ($\text{SO}_4^{2-}:\text{Cl}^-$)** and **Estimated Mash pH** readouts.
* **Brewer's Log & Brew-Day Timers**:
  * Side-by-side **Planned vs. Actual Ingredients Used**, co-brewers, *What Went Right*, *Day-Of Adjustments*, measured brewhouse efficiency, fermentation gravity log, and a **Mash & Boil Countdown Timer** with **Phone Screen Wake Lock**.
* **ADA / WCAG 2.1 AA & Full Keyboard Accessibility**:
  * Native `<dialog>` modals, WAI-ARIA `tablist` and `menu` patterns, roving `tabIndex` filters, container-query responsive card tables, and global keyboard shortcuts (`Alt+1..5`, `Cmd/Ctrl+S`, `?`).

---

## 🚀 Quick Start (Run Locally in 30 Seconds)

```bash
git clone https://github.com/hgottschalk/homebrew-studio.git
cd homebrew-studio
npm install
npm run dev
```

Open **`http://localhost:3456`** in your browser.

### 📱 Use on Your Phone Over Home Wi-Fi (Zero Setup)
When running `npm run dev` or `npm start` on your computer, the app automatically saves your brewery state to `.data/brewery-state.json`.
1. Find your computer's local Wi-Fi IP address (shown in the terminal as `- Network: http://192.168.x.x:3456`).
2. Open that URL on your phone while connected to the same Wi-Fi network.
3. **Install to Home Screen**:
   * **iPhone (Safari)**: Tap **Share → Add to Home Screen**.
   * **Android (Chrome)**: Tap **Menu (⋮) → Install App**.
4. Any recipe, inventory change, or brew-day log you make on your computer or phone automatically syncs between both devices!

---

## ☁️ Deploy to the Cloud for $0/Month (Vercel + Free Cloud Sync)

You can host your own private instance on **Vercel's Free Hobby Tier** and sync across your phone and laptop from anywhere (including at the local homebrew supply shop):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fhgottschalk%2Fhomebrew-studio)

### Optional Environment Variables (All $0)
Configure any of these in `.env.local` or your **Vercel Project Settings → Environment Variables**:

| Variable | Purpose | Cost |
| :--- | :--- | :--- |
| `BREW_STUDIO_PIN` | Sets a **Brewery PIN / Passcode** (e.g. `4829`). Protects your public Vercel URL with a lock screen and a 90-day encrypted `HttpOnly` cookie. Leave blank to disable the lock screen. | **$0** |
| `GITHUB_GIST_TOKEN` | Personal Access Token (with only the `gist` scope) from [GitHub Tokens](https://github.com/settings/tokens). Automatically syncs your entire brewery state to a **secret GitHub Gist** (`homebrew-recipe-studio-state.json`). | **$0 Forever** |
| `UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN` | Alternative cloud sync via Upstash Redis Free Tier (10,000 requests/day free). | **$0 Free Tier** |
| `GEMINI_API_KEY` | Enables live `gemini-3.8-flash` cloud reasoning in the **AI Brewmaster** tab (falls back to the built-in offline Brewmaster engine if omitted). | **Free Tier Available** |

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Alt + 1` … `Alt + 5` | Switch between Recipe Builder, Inventory, Water & Mash, Brewer's Log, and AI Brewmaster |
| `Ctrl / Cmd + S` | Save active recipe to library |
| `?` | Open Keyboard Navigation & Accessibility Reference |
| `ArrowLeft` / `ArrowRight` | Navigate module tabs, unit switchers, and category filter pills |
| `Escape` | Close any open modal dialog or dropdown menu |

---

## 🤝 Contributing

Contributions from homebrewers and developers are welcome! Whether you want to add new hop varieties, yeast strains, specialty malts/honeys/sugars, BJCP styles, or brewing calculators:
* Read the **[Contributing Guide (`CONTRIBUTING.md`)](./CONTRIBUTING.md)**
* Open a **[New Ingredient Request](https://github.com/hgottschalk/homebrew-studio/issues/new/choose)** or submit a Pull Request!

---

## 👤 Credits & License

* **Created by**: [Harold Gottschalk (@hgottschalk)](https://github.com/hgottschalk) • **SoftBrew** (`hgottschalk@softbrew.com`)
* **License**: Released under the [MIT License](./LICENSE). Free for all homebrewers and brewing clubs to use, modify, and self-host.
