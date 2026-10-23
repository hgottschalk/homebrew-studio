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

## ☁️ 1-Click Free Cloud Deploy (Vercel)

You can launch your own personal studio in the cloud for **$0/month** on Vercel's free tier. It works immediately in browser storage, installs to your phone's home screen, and costs nothing.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fhgottschalk%2Fhomebrew-studio&env=BREW_STUDIO_PIN&envDescription=Choose+a+4-digit+PIN+or+passphrase+to+lock+your+studio+(optional)&envLink=https%3A%2F%2Fgithub.com%2Fhgottschalk%2Fhomebrew-studio%23environment-variables&project-name=my-brew-studio&repository-name=homebrew-studio)

### 3-Minute Setup for Non-Technical Brewers
1. **Click the Blue Button Above**: Sign in with GitHub (free).
2. **Set an Optional PIN**: When Vercel asks for `BREW_STUDIO_PIN`, enter any 4–6 digit PIN (e.g. `1234`) or leave it blank to leave it open.
3. **Click "Deploy"**: Vercel will build and give you a personal website link (like `https://my-brew-studio.vercel.app`).
4. **Install on Your Phone**:
   * Open the link in **Safari on iPhone** → tap **Share** → tap **Add to Home Screen**.
   * Open the link in **Chrome on Android** → tap **Menu (⋮)** → tap **Install App**.

That's it! Your recipes, stock inventory, and brew day logs are saved directly on your phone and computer.

---

### 🔄 Optional: Syncing Across Multiple Devices ($0)

The app works 100% out-of-the-box using local device storage. If you want your recipes and inventory to **automatically sync between your laptop and phone**, you have two zero-cost options:

1. **GitHub Secret Gist (Recommended & 100% Free Forever)**:
   * Generate a free personal token at [github.com/settings/tokens](https://github.com/settings/tokens) with only the `gist` box checked.
   * Add `GITHUB_GIST_TOKEN` to your Vercel Project Settings → Environment Variables.
   * The app will automatically create and update a private backup gist on your GitHub account.
2. **1-Click Backup Export/Restore**:
   * If you don't want to set up tokens, click the cloud icon in the top header anytime to **Download Full Backup (.json)** and AirDrop/email it to your other device to restore.

### Environment Variables Reference
All environment variables are optional. The app gracefully falls back to secure defaults if omitted.

| Variable | Description | Default |
| :--- | :--- | :--- |
| `BREW_STUDIO_PIN` | 4–6 digit PIN or passphrase to protect your studio | *None (open)* |
| `BREW_STUDIO_SECRET` | 32+ character random signing key (e.g. from `openssl rand -hex 32`) | *Auto-generated fallback* |
| `GITHUB_GIST_TOKEN` | GitHub token (`gist` scope only) for cross-device cloud sync | *None (uses local device storage)* |
| `UPSTASH_REDIS_REST_URL` | Alternative cloud storage via Upstash Redis REST | *None* |
| `UPSTASH_REDIS_REST_TOKEN`| Upstash Redis REST authorization token | *None* |
| `GEMINI_API_KEY` | Google Gemini API key for live AI Brewmaster formulation reasoning | *Uses built-in offline rule engine* |

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
