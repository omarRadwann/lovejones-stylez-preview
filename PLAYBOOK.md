# Cinematic Rebrand Playbook
*How we turned Love Jones Stylez into a private redesign concept, and how to do it again — anywhere.*

---

## 0 · TL;DR

You build a real-feeling cinematic redesign for a small business that already has trust and a story. You ship it as a live private URL with their actual content woven in. You DM it to the owner as a creative gift, not a pitch. If they say yes, you turn it into a paid 3-tier engagement.

- **Time investment per project:** 25–35 hours, spread over 5–7 days
- **Cash cost per project:** ~$30 (Higgsfield credits + optional domain). Hosting is free.
- **What you charge if they convert:** $1.5K (Concept Pack), $3.5K (Full Refresh), or $2.5K/mo (Always-on Studio). Adjusted EGP tiers in §7.
- **Conversion math:** even a 1-in-10 cold-conversion rate is profitable. The site itself is reusable scaffolding.

---

## 1 · Find the right business

The whole model works *because* the business is already credible. You're not selling them a brand — you're making the brand they already have *visible online in three seconds*.

### Profile of an ideal target

| Signal | What it tells you |
|--------|-------------------|
| 5+ years in business | The story is real, the cash flow is real |
| Owner has a personal narrative | Gives you a hero figure for the cinema reel |
| Strong Google/Vagaro/Instagram reviews (4.7+) | Trust signals you can hard-quote |
| Existing visual content (even if amateur) | Photo references for Higgsfield |
| Outdated or template website (Wix / Squarespace / no site) | The gap is obvious to them |
| Active social presence | They check DMs |
| Premium price point or premium aspiration | They can afford the engagement if they convert |
| Local market with regional identity | The "we know your neighborhood" angle |

### Pass on these

