# Handover — Love Jones Stylez × Higgsfield rebrand

Last updated: 2026-05-11

## TL;DR

Private redesign concept for **Love Jones Stylez** (Raleigh, NC hair salon).
Goal: pitch Christina Jones a cinematic, AI-powered website + reel package using **Higgsfield AI** to generate the video content.

The site is a single-page Vite app (Three.js + GSAP + Lenis). A new `#reel` section was just added — four 9:16 vertical cards ready to play Higgsfield MP4s.

---

## Where things stand

**Done**
- [x] Audited existing app — Three.js scene, GSAP scroll choreography, Lenis, magnetic buttons, cinema reveals, animated counters, pinned craft section.
- [x] Added couture typography (Fraunces variable serif + Inter via Google Fonts).
- [x] Added cinematic loading-screen letterbox bars + "A cinematic salon concept" eyebrow.
- [x] Added subtle film-grain pulse animation over hero.
- [x] **Built new `#reel` section** with 4× 9:16 reel cards (Cinema Studio / Soul / Seedance / Kling labels), shutter-bar reveal, REC pill, glassmorphic play button, single-active-at-a-time playback.
- [x] Added "Reel" link to nav.
- [x] Added `button-ghost` variant.
- [x] Wrote `HIGGSFIELD_PACKAGE.md` — Higgsfield MCP setup, four render prompts, 3-tier sellable package, DM line.

