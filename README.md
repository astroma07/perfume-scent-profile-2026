# Scent Profile — Olfactory Analytics Dashboard

An interactive fragrance collection dashboard built with React + Recharts.

## Features

- **Fragrance Notes** — AI-analyzed doughnut chart of your scent DNA (powered by Claude Sonnet)
- **Wear Calendar** — Log which fragrances you wear daily, with multi-select support
- **Trends Chart** — Auto-generated from your calendar entries
- **Collection Bubble Chart** — Cost vs. volume vs. frequency visualization
- **Editable Everything** — Status, house, cost, volume, frequency all editable inline

---

## Quick Start (Local)

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Deploy to Vercel (Recommended)

### Option A — Drag & Drop
1. Run `npm run build` locally
2. Go to [vercel.com/new](https://vercel.com/new)
3. Drag the `dist/` folder onto the page
4. Done — you'll get a live URL instantly

### Option B — GitHub + Auto-Deploy
1. Push this folder to a GitHub repo
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import the repo
4. Vercel auto-detects Vite — click **Deploy**
5. Every push to `main` auto-deploys

### Option C — Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy (follow the prompts)
vercel
```

---

## Deploy to Netlify

1. Run `npm run build`
2. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
3. Drag the `dist/` folder
4. Live in seconds

---

## Deploy to GitHub Pages

```bash
# Install gh-pages
npm install --save-dev gh-pages

# Add to package.json scripts:
#   "deploy": "vite build && gh-pages -d dist"

# Then in vite.config.js, add:
#   base: '/your-repo-name/',

npm run deploy
```

---

## Project Structure

```
scent-profile/
├── index.html              # Entry HTML
├── package.json            # Dependencies & scripts
├── vite.config.js          # Vite configuration
├── README.md               # This file
└── src/
    ├── main.jsx            # React mount point
    └── ScentDashboard.jsx  # The full dashboard component
```

---

## Note on the Sonnet API

The Notes tab calls the Anthropic API to analyze your collection. This works automatically in Claude.ai artifacts. For standalone deployment, you'll need to either:

1. **Use the fallback profile** — The app includes a pre-built fallback that loads instantly
2. **Add an API key** — Set up a lightweight proxy/serverless function to forward requests to the Anthropic API (never expose keys in frontend code)

The fallback profile is derived from your Sonnet conversation and works perfectly without any API calls.

---

Built with React, Recharts, and Vite. Scent data analyzed by Claude Sonnet.