- Businesses with strong existing brand consistency (you can't add value)
- Owners with no social presence (they won't see the DM)
- Pure commodity plays (gas stations, generic convenience) — no story to amplify
- Businesses currently in legal/PR trouble — don't touch
- Multi-location chains — corporate marketing exists, decision lag is brutal

### Where to find them

- **US:** Google Maps in a target neighborhood + filter 4.5+ stars + sort by review count. Open Instagram profiles of the top 20.
- **Egypt:** Instagram hashtag mining is more effective than Google. Search by neighborhood (`#zamalek`, `#newcairo`, `#sheikhzayed`) + business type. Then look at their bio for WhatsApp / booking links.
- **Both:** local press features ("Best of Raleigh", "Cairo's top patisseries") give you pre-vetted lists.

### The first 30 minutes on a candidate

1. Pull their website. Scroll. Time how long it takes for the first emotional moment.
2. Open their top 5 Instagram posts. Read the captions.
3. Pull 3 reviews — quote them in a notes doc.
4. Find: owner name, business address, primary booking channel, brand promise line (or invent one from their copy).

If after 30 minutes you can't write a one-sentence brand promise for them — pass. The whole project depends on you having a clear north star.

---

## 2 · Audit & document (Day 1)

Create three docs in a new project folder. These become the spec for everything that follows.

### `CONTENT_AUDIT.md`
- Owner name, business address, phone, hours
- All booking channels (Vagaro, Schedulicity, WhatsApp, Instagram DM, phone)
- Existing photos — paste URLs, note rights status
- Existing brand colors (eyedrop them from the current site)
- Existing fonts
- Brand promise (theirs or your version)
- Service/menu list with prices
- Team members + their specialties
- Notable policies (deposits, cancellations, etc.)
- Real client reviews (5-10, with names + dates if public)

### `OUTREACH_BRIEF.md`
- Channel ranking (IG, FB, email, WhatsApp)
- Owner's preferred name + Instagram handle
- DM script (draft now, refine after build)
- Email script
- 2-message follow-up plan

### `CREATIVE_BRIEF.md`
- Palette (5–7 colors, with hex)
- Typography (1 display serif, 1 UI sans, both web-loadable)
- Mood (3–5 reference films, photographers, brands)
- The brand promise line (rewrite until it fits in one breath)
- Three "moments" the visitor must feel in the first 30 seconds
- Three things the site must NEVER do (e.g. "never look generic", "never bury the price", "never feel like a template")

These three docs replace strategy debates. When in doubt during the build, you re-read them.

---

## 3 · Define the creative direction (Day 2)

For Love Jones Stylez:
- **Palette:** ink `#050202`, ivory `#fff8ef`, gold `#f8d47a`, champagne `#efd9a8`, rose `#e66598`, copper `#b86f43`, green `#23836f`
- **Typography:** Fraunces (display italic serif) + Inter (UI sans)
- **Mood:** editorial fashion film, warm Raleigh window light, anamorphic flare, light film grain, slow camera moves, hands-and-texture macro
- **Promise:** *"Healthy hair care. Natural stylez. No limitations."*

Lock the palette before you write any CSS. Lock typography before any HTML. Lock the promise line before any copy.

### Egypt color/type adjustments

- Palettes that work in Egypt: warm earth tones, deep gold, ivory, rose-mauve, copper, deep teal. Avoid pure black for premium feels (deep aubergine or warm charcoal reads richer). For Cairo specifically, gold + cream + a single accent (emerald, fuchsia, or burnt orange) is the modern luxury vocabulary.
- Arabic typography: **IBM Plex Sans Arabic**, **Cairo**, **Tajawal**, **Almarai** are the four solid web-loadable Arabic faces. Cairo is the safest default. For a display italic equivalent to Fraunces, **Markazi Text** or **Reem Kufi** can carry the editorial feel.
- Mirror pairs: if Fraunces (English serif) + Cairo (Arabic sans) feels too disparate, pair Inter (English sans) + Tajawal (Arabic sans) for tighter visual harmony.

---

## 4 · The technical build (Days 3–7)

### Stack we used

- **Vite** for bundling (Vite + vanilla JS, no React for this kind of site — keeps the bundle lean)
- **Three.js** for the WebGL hero scene (ribbons, hair-strand curves, silk veil, portal frame, particle sparks)
- **GSAP + ScrollTrigger** for scroll choreography
- **Lenis** for smooth scrolling
- **Google Fonts** for typography (Fraunces + Inter; swap for Arabic faces in Egypt)
- **GitHub Pages** for hosting (auto-deploy on push)

No backend. No database. Everything is static + a small runtime config (`public/reels.json`) for swapping video URLs without a rebuild.

### Repo layout

```
project-preview/
├── index.html              ← all sections live here
├── src/
│   ├── main.js             ← Three.js scene, GSAP triggers, reel state machine, moonshot pack
│   └── styles.css          ← design tokens at top, section CSS below
├── public/
│   └── reels.json          ← runtime video URLs; edit + redeploy without rebuild
├── vite.config.js          ← set `base` to your GH Pages subpath
├── .github/workflows/deploy.yml  ← auto-deploy on push to main
└── PLAYBOOK.md             ← this file
```

### The 14 moonshot features we shipped

These are the building blocks. Cherry-pick what fits the next brand; the technical scaffolding stays.

1. **Hero Soul scaffold** — `<video class="hero-soul">` fades in above the WebGL scene at 0.78 opacity. Wired from `reels.json`. Mix-blend on desktop, plain alpha on mobile.
2. **Cinema booking interview** — 3-step modal that intercepts every `[data-booking-interview]` link. Funnels intent into a deep-linked booking URL.
3. **Reel cinema-strip auto-play** — 4 cards stagger-play at 400ms intervals when the section enters viewport. Once-only per card.
4. **CROWN-Act-style manifesto section** — full-bleed dark, italic Fraunces, a brand-pillar background letterform. Re-use for any cause-driven section.
5. **Drifting review quotes** — fixed-position layer behind main content with `z-index: 1` and `main { z-index: 2 }`. Cards animate infinitely on staggered lanes.
6. **Save-this-look share card generator** — HTML Canvas renders 1080×1350 IG-native PNG with the reel poster, headline, and brand strip. Downloads on click.
7. **Hair-strand particle presence** — 14 Three.js tube curves in the brand palette, additive blending, GPU-cheap.
8. **3D portrait carousel** — Z-axis rotation with opacity-only depth. Touch swipe + dot nav + autoplay that pauses offscreen.
9. **Price count-up** — regex-wraps every `$NN` (or any currency token) in menu items, animates from 0 on enter-viewport, restores the original string at end.
10. **Hand-drawn signature in loader** — SVG path with stroke-dasharray draw-on animation.
11. **Time-of-day theme** — `.is-tod-morning/afternoon/evening` class on `<html>` shifts the gold tone (honey → amber → copper).
12. **Mobile haptic on reel reveal** — `navigator.vibrate(6)` on first IntersectionObserver entry.
13. **Cinema iris page transitions** — `[data-iris]` overlay closes/opens around in-page anchor clicks. Lenis scrolls underneath.
14. **Cinematic counter on the hero stat** — `data-count` + blinking serif cursor span.

Plus the "Majestic" ambient framing pack:
- **Film-edge perforations** at top and bottom of viewport
- **"Reel · 01 · YEAR" cinema roll badge** in the bottom-left corner
- **Hero marquee** — slim gold-bordered ticker centered above the hero with the brand line

### Performance gates (do not ship without)

| Gate | How to verify |
|------|---------------|
| 60fps WebGL | `requestAnimationFrame(animate)` not `setTimeout`. Skip render when canvas is offscreen via IntersectionObserver. |
| Pixel ratio honest | `min(devicePixelRatio, 1.25)` desktop / `min(devicePixelRatio, 1.0)` mobile |
| No `mix-blend-mode` on continuously animating layers | The grain layer is the classic offender |
| No `backdrop-filter` on moving elements | We removed it from drifting review quotes |
| No `filter: blur()` in reveal animations | Use composited transforms + opacity instead |
| `content-visibility: auto` on below-fold sections | Browser skips paint/layout until near viewport |
| Pointer events rAF-batched | Cursor + card hover + magnetic buttons |
| `gsap.quickTo` for repeated tweens | Never `gsap.to` inside a pointermove |
| `overflow-x: clip` on `html, body` | Verify `scrollWidth === clientWidth` |
| Tab hidden → loop pauses | Page Visibility API |

### Mobile gates

| Gate | How to verify |
|------|---------------|
| iOS safe-area handled | `viewport-fit=cover` + `env(safe-area-inset-*)` on header + modals |
| Tap targets ≥ 44×44 | Hit-test every button on a phone |
| Touch swipe on carousels | `touchstart`/`touchend` with vertical-scroll guard |
| Mute-by-default video autoplay | Browser autoplay policy |
| First tap on muted video → unmute, not pause | The sound-on-tap gesture we built |
| Floating overlays hidden on tablets | Drifting reviews under 1080px |
| `apple-mobile-web-app-status-bar-style` | If she "Add to Home Screen", chrome matches the page |

---

## 5 · The Higgsfield workflow (Day 4–5)

We rendered 5 videos for $30. Here's the recipe.

### Connect once (60 seconds)
Cowork → Settings → Connectors → **Higgsfield** → URL `https://mcp.higgsfield.ai`. Sign in with Pro account.

### Model selection cheat sheet

| Need | Model | Notes |
|------|-------|-------|
| Owner reveal, ultra-cinematic, no audio needed | `cinematic_studio_3_0` | Slowest. 50c per 10s. Best for the hero "owner" shot. |
| Macro texture, no model face, intimate | `cinematic_studio_video_v2` with `genre: 'intimate'` | 30–40c. Great for product/texture beauty shots. |
| Reference-anchored, identity-consistent | `seedance_2_0` | 45c. Best when you have a real photo of the subject. |
| Multi-shot, motion-transfer, faster | `kling3_0` | 20c std / much more in pro. Solid for reveals + camera turns. |
| **Voice-over + ultra-realistic** | **`veo3_1` quality:ultra** OR `kling3_0` mode:pro sound:on | The voice-over winners. Veo can be slow; Kling Pro is faster. |
| Budget batch | `veo3_1_lite` | Cheapest for filler shots. |

### Prompt anatomy

Higgsfield's prompt enhancer expands a short brief into a 7-block cinematographer's spec (SHOT / SUBJECT / SCENE / VISUAL DETAILS / ACTION / CINEMATOGRAPHY / AUDIO / STYLE). Your job is to give it the right seeds. The structure that worked for us:

```
[Aesthetic header: "Ultra-realistic editorial fashion-film:"]
[Subject: who, in what posture, where]
[Lighting: light source, time of day, palette]
[Action: 2-3 beats max]
[Voice-over (if any), in quotes, verbatim]
[Closing shot intent: "End on…"]
[Negative space: "No on-screen text. No subtitles."]
[Duration: "8 seconds." or "10 seconds."]
```

Five rules:

1. **Always include a reference image when you have one.** Use the owner's actual photo (Wix/Instagram URL works directly as `start_image`). Identity consistency goes up dramatically.
2. **Voice-over goes in quotes inside the prompt.** Veo 3.1 + Kling 3.0 can synthesize matching audio with mouth movement.
3. **State the negative.** "No on-screen text. No subtitles. No music." prevents Higgsfield from baking text overlays into the video.
4. **Lock duration.** Pick from the model's allowed list (`models_explore` returns these). Veo 3.1 only does 4/6/8 seconds.
5. **Use `get_cost: true` to preflight** before firing 5 jobs at once.

### Cost management

- Pro plan has a **3 concurrent jobs** cap. Fire 3, wait, fire the next batch.
- Ultra quality on Veo 3.1 can stall in queue for 20+ minutes during peak. Fire a `high` quality backup in parallel — whichever lands first goes live.
- Failed renders refund credits, but only after a timeout (~hours).
- Keep ~30% credit headroom for retries.

### What we spent on Love Jones Stylez

| Reel | Model | Cost | Wall time |
|------|-------|------|-----------|
| Hero (owner reveal) | cinematic_studio_3_0 | 50c | 18 min |
| Texture | cinematic_studio_video_v2 (intimate) | ~30c | 1 min |
| Craft | seedance_2_0 | 45c | 5 min |
| Reveal | kling3_0 std | 20c | 2 min |
| heroSoul (hero background) | cinematic_studio_3_0 | 50c | 17 min |
| **Premium hero w/ voice-over** | kling3_0 pro sound:on | ~50c | 7 min |
| Total | | ~245c (~$25) | |

---

## 6 · The outreach playbook

Everything in `OUTREACH_BRIEF.md` plus the field notes from the Love Jones send.

### The DM (short, warm, gift framing)

> Hi {NAME} — my name's {YOU}.
>
> I came across {BUSINESS} and got pulled in by {ONE SPECIFIC OBSERVATION ABOUT THEIR WORK, NOT GENERIC}. Your story is unusually strong.
>
> I built you something as a creative gift — a private mock of what a cinematic version of {BUSINESS} could feel like. It keeps your services, your menu, your booking, and the team. It just makes the *first three seconds* match the quality you give {IN THE CHAIR / IN THE KITCHEN / IN PERSON}.
>
> 🔗 {LIVE URL}
>
> Open it on your phone, scroll to the campaign reel — that part has sound. No pressure to do anything with it. Just thought it deserved to exist.

Then immediately send: (a) a 40–60s portrait screen-recording, (b) two stills.

### Timing

- **US:** Tuesday or Wednesday 10am–12pm local
- **Egypt:** Sunday or Monday 11am–1pm Cairo time (Egyptian work week starts Sunday)
- Never Sundays in US, never Fridays in Egypt

### Follow-up

One soft bump after 5 business days. Then stop. Two-message maximum on cold outreach.

### Three-tier menu (when they reply "what now?")

| Tier | US Price | EGP Price | What you ship |
|------|----------|-----------|---------------|
| 1 — Concept Pack | $1,500 | 50,000–80,000 EGP | Deploy site, 4 reels, 1× 15s master, booking polish, 1 revision |
| 2 — Full Refresh | $3,500 | 100,000–150,000 EGP | Tier 1 + 8 more reels + character training + brand kit + 90-day analytics |
| 3 — Always-on Studio | $2,500/mo | 30,000–50,000 EGP/mo | 8 reels/mo + monthly hero swap + ad creative + monthly report |

---

## 7 · Egypt adaptations

Everything above works in Egypt with these specific swaps.

### Language: AR + EN, RTL

- Build a `lang` toggle in the header (state in localStorage)
- Use `dir="rtl"` on `<html>` when Arabic is active
- All CSS uses logical properties (`margin-inline-start` not `margin-left`) where directional
- Translate copy by a native Egyptian Arabic speaker — never auto-translate the brand promise
- Arabic typography pack: **Cairo** + **IBM Plex Sans Arabic** + **Tajawal** (load all three weights of one of these from Google Fonts)
- Mirror the entire layout direction; check the team carousel, the marquee scroll direction, the reel-strip stagger order

### Booking channels (replace Vagaro/Schedulicity)

| Channel | What to wire |
|---------|--------------|
| WhatsApp Business | `https://wa.me/+201XXXXXXXXX?text={ENCODED_INTRO}` — opens WhatsApp with a pre-filled intro message |
| Instagram DM | `https://ig.me/m/{handle}` |
| Phone | `tel:+201XXXXXXXXX` |
| Google Maps | for hours + directions |
| Optional booking platforms (less common): Boomy, Fresha, Setmore |

The 3-step booking interview from Love Jones Stylez should funnel into WhatsApp with a pre-filled message like:

> *"Salam {OWNER}, I'd like to book {SERVICE} {TIMING}. Found you through your site."*

This is the WhatsApp-native equivalent of the Vagaro deep-link with `?q=Silk%20Press`.

### Cultural sensitivity

- **Modesty norms vary by audience.** For a salon in Maadi vs Sheikh Zayed vs a regional city, the same hair-uncovered shot may or may not land. Ask the owner what's right for *their* clientele. Don't generalize.
- **Religious references.** Don't accidentally schedule launch during Ramadan first week or Eid week. Posts/launches Sunday-Wednesday outside of holy week.
- **Halal/non-halal verticals.** Restaurants and bars differ. Restaurants: lead with food + texture + family. Bars/nightlife: be discreet, lean on aesthetic over explicit drinking shots.
- **Family-business framing.** Many Egyptian SMBs are family-run. The owner story often includes "my mother taught me," "my father started this." Surface that.

### Payment expectations

- Most Egyptian SMBs invoice in EGP via bank transfer + Instapay
- Ask for **50% upfront, 50% on delivery** — this is normal in Egypt
- Have a clear invoice template (Arabic + English) ready before the call
- Be VAT-aware: 14% VAT applies on services over a threshold

### Best target verticals in Egypt

Ranked by fit + ability to pay:

1. **Premium salons & spas** (Cairo, Alexandria, Gouna, Sahel)
2. **Boutique fashion brands** (Cairo's startup fashion scene — Up-Fuse, Kojak, Karim Adduchi-style)
3. **Boutique restaurants & cafés** with strong identity (Sequoia, Zooba, Cilantro is too big; you want the 1-3 location places)
4. **Patisseries** (compete with Mandarine Koueider / Tseppas)
5. **Wedding planners + photographers**
6. **Real estate developers / agents** in compounds (Mountain View, Palm Hills, SODIC)
7. **Private clinics** (cosmetic, dermatology, dental)
8. **Wellness/yoga/pilates studios**
9. **Boutique hotels / Nile yachts / desert lodges**
10. **Music labels & artist managers** (independent scene growing fast)

### Outreach channel ranking (Egypt-specific)

1. **WhatsApp Business** — if the business publishes a WhatsApp number, this is the single highest-converting channel
2. **Instagram DM** — universal fallback
3. **Phone call** — actually acceptable in Egypt for B2B outreach, unlike the US
4. **Email** — last resort

WhatsApp intro template (Arabic):

> *"السلام عليكم {NAME}، أنا {YOU}. شفت {BUSINESS} ونزلت متابع، وعملت تجربة كاملة لتصميم موقع سينمائي لشغلكم كهدية إبداعية — مش بيع، مش اشتراك. الرابط جاه هنا للمعاينة. لو حبيتي تتفرجي عليه من الموبايل: {LINK} — ابعتيلي رأيك لو خد دقيقة منك."*

(English version usable for younger / English-comfortable owners — same structure as the US DM in §6.)

### Performance considerations for Egyptian users

- Egyptian mobile networks are improving but bandwidth is variable — keep total page weight under 4 MB (we shipped 700 KB JS + ~3.5 MB video CDN-served lazily)
- Cloudfront serves the Higgsfield videos with reasonable latency from Frankfurt — fine for Egypt
- If you want faster delivery, mirror the MP4s to a Bunny.net CDN with a Cairo edge — adds ~$1/mo

---

## 8 · Gotchas we learned the hard way

| Gotcha | What happened | Fix |
|--------|--------------|-----|
| WebGL render at 18fps | The original code had `setTimeout(rAF, 1000/18)` — the page felt sluggish | Pure `requestAnimationFrame`, skip when offscreen |
| Pixel ratio 0.45 = blurry WebGL | Original code tried to be "performant" by underscaling | Bump to 1.25 desktop / 1.0 mobile and pause when offscreen instead |
| `mix-blend-mode: overlay` on full-viewport grain | Caused continuous recomposite during Lenis scroll | Drop blend mode, use opacity only |
| `backdrop-filter` on moving review cards | 4 moving elements × per-frame GPU blur | Flat rgba background |
| `filter: blur()` in card reveal animations | Full-section repaint per frame | Composited transforms only |
| Tab throttling kills metadata loading | Videos stuck in `NETWORK_LOADING` forever | Add a 12s timeout fallback that flips to error state |
| Veo 3.1 Ultra render stalls 20+ min in queue | We waited 25 min, eventually fired a Kling 3.0 Pro fallback | Always fire a faster backup in parallel |
| Horizontal scroll from 3D carousel slots | Slots translated beyond viewport on mobile | Wrap stage in `overflow: hidden` + `overflow-x: clip` on body |
| Drifting review quotes overlap heading | Position fixed + z-index 1 painted over content | `main { z-index: 2 }` keeps content on top |
| Tech-name leak in user-facing copy | "AI cinema reel", "Higgsfield", model names everywhere | Strip ALL tooling references from visible copy and HTML comments |
| Pitch-deck-voice copy | Headlines like "Christina's story should be the first thing clients feel" sound like a designer pitching | Rewrite every headline as the brand speaking, not the designer |
| Floating reviews invisible on mobile | They worked at desktop sizes but cramped tablets/phones | Hide via `@media (max-width: 1080px)` |
| Reel cards visible "REC · MODEL" badges | Felt like a debug watermark when real content played | Hide `.reel-meta { display: none }` after real reels are wired |
| Voice-over video auto-played muted | Browser autoplay policy + no clear way to unmute | First tap unmutes, second tap pauses — bespoke gesture in togglePlay |

---

## 9 · The repo as a template

The Love Jones repo IS the starter kit. To use it for the next client:

```bash
# 1. Clone + rename
gh repo create {new-client-preview} --private --template omarRadwann/lovejones-stylez-preview
cd {new-client-preview}

# 2. Update vite.config.js base
# base: '/{new-client-preview}/'

# 3. Update .github/workflows/deploy.yml — no change needed; GH Pages picks up the new repo

# 4. Strip Love-Jones-specific content:
#    - Replace index.html copy (all text)
#    - Replace public/reels.json with new client URLs
#    - Update styles.css design tokens at the top
#    - Replace Wix image URLs in markup with new client's images

# 5. Update reels.json with new render URLs from Higgsfield

# 6. Push, GH Pages auto-deploys
```

### Files to swap entirely

- `index.html` (all copy + image URLs)
- `public/reels.json` (5 video URLs)
- `OUTREACH_BRIEF.md` (DM/email scripts)
- Color tokens at top of `styles.css`
- Google Fonts import in `index.html` head

### Files to keep as-is

- `src/main.js` — the 14 moonshot mechanics are reusable
- `src/styles.css` — section/component CSS below the design tokens
- `.github/workflows/deploy.yml`
- `vite.config.js` (just update base path)
- `package.json`
- This `PLAYBOOK.md`

### Files to delete from each new fork

- `HANDOVER.md` (Love-Jones-specific)
- `HIGGSFIELD_PACKAGE.md` (Love-Jones-specific)
- `LOVEJONES_CONTENT_AUDIT.md`
- `SMOKE_TEST.md` (regenerate per project)

---

## 10 · The 30-day timeline

Assuming one project at a time, working evenings + weekends.

| Day | Phase | Deliverable |
|-----|-------|-------------|
| 1 | Discover | Shortlist of 5 candidates from Google/Instagram |
| 2 | Audit chosen target | 3 docs: `CONTENT_AUDIT.md`, `OUTREACH_BRIEF.md`, `CREATIVE_BRIEF.md` |
| 3 | Creative direction | Palette + typography + promise line locked |
| 4 | Repo bootstrap | Fork template, swap design tokens, build hero section |
| 5–7 | Build all sections | Hero → story → craft → services → menu → team → policy → reel → storyboard → visit → contact |
| 8 | Performance pass | All gates in §4 checked |
| 9 | Mobile pass | All gates in §4 checked |
| 10–11 | Higgsfield content | Train any Soul characters; render 4-5 reels |
| 12 | Wire videos into `public/reels.json` | Live deploy verified |
| 13 | Copy revisit | Strip pitch-deck voice; strip tech names |
| 14 | Final QA | Open on iPhone Safari, Android Chrome, desktop Chrome, desktop Safari |
| 15 | Domain + favicon (optional) | Buy a $9 domain that signals legitimacy |
| 16 | Screen recording | 40–60s portrait recording for DM attachment |
| 17 | Outreach prep | DM scripted, scheduled to send Tuesday morning |
| 18 | Send | One IG DM + one follow-on with media |
| 19–22 | Silence | Don't double-message |
| 23 | Soft bump | One follow-up message |
| 24–30 | Either she replies or you're prepping next candidate | Move on if no reply |

### If she replies positively

- Day 1: schedule a 30-min discovery call
- Day 2: send a one-page quote (pick the tier together)
- Day 3: contract + 50% upfront invoice
- Days 4–18: production (it's mostly already built — you're polishing + rendering production reels)
- Day 19: launch

---

## 11 · The repo as a portfolio

After 3 cinematic rebrand concepts, you have a portfolio that closes warm introductions in seconds. Set up a private gallery page (single HTML, the same Vite template) at e.g. `{your-domain}/work` that shows:

- Hero thumbnail of each client preview
- One-line "made for {BUSINESS}, {CITY}" caption
- Click-through to each live preview

Now every cold DM can include: *"this is the third one I've made — others linked here {gallery URL}."* Conversion goes up 3-5x once you have social proof of having done it before.

---

## 12 · One-line summary

You're not selling design. You're selling visibility for stories that are already strong — and you're proving you mean it by showing up with the work already done.