**Not yet done — pick up from here**
- [ ] **Render the four Higgsfield reels** (hero / texture / craft / reveal). Prompts are in `HIGGSFIELD_PACKAGE.md` §3. Output: four 1080p 9:16 MP4s, ~10s each.
- [ ] **Wire the MP4s** into `window.HIGGSFIELD_REELS` in `index.html` (see §2 of the package doc).
- [ ] **Train a Soul Character** on Christina (and ideally each stylist) so future renders stay visually consistent.
- [ ] **Take screenshots** of the polished site (the sandbox couldn't reach `localhost`, so a real screenshot pass is still pending — do this from a real browser after `npm run dev`).
- [ ] **Outreach** — send Christina the DM in `OUTREACH_BRIEF.md` with the deployed preview URL.
- [ ] **Deploy** the preview somewhere private (Vercel/Netlify, password-protect or noindex meta is already on). Currently the `vite.config.js` base path is set to `/lovejones-stylez-preview/` for production builds — adjust if hosting at a different path.
- [ ] **Optional: deeper polish** — a before/after slider for transformations, a CMS-driven hero video swap, Marketing Studio ads for Meta/TikTok.

**Known issues / quirks**
- `node_modules` was originally a Windows install; a fresh sandboxed `npm install` failed because Linux can't overwrite Windows binaries. **Run locally on the user's machine** for dev/build — that's where the original install lives.
- The sandbox `vite build` does not work due to the platform-specific `@rollup/rollup-win32-x64-*` deps. Build on the user's Windows machine.
- Chrome (browser tools) cannot reach the sandbox's `127.0.0.1` — screenshots have to be taken locally.

---

## How to run

```bash
cd lovejones-preview
npm install           # only if node_modules is missing / broken
npm run dev -- --port 5173
# open http://127.0.0.1:5173/
```

To produce a production bundle:
```bash
npm run build         # outputs to /dist
npm run preview
```

---

## File map (the important stuff)

```
lovejones-preview/
├── index.html                 # Main page. New #reel section ~line 433+. Nav link "Reel" added.
├── src/
│   ├── main.js                # Three.js scene + GSAP. NEW reel-card behavior at the bottom (~line 880+).
│   └── styles.css             # Tokens at top. NEW reel section CSS appended after the prefers-reduced-motion block (~line 1600+).
├── vite.config.js             # base: '/lovejones-stylez-preview/' in prod — change if hosting elsewhere.
├── HIGGSFIELD_PACKAGE.md      # THIS IS THE PITCH DOC. Setup, prompts, pricing tiers, DM line.
├── HANDOVER.md                # ← you are here
├── OUTREACH_BRIEF.md          # Original DM / email scripts for Christina.
├── LOVEJONES_CONTENT_AUDIT.md # Scraped content from the live site.
├── README.md                  # Project basics.
└── dist/                      # Stale — needs a rebuild to reflect new reel section.
```

---

## How the Higgsfield reel system works

Each `.reel-card` in `index.html` has a `<video data-reel="KEY">` where KEY is one of `hero | texture | craft | reveal`.

The JS reads from a global `window.HIGGSFIELD_REELS` object:

```html
<!-- Drop this just above the <script type="module" src="/src/main.js"></script> tag in index.html -->
<script>
  window.HIGGSFIELD_REELS = {
    hero:    "https://your-cdn.com/lj-hero.mp4",
    texture: "https://your-cdn.com/lj-texture.mp4",
    craft:   "https://your-cdn.com/lj-craft.mp4",
    reveal:  "https://your-cdn.com/lj-reveal.mp4",
  };
</script>
```

If a key is empty, the card falls back to its poster image. Reels:
- Auto-pause when scrolled out of view (IntersectionObserver, threshold 0.32)
- Only one plays at a time
- Click anywhere on the frame or hit the play button to toggle
- Shutter bars retract on first reveal (`is-revealed` class)

---

## Connecting Higgsfield (recommended path)

**Easiest: MCP via Cowork / Claude.**
1. Cowork → Settings → Connectors → Add custom connector
2. Name `Higgsfield`, URL `https://mcp.higgsfield.ai`
3. Sign in with the Higgsfield account
4. Then prompt: *"Render a 9:16, 10-second clip in Cinema Studio: slow push-in on a Black woman salon owner in warm Raleigh studio light, bone & gold palette, editorial fashion film. End on a small confident smile."*
5. Save the returned MP4 URL into `window.HIGGSFIELD_REELS.hero`.

**Backend route: Cloud API.**
- `https://cloud.higgsfield.ai/` — text-to-video, image-to-video, Soul mode
- Auth: `Authorization: Bearer <token>`
- Duration 5s/10s, resolution up to 1080p, aspect ratios 16:9 / 4:3 / 1:1 / 9:21
- Wire this if you want the CMS / admin panel to swap the hero clip monthly.

Full prompts for all four reels are in `HIGGSFIELD_PACKAGE.md` §3.

---

## Brand & creative direction (lock these so future passes stay consistent)

- **Palette:** ink `#050202`, ivory `#fff8ef`, gold `#f8d47a`, champagne `#efd9a8`, rose `#e66598`, copper `#b86f43`, green `#23836f`.
- **Type:** Fraunces (italic, opsz axis, soft+wonk turned on) for display; Inter 300–800 for UI.
- **Mood:** editorial fashion-film, warm Raleigh window light, anamorphic flare, light film grain, slow camera moves, hands-and-texture macro shots, confident reveals — never glossy/CGI/fantasy.
- **Promise line:** *"Healthy hair care. Natural stylez. No limitations."*
- **Always-true context:** 24+ years in hair, 14 years licensed, owner Christina Jones, Raleigh NC, CROWN Act relevance.

---

## Package being pitched (from `HIGGSFIELD_PACKAGE.md`)

| Tier | Price | What's in it |
|---|---|---|
| **1 — Cinematic Concept Pack** | $1,500 | This site deployed, 4× Higgsfield reels, 1× 15s master, booking polish, 1 revision |
| **2 — Full Brand Refresh** | $3,500 | Tier 1 + 8 more reels, Soul Character training, brand kit, 90-day analytics |
| **3 — Always-on Studio** | $2,500/mo | 8 fresh reels/mo, monthly hero swap, Marketing Studio ads, monthly report |

DM line (in `HIGGSFIELD_PACKAGE.md` §4):
> "I built a private redesign concept for Love Jones Stylez and rendered four short reels with AI cinema tools so you can see what a premium, cinematic salon site could look like in 2026. No pressure — just a creative gift. Link inside."

---

## Open decisions for whoever picks this up

1. **Render the reels yourself, or wait for Christina to say yes first?** Cheaper to render after a yes, but the cold DM is much stronger with the reels already attached.
2. **Hosting:** Vercel preview link (noindex) vs. a custom subdomain like `concept.lovejonesstylez.com` — only do the latter if Christina opts in.
3. **Soul Character vs. casting a model.** Soul gives consistency but Christina's real face is more authentic. Suggestion: Soul-trained on her existing salon photos for the campaign reels, then use real photos for the team grid.
4. **Vagaro vs. Schedulicity as the primary CTA.** Both are wired. Christina actively uses Vagaro — recommend leading with that.

---

## Quick next-action checklist

1. `npm run dev` locally → screenshot the polished site → attach to the DM as preview.
2. Connect Higgsfield MCP in Cowork (one-time, 60 seconds).
3. Render the 4 reels using the prompts in `HIGGSFIELD_PACKAGE.md` §3.
4. Paste the 4 MP4 URLs into `window.HIGGSFIELD_REELS` in `index.html`.
5. `npm run build` and deploy (Vercel/Netlify, noindex still on).
6. Send the DM from `OUTREACH_BRIEF.md` with the deployed link.
