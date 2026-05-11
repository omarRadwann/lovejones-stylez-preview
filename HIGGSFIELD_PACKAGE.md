# Love Jones Stylez × Higgsfield — Rebrand Package

A short playbook for using Higgsfield to power the cinematic reel section of this site, plus a sellable package outline.

---

## 1. How to connect Higgsfield (no API key needed)

Higgsfield ships an MCP server. Once you connect it inside Cowork (or Claude desktop / Claude Code), you can ask in plain English ("generate a 9:16 vertical clip of a stylist running fingers through silk-pressed hair, warm gold rim light, slow push-in") and the model will render through Higgsfield's stack (Cinema Studio, Soul, Seedance, Kling, Veo, etc.) and return MP4 URLs.

Setup (one-time):

1. Open Cowork → Settings → Connectors
2. Add a custom connector
3. Name: `Higgsfield`, URL: `https://mcp.higgsfield.ai`
4. Click Add → Connect → sign in with your Higgsfield account
5. Done. Credits are billed against your Higgsfield plan.

If you'd rather call a raw REST API (e.g. from a backend), the Higgsfield Cloud API at `https://cloud.higgsfield.ai/` supports text-to-video, image-to-video, and Soul mode with an `Authorization: Bearer <token>` header. Durations 5s/10s, resolutions up to 1080p, aspect ratios 16:9 / 4:3 / 1:1 / 9:21. The Cloud API is the route to wire if you want the salon site to render clips on demand from a CMS or admin panel.

---

## 2. How the site is wired for Higgsfield

The `#reel` section in `index.html` has four 9:16 `<video>` cards, each with a `data-reel="hero|texture|craft|reveal"` key. Sources are resolved at runtime — no rebuild required to swap a reel.

**Primary path — `public/reels.json` (recommended)**

Edit one file, redeploy (or just re-upload the JSON if your host serves `/public` unbuilt):

```json
{
  "hero":    "https://your-cdn.com/lj-hero.mp4",
  "texture": "https://your-cdn.com/lj-texture.mp4",
  "craft":   "https://your-cdn.com/lj-craft.mp4",
  "reveal":  "https://your-cdn.com/lj-reveal.mp4"
}
```

The site fetches this with `cache: 'no-store'`, so visitors pick up new reels on next load. Empty strings (`""`) keep that card in the `pending` state.

**Override path — inline `window.HIGGSFIELD_REELS`**

For one-off previews you don't want in the JSON file, drop an inline block before the main script:

```html
<script>
  window.HIGGSFIELD_REELS = {
    hero: "https://your-cdn.com/lj-hero-preview.mp4",
  };
</script>
<script type="module" src="/src/main.js"></script>
```

**Precedence:** `public/reels.json` wins over inline. Inline only fills keys the file leaves empty (or absent entirely if the file 404s). Empty strings on either side are ignored.

**Card state machine** — each card transitions automatically:
- `pending` → no URL set. Poster stays, badge reads `RENDERING · <PRESET>`, champagne dot pulses slowly, no play button.
- `loading` → URL set, video metadata still loading. Play button fades.
- `ready` → playable. Red REC dot, play button responsive.
- `playing` → playing. REC pulses, single-active-at-a-time, auto-pauses on scroll out.
- `error` → URL set but failed to load. Badge reads `PREVIEW SOON · <PRESET>`, copper dot, no play button.

No other code changes are needed when reels are wired in.

---

## 3. Prompt pack — four reels to render in Higgsfield

Render all four at 9:16, 10 seconds, 1080p. Use Soul characters for consistency across clips.

**01 — Hero / Cinema Studio**
> Slow cinematic push-in on a confident Black woman salon owner standing in a warm, naturally-lit Raleigh hair studio. Bone, ivory, copper, and soft gold palette. Editorial fashion-film tone. She gives a small, knowing smile to camera. Shallow depth of field, anamorphic flare, gentle film grain. End on a tight portrait. No text. 10 seconds.

**02 — Texture / Soul**
> Macro 9:16 close-up of healthy natural Black hair: defined curls, glossy locs, silk-press shine, water beads catching gold and rose rim light. Hands lift sections, treatment shine glistens. Slow orbit, shallow focus, editorial beauty look. No model face. 10 seconds.

**03 — Craft / Seedance**
> Stylist hands sectioning hair, applying treatment, gold and rose rim light, deep black background, warm bone highlights. Macro on tools — comb, brush, color bowl. Slow dolly, science-of-hair editorial tone. Add subtle film grain. 10 seconds.

**04 — Mirror reveal / Kling 3.0**
> Slow turn from back-of-head to face: a Black woman in a salon chair turning toward the mirror, her finished style catching warm gold light. Lands on a quiet, confident smile. Editorial beauty film, 9:16, soft contrast, anamorphic. End freeze frame for 0.5s. 10 seconds.

Optional title-card overlay (do in post, not in Higgsfield):
> "Love Jones Stylez · Raleigh, NC · Healthy hair. Natural stylez. No limitations."

---

## 4. Package you can sell to Christina

**Tier 1 — Cinematic Concept Pack ($1,500)**
- This preview site, branded and deployed under `lovejonesstylez.com`
- 4× 9:16 Higgsfield reels for IG/TikTok/site hero
- 1× 15-second master cut for site hero
- Booking flow polish (Vagaro + Schedulicity buttons, mobile-first)
- 1 round of revisions

**Tier 2 — Full Brand Refresh ($3,500)**
- Everything in Tier 1
- 8 additional Higgsfield clips (service-specific: locs, color, silk press, big chop, treatments, lashes, bridal, behind-the-scenes)
- Soul Character trained on Christina + each stylist so future renders stay consistent
- Brand kit: typography, color, social templates
- 90-day analytics + iterate

**Tier 3 — Always-on Studio ($2,500/mo retainer)**
- 8 fresh reels per month, themed around upcoming services + seasons
- Site updated with new hero clip monthly
- Higgsfield Marketing Studio ad generation for Meta / TikTok ads
- Monthly performance report (engagement, bookings driven from site)

**Sell-it line for the DM:**
> "I built a private redesign concept for Love Jones Stylez and rendered four short reels with AI cinema tools so you can see what a premium, cinematic salon site could look like in 2026. No pressure — just a creative gift. Link inside."

---

## 5. Run the upgraded preview locally

```bash
cd lovejones-preview
npm install
npm run dev -- --port 5173
```
Open `http://127.0.0.1:5173/`.

When you drop your Higgsfield MP4 URLs into `window.HIGGSFIELD_REELS` (either inline in `index.html` or in a `.env`-driven build step), the reel cards will start playing them automatically.

---

## 6. References

- Higgsfield MCP (Cowork / Claude integration): https://higgsfield.ai/mcp
- Higgsfield Cloud API: https://cloud.higgsfield.ai/
- Higgsfield model catalog (Cinema Studio, Soul, Seedance, Kling, Veo): https://higgsfield.ai/
- Cinema-style camera moves & presets: https://higgsfield.ai/cinematic-video-generator
- Marketing Studio (ad generation): https://higgsfield.ai/marketing-studio-intro
