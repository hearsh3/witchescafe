/* ===========================================================================
   The lamps stay on when the network doesn't.

   Three caches, because the three things behave differently:
     shell   — the room itself. Precached on install, then network-first, so an
               edit to app.js shows up on the next load.
     library — the fables. Cached the first time you read one, then quietly
               swept up in the background so a train journey is survivable.
     media   — art, audio, fonts.

   Library and media are stale-while-revalidate rather than cache-first. Both
   are regenerated in place by build.py and sprites.py under unchanged
   filenames, and cache-first would happily serve last month's copy forever.
   This way the reader gets an instant answer and a fresh copy for next time.

   Audio is deliberately NOT precached: the two ambience loops are ten megabytes
   between them, and a reader who never opens the jukebox should never pay for
   them. They cache themselves the first time they're played.
   =========================================================================== */

const VERSION = "maqhaa-v3";
const SHELL = VERSION + "-shell";
const LIBRARY = VERSION + "-library";
const MEDIA = VERSION + "-media";

const SHELL_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./data.js",
  "./fables.js",
  "./manifest.webmanifest",
  "./assets/cafe.gif",
  "./assets/cafewarm.gif",
  "./assets/cafebright-poster.jpg",
  "./assets/fonts/pressstart-400.woff2",
  "./assets/fonts/silkscreen-400.woff2",
  "./assets/fonts/silkscreen-700.woff2",
  "./assets/fonts/vt323-400.woff2",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(SHELL)
      // addAll is all-or-nothing; one missing sprite shouldn't fail the install
      .then((c) => Promise.all(SHELL_FILES.map((u) => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* Pull the whole library down in the background once the reader is settled.
   Fired from the page, so it never competes with the first paint. */
self.addEventListener("message", (e) => {
  const msg = e.data || {};
  if (msg.type !== "stock-up" || !Array.isArray(msg.files)) return;
  e.waitUntil(caches.open(LIBRARY).then(async (c) => {
    for (const url of msg.files) {
      if (await c.match(url)) continue;
      try { await c.add(url); } catch (err) { /* it'll keep */ }
      await new Promise((r) => setTimeout(r, 40));   // stay out of the way
    }
  }));
});

function isFable(url) { return /\/fables\/[^/]+\.md$/.test(url.pathname); }
function isMedia(url) { return /\.(mp3|mp4|png|jpe?g|webp|gif|woff2?)$/.test(url.pathname); }

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  /* Stories: answer from the shelf instantly, then quietly fetch a fresh copy
     for next time. Cache-first alone would be wrong — build.py rewrites these
     whenever a story is edited, and the filenames don't change. */
  if (isFable(url)) {
    e.respondWith(staleWhileRevalidate(e, req, LIBRARY));
    return;
  }

  /* Range requests (audio and video streaming) must go straight to the network
     — a cached 200 answered to a Range request makes some browsers give up.
     The practical consequence: offline, the BRIGHT room shows its poster frame
     instead of the moving one. The poster is precached for exactly that. */
  if (req.headers.has("range")) return;

  /* Same for art and audio. sprites.py regenerates portraits under the exact
     same names, so a pure cache-first store would serve last month's grading
     until the end of time. */
  if (isMedia(url)) {
    e.respondWith(staleWhileRevalidate(e, req, MEDIA));
    return;
  }

  /* The room: try the network so edits show up, fall back to the last good
     copy, and fall back again to the door for a cold navigation. */
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(SHELL).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((hit) =>
          hit || (req.mode === "navigate" ? caches.match("./index.html") : undefined)
        )
      )
  );
});

/* Serve what we have at once; refresh it behind the reader's back.
   Offline, the network arm fails quietly and the cached copy still stands.
   The refresh is handed to waitUntil so the worker isn't torn down mid-write
   the moment the cached response is returned. */
async function staleWhileRevalidate(event, req, bucket) {
  const cache = await caches.open(bucket);
  const hit = await cache.match(req);

  const fresh = fetch(req)
    .then((res) => {
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    })
    .catch(() => undefined);

  if (hit) {
    event.waitUntil(fresh);
    return hit;
  }
  return (await fresh) || Response.error();
}
