# Reel-section smoke test

Run this checklist top to bottom after any change to the reel wiring (`public/reels.json`, `src/main.js` reel block, `.reel-card` CSS, or the `<span class="reel-state">` markup).

**Setup:** `cd lovejones-preview && npm install` (only needed once).

---

## Dev mode (`npm run dev`)

Start the dev server:

```bash
npm run dev -- --port 5173
```

Open `http://127.0.0.1:5173/#reel`.

### Pending state (default)

- [ ] **1. All four cards show `pending` state.** With `public/reels.json` containing only empty strings (the shipped default), every card shows poster + `RENDERING · <PRESET>` badge + champagne dot pulsing slowly + no play button.

### Ready state (single reel)

Edit `public/reels.json` and set `hero` to a real MP4 URL (any short 9:16 clip works for verification — Higgsfield, Mux, Cloudflare Stream, etc.):

```json
{ "hero": "https://your-cdn.com/sample.mp4", "texture": "", "craft": "", "reveal": "" }
```

Hard-reload (`Ctrl+Shift+R`).

- [ ] **2. The hero card transitions through `loading → ready`.** Play button fades during loading, then becomes fully opaque + interactive. Badge reads `REC · CINEMA STUDIO`, red dot pulses.
- [ ] **3. Click the play button.** Video plays. Click again. Video pauses. Badge text stays `REC`.
- [ ] **4. The other three cards remain in `pending` state.**

### Single-active-at-a-time

Set two URLs:

```json
{ "hero": "<url1>", "texture": "<url2>", "craft": "", "reveal": "" }
```

- [ ] **5. Click play on hero, then click play on texture.** Hero auto-pauses when texture starts playing.

### Pause on scroll-out

- [ ] **6. With hero playing, scroll until the reel section leaves the viewport.** Video pauses (verify by scrolling back — it doesn't auto-resume, but it's paused not playing).

### Error state

Edit `public/reels.json` and set hero to a deliberately broken URL:

```json
{ "hero": "https://example.invalid/x.mp4", "texture": "", "craft": "", "reveal": "" }
```

Hard-reload.

- [ ] **7. The hero card lands in `error` state.** Badge reads `PREVIEW SOON · CINEMA STUDIO`. Copper dot, no animation. No play button. Poster image still shows.

### Precedence — file wins over inline

Set `public/reels.json` to:

```json
{ "hero": "<URL-A>", "texture": "", "craft": "", "reveal": "" }
```

Then add an inline override to `index.html` just before the `<script type="module">` tag:

```html
<script>
  window.HIGGSFIELD_REELS = { hero: "<URL-B>" };
</script>
```

- [ ] **8. The hero card plays URL-A (file wins).**

### Inline fills empty file slots

Keep the inline override in place. Change `reels.json` so `hero` is empty:

```json
{ "hero": "", "texture": "", "craft": "", "reveal": "" }
```

- [ ] **9. The hero card plays URL-B (inline fills the empty slot).**

### Missing config file (404)

Temporarily rename `public/reels.json` to `public/reels.json.bak`. Remove the inline override too.

- [ ] **10. All four cards stay in `pending` state. No console errors.** Restore the file before continuing.

### Responsive

- [ ] **11. At ≤1080px viewport, grid collapses to 2 columns.** At ≤640px, single column. Badges still legible, 9:16 aspect ratio preserved.

### Reduced motion

OS-level: enable "Reduce motion" (System Settings → Accessibility → Display).

- [ ] **12. RENDERING pulse + REC blink are static. Shutter reveal is instant.** Refresh to confirm.

### A11y

- [ ] **13. Tab through the reel section.** Pending and error cards' play buttons are skipped (they have `hidden` attribute). Loading-state play buttons get focus but `aria-disabled="true"`. Only `ready`-state play buttons are fully tabbable.

---

## Production base-path verification

`npm run dev` does **not** apply the production `base: '/lovejones-stylez-preview/'`. To test the deploy path:

```bash
npm run build
npm run preview
```

The preview URL will be something like `http://localhost:4173/lovejones-stylez-preview/`.

- [ ] **14. `/lovejones-stylez-preview/reels.json` returns 200.** Open the URL directly in a tab — should see the JSON contents.
- [ ] **15. Reel cards behave identically to dev mode.** Same pending/loading/ready/error transitions.
- [ ] **16. Network tab shows the fetch to `/lovejones-stylez-preview/reels.json` (not `/reels.json`).** This proves `import.meta.env.BASE_URL` is honored.
- [ ] **17. Response header for `reels.json` is not cached.** (`cache-control: no-store` on the request — server may or may not honor this in preview mode, but the request itself must use `no-store`.)

---

## Browser coverage

- [ ] **18. Chrome desktop:** all of the above pass.
- [ ] **19. Safari desktop:** play button works (Safari is stricter about `autoplay`; we set `muted` + `playsinline` so click-to-play is reliable).
- [ ] **20. Mobile Safari (iOS):** `playsinline` keeps video inline (not fullscreen takeover). Tap to play works.

---

## Restore before commit

- [ ] Restore `public/reels.json` to its shipped empty-strings state.
- [ ] Remove any inline `window.HIGGSFIELD_REELS` override you added for testing.
