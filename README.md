# مقهى الساحرات · Maqhaa al-Saahirat

**The Witches' Cafe.** A reader for the Solaris-3 corpus, kept by the Banat
al-Rih — Herta, Viviane, Black Swan, Elaina, Phrolova and Mina, with Agrat bat
Mahlat turning up on Wednesdays, as is proper.

71 fables. 586,000 words. Forty-one and a half hours of reading, if you took it
all at once, which nobody is suggesting.

---

## Running it

```sh
python3 -m http.server 8792 --directory "Maqhaa Alsaahirat"
# then open http://localhost:8792
```

Or, from Claude Code, `preview_start` the **maqhaa** config in
`.claude/launch.json`.

It needs a real HTTP server. Opened as a `file://` page the browser refuses to
fetch the story files and Herta will tell you so, in her own words.

### Installing it to a phone

Open the served page in a mobile browser and use **Add to Home Screen**. It
installs as a standalone app: no address bar, and the whole library — every
fable, every portrait, both ambience tracks — is cached for offline reading
after your first visit. The service worker walks the shelf in the background
about six seconds after load, so give it a moment on wifi before the train.

---

## Adding or editing stories

Stories live in the parent folder. The app reads a **copy** in `fables/`, so
after any edit:

```sh
python3 "Maqhaa Alsaahirat/build.py"
```

That rescans the corpus, recopies everything, and rewrites `fables.js` with
titles, subtitles, word counts and reading times.

The copy is deliberate. A service worker can only cache URLs inside its own
scope, so a reader that fetched `../Some Story.md` would work online and go
blank the moment you lost signal.

`build.py` picks up every `.md` in the corpus root and in `Huanglong Fables/`,
skips the folders that are software rather than stories, and pulls in
`Uncalled.txt` by name because it is prose that happens to have the wrong
extension. Both drafts of a twice-written piece are kept and the menu labels
which file each row came from.

---

## The room

**Three rooms.** `◐` in the top bar. The Maqhaa has been three places:

| | |
|---|---|
| **NOBODY** | the violet hour, off `cafe.gif` — rain on the glass, umbrellas going past |
| **WARM** | espresso and brass, off `cafewarm.gif` — the chalkboard, the long counter |
| **BRIGHT** | eleven in the morning, off `cafebright.mp4` — a light UI, not a dark one with the lamps turned up |

Every colour in `style.css` is a token re-declared per theme, so a fourth room
is one block of CSS and nothing else. BRIGHT runs video; turn on CALM SCREEN
and it holds a still frame instead. Offline it holds the still frame too —
range requests can't be served from a cache, so the poster is precached for
exactly that.

**The Menu.** The table of contents, written up as a cafe menu. Stories are
grouped by how long you're staying — *demitasse*, *a cup*, *the long pour*, *the
whole pot* — with strength pips, reading times, and a mark showing whether
you've finished (`◕`), started (`◔`) or not touched it (`○`). Sort by cup, A–Z,
freshest, longest, or unpoured. `/` focuses the search box.

**The counter.** One of the six greets you each time you open the app, chosen
mostly by the hour — Mina opens up, Herta has the reading hours, Elaina takes
the post, Viviane lights the harbour lamp, Phrolova keeps the hour after dusk,
Black Swan does not sleep so much as pause — and sometimes just by whoever's
nearest. On Wednesdays Agrat lets herself in. Every line is hand-written in
that character's own register and drawn from `data.js`; click the speech box
for another. The room's accent colour follows whoever is on.

**Pull up a chair.** Any three of the twenty-seven portraits can be seated
beside the barista. They keep their seats between visits.

**Reading.** Pixel type for the room, a proper book face for the page. Serif or
sans, with size, leading and measure all adjustable in the house rules. Your
scroll position is saved continuously; come back and you're offered your place.

**Visual novel mode.** `▤` in the reading bar, or `t`. The room clears, the cast
stands in the cafe, and the prose comes a beat at a time in a box at the bottom
— click, space, or `→` to advance, `←` to go back, `esc` to leave. Long
paragraphs are cut at sentence boundaries, never mid-clause. Chapter headings
ride along as a badge.

The barista does not appear here: whoever is pouring is at the counter, not in
the story you're reading. VN mode shows exactly the cast you seated, and an
empty stage if you seated nobody.

**The jukebox.** No music — you play your own. What the house keeps is weather:
independent faders for room noise and rain, plus five presets. Nothing is
downloaded until you turn a fader up.

**Sound.** The clicks, blips and china are synthesised with the Web Audio API at
runtime. There are no sound files to ship.

Everything you do lives in this browser's `localStorage` under `maqhaa.v1`.
No account, no server, no one keeping a file on you.

---

## Files

| | |
|---|---|
| `index.html` | the room |
| `style.css` | two typographic worlds: pixels for the cafe, a book for the page |
| `app.js` | markdown parser, menu, reader, VN engine, counter, drawers |
| `data.js` | the six (plus Agrat): voices, rota, dialogue banks, sprite roster |
| `fables.js` | generated menu — **do not edit, edit the stories** |
| `build.py` | rescans the corpus and rewrites `fables.js` |
| `sprites.py` | cuts the character art into square portraits |
| `sw.js` | offline shelf |
| `fables/` | generated copies of the stories |

### Portraits

Twenty-seven of them, cut from the corpus art by `sprites.py` in two stages.

**Framed.** A hand-set crop box per character, as percentages of the
alpha-trimmed bounding box, aiming to land the face at about (50%, 42%).
Automatic face-finding was tried and kept choosing thighs and hat brims.

**Graded, then pixelated.** Downsampled to 144px, alpha hard-thresholded so
the silhouette has no soft fringe, then graded before the palette is cut, then
quantized to 48 colours with dithering off — at that resolution dithering reads
as dirt — and given a one-pixel keyline so a sprite holds its shape against a
violet room or a sunlit one. Indexed PNG, because lossy formats smear exactly
the hard edges the whole exercise is for. The page renders them with
`image-rendering: pixelated`.

The grading is not decoration. This art is mostly pale — skin, white hair,
white cloth — and quantizing it raw spends almost no palette on the top end,
snapping the entire upper range onto one entry that the quantizer picks as pure
white. Measured on the first pass, Phrolova's 90th-percentile luminance went
235 in the source to 255 in the sprite and a tenth of her pixels came out at
maximum; faces arrived as flat white blobs with eyes on them. So the highlights
are rolled off first (linear to 165, eased into a 232 ceiling), saturation is
put back afterwards, and the palette is cut with MEDIANCUT rather than
MAXCOVERAGE. Nothing now clips: the worst sprite's 99th percentile is 239.

To add someone: drop the art in the corpus folder, add a line to `CROPS`, run
the script, look at what came out, adjust, then add them to `GUESTS` in
`data.js`.

`Lilith.png` and `asdf.png` are left out — a moon glyph and a photograph of a
room, neither of them character art. That's recorded in `sprites.py` so nobody
works it out twice.

---

*The lamps are lit. The kettle is on. The coming-back is built in.*
